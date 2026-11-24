import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { PlayerId } from '../../../engine';
import { panFor } from '../../audio/cues';
import { sound } from '../../audio/engine';
import { BOARD, pieceSpots, polar, signAngle } from '../../components/boardGeometry';
import type { GameController } from '../../game/controller';
import { EMOTE_PITCH, emoteWishes, replyTo, type EmoteId, type EmoteWish } from '../../game/emotes';
import { fxFor, type FxPlan } from '../../fx/faceFx';
import { BOARD_SHAKE, IMPACT_MS, SHAKES, fxDuration, pieceReaction, type FxItem, type Point } from '../../fx/FxLayer';
import { useLang } from '../../hooks/useLang';
import { emoteStore } from '../../fx/emoteStore';

export interface Bubble {
  id: number;
  p: PlayerId;
  emote: EmoteId;
  at: Point;
}

const BUBBLE_MS = 2600;
/** Computers: one emote on the table at a time, and not too often from one player. */
const BOT_GAP_MS = 1500;
const BOT_REPEAT_MS = 5000;
const HUMAN_REPEAT_MS = 1200;

/**
 * Card effects over the board and emote bubbles, in step with the playback. Effects play
 * when a card is shown; computers react with emotes now and then. `stage` is the box the
 * board sits in (its pieces shake when they are hit).
 */
export function useFx(c: GameController, stage: RefObject<HTMLElement | null>) {
  const [items, setItems] = useState<FxItem[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const sayRef = useRef<(p: PlayerId, emote: EmoteId) => void>(() => {});
  const { t } = useLang();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let seq = 0;
    let lastBot = -Infinity;
    const lastSaid = new Map<PlayerId, number>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const h = setTimeout(() => {
        timers.delete(h);
        fn();
      }, ms);
      timers.add(h);
    };
    const spotsNow = () => {
      const v = c.getView();
      return pieceSpots(v.shown.players.map((p) => ({ id: p.id, sign: (((v.pieces[p.id] ?? 0) % 12) + 12) % 12 })));
    };

    const launch = (plan: FxPlan) => {
      const v = c.getView();
      const speed = v.speed;
      const spots = spotsNow();
      const from = spots.get(plan.actor) ?? [0, 0];
      const to: Point[] = plan.sign !== undefined ? [polar(BOARD.trapR, signAngle(plan.sign))] : plan.targets.map((t) => spots.get(t) ?? from);
      const hit = plan.sign !== undefined ? [] : plan.targets.map((t) => v.shown.players[t]!.element);
      const id = ++seq;
      const label = plan.face ? `${tRef.current(`face.${plan.face}.name`)}${tRef.current('fx.bang')}` : undefined;
      setItems((cur) => [...cur, { id, plan, from, to, hit, speed, ...(label ? { label } : {}) }]);
      later(() => setItems((cur) => cur.filter((x) => x.id !== id)), fxDuration(speed) + 250);
      const impact = IMPACT_MS[plan.fx] / speed;
      const el = v.shown.players[plan.targets[0] ?? plan.actor]!.element;
      sound().play([{ name: plan.sound, pan: panFor(el), delay: impact / 1000 }]);
      const frames = pieceReaction(plan);
      if (SHAKES.has(plan.fx)) later(() => stage.current?.animate(BOARD_SHAKE, { duration: 380 / speed, easing: 'ease-out' }), impact);
      later(() => {
        for (const element of hit) {
          const token = stage.current?.querySelector(`[data-piece="${element}"] > g`);
          token?.animate(frames, { duration: 650 / speed, easing: 'ease-out' });
        }
      }, impact);
    };

    const say = (p: PlayerId, emote: EmoteId, bot: boolean): boolean => {
      const now = performance.now();
      if (bot && (now - lastBot < BOT_GAP_MS || now - (lastSaid.get(p) ?? -Infinity) < BOT_REPEAT_MS)) return false;
      if (!bot && now - (lastSaid.get(p) ?? -Infinity) < HUMAN_REPEAT_MS) return false;
      if (bot) lastBot = now;
      lastSaid.set(p, now);
      const at = spotsNow().get(p) ?? [0, 0];
      const id = ++seq;
      setBubbles((cur) => [...cur.filter((b) => b.p !== p), { id, p, emote, at }]);
      later(() => setBubbles((cur) => cur.filter((b) => b.id !== id)), BUBBLE_MS);
      sound().play([{ name: 'emote', pitch: EMOTE_PITCH[emote], pan: panFor(c.getView().latest.players[p]!.element) }]);
      return true;
    };

    const consider = (w: EmoteWish) => {
      const v = c.getView();
      const pl = v.latest.players[w.p];
      if (!pl || pl.controller !== 'computer' || !emoteStore.get() || Math.random() > w.chance) return;
      const emote = w.emotes[Math.floor(Math.random() * w.emotes.length)]!;
      later(() => say(w.p, emote, true), w.delay / v.speed);
    };

    sayRef.current = (p, emote) => {
      if (!say(p, emote, false)) return;
      // A computer may answer back.
      const replies = replyTo(emote);
      const bots = c.getView().latest.players.filter((x) => x.controller === 'computer');
      if (replies && bots.length) consider({ p: bots[Math.floor(Math.random() * bots.length)]!.id, emotes: replies, chance: 0.5, delay: 900 });
    };

    const off = c.onShow((item) => {
      if (item.kind !== 'event' || item.fast) return;
      const e = item.event;
      const s = c.getView().shown;
      const plan = e.t === 'play' ? fxFor(e, s) : null;
      if (plan) launch(plan);
      for (const w of emoteWishes(e, s, plan)) consider(w);
    });

    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [c, stage]);

  const sendEmote = useCallback((p: PlayerId, emote: EmoteId) => sayRef.current(p, emote), []);
  return { items, bubbles, sendEmote };
}
