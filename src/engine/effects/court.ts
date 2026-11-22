// Rule §9.2: court card combos (the court card plus two minors of the listed elements).
import { othersOf, params } from '../core/context';
import { addStatus, grantShield, hit } from '../rules/status';
import { moveBackTo, moveBy, moveToNext } from '../rules/move';
import { gainFp, loseFp } from '../rules/fp';
import { discardRandom, drawCards } from '../rules/deck';
import type { FaceKey } from '../types';
import type { Handler } from './minor';
import { targetsFor } from '../core/targeting';

export const COURT_HANDLERS: Partial<Record<FaceKey, Handler>> = {
  'page.upright': (ctx, a) => {
    moveToNext(ctx, a, 'air');
    drawCards(ctx, a, params(ctx, 'page.upright').draw!);
  },
  'page.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'page.reversed')) {
      const P = params(ctx, 'page.reversed');
      if (!hit(ctx, t, 'page.reversed')) continue;
      moveBy(ctx, t, -P.back!, 'card');
      discardRandom(ctx, t, P.discard!);
      addStatus(ctx, t, 'silenced', P.silencedTurns!, 'page.reversed');
    }
  },

  'knight.upright': (ctx, a) => moveToNext(ctx, a, 'fire', params(ctx, 'knight.upright').extra!),
  'knight.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'knight.reversed')) {
      if (!hit(ctx, t, 'knight.reversed')) continue;
      moveBackTo(ctx, t, 'earth');
      addStatus(ctx, t, 'stunned', params(ctx, 'knight.reversed').stunnedTurns!, 'knight.reversed');
    }
  },

  'queen.upright': (ctx, a) => {
    const P = params(ctx, 'queen.upright');
    moveBy(ctx, a, P.move!, 'card');
    gainFp(ctx, a, P.fp!, 'card');
    if (P.shield) grantShield(ctx, a, 'queen.upright');
  },
  'queen.reversed': (ctx, a, c) => {
    for (const t of targetsFor(ctx.s, a, c, 'queen.reversed')) {
      if (!hit(ctx, t, 'queen.reversed')) continue;
      moveBackTo(ctx, t, 'fire');
      loseFp(ctx, t, params(ctx, 'queen.reversed').fpLoss!, 'card');
    }
  },

  'king.upright': (ctx, a) => {
    const P = params(ctx, 'king.upright');
    moveBy(ctx, a, P.move!, 'card');
    if (P.shield) grantShield(ctx, a, 'king.upright');
  },
  // Decision D-29: "all other players" = everyone but you, the target included.
  'king.reversed': (ctx, a, c) => {
    const ts = targetsFor(ctx.s, a, c, 'king.reversed');
    const P = params(ctx, 'king.reversed');
    for (const t of ts) {
      if (!hit(ctx, t, 'king.reversed')) continue;
      moveBy(ctx, t, -P.back!, 'card');
      addStatus(ctx, t, 'silenced', P.silencedTurns!, 'king.reversed');
      addStatus(ctx, t, 'drained', P.drainedTurns!, 'king.reversed');
    }
    for (const o of othersOf(ctx.s, a)) {
      if (ts.includes(o)) continue;
      if (hit(ctx, o, 'king.reversed')) addStatus(ctx, o, 'drained', P.drainedTurns!, 'king.reversed');
    }
  },
};
