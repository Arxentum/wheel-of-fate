/**
 * Icons for the card effects, drawn like the board's glyphs: bold flat shapes with an ink
 * outline, in a 100 × 100 box centred on (50, 50). Each icon is a list of layers; a layer
 * with fill 'accent' takes the effect's colour.
 */

export interface IconLayer {
  d: string;
  fill?: 'accent' | 'ink' | 'paper' | 'none' | string;
  /** Outline width (default 6). */
  stroke?: number;
}

export type IconName =
  | 'flame' | 'smoke' | 'coin' | 'wind' | 'sword' | 'drop' | 'heart' | 'heartBroken'
  | 'letter' | 'bubble' | 'horseshoe' | 'lance' | 'rose' | 'eye' | 'crown' | 'shield'
  | 'feather' | 'signpost' | 'hat' | 'hand' | 'leaf' | 'scroll' | 'key' | 'bell'
  | 'wheel' | 'lion' | 'lantern' | 'scales' | 'gavel' | 'rope' | 'skull' | 'hourglass'
  | 'horns' | 'chain' | 'bolt' | 'brick' | 'star' | 'moon' | 'sun' | 'trumpet' | 'globe' | 'snowflake' | 'scythe';

const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;

export const ICONS: Record<IconName, IconLayer[]> = {
  flame: [
    { d: 'M50 6 C62 26 82 38 82 62 C82 82 68 94 50 94 C32 94 18 82 18 62 C18 46 30 38 34 24 C40 34 42 40 48 42 C50 30 48 18 50 6 Z', fill: 'accent' },
    { d: 'M50 52 C58 62 64 68 64 78 C64 86 58 92 50 92 C42 92 36 86 36 78 C36 70 44 64 50 52 Z', fill: '#EAA936', stroke: 4 },
  ],
  smoke: [
    { d: `${circle(34, 58, 18)} ${circle(58, 46, 22)} ${circle(70, 66, 16)} M26 74 H78 V82 H26 Z`, fill: '#C9C1B6' },
  ],
  coin: [
    { d: circle(50, 50, 38), fill: '#EAA936' },
    { d: 'M50 24 L57 42 L76 42 L61 54 L67 72 L50 61 L33 72 L39 54 L24 42 L43 42 Z', fill: 'paper', stroke: 4 },
  ],
  wind: [
    { d: 'M10 34 H62 C74 34 78 22 70 16 C64 12 56 16 56 22', fill: 'none', stroke: 8 },
    { d: 'M10 52 H80 C92 52 94 66 86 72 C80 76 72 72 72 66', fill: 'none', stroke: 8 },
    { d: 'M10 70 H48 C58 70 60 82 52 86', fill: 'none', stroke: 8 },
  ],
  sword: [
    { d: 'M50 4 L60 18 L60 64 L40 64 L40 18 Z', fill: 'paper' },
    { d: 'M24 64 H76 V74 H24 Z', fill: 'accent' },
    { d: 'M44 74 H56 V90 H44 Z', fill: 'ink' },
    { d: circle(50, 94, 5), fill: 'accent', stroke: 4 },
  ],
  drop: [{ d: 'M50 6 C62 30 80 48 80 66 C80 84 66 96 50 96 C34 96 20 84 20 66 C20 48 38 30 50 6 Z', fill: 'accent' }],
  heart: [{ d: 'M50 88 C20 66 8 50 8 34 C8 20 18 10 32 10 C42 10 48 18 50 24 C52 18 58 10 68 10 C82 10 92 20 92 34 C92 50 80 66 50 88 Z', fill: 'accent' }],
  heartBroken: [
    { d: 'M46 86 C18 64 8 50 8 34 C8 20 18 10 32 10 C40 10 46 16 48 22 L40 40 L52 52 L44 70 Z', fill: 'accent' },
    { d: 'M56 86 C84 64 94 50 94 34 C94 20 84 10 70 10 C62 10 56 16 54 22 L46 40 L58 52 L50 70 Z', fill: 'accent' },
  ],
  letter: [
    { d: 'M10 24 H90 V78 H10 Z', fill: 'paper' },
    { d: 'M10 24 L50 56 L90 24', fill: 'none' },
    { d: circle(50, 58, 8), fill: 'accent', stroke: 4 },
  ],
  bubble: [
    { d: 'M14 16 H86 V66 H44 L26 84 L28 66 H14 Z', fill: 'paper' },
    { d: `${circle(34, 41, 6)} ${circle(50, 41, 6)} ${circle(66, 41, 6)}`, fill: 'ink', stroke: 0 },
  ],
  horseshoe: [{ d: 'M20 90 V48 C20 26 34 12 50 12 C66 12 80 26 80 48 V90 H64 V48 C64 36 58 28 50 28 C42 28 36 36 36 48 V90 Z', fill: 'accent' }],
  lance: [
    { d: 'M50 2 L60 30 L56 30 L56 96 L44 96 L44 30 L40 30 Z', fill: 'paper' },
    { d: 'M30 62 H70 L62 74 H38 Z', fill: 'accent' },
  ],
  rose: [
    { d: circle(50, 38, 26), fill: 'accent' },
    { d: 'M50 22 C60 26 62 38 54 44 C46 50 38 42 42 34', fill: 'none', stroke: 5 },
    { d: 'M50 64 V96 M50 80 C60 72 70 74 74 78 C68 86 58 86 50 80', fill: '#3B672B', stroke: 5 },
  ],
  eye: [
    { d: 'M6 50 C22 22 78 22 94 50 C78 78 22 78 6 50 Z', fill: 'paper' },
    { d: circle(50, 50, 18), fill: 'accent' },
    { d: circle(50, 50, 7), fill: 'ink', stroke: 0 },
  ],
  crown: [
    { d: 'M10 30 L30 52 L50 18 L70 52 L90 30 L82 78 H18 Z', fill: '#EAA936' },
    { d: 'M18 78 H82 V90 H18 Z', fill: 'accent' },
  ],
  shield: [{ d: 'M50 6 L88 20 C88 56 74 80 50 94 C26 80 12 56 12 20 Z', fill: 'accent' }, { d: 'M50 22 V80 M28 40 H72', fill: 'none', stroke: 5 }],
  feather: [
    { d: 'M78 8 C40 18 22 50 26 86 C58 80 84 50 78 8 Z', fill: 'paper' },
    { d: 'M76 12 L18 94', fill: 'none', stroke: 6 },
  ],
  signpost: [
    { d: 'M46 14 H54 V96 H46 Z', fill: 'ink' },
    { d: 'M14 20 H72 L86 32 L72 44 H14 Z', fill: 'accent' },
    { d: 'M86 52 H28 L14 64 L28 76 H86 Z', fill: 'paper' },
  ],
  hat: [
    { d: 'M30 16 H70 V72 H30 Z', fill: 'ink' },
    { d: 'M30 56 H70 V66 H30 Z', fill: 'accent', stroke: 0 },
    { d: 'M8 72 H92 V84 H8 Z', fill: 'ink' },
  ],
  hand: [
    {
      d: 'M30 92 C20 80 16 66 16 56 V40 C16 34 26 34 26 40 V54 H30 V20 C30 14 40 14 40 20 V50 H44 V14 C44 8 54 8 54 14 V50 H58 V20 C58 14 68 14 68 20 V54 H72 V34 C72 28 82 28 82 34 V60 C82 76 74 86 66 92 Z',
      fill: 'paper',
    },
  ],
  leaf: [
    { d: 'M14 86 C14 40 44 14 88 12 C88 56 62 86 14 86 Z', fill: '#3B672B' },
    { d: 'M14 86 C40 60 58 42 80 22', fill: 'none', stroke: 5 },
  ],
  scroll: [
    { d: 'M20 18 H76 V82 H20 Z', fill: 'paper' },
    { d: 'M30 34 H66 M30 48 H66 M30 62 H54', fill: 'none', stroke: 5 },
    { d: circle(70, 78, 14), fill: 'accent' },
  ],
  key: [
    { d: circle(30, 50, 20), fill: '#EAA936' },
    { d: 'M48 44 H92 V56 H84 V68 H74 V56 H48 Z', fill: '#EAA936' },
    { d: circle(30, 50, 7), fill: 'paper', stroke: 4 },
  ],
  bell: [
    { d: 'M50 10 C70 10 78 26 78 46 V64 L88 76 H12 L22 64 V46 C22 26 30 10 50 10 Z', fill: 'accent' },
    { d: circle(50, 86, 8), fill: 'ink', stroke: 4 },
  ],
  wheel: [
    { d: circle(50, 50, 40), fill: 'paper' },
    { d: circle(50, 50, 10), fill: 'accent' },
    { d: 'M50 10 V90 M10 50 H90 M22 22 L78 78 M78 22 L22 78', fill: 'none', stroke: 6 },
  ],
  lion: [
    { d: 'M50 4 L60 18 L76 12 L76 28 L92 32 L84 46 L96 58 L80 64 L82 82 L66 78 L58 94 L50 82 L42 94 L34 78 L18 82 L20 64 L4 58 L16 46 L8 32 L24 28 L24 12 L40 18 Z', fill: '#EAA936' },
    { d: circle(50, 52, 24), fill: 'accent' },
    { d: `${circle(41, 46, 4)} ${circle(59, 46, 4)} M42 62 L50 68 L58 62`, fill: 'ink', stroke: 3 },
  ],
  lantern: [
    { d: 'M38 6 H62 V16 H38 Z', fill: 'ink' },
    { d: 'M30 16 H70 L76 76 H24 Z', fill: '#EAA936' },
    { d: 'M50 34 C58 44 60 52 50 62 C40 52 42 44 50 34 Z', fill: 'accent', stroke: 4 },
    { d: 'M20 76 H80 V88 H20 Z', fill: 'ink' },
  ],
  scales: [
    { d: 'M47 10 H53 V86 H47 Z M24 86 H76 V94 H24 Z M14 24 H86', fill: 'ink', stroke: 6 },
    { d: 'M6 56 L22 24 L38 56 Z M62 56 L78 24 L94 56 Z', fill: 'none', stroke: 4 },
    { d: 'M4 56 H40 C40 66 32 72 22 72 C12 72 4 66 4 56 Z M60 56 H96 C96 66 88 72 78 72 C68 72 60 66 60 56 Z', fill: 'accent' },
  ],
  gavel: [
    { d: 'M18 30 L46 8 L66 30 L38 52 Z', fill: 'accent' },
    { d: 'M46 40 L88 84 L80 92 L38 48 Z', fill: 'ink' },
    { d: 'M10 82 H50 V92 H10 Z', fill: 'paper' },
  ],
  rope: [
    { d: 'M50 4 V40', fill: 'none', stroke: 8 },
    { d: circle(50, 62, 22), fill: 'none', stroke: 10 },
    { d: 'M38 46 L62 78 M62 46 L38 78', fill: 'none', stroke: 4 },
  ],
  skull: [
    { d: 'M50 8 C74 8 88 24 88 46 C88 60 80 66 76 70 V88 H24 V70 C20 66 12 60 12 46 C12 24 26 8 50 8 Z', fill: 'paper' },
    { d: `${circle(35, 46, 10)} ${circle(65, 46, 10)} M44 66 L50 58 L56 66 Z`, fill: 'ink', stroke: 0 },
    { d: 'M38 76 V88 M50 76 V88 M62 76 V88', fill: 'none', stroke: 4 },
  ],
  hourglass: [
    { d: 'M20 8 H80 V16 H20 Z M20 84 H80 V92 H20 Z', fill: 'ink' },
    { d: 'M28 16 H72 C72 36 56 44 56 50 C56 56 72 64 72 84 H28 C28 64 44 56 44 50 C44 44 28 36 28 16 Z', fill: 'paper' },
    { d: 'M36 84 C38 72 46 66 50 66 C54 66 62 72 64 84 Z M40 26 H60 C58 34 52 40 50 44 C48 40 42 34 40 26 Z', fill: 'accent', stroke: 0 },
  ],
  horns: [
    { d: 'M14 10 C10 40 24 60 44 64 L38 48 C28 44 22 30 14 10 Z M86 10 C90 40 76 60 56 64 L62 48 C72 44 78 30 86 10 Z', fill: 'accent' },
    { d: 'M30 56 C30 78 40 92 50 92 C60 92 70 78 70 56 Z', fill: 'ink' },
  ],
  chain: [
    { d: 'M8 38 H44 C54 38 54 62 44 62 H8 C-2 62 -2 38 8 38 Z', fill: 'none', stroke: 9 },
    { d: 'M56 38 H92 C102 38 102 62 92 62 H56 C46 62 46 38 56 38 Z', fill: 'none', stroke: 9 },
    { d: 'M34 50 H66', fill: 'none', stroke: 9 },
  ],
  bolt: [{ d: 'M60 4 L22 56 H46 L36 96 L80 38 H54 Z', fill: '#EAA936' }],
  brick: [
    { d: 'M8 30 H92 V70 H8 Z', fill: 'accent' },
    { d: 'M8 50 H92 M50 30 V50 M30 50 V70 M70 50 V70', fill: 'none', stroke: 4 },
  ],
  star: [{ d: 'M50 4 L62 36 L96 38 L70 60 L80 94 L50 74 L20 94 L30 60 L4 38 L38 36 Z', fill: '#EAA936' }],
  moon: [{ d: 'M66 8 C40 12 24 32 24 54 C24 78 44 94 68 92 C50 82 42 66 42 50 C42 32 52 16 66 8 Z', fill: '#F2EADF' }],
  sun: [
    { d: 'M50 0 L56 20 L72 8 L70 28 L92 26 L80 42 L100 50 L80 58 L92 74 L70 72 L72 92 L56 80 L50 100 L44 80 L28 92 L30 72 L8 74 L20 58 L0 50 L20 42 L8 26 L30 28 L28 8 L44 20 Z', fill: '#EAA936' },
    { d: circle(50, 50, 20), fill: 'accent' },
  ],
  trumpet: [
    { d: 'M6 42 H14 V58 H6 Z', fill: 'ink' },
    { d: 'M14 46 H56 L92 22 V78 L56 54 H14 Z', fill: '#EAA936' },
    { d: 'M30 46 V54 M42 46 V54', fill: 'none', stroke: 4 },
  ],
  globe: [
    { d: circle(50, 50, 40), fill: '#1D4C7C' },
    { d: 'M26 34 C36 30 42 40 36 48 C30 56 38 66 32 74 M62 18 C56 30 70 36 74 46 C78 56 68 62 72 76', fill: 'none', stroke: 6 },
    { d: 'M2 60 C30 74 70 74 98 60', fill: 'none', stroke: 5 },
  ],
  scythe: [
    { d: "M66 8 L28 96", fill: "none", stroke: 9 },
    { d: "M66 10 C44 2 18 10 4 32 C24 22 46 20 62 24 Z", fill: "paper" },
  ],
  snowflake: [
    { d: 'M50 4 V96 M10 27 L90 73 M10 73 L90 27', fill: 'none', stroke: 9 },
    { d: 'M38 12 L50 24 L62 12 M38 88 L50 76 L62 88 M8 42 L24 46 L18 30 M92 58 L76 54 L82 70 M8 58 L24 54 L18 70 M92 42 L76 46 L82 30', fill: 'none', stroke: 6 },
  ],
};
