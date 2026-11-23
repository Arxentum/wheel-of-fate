import type { EmoteId } from '../game/emotes';
import type { IconLayer } from './icons';

/** The emote faces: a round face in the board's style, each with its own expression. */

const face = 'M10 52 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 Z';
const YELLOW = '#EAA936';

export const EMOTE_FACES: Record<EmoteId, IconLayer[]> = {
  taunt: [
    { d: face, fill: YELLOW },
    { d: 'M28 44 H42 M58 44 H72', fill: 'none', stroke: 6 },
    { d: 'M34 64 C44 72 60 70 70 60', fill: 'none', stroke: 6 },
    { d: 'M52 68 C52 80 64 82 66 72 Z', fill: '#D14135', stroke: 4 },
  ],
  laugh: [
    { d: face, fill: YELLOW },
    { d: 'M28 46 L35 38 L42 46 M58 46 L65 38 L72 46', fill: 'none', stroke: 6 },
    { d: 'M28 58 H72 C72 74 62 82 50 82 C38 82 28 74 28 58 Z', fill: '#D14135', stroke: 5 },
  ],
  cool: [
    { d: face, fill: YELLOW },
    { d: 'M20 40 H46 V52 C46 58 40 60 34 60 C26 60 20 56 20 48 Z M54 40 H80 V48 C80 56 74 60 66 60 C60 60 54 58 54 52 Z M46 44 H54', fill: 'ink', stroke: 4 },
    { d: 'M36 70 C44 76 58 76 66 68', fill: 'none', stroke: 6 },
  ],
  shock: [
    { d: face, fill: YELLOW },
    { d: 'M24 44 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z M56 44 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 Z', fill: 'paper', stroke: 4 },
    { d: 'M31 44 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z M63 44 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z', fill: 'ink', stroke: 3 },
    { d: 'M42 70 a8 10 0 1 0 16 0 a8 10 0 1 0 -16 0 Z', fill: 'ink', stroke: 3 },
  ],
  cry: [
    { d: face, fill: YELLOW },
    { d: 'M28 42 L42 46 M72 42 L58 46', fill: 'none', stroke: 6 },
    { d: 'M34 74 C42 64 58 64 66 74', fill: 'none', stroke: 6 },
    { d: 'M30 52 C26 60 26 66 31 68 C36 66 35 60 30 52 Z M70 52 C66 60 66 66 71 68 C76 66 75 60 70 52 Z', fill: '#1D4C7C', stroke: 3 },
  ],
  angry: [
    { d: face, fill: '#D14135' },
    { d: 'M24 36 L44 46 M76 36 L56 46', fill: 'none', stroke: 7 },
    { d: 'M32 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z M58 50 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z', fill: 'ink', stroke: 3 },
    { d: 'M34 74 C42 66 58 66 66 74', fill: 'none', stroke: 7 },
  ],
  nice: [
    { d: face, fill: YELLOW },
    { d: 'M35 32 L38 40 L46 40 L40 45 L42 53 L35 48 L28 53 L30 45 L24 40 L32 40 Z M65 32 L68 40 L76 40 L70 45 L72 53 L65 48 L58 53 L60 45 L54 40 L62 40 Z', fill: 'paper', stroke: 3 },
    { d: 'M30 62 C38 78 62 78 70 62 Z', fill: 'paper', stroke: 5 },
  ],
  gg: [
    { d: face, fill: YELLOW },
    { d: 'M30 46 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z M62 46 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z', fill: 'ink', stroke: 3 },
    { d: 'M34 62 C42 72 58 72 66 62', fill: 'none', stroke: 6 },
    { d: 'M18 58 a6 4 0 1 0 12 0 a6 4 0 1 0 -12 0 Z M70 58 a6 4 0 1 0 12 0 a6 4 0 1 0 -12 0 Z', fill: '#D14135', stroke: 0 },
  ],
};
