import type { BalancePatch } from '../engine';

/**
 * Rulebook v3 as a patch over the current defaults (v4), so the simulator can still compare
 * the two (docs/balance-report.md). Every line undoes one M1 change (report §6).
 */
export const RULEBOOK_V3: BalancePatch = {
  rotateStart: false, // S1
  reversedAhead: false, // S2
  cards: {
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
