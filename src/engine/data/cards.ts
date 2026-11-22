import type {
  CardId, CardUid, CourtRank, Element, FaceDef, FaceKey, FateCardId, MajorId, Orientation, Suit,
} from '../types';

export const SUITS: readonly Suit[] = ['wands', 'pentacles', 'swords', 'cups'];
export const COURTS: readonly CourtRank[] = ['page', 'knight', 'queen', 'king'];
export const ORIENTATIONS: readonly Orientation[] = ['upright', 'reversed'];

/** Rule §9.3, numbered 0..21. */
export const MAJORS: readonly MajorId[] = [
  'fool', 'magician', 'highPriestess', 'empress', 'emperor', 'hierophant', 'lovers',
  'chariot', 'strength', 'hermit', 'wheelOfFortune', 'justice', 'hangedMan', 'death',
  'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world',
];

/** Rule §3.3: 10 of each minor suit, 2 of each court card = 48. */
export const MINOR_COPIES = 10;
export const COURT_COPIES = 2;
export const DECK_SIZE = SUITS.length * MINOR_COPIES + COURTS.length * COURT_COPIES;

/** uid 0-9 wands, 10-19 pentacles, 20-29 swords, 30-39 cups, 40-41 page, 42-43 knight, 44-45 queen, 46-47 king. */
export function cardDef(uid: CardUid): FateCardId {
  if (uid < 0 || uid >= DECK_SIZE) throw new Error(`bad card uid ${uid}`);
  const minorCount = SUITS.length * MINOR_COPIES;
  if (uid < minorCount) return SUITS[Math.floor(uid / MINOR_COPIES)]!;
  return COURTS[Math.floor((uid - minorCount) / COURT_COPIES)]!;
}

export function isSuit(id: CardId): id is Suit {
  return (SUITS as readonly string[]).includes(id);
}

export function isCourt(id: CardId): id is CourtRank {
  return (COURTS as readonly string[]).includes(id);
}

export function isMajor(id: CardId): id is MajorId {
  return (MAJORS as readonly string[]).includes(id);
}

export function faceKey(id: CardId, orientation: Orientation): FaceKey {
  return `${id}.${orientation}`;
}

export function splitFace(key: FaceKey): [CardId, Orientation] {
  const i = key.lastIndexOf('.');
  return [key.slice(0, i) as CardId, key.slice(i + 1) as Orientation];
}

/** Rule §9.2: element requirement of each court face (two minors, each of one of these elements). */
export const COURT_REQUIRES: Record<CourtRank, Record<Orientation, [Element, Element]>> = {
  page: { upright: ['air', 'water'], reversed: ['earth', 'fire'] },
  knight: { upright: ['fire', 'water'], reversed: ['earth', 'air'] },
  queen: { upright: ['water', 'earth'], reversed: ['fire', 'air'] },
  king: { upright: ['earth', 'fire'], reversed: ['water', 'air'] },
};

const none = (params: Record<string, number> = {}): FaceDef => ({ targeting: 'none', params });
const other = (params: Record<string, number> = {}): FaceDef => ({ targeting: 'other', params });

/**
 * Every face of every card (rulebook v4 §9; v4 = v3 + the M1 balance changes, see
 * docs/balance-report.md §6 and src/sim/rulebookV3.ts). `params` hold all the numbers; effects/ read them through
 * the game's BalanceConfig so a balance patch can change them.
 */
export const FACES: Record<FaceKey, FaceDef> = {
  // §9.1 minor arcana
  'wands.upright': none({ move: 1 }),
  'wands.reversed': other({ slowedTurns: 1 }),
  'pentacles.upright': none({ fp: 2 }),
  'pentacles.reversed': other({ steal: 1 }),
  'swords.upright': none({ fp: 1 }),
  'swords.reversed': other({ back: 1 }),
  'cups.upright': none({ draw: 2 }),
  'cups.reversed': other({ discard: 2 }),

  // §9.2 court combos
  'page.upright': none({ draw: 2 }),
  'page.reversed': other({ back: 1, discard: 2, silencedTurns: 1 }),
  'knight.upright': none({ extra: 1 }),
  'knight.reversed': other({ stunnedTurns: 1 }),
  'queen.upright': none({ move: 2, fp: 2, shield: 1 }),
  'queen.reversed': other({ fpLoss: 3 }),
  'king.upright': none({ move: 3, shield: 1 }),
  'king.reversed': other({ back: 2, silencedTurns: 1, drainedTurns: 1 }),

  // §9.3 major arcana
  'fool.upright': { targeting: 'none', params: { bonus: 1 }, random: true },
  'fool.reversed': other({ back: 1 }),
  'magician.upright': none({ draw: 2, extraPlays: 2 }),
  'magician.reversed': other({ back: 2, steal: 1, silencedTurns: 0 }),
  'highPriestess.upright': none({ look: 3, fp: 0, move: 1 }),
  'highPriestess.reversed': other({ back: 1, slowedTurns: 1, discard: 1, drainedTurns: 0 }),
  'empress.upright': none({ move: 1, fp: 3, draw: 1 }),
  'empress.reversed': other({ rootedTurns: 1, fpLoss: 1 }),
  'emperor.upright': none({ fp: 1, roll: 4, shield: 1 }),
  'emperor.reversed': { targeting: 'leaderTie', params: { back: 2, silencedTurns: 1, drainedTurns: 1 } },
  'hierophant.upright': none({ move: 1, fp: 2, draw: 1, shield: 1 }),
  'hierophant.reversed': other(),
  'lovers.upright': none({ range: 5, extra: 0, fallback: 2 }),
  'lovers.reversed': { targeting: 'twoOthers', params: { back2p: 2, max: 4, fallback: 2 } },
  'chariot.upright': none({ move: 3 }),
  'chariot.reversed': other({ back: 2, slowedTurns: 1 }),
  'strength.upright': none({ shield: 0 }),
  'strength.reversed': other({ back: 1, stunnedTurns: 1, fpLoss: 1 }),
  'hermit.upright': none({ move: 1, fp: 2, draw: 1, shield: 1 }),
  'hermit.reversed': other({ back: 2, drainedTurns: 1 }),
  'wheelOfFortune.upright': { targeting: 'none', params: { moveHigher: 0 }, random: true },
  'wheelOfFortune.reversed': { targeting: 'none', params: {}, random: true },
  'justice.upright': none({ min: 2, max: 5, fpIfLeading: 2, moveIfLeading: 1 }),
  'justice.reversed': { targeting: 'leaderTie', params: { back: 2, fpLoss: 1 } },
  'hangedMan.upright': none({ skipMove: 0, move: 2, fp: 3, draw: 1, shield: 1, slowedSelf: 1 }),
  'hangedMan.reversed': other({ rootedTurns: 1, drainedTurns: 1, fpLoss: 0 }),
  'death.upright': { targeting: 'discardAny', params: { move: 2, handTo: 5, fp: 1 } },
  'death.reversed': other({ back: 2, fpLoss: 2, discard: 0 }),
  'temperance.upright': none({ draw: 0 }),
  'temperance.reversed': other({ slowedTurns: 2 }),
  'devil.upright': none({ fp: 5, move: 2, drainedTurns: 1 }),
  'devil.reversed': { targeting: 'sign', params: {} },
  'tower.upright': none({ move: 4, moveIfLeading: 4, fpLoss: 0 }),
  'tower.reversed': { targeting: 'others', params: { back: 2 } },
  'star.upright': none({ fpFloor: 2 }),
  'star.reversed': other({ back: 2, steal: 1 }),
  'moon.upright': none({ move: 2, shield: 1, fp: 1 }),
  'moon.reversed': { targeting: 'sign', params: {} },
  'sun.upright': none({ move: 2, fp: 2 }),
  'sun.reversed': other({ back: 1, fpLoss: 1, slowedTurns: 1 }),
  'judgement.upright': { targeting: 'discardUpTo', params: { max: 4, draw: 2 } },
  'judgement.reversed': { targeting: 'others', params: { max: 4 } },
  'world.upright': none({ max: 8 }),
  'world.reversed': { targeting: 'others', params: { rootedTurns: 1, slowedTurns: 0 } },
};

/** The World's faces are once per game (rule §9.3, decision D-30). */
export const ONCE_PER_GAME: ReadonlySet<MajorId> = new Set<MajorId>(['world']);
