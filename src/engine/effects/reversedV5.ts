// Rules v5 (decision D-60, docs/major-reversed-redesign.md): the characters' reversed faces.
// Each one picks ONE player ahead of you (Tower and World: every player ahead), always has a
// positional consequence, and is +1 stronger against the leading player (balance.leaderBonus).
import { emit, leaderBonusOn, params, player, playersAhead, type Ctx } from '../core/context';
import { discardCards, discardRandom, stealRandomCard } from '../rules/deck';
import { loseFp, stealFp } from '../rules/fp';
import { moveBackTo, moveBy } from '../rules/move';
import { addStatus, hit } from '../rules/status';
import type { FaceKey, PlayerId, SkillChoice } from '../types';
import { rollDie } from './major';
import type { Handler } from './minor';

function one(choice: SkillChoice): PlayerId {
  if (choice.target === undefined) throw new Error('target missing');
  return choice.target;
}

/** +1 when the target is the leading player (ties count), judged before the effect. */
function bonus(ctx: Ctx, t: PlayerId, key?: FaceKey): number {
  const extra = key ? (params(ctx, key).extra ?? 0) : 0;
  return leaderBonusOn(ctx.s, t) + extra;
}

function back(ctx: Ctx, t: PlayerId, n: number): void {
  if (n > 0) moveBy(ctx, t, -n, 'push');
}

export const REVERSED_V5: Partial<Record<FaceKey, Handler>> = {
  // 0 The Fool: Wrong Turn — next Move step goes back instead of rolling.
  'fool.reversed': (ctx, _a, c) => {
    const t = one(c);
    const b = bonus(ctx, t, 'fool.reversed');
    if (!hit(ctx, t, 'fool.reversed')) return;
    addStatus(ctx, t, 'wrongTurn', 1, 'fool.reversed', params(ctx, 'fool.reversed').back! + b);
  },
  // 1 The Magician: Sleight of Hand — back, and you steal a random card.
  'magician.reversed': (ctx, a, c) => {
    const t = one(c);
    const P = params(ctx, 'magician.reversed');
    const b = bonus(ctx, t, 'magician.reversed');
    if (!hit(ctx, t, 'magician.reversed')) return;
    back(ctx, t, P.back! + b);
    for (let i = 0; i < P.steal!; i++) stealRandomCard(ctx, t, a);
    addStatus(ctx, t, 'silenced', P.silencedTurns ?? 0, 'magician.reversed');
  },
  // 2 The High Priestess: Veil — back and Slowed; you look at their hand and discard 1.
  'highPriestess.reversed': (ctx, a, c) => {
    const t = one(c);
    const P = params(ctx, 'highPriestess.reversed');
    const b = bonus(ctx, t, 'highPriestess.reversed');
    if (!hit(ctx, t, 'highPriestess.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'slowed', P.slowedTurns!, 'highPriestess.reversed');
    const hand = player(ctx.s, t).hand;
    if (P.discard! <= 0 || hand.length === 0) return;
    if (hand.length > P.discard!) {
      ctx.s.pending = { kind: 'veil', player: a, target: t, count: P.discard! };
      return;
    }
    discardCards(ctx, t, [...hand], 'chosen');
  },
  // 3 The Empress: Overgrowth — Rooted, −FP; the leader is also pushed back.
  'empress.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'empress.reversed');
    const b = bonus(ctx, t, 'empress.reversed');
    if (!hit(ctx, t, 'empress.reversed')) return;
    addStatus(ctx, t, 'rooted', P.rootedTurns!, 'empress.reversed');
    loseFp(ctx, t, P.fpLoss!, 'card');
    back(ctx, t, b);
  },
  // 4 The Emperor: Decree — back and Silenced.
  'emperor.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'emperor.reversed');
    const b = bonus(ctx, t, 'emperor.reversed');
    if (!hit(ctx, t, 'emperor.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'silenced', P.silencedTurns!, 'emperor.reversed');
  },
  // 5 The Hierophant: Penance — back to the previous Earth sign (the leader one more).
  'hierophant.reversed': (ctx, _a, c) => {
    const t = one(c);
    const b = bonus(ctx, t, 'hierophant.reversed');
    if (!hit(ctx, t, 'hierophant.reversed')) return;
    moveBackTo(ctx, t, 'earth', 'push');
    back(ctx, t, b);
  },
  // 6 The Lovers: Heartbreak — back to the nearest player behind them (max N, else fallback).
  'lovers.reversed': (ctx, _a, c) => {
    const s = ctx.s;
    const t = one(c);
    const P = params(ctx, 'lovers.reversed');
    const b = bonus(ctx, t, 'lovers.reversed');
    if (!hit(ctx, t, 'lovers.reversed')) return;
    const at = player(s, t).progress;
    const behind = s.players.filter((p) => p.progress < at).map((p) => at - p.progress);
    const gap = behind.length > 0 ? Math.min(...behind) : Infinity;
    back(ctx, t, (gap <= P.max! ? gap : P.fallback!) + b);
  },
  // 7 The Chariot: Ram — back and Slowed.
  'chariot.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'chariot.reversed');
    const b = bonus(ctx, t, 'chariot.reversed');
    if (!hit(ctx, t, 'chariot.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'slowed', P.slowedTurns!, 'chariot.reversed');
  },
  // 8 Strength: Intimidate — back, Stunned, −FP.
  'strength.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'strength.reversed');
    const b = bonus(ctx, t, 'strength.reversed');
    if (!hit(ctx, t, 'strength.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'stunned', P.stunnedTurns!, 'strength.reversed');
    loseFp(ctx, t, P.fpLoss!, 'card');
  },
  // 9 The Hermit: Isolation — back and Drained.
  'hermit.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'hermit.reversed');
    const b = bonus(ctx, t, 'hermit.reversed');
    if (!hit(ctx, t, 'hermit.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'drained', P.drainedTurns!, 'hermit.reversed');
  },
  // 10 Wheel of Fortune: The Wheel Turns (option A) — the target rolls and goes back that many.
  'wheelOfFortune.reversed': (ctx, _a, c) => {
    const t = one(c);
    const b = bonus(ctx, t, 'wheelOfFortune.reversed');
    if (!hit(ctx, t, 'wheelOfFortune.reversed')) return;
    const roll = rollDie(ctx);
    emit(ctx, { t: 'effectRoll', p: t, dice: [roll] });
    back(ctx, t, roll + b);
  },
  // 11 Justice: Verdict — back and −FP.
  'justice.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'justice.reversed');
    const b = bonus(ctx, t, 'justice.reversed');
    if (!hit(ctx, t, 'justice.reversed')) return;
    back(ctx, t, P.back! + b);
    loseFp(ctx, t, P.fpLoss!, 'card');
  },
  // 12 The Hanged Man: Suspend — Rooted and Drained; the leader is also pushed back.
  'hangedMan.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'hangedMan.reversed');
    const b = bonus(ctx, t, 'hangedMan.reversed');
    if (!hit(ctx, t, 'hangedMan.reversed')) return;
    addStatus(ctx, t, 'rooted', P.rootedTurns!, 'hangedMan.reversed');
    addStatus(ctx, t, 'drained', P.drainedTurns!, 'hangedMan.reversed');
    loseFp(ctx, t, P.fpLoss ?? 0, 'card');
    back(ctx, t, b);
  },
  // 13 Death: Reap — back and −FP.
  'death.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'death.reversed');
    const b = bonus(ctx, t, 'death.reversed');
    if (!hit(ctx, t, 'death.reversed')) return;
    back(ctx, t, P.back! + b);
    loseFp(ctx, t, P.fpLoss!, 'card');
    discardRandom(ctx, t, P.discard ?? 0);
  },
  // 14 Temperance: Restraint — Slowed for several turns (the leader one more).
  'temperance.reversed': (ctx, _a, c) => {
    const t = one(c);
    const b = bonus(ctx, t, 'temperance.reversed');
    if (!hit(ctx, t, 'temperance.reversed')) return;
    const lead = leaderBonusOn(ctx.s, t);
    addStatus(ctx, t, 'slowed', params(ctx, 'temperance.reversed').slowedTurns! + lead, 'temperance.reversed');
    back(ctx, t, b - lead);
  },
  // 16 The Tower: Collapse — every player ahead goes back (the leader one more).
  'tower.reversed': (ctx, a) => {
    const n = params(ctx, 'tower.reversed').back!;
    // Who leads is judged once, before anyone moves.
    const targets = playersAhead(ctx.s, a).map((o) => [o, bonus(ctx, o, 'tower.reversed')] as const);
    for (const [o, b] of targets) {
      if (hit(ctx, o, 'tower.reversed')) back(ctx, o, n + b);
    }
  },
  // 17 The Star: Falling Star — back, and you steal FP.
  'star.reversed': (ctx, a, c) => {
    const t = one(c);
    const P = params(ctx, 'star.reversed');
    const b = bonus(ctx, t, 'star.reversed');
    if (!hit(ctx, t, 'star.reversed')) return;
    back(ctx, t, P.back! + b);
    stealFp(ctx, t, a, P.steal!);
  },
  // 19 The Sun: Scorch — back, Slowed, −FP.
  'sun.reversed': (ctx, _a, c) => {
    const t = one(c);
    const P = params(ctx, 'sun.reversed');
    const b = bonus(ctx, t, 'sun.reversed');
    if (!hit(ctx, t, 'sun.reversed')) return;
    back(ctx, t, P.back! + b);
    addStatus(ctx, t, 'slowed', P.slowedTurns!, 'sun.reversed');
    loseFp(ctx, t, P.fpLoss!, 'card');
  },
  // 20 Judgement: Reckoning — back half the distance between you (round up, max N).
  'judgement.reversed': (ctx, a, c) => {
    const t = one(c);
    const P = params(ctx, 'judgement.reversed');
    const b = bonus(ctx, t, 'judgement.reversed');
    if (!hit(ctx, t, 'judgement.reversed')) return;
    const gap = player(ctx.s, t).progress - player(ctx.s, a).progress;
    back(ctx, t, Math.min(P.max!, Math.ceil(gap / 2)) + b);
  },
  // 21 The World: Standstill — once per game, every player ahead is Rooted (the leader also back).
  'world.reversed': (ctx, a) => {
    const P = params(ctx, 'world.reversed');
    const targets = playersAhead(ctx.s, a).map((o) => [o, bonus(ctx, o, 'world.reversed')] as const);
    for (const [o, b] of targets) {
      if (!hit(ctx, o, 'world.reversed')) continue;
      addStatus(ctx, o, 'rooted', P.rootedTurns!, 'world.reversed');
      addStatus(ctx, o, 'slowed', P.slowedTurns ?? 0, 'world.reversed');
      back(ctx, o, b);
    }
  },
};

/** v5 faces that pick one player ahead of you. */
export const V5_ONE_AHEAD: ReadonlySet<FaceKey> = new Set<FaceKey>(
  (Object.keys(REVERSED_V5) as FaceKey[]).filter((k) => k !== 'tower.reversed' && k !== 'world.reversed'),
);
