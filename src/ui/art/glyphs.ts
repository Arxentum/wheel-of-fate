import type { Element } from '../../engine/types';
import type { SignId } from '../../engine/data/board';

/**
 * Stroke-only glyphs on a 100 × 100 box (draw with fill none, round caps and joins).
 * Drawn as paths so the board never depends on a font having the zodiac symbols.
 */
export const ZODIAC_PATHS: Record<SignId, string> = {
  aries:
    'M50 90 V44 M50 44 C50 22 40 12 28 12 C17 12 10 21 10 31 C10 41 17 47 25 47 M50 44 C50 22 60 12 72 12 C83 12 90 21 90 31 C90 41 83 47 75 47',
  taurus: 'M26 66 A24 24 0 1 0 74 66 A24 24 0 1 0 26 66 M10 12 C14 30 30 42 50 42 C70 42 86 30 90 12',
  gemini: 'M14 12 Q50 26 86 12 M14 88 Q50 74 86 88 M34 20 V80 M66 20 V80',
  cancer:
    'M13 40 A13 13 0 1 0 39 40 A13 13 0 1 0 13 40 M26 27 C46 13 72 14 90 30 M61 60 A13 13 0 1 0 87 60 A13 13 0 1 0 61 60 M74 73 C54 87 28 86 10 70',
  leo: 'M14 66 A14 14 0 1 0 42 66 A14 14 0 1 0 14 66 M40 58 C36 44 28 36 28 26 C28 15 38 8 50 8 C63 8 72 17 72 29 C72 45 58 56 58 72 C58 84 66 90 74 90 C82 90 88 84 88 76',
  virgo:
    'M8 26 C14 26 16 30 16 36 V82 M16 40 C16 27 34 27 34 40 V82 M34 40 C34 27 52 27 52 40 V82 M52 62 C58 46 80 46 82 60 C84 74 70 84 58 92',
  libra: 'M10 86 H90 M10 66 H32 C22 58 22 40 34 31 C44 23 56 23 66 31 C78 40 78 58 68 66 H90',
  scorpio:
    'M8 26 C14 26 16 30 16 36 V80 M16 40 C16 27 34 27 34 40 V80 M34 40 C34 27 52 27 52 40 V72 C52 82 58 86 68 86 H90 M80 76 L90 86 L80 96',
  sagittarius: 'M14 86 L86 14 M52 14 H86 V48 M26 50 L50 74',
  capricorn:
    'M8 18 C16 18 22 26 22 36 V82 M22 42 C26 26 44 24 46 40 V66 C46 82 58 90 72 86 C84 82 90 70 84 60 C78 50 62 52 60 64 C58 76 50 88 38 92',
  aquarius: 'M8 44 L24 30 L40 44 L56 30 L72 44 L92 30 M8 74 L24 60 L40 74 L56 60 L72 74 L92 60',
  pisces: 'M22 10 C40 30 40 70 22 90 M78 10 C60 30 60 70 78 90 M24 50 H76',
};

/** Alchemical element triangles: fire up, water down, air up with a bar, earth down with a bar. */
export const ELEMENT_PATHS: Record<Element, string> = {
  fire: 'M50 12 L90 82 H10 Z',
  water: 'M10 18 H90 L50 88 Z',
  air: 'M50 12 L90 82 H10 Z M12 58 H88',
  earth: 'M10 18 H90 L50 88 Z M12 42 H88',
};

/** Chain Trap: two linked rings. Illusion Trap: a crescent moon. Same 100 × 100 box, stroke only. */
export const TRAP_PATHS = {
  chain: 'M10 50 A20 20 0 0 1 30 30 H44 A20 20 0 0 1 44 70 H30 A20 20 0 0 1 10 50 Z M56 30 H70 A20 20 0 0 1 70 70 H56 A20 20 0 0 1 56 30 Z',
  illusion: 'M62 12 A40 40 0 1 0 88 66 A30 30 0 1 1 62 12 Z',
} as const;
