import type { BalancePatch } from '../engine';

/**
 * Earlier rule versions as patches over the current defaults (rules v5), so the simulator can
 * compare them (docs/balance-report.md) and tests can still check the older behaviour.
 */

/** Rules v4 = v5 without the character reversed redesign (D-60) and the shield refund (D-59). */
export const RULEBOOK_V4: BalancePatch = {
  majorReversedV5: false,
  leaderBonus: 0,
  trapOnPass: false,
  trapBounty: 0,
  trapReach: 0,
  shieldRefund: 0,
  cards: {
    'magician.reversed': { steal: 1, silencedTurns: 1 },
    'highPriestess.reversed': { discard: 2, drainedTurns: 1 },
    'hermit.reversed': { drainedTurns: 2 },
    'death.reversed': { fpLoss: 3, discard: 1 },
    'star.reversed': { steal: 2 },
    'sun.reversed': { fpLoss: 2 },
  },
};

/** Rulebook v3 = v4 without the M1 balance changes (D-58). Every line undoes one change (report §6). */
export const RULEBOOK_V3: BalancePatch = {
  ...RULEBOOK_V4,
  rotateStart: false, // S1
  reversedAhead: false, // S2
  cards: {
    ...RULEBOOK_V4.cards,
    'strength.upright': { shield: 1 }, // M1
    'wheelOfFortune.upright': { moveHigher: 1 }, // M2
    'lovers.upright': { extra: 1 }, // M3
    'star.upright': { fpFloor: 3 }, // M4
    'temperance.upright': { draw: 1 }, // M5
    'world.upright': { max: 11 }, // M6
    'hermit.upright': { move: 0, draw: 2 }, // M7
    'empress.upright': { move: 0, draw: 2 }, // M8
    'hierophant.upright': { move: 0 }, // M9
    'highPriestess.upright': { move: 0, fp: 1 }, // M10
    'death.upright': { move: 0 }, // M11
    'devil.upright': { move: 1 }, // M12
    'emperor.upright': { roll: 3, fp: 2 }, // M13
    'magician.upright': { extraPlays: 1 }, // M14
    'justice.upright': { min: 0, moveIfLeading: 0 }, // M15
    'judgement.upright': { draw: 1 }, // M16
    'moon.upright': { fp: 0 }, // M17
    'hangedMan.upright': { skipMove: 1, move: 0, fp: 4, draw: 2, slowedSelf: 0 }, // M18
  },
};
