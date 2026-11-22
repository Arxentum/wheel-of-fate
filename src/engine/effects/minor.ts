// Rule §9.1: minor arcana. Upright helps you; reversed hits a target player.
import { cardLeaderBonusOn, params, type Ctx } from '../core/context';
import { targetsFor } from '../core/targeting';
import { addStatus, hit } from '../rules/status';
import { moveBy } from '../rules/move';
import { gainFp, stealFp } from '../rules/fp';
import { discardRandom, drawCards } from '../rules/deck';
import type { FaceKey, PlayerId, SkillChoice } from '../types';

export type Handler = (ctx: Ctx, actor: PlayerId, choice: SkillChoice) => void;

/** Targets with their leader bonus, judged before anyone is hit. */
function targets(ctx: Ctx, actor: PlayerId, choice: SkillChoice, key: FaceKey): [PlayerId, number][] {
  return targetsFor(ctx.s, actor, choice, key).map((t) => [t, cardLeaderBonusOn(ctx.s, t)]);
}

export const MINOR_HANDLERS: Partial<Record<FaceKey, Handler>> = {
  // Wands (fire): movement.
  'wands.upright': (ctx, a) => moveBy(ctx, a, params(ctx, 'wands.upright').move!, 'card'),
  'wands.reversed': (ctx, a, c) => {
    for (const [t, b] of targets(ctx, a, c, 'wands.reversed')) {
      if (hit(ctx, t, 'wands.reversed')) addStatus(ctx, t, 'slowed', params(ctx, 'wands.reversed').slowedTurns! + b, 'wands.reversed');
    }
  },

  // Pentacles (earth): Fate Points.
  'pentacles.upright': (ctx, a) => { gainFp(ctx, a, params(ctx, 'pentacles.upright').fp!, 'card'); },
  'pentacles.reversed': (ctx, a, c) => {
    for (const [t, b] of targets(ctx, a, c, 'pentacles.reversed')) {
      if (hit(ctx, t, 'pentacles.reversed')) stealFp(ctx, t, a, params(ctx, 'pentacles.reversed').steal! + b);
    }
  },

  // Swords (air): the die and position.
  'swords.upright': (ctx, a) => {
    const s = ctx.s;
    if (s.turn.player === a && s.turn.rollMode === 'normal') s.turn.rollMode = 'advantage';
    gainFp(ctx, a, params(ctx, 'swords.upright').fp!, 'card');
  },
  'swords.reversed': (ctx, a, c) => {
    for (const [t, b] of targets(ctx, a, c, 'swords.reversed')) {
      if (hit(ctx, t, 'swords.reversed')) moveBy(ctx, t, -(params(ctx, 'swords.reversed').back! + b), 'push');
    }
  },

  // Cups (water): cards.
  'cups.upright': (ctx, a) => { drawCards(ctx, a, params(ctx, 'cups.upright').draw!); },
  'cups.reversed': (ctx, a, c) => {
    for (const [t, b] of targets(ctx, a, c, 'cups.reversed')) {
      if (hit(ctx, t, 'cups.reversed')) discardRandom(ctx, t, params(ctx, 'cups.reversed').discard! + b);
    }
  },
};
