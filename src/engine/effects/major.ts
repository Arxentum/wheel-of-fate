// Rule §9.3: the 22 characters' skills.
import {
  bal, current, emit, isLeading, leadersAmong, maxProgress, orderFrom, othersOf, params,
  player, playersAhead, type Ctx,
} from '../core/context';
import { pick } from '../core/rng';
import { PISCES, signOf } from '../data/board';
import { cardDef, faceKey, isCourt, isSuit } from '../data/cards';
import { discardCards, discardRandom, drawCards, stealRandomCard, takeTop, takeTopCards } from '../rules/deck';
import { gainFp, loseFp, stealFp } from '../rules/fp';
import { moveBackTo, moveBy, moveTo, moveToNext } from '../rules/move';
import { addStatus, cleanseNegatives, grantShield, hasShield, hit, isActive, isFinishSafe } from '../rules/status';
import { placeTrap } from '../rules/trap';
import type { CardUid, FaceKey, PlayerId, SkillChoice } from '../types';
import { MINOR_HANDLERS, type Handler } from './minor';
import { targetsFor } from '../core/targeting';

function target(choice: SkillChoice): PlayerId {
  if (choice.target === undefined) throw new Error('target missing');
  return choice.target;
}

export function rollDie(ctx: Ctx): number {
  return pick(ctx.s.rng, bal(ctx).die);
}

/** Decision D-26: the leader among the other players; the caster's choice breaks a tie. */
function chosenLeader(ctx: Ctx, actor: PlayerId, choice: SkillChoice): PlayerId {
  const leaders = leadersAmong(ctx.s, othersOf(ctx.s, actor));
  if (leaders.length === 1) return leaders[0]!;
  const t = choice.target;
  if (t === undefined || !leaders.includes(t)) throw new Error('tied leader must be chosen');
  return t;
}

// ---------- The Wheel Turns (decision D-32) ----------

/** Applies a revealed minor card's reversed face for `revealer` against `t`. */
export function resolveWheelCard(ctx: Ctx, revealer: PlayerId, card: CardUid, t: PlayerId | undefined): void {
  const def = cardDef(card);
  const key = faceKey(def, 'reversed');
  emit(ctx, { t: 'play', p: revealer, kind: 'wheel', face: key, ...(t !== undefined ? { target: t } : {}) });
  MINOR_HANDLERS[key]!(ctx, revealer, t !== undefined ? { target: t } : {});
  ctx.s.discard.push(card);
}

/** Reveals for each player in `queue`; pauses with a decision when someone must pick a target. */
export function continueWheel(ctx: Ctx, caster: PlayerId, queue: readonly PlayerId[]): void {
  const s = ctx.s;
  const q = [...queue];
  while (q.length > 0) {
    const r = q.shift()!;
    const card = takeTop(ctx);
    if (card === null) continue;
    const def = cardDef(card);
    emit(ctx, { t: 'reveal', p: r, card: def });
    if (isCourt(def)) {
      s.discard.push(card);
      continue;
    }
    const others = othersOf(s, r);
    if (s.config.balance.reversedAhead) {
      resolveWheelCard(ctx, r, card, undefined);
      continue;
    }
    if (others.length === 1) {
      resolveWheelCard(ctx, r, card, others[0]!);
      continue;
    }
    s.pending = { kind: 'wheelTarget', player: r, card, caster, queue: q };
    return;
  }
}

// ---------- Handlers ----------

export const MAJOR_HANDLERS: Partial<Record<FaceKey, Handler>> = {
  // 0 The Fool
  'fool.upright': (ctx, a) => {
    const roll = rollDie(ctx);
    emit(ctx, { t: 'effectRoll', p: a, dice: [roll] });
    moveBy(ctx, a, roll + params(ctx, 'fool.upright').bonus!, 'card');
  },
  // Decision D-16: a status consumed by the target's next real Move step.
  'fool.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'fool.reversed')) {
      if (hit(ctx, t, 'fool.reversed')) addStatus(ctx, t, 'wrongTurn', 1, 'fool.reversed');
    }
  },

  // 1 The Magician
  'magician.upright': (ctx, a) => {
    drawCards(ctx, a, params(ctx, 'magician.upright').draw!);
    const p = player(ctx.s, a);
    // Decision D-04: optional extra minor play, not while Silenced.
    if (params(ctx, 'magician.upright').extraPlays! > 0 && !isActive(p, 'silenced') && p.hand.some((u) => isSuit(cardDef(u)))) {
      ctx.s.pending = { kind: 'conjure', player: a, left: params(ctx, 'magician.upright').extraPlays! };
    }
  },
  'magician.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'magician.reversed')) {
      if (!hit(ctx, t, 'magician.reversed')) continue;
      stealRandomCard(ctx, t, a);
      addStatus(ctx, t, 'silenced', params(ctx, 'magician.reversed').silencedTurns!, 'magician.reversed');
    }
  },

  // 2 The High Priestess
  'highPriestess.upright': (ctx, a) => {
    if (params(ctx, 'highPriestess.upright').move) moveBy(ctx, a, params(ctx, 'highPriestess.upright').move!, 'card');
    const cards = takeTopCards(ctx, params(ctx, 'highPriestess.upright').look!);
    emit(ctx, { t: 'look', p: a, cards: cards.map(cardDef) });
    if (cards.length === 0) {
      gainFp(ctx, a, params(ctx, 'highPriestess.upright').fp!, 'card');
      return;
    }
    ctx.s.pending = { kind: 'foresight', player: a, cards };
  },
  'highPriestess.reversed': (ctx, a, c) => {
    const t = target(c);
    const P = params(ctx, 'highPriestess.reversed');
    if (!hit(ctx, t, 'highPriestess.reversed')) return;
    const hand = player(ctx.s, t).hand;
    if (hand.length > P.discard!) {
      ctx.s.pending = { kind: 'veil', player: a, target: t, count: P.discard! };
      return;
    }
    discardCards(ctx, t, [...hand], 'chosen');
    addStatus(ctx, t, 'drained', P.drainedTurns!, 'highPriestess.reversed');
  },

  // 3 The Empress
  'empress.upright': (ctx, a) => {
    const P = params(ctx, 'empress.upright');
    if (P.move) moveBy(ctx, a, P.move, 'card');
    gainFp(ctx, a, P.fp!, 'card');
    drawCards(ctx, a, P.draw!);
  },
  'empress.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'empress.reversed')) {
      const P = params(ctx, 'empress.reversed');
      if (!hit(ctx, t, 'empress.reversed')) continue;
      addStatus(ctx, t, 'rooted', P.rootedTurns!, 'empress.reversed');
      loseFp(ctx, t, P.fpLoss!, 'card');
    }
  },

  // 4 The Emperor
  'emperor.upright': (ctx, a) => {
    const P = params(ctx, 'emperor.upright');
    gainFp(ctx, a, P.fp!, 'card');
    if (P.shield) grantShield(ctx, a, 'emperor.upright');
    if (ctx.s.turn.player === a) ctx.s.turn.rollMode = 'fixed3';
  },
  'emperor.reversed': (ctx, a, c) => {
    const P = params(ctx, 'emperor.reversed');
    const leader = chosenLeader(ctx, a, c);
    for (const o of othersOf(ctx.s, a)) {
      if (!hit(ctx, o, 'emperor.reversed')) continue;
      addStatus(ctx, o, 'silenced', P.silencedTurns!, 'emperor.reversed');
      if (o === leader) addStatus(ctx, o, 'drained', P.drainedTurns!, 'emperor.reversed');
    }
  },

  // 5 The Hierophant
  'hierophant.upright': (ctx, a) => {
    const P = params(ctx, 'hierophant.upright');
    if (P.move) moveBy(ctx, a, P.move, 'card');
    cleanseNegatives(ctx, a);
    gainFp(ctx, a, P.fp!, 'card');
    drawCards(ctx, a, P.draw!);
    if (P.shield) grantShield(ctx, a, 'hierophant.upright');
  },
  'hierophant.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'hierophant.reversed')) {
      if (hit(ctx, t, 'hierophant.reversed')) moveBackTo(ctx, t, 'earth');
    }
  },

  // 6 The Lovers
  'lovers.upright': (ctx, a) => {
    const P = params(ctx, 'lovers.upright');
    const me = player(ctx.s, a).progress;
    let best: number | null = null;
    for (const o of othersOf(ctx.s, a)) {
      const d = player(ctx.s, o).progress - me;
      if (d >= 1 && d <= P.range! && (best === null || d < best)) best = d;
    }
    if (best === null) moveBy(ctx, a, P.fallback!, 'card');
    else moveTo(ctx, a, me + best + P.extra!, 'card');
  },
  // Decisions D-20/D-28: swap progress; any shield among the two cancels the swap.
  'lovers.reversed': (ctx, _a, c) => {
    const s = ctx.s;
    if (s.players.length === 2) {
      const t = target(c);
      if (hit(ctx, t, 'lovers.reversed')) moveBy(ctx, t, -params(ctx, 'lovers.reversed').back2p!, 'card');
      return;
    }
    const pair = c.targets;
    if (!pair) throw new Error('targets missing');
    const [x, y] = pair;
    const shielded = pair.filter((id) => hasShield(player(s, id)) || isFinishSafe(s, player(s, id)));
    if (shielded.length > 0) {
      for (const id of shielded) hit(ctx, id, 'lovers.reversed');
      emit(ctx, { t: 'swapFailed', targets: [x, y] });
      return;
    }
    const px = player(s, x).progress;
    const py = player(s, y).progress;
    moveTo(ctx, x, py, 'swap');
    moveTo(ctx, y, px, 'swap');
  },

  // 7 The Chariot
  'chariot.upright': (ctx, a) => moveBy(ctx, a, params(ctx, 'chariot.upright').move!, 'card'),
  'chariot.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'chariot.reversed')) {
      const P = params(ctx, 'chariot.reversed');
      if (!hit(ctx, t, 'chariot.reversed')) continue;
      moveBy(ctx, t, -P.back!, 'card');
      addStatus(ctx, t, 'slowed', P.slowedTurns!, 'chariot.reversed');
    }
  },

  // 8 Strength
  'strength.upright': (ctx, a) => {
    moveToNext(ctx, a, 'fire');
    if (params(ctx, 'strength.upright').shield) grantShield(ctx, a, 'strength.upright');
  },
  'strength.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'strength.reversed')) {
      const P = params(ctx, 'strength.reversed');
      if (!hit(ctx, t, 'strength.reversed')) continue;
      addStatus(ctx, t, 'stunned', P.stunnedTurns!, 'strength.reversed');
      loseFp(ctx, t, P.fpLoss!, 'card');
    }
  },

  // 9 The Hermit
  'hermit.upright': (ctx, a) => {
    const P = params(ctx, 'hermit.upright');
    if (P.move) moveBy(ctx, a, P.move, 'card');
    gainFp(ctx, a, P.fp!, 'card');
    drawCards(ctx, a, P.draw!);
    if (P.shield) grantShield(ctx, a, 'hermit.upright');
  },
  'hermit.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'hermit.reversed')) {
      if (hit(ctx, t, 'hermit.reversed')) addStatus(ctx, t, 'drained', params(ctx, 'hermit.reversed').drainedTurns!, 'hermit.reversed');
    }
  },

  // 10 Wheel of Fortune
  'wheelOfFortune.upright': (ctx, a) => {
    const d1 = rollDie(ctx);
    const d2 = rollDie(ctx);
    emit(ctx, { t: 'effectRoll', p: a, dice: [d1, d2] });
    const high = Math.max(d1, d2), low = Math.min(d1, d2);
    const moveHigher = params(ctx, 'wheelOfFortune.upright').moveHigher !== 0;
    moveBy(ctx, a, moveHigher ? high : low, 'card');
    gainFp(ctx, a, moveHigher ? low : high, 'card');
  },
  'wheelOfFortune.reversed': (ctx, a) => continueWheel(ctx, a, orderFrom(ctx.s, a)),

  // 11 Justice
  'justice.upright': (ctx, a) => {
    const P = params(ctx, 'justice.upright');
    if (isLeading(ctx.s, a)) {
      if (P.moveIfLeading) moveBy(ctx, a, P.moveIfLeading, 'card');
      gainFp(ctx, a, P.fpIfLeading!, 'card');
      return;
    }
    const gap = maxProgress(ctx.s, ctx.s.players.map((p) => p.id)) - player(ctx.s, a).progress;
    moveBy(ctx, a, Math.min(P.max!, Math.max(P.min ?? 0, Math.ceil(gap / 2))), 'card');
  },
  'justice.reversed': (ctx, a, c) => {
    const P = params(ctx, 'justice.reversed');
    const t = chosenLeader(ctx, a, c);
    if (!hit(ctx, t, 'justice.reversed')) return;
    moveBy(ctx, t, -P.back!, 'card');
    loseFp(ctx, t, P.fpLoss!, 'card');
  },

  // 12 The Hanged Man
  'hangedMan.upright': (ctx, a) => {
    const P = params(ctx, 'hangedMan.upright');
    if (P.skipMove && ctx.s.turn.player === a) ctx.s.turn.skipMove = true;
    if (P.move) moveBy(ctx, a, P.move, 'card');
    gainFp(ctx, a, P.fp!, 'card');
    drawCards(ctx, a, P.draw!);
    if (P.shield) grantShield(ctx, a, 'hangedMan.upright');
    if (P.slowedSelf) addStatus(ctx, a, 'slowed', P.slowedSelf, 'hangedMan.upright');
  },
  'hangedMan.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'hangedMan.reversed')) {
      const P = params(ctx, 'hangedMan.reversed');
      if (!hit(ctx, t, 'hangedMan.reversed')) continue;
      addStatus(ctx, t, 'rooted', P.rootedTurns!, 'hangedMan.reversed');
      addStatus(ctx, t, 'drained', P.drainedTurns!, 'hangedMan.reversed');
      if (P.fpLoss) loseFp(ctx, t, P.fpLoss, 'card');
    }
  },

  // 13 Death
  'death.upright': (ctx, a, c) => {
    const P = params(ctx, 'death.upright');
    if (P.move) moveBy(ctx, a, P.move, 'card');
    discardCards(ctx, a, c.discard ?? [], 'chosen');
    const need = P.handTo! - player(ctx.s, a).hand.length;
    if (need > 0) drawCards(ctx, a, need);
    cleanseNegatives(ctx, a);
    gainFp(ctx, a, P.fp!, 'card');
  },
  'death.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'death.reversed')) {
      const P = params(ctx, 'death.reversed');
      if (!hit(ctx, t, 'death.reversed')) continue;
      loseFp(ctx, t, P.fpLoss!, 'card');
      discardRandom(ctx, t, P.discard!);
    }
  },

  // 14 Temperance
  'temperance.upright': (ctx, a) => {
    moveToNext(ctx, a, 'water');
    drawCards(ctx, a, params(ctx, 'temperance.upright').draw!);
  },
  'temperance.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'temperance.reversed')) {
      if (hit(ctx, t, 'temperance.reversed')) addStatus(ctx, t, 'slowed', params(ctx, 'temperance.reversed').slowedTurns!, 'temperance.reversed');
    }
  },

  // 15 The Devil
  'devil.upright': (ctx, a) => {
    const P = params(ctx, 'devil.upright');
    gainFp(ctx, a, P.fp!, 'card');
    moveBy(ctx, a, P.move!, 'card');
    addStatus(ctx, a, 'drained', P.drainedTurns!, 'devil.upright');
  },
  'devil.reversed': (ctx, a, c) => {
    if (c.sign === undefined) throw new Error('sign missing');
    placeTrap(ctx, a, 'chain', c.sign);
  },

  // 16 The Tower
  'tower.upright': (ctx, a) => {
    const P = params(ctx, 'tower.upright');
    moveBy(ctx, a, P.move!, 'card');
    discardCards(ctx, a, [...player(ctx.s, a).hand], 'whole');
    if (P.fpLoss) loseFp(ctx, a, P.fpLoss, 'card');
  },
  'tower.reversed': (ctx, a) => {
    const back = params(ctx, 'tower.reversed').back!;
    for (const o of playersAhead(ctx.s, a)) {
      if (hit(ctx, o, 'tower.reversed')) moveBy(ctx, o, -back, 'card');
    }
  },

  // 17 The Star (decision D-34: the floor is checked after paying for the skill)
  'star.upright': (ctx, a) => {
    moveToNext(ctx, a, 'water');
    const floor = params(ctx, 'star.upright').fpFloor!;
    const fp = player(ctx.s, a).fp;
    if (fp < floor) gainFp(ctx, a, floor - fp, 'card');
  },
  'star.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'star.reversed')) {
      if (hit(ctx, t, 'star.reversed')) stealFp(ctx, t, a, params(ctx, 'star.reversed').steal!);
    }
  },

  // 18 The Moon (decision D-24)
  'moon.upright': (ctx, a) => {
    const P = params(ctx, 'moon.upright');
    moveBy(ctx, a, P.move!, 'card');
    if (P.shield) grantShield(ctx, a, 'moon.upright');
    if (P.fp) gainFp(ctx, a, P.fp, 'card');
    const p = player(ctx.s, a);
    p.trapImmuneTurn = p.turnNo;
  },
  'moon.reversed': (ctx, a, c) => {
    if (c.sign === undefined) throw new Error('sign missing');
    placeTrap(ctx, a, 'illusion', c.sign);
  },

  // 19 The Sun
  'sun.upright': (ctx, a) => {
    const P = params(ctx, 'sun.upright');
    moveBy(ctx, a, P.move!, 'card');
    gainFp(ctx, a, P.fp!, 'card');
  },
  'sun.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'sun.reversed')) {
      const P = params(ctx, 'sun.reversed');
      if (!hit(ctx, t, 'sun.reversed')) continue;
      loseFp(ctx, t, P.fpLoss!, 'card');
      addStatus(ctx, t, 'slowed', P.slowedTurns!, 'sun.reversed');
    }
  },

  // 20 Judgement
  'judgement.upright': (ctx, a, c) => {
    const cards = c.discard ?? [];
    discardCards(ctx, a, cards, 'chosen');
    moveBy(ctx, a, cards.length, 'card');
    drawCards(ctx, a, params(ctx, 'judgement.upright').draw!);
  },
  // Decision D-33: shielded players stay out of the pool; the remainder goes to you.
  'judgement.reversed': (ctx, a) => {
    const s = ctx.s;
    const pool = [a, ...othersOf(s, a).filter((o) => hit(ctx, o, 'judgement.reversed'))];
    const total = pool.reduce((sum, id) => sum + player(s, id).fp, 0);
    const share = Math.floor(total / pool.length);
    const rest = total - share * pool.length;
    for (const id of pool) {
      const want = share + (id === a ? rest : 0);
      const delta = want - player(s, id).fp;
      if (delta > 0) gainFp(ctx, id, delta, 'reckoning');
      else if (delta < 0) loseFp(ctx, id, -delta, 'reckoning');
    }
  },

  // 21 The World (decision D-30: never usable on Pisces)
  'world.upright': (ctx, a) => {
    const p = player(ctx.s, a);
    const d = (PISCES - signOf(p.progress) + 12) % 12;
    moveBy(ctx, a, Math.min(d, params(ctx, 'world.upright').max!), 'card');
  },
  'world.reversed': (ctx, a) => {
    const P = params(ctx, 'world.reversed');
    for (const o of othersOf(ctx.s, a)) {
      if (!hit(ctx, o, 'world.reversed')) continue;
      addStatus(ctx, o, 'rooted', P.rootedTurns!, 'world.reversed');
      addStatus(ctx, o, 'slowed', P.slowedTurns ?? 0, 'world.reversed');
    }
  },
};

/** Used by the Foresight decision: the current player uses a minor card's upright face. */
export function useMinorUpright(ctx: Ctx, card: CardUid): void {
  const def = cardDef(card);
  const key = faceKey(def, 'upright');
  const a = current(ctx.s).id;
  emit(ctx, { t: 'play', p: a, kind: 'foresight', face: key });
  MINOR_HANDLERS[key]!(ctx, a, {});
}
