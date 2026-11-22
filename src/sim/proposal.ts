import type { BalancePatch } from '../engine';

/**
 * Suggested changes to rulebook v3 (balance report §6). Not used by the game until approved;
 * the simulator runs it next to the v3 numbers. Every entry maps to one sentence of card text.
 */
export const PROPOSAL: BalancePatch = {
  // Structure
  rotateStart: true, // the first player moves one seat on each round
  reversedAhead: true, // single-target reversed faces hit every player ahead of you
  cards: {
    // Too strong in v3
    'strength.upright': { shield: 0 }, // next Fire sign, no shield
    'wheelOfFortune.upright': { moveHigher: 0 }, // move the lower die, FP = the higher
    'lovers.upright': { extra: 0 }, // to the space of the nearest player ahead, not 1 beyond
    'star.upright': { fpFloor: 2 }, // FP back up to 2 (was 3)
    'temperance.upright': { draw: 0 }, // next Water sign only
    'world.upright': { max: 8 }, // to Pisces, at most 8 spaces
    // Too weak in v3: a little forward movement
    'hermit.upright': { move: 1, draw: 1 },
    'empress.upright': { move: 1, draw: 1 },
    'hierophant.upright': { move: 1 },
    'highPriestess.upright': { move: 1, fp: 0 },
    'death.upright': { move: 2 },
    'devil.upright': { move: 2 },
    'emperor.upright': { roll: 4, fp: 1 },
    'magician.upright': { extraPlays: 2 },
    'justice.upright': { min: 2, moveIfLeading: 1 },
    'judgement.upright': { draw: 2 },
    'moon.upright': { fp: 1 },
    // The Hanged Man: move now, pay next turn (was: skip this Move step for 4 FP + 2 cards + shield)
    'hangedMan.upright': { skipMove: 0, move: 2, fp: 3, draw: 1, slowedSelf: 1 },
  },
};
