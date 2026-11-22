import type { BalanceConfig, BalancePatch, FaceKey } from '../types';
import { FACES } from './cards';

function defaultCardParams(): Record<FaceKey, Record<string, number>> {
  const out = {} as Record<FaceKey, Record<string, number>>;
  for (const key of Object.keys(FACES) as FaceKey[]) out[key] = { ...FACES[key].params };
  return out;
}

/** The rules and numbers of rules v5 (v3 + the M1 balance changes D-58, shield refund D-59, character reversed redesign D-60). */
export function defaultBalance(): BalanceConfig {
  return {
    startFp: 3,
    startHand: 3,
    drawPerTurn: 1,
    drawWhenEmpty: 2,
    fpCap: 10,
    handLimit: 5,
    rerollCost: 1,
    boostCost: 2,
    flipCost: 1,
    skillCost: 1,
    lapBonus: 2,
    elementBonus: 1,
    resonanceBonus: 1,
    meditateDraw: 1,
    meditateFp: 1,
    courtDraw: 1,
    die: [1, 2, 3],
    maxTraps: 3,
    chainRootedTurns: 1,
    chainFpLoss: 3,
    illusionBack: 4,
    shieldRefund: 1,
    majorReversedV5: true,
    leaderBonus: 2,
    trapOnPass: true,
    trapBounty: 1,
    trapReach: 3,
    leaderBonusCards: 0,
    startProgressBySeat: [],
    startFpBySeat: [],
    finishSafe: false,
    endRule: 'round',
    rotateStart: true,
    reversedAhead: true,
    cards: defaultCardParams(),
    // Rules v5: "2-player game: ..." lines (decision D-63).
    cards2p: {
      'hangedMan.upright': { move: 3 },
      'hermit.upright': { draw: 2 },
      'hierophant.upright': { fp: 2 },
      'lovers.upright': { fallback: 2 },
    },
  };
}

/** The balance a game actually uses: 2-player games take the cards2p changes. */
export function balanceForPlayers(b: BalanceConfig, players: number): BalanceConfig {
  if (players !== 2 || Object.keys(b.cards2p).length === 0) return b;
  const cards = { ...b.cards };
  for (const key of Object.keys(b.cards2p) as FaceKey[]) cards[key] = { ...cards[key], ...b.cards2p[key] };
  return { ...b, cards };
}

export function applyBalancePatch(base: BalanceConfig, patch?: BalancePatch): BalanceConfig {
  if (!patch) return base;
  const { cards, cards2p, ...rest } = patch;
  const merged: BalanceConfig = { ...base, ...rest, cards: { ...base.cards }, cards2p: { ...base.cards2p } };
  if (cards2p) {
    for (const key of Object.keys(cards2p) as FaceKey[]) {
      if (!(key in FACES)) throw new Error(`unknown face ${key}`);
      merged.cards2p[key] = { ...base.cards2p[key], ...cards2p[key] };
    }
  }
  if (cards) {
    for (const key of Object.keys(cards) as FaceKey[]) {
      if (!(key in FACES)) throw new Error(`unknown face ${key}`);
      merged.cards[key] = { ...base.cards[key], ...cards[key] };
    }
  }
  return merged;
}
