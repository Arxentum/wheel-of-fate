import { SUIT_ELEMENT, elementOfSign, signOf } from '../data/board';
import { ONCE_PER_GAME, cardDef, faceKey, isCourt, isSuit } from '../data/cards';
import { HANDLERS } from '../effects';
import { continueWheel, resolveWheelCard, useMinorUpright } from '../effects/major';
import { discardCards, drawCards, putOnBottom, removeFromHand } from '../rules/deck';
import { gainFp, spendFp } from '../rules/fp';
import { addStatus } from '../rules/status';
import type { Action, CardUid, Decision, GameEvent, GameState, Orientation, PlayerId } from '../types';
import { checkAction } from './check';
import { cloneState } from './clone';
import { bal, current, emit, makeCtx, params, player, type ApplyOptions, type Ctx } from './context';
import { afterPlay, confirmMove, doBoost, doFlip, doReroll, finishTurn } from './flow';

export class IllegalActionError extends Error {
  constructor(readonly reason: string, readonly action: Action) {
    super(`illegal action ${action.type}: ${reason}`);
  }
}

/** Plays a minor card from `actor`'s hand: rule §5 A, resonance per decision D-01. */
function playMinorCard(
  ctx: Ctx, actor: PlayerId, card: CardUid, o: Orientation, target: PlayerId | undefined,
  kind: 'minor' | 'conjure',
): void {
  const s = ctx.s;
  const p = player(s, actor);
  const def = cardDef(card);
  if (!isSuit(def)) throw new Error('not a minor card');
  removeFromHand(ctx, actor, card);
  s.discard.push(card);
  const key = faceKey(def, o);
  const resonance = elementOfSign(signOf(p.progress)) === SUIT_ELEMENT[def];
  emit(ctx, { t: 'play', p: actor, kind, face: key, ...(target !== undefined ? { target } : {}), resonance });
  if (resonance) gainFp(ctx, actor, bal(ctx).resonanceBonus, 'resonance');
  HANDLERS[key](ctx, actor, target !== undefined ? { target } : {});
}

function perform(ctx: Ctx, a: Action, d: Decision): void {
  const s = ctx.s;
  s.pending = null;
  switch (a.type) {
    case 'playMinor': {
      s.turn.action = 'minor';
      playMinorCard(ctx, d.player, a.card, a.orientation, a.target, 'minor');
      afterPlay(ctx);
      return;
    }
    case 'playCourt': {
      const actor = d.player;
      const def = cardDef(a.card);
      if (!isCourt(def)) throw new Error('not a court card');
      s.turn.action = 'court';
      for (const u of [a.card, ...a.fuel]) removeFromHand(ctx, actor, u);
      s.discard.push(a.card, ...a.fuel);
      const key = faceKey(def, a.orientation);
      emit(ctx, {
        t: 'play', p: actor, kind: 'court', face: key,
        ...(a.target !== undefined ? { target: a.target } : {}),
        fuel: a.fuel.map(cardDef),
      });
      HANDLERS[key](ctx, actor, a.target !== undefined ? { target: a.target } : {});
      drawCards(ctx, actor, bal(ctx).courtDraw);
      afterPlay(ctx);
      return;
    }
    case 'useSkill': {
      const p = player(s, d.player);
      const key = faceKey(p.major, p.orientation);
      const choice = a.choice ?? {};
      s.turn.action = 'skill';
      spendFp(ctx, p.id, bal(ctx).skillCost, 'skill');
      p.lastSkillTurn = p.turnNo;
      if (ONCE_PER_GAME.has(p.major)) p.onceUsed[p.orientation] = true;
      emit(ctx, {
        t: 'play', p: p.id, kind: 'skill', face: key,
        ...(choice.target !== undefined ? { target: choice.target } : {}),
        ...(choice.targets ? { targets: [...choice.targets] } : {}),
        ...(choice.sign !== undefined ? { sign: choice.sign } : {}),
      });
      HANDLERS[key](ctx, p.id, choice);
      afterPlay(ctx);
      return;
    }
    case 'meditate': {
      const b = bal(ctx);
      s.turn.action = 'meditate';
      emit(ctx, { t: 'play', p: d.player, kind: 'meditate' });
      drawCards(ctx, d.player, b.meditateDraw);
      gainFp(ctx, d.player, b.meditateFp, 'meditate');
      afterPlay(ctx);
      return;
    }
    case 'conjurePlay': {
      if (d.kind !== 'conjure') throw new Error('bad decision');
      if (a.play) {
        playMinorCard(ctx, d.player, a.play.card, a.play.orientation, a.play.target, 'conjure');
        const p = player(s, d.player);
        // Proposal option: more than one extra play (magician.upright.extraPlays).
        if (d.left > 1 && p.hand.some((u) => isSuit(cardDef(u)))) {
          s.pending = { kind: 'conjure', player: d.player, left: d.left - 1 };
          return;
        }
      }
      afterPlay(ctx);
      return;
    }
    case 'foresightPick': {
      if (d.kind !== 'foresight') throw new Error('bad decision');
      const p = player(s, d.player);
      let rest = [...d.cards];
      if (a.use !== null) {
        rest = rest.filter((u) => u !== a.use);
        s.discard.push(a.use);
        useMinorUpright(ctx, a.use);
      }
      if (a.take !== null) {
        rest = rest.filter((u) => u !== a.take);
        p.hand.push(a.take);
        emit(ctx, { t: 'take', p: p.id, card: cardDef(a.take) });
      }
      putOnBottom(ctx, rest);
      gainFp(ctx, p.id, params(ctx, 'highPriestess.upright').fp!, 'card');
      afterPlay(ctx);
      return;
    }
    case 'veilPick': {
      if (d.kind !== 'veil') throw new Error('bad decision');
      discardCards(ctx, d.target, a.cards, 'chosen');
      addStatus(ctx, d.target, 'drained', params(ctx, 'highPriestess.reversed').drainedTurns!, 'highPriestess.reversed');
      afterPlay(ctx);
      return;
    }
    case 'chooseTarget': {
      if (d.kind !== 'wheelTarget') throw new Error('bad decision');
      resolveWheelCard(ctx, d.player, d.card, a.target);
      continueWheel(ctx, d.caster, d.queue);
      afterPlay(ctx);
      return;
    }
    case 'flip':
      doFlip(ctx, a.flip);
      return;
    case 'reroll':
      doReroll(ctx);
      return;
    case 'boost':
      doBoost(ctx);
      return;
    case 'confirmMove':
      confirmMove(ctx);
      return;
    case 'discard':
      discardCards(ctx, d.player, a.cards, 'limit');
      finishTurn(ctx);
      return;
  }
}

/** Applies an action in place and returns the events. Throws on an illegal action. */
export function applyActionMut(s: GameState, a: Action, opts: ApplyOptions = {}): GameEvent[] {
  const d = s.pending;
  const c = checkAction(s, a);
  if (!c.ok || !d) throw new IllegalActionError(c.ok ? 'noDecision' : c.reason, a);
  const ctx = makeCtx(s, opts);
  perform(ctx, a, d);
  return ctx.ev;
}

/** Pure version: returns a new state. */
export function applyAction(s: GameState, a: Action, opts: ApplyOptions = {}): { state: GameState; events: GameEvent[] } {
  const next = cloneState(s);
  const events = applyActionMut(next, a, opts);
  return { state: next, events };
}

/** Who has to decide now (null when the game is over). */
export function whoDecides(s: GameState): PlayerId | null {
  return s.pending ? s.pending.player : null;
}

export { current };
