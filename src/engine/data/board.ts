import type { Element, Suit } from '../types';

/** Rule §3.1: 12 signs clockwise from Aries; elements repeat fire, earth, air, water. */
export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type SignId = (typeof SIGNS)[number];

export const BOARD_SIZE = 12;
export const ELEMENTS: readonly Element[] = ['fire', 'earth', 'air', 'water'];
export const PISCES = 11;

/** Rule §3.5: turn order by element. */
export const ELEMENT_ORDER: Record<Element, number> = { fire: 0, earth: 1, air: 2, water: 3 };

export const SUIT_ELEMENT: Record<Suit, Element> = {
  wands: 'fire',
  pentacles: 'earth',
  swords: 'air',
  cups: 'water',
};

export function signOf(progress: number): number {
  return ((progress % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

export function elementOfSign(sign: number): Element {
  return ELEMENTS[signOf(sign) % 4]!;
}

export function lapOf(progress: number): number {
  return Math.floor(progress / BOARD_SIZE);
}

/** Spaces to the next sign of `element` ahead, not counting the current one (1..4). */
export function distanceToNext(progress: number, element: Element): number {
  for (let d = 1; d <= 4; d++) if (elementOfSign(progress + d) === element) return d;
  throw new Error('unreachable');
}

/** Spaces back to the previous sign of `element`, not counting the current one (1..4). */
export function distanceToPrev(progress: number, element: Element): number {
  for (let d = 1; d <= 4; d++) if (elementOfSign(progress - d) === element) return d;
  throw new Error('unreachable');
}
