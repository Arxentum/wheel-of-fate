// Seeded random numbers (sfc32). The state lives in GameState.rng so games replay exactly.

export type RngState = [number, number, number, number];

/** cyrb128: hashes a string to four 32-bit seeds. */
export function seedFromString(seed: string): RngState {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  const st: RngState = [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  // Warm up.
  for (let i = 0; i < 12; i++) nextFloat(st);
  return st;
}

/** Advances `st` in place and returns a float in [0, 1). */
export function nextFloat(st: RngState): number {
  let [a, b, c, d] = st;
  a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
  let t = (a + b) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  d = (d + 1) | 0;
  t = (t + d) | 0;
  c = (c + t) | 0;
  st[0] = a; st[1] = b; st[2] = c; st[3] = d;
  return (t >>> 0) / 4294967296;
}

/** Integer in [0, n). */
export function nextInt(st: RngState, n: number): number {
  return Math.floor(nextFloat(st) * n);
}

export function pick<T>(st: RngState, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick from empty list');
  return items[nextInt(st, items.length)]!;
}

/** Fisher-Yates shuffle in place. */
export function shuffle<T>(st: RngState, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = nextInt(st, i + 1);
    const tmp = items[i]!;
    items[i] = items[j]!;
    items[j] = tmp;
  }
  return items;
}

/** A different but deterministic stream (used by the AI so it cannot peek at the real one). */
export function deriveRng(st: RngState, salt: number): RngState {
  const out: RngState = [
    (st[0] ^ 0x9e3779b9 ^ salt) >>> 0,
    (st[1] ^ 0x85ebca6b) >>> 0,
    (st[2] ^ 0xc2b2ae35 ^ Math.imul(salt, 0x27d4eb2f)) >>> 0,
    (st[3] ^ 0x165667b1) >>> 0,
  ];
  for (let i = 0; i < 8; i++) nextFloat(out);
  return out;
}
