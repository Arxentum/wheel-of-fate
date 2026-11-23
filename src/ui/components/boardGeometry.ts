/**
 * Board geometry in SVG units, centre (0, 0), y down. Aries is centred at the top and
 * the signs go clockwise (rule §3.1), so a larger angle is further along the track.
 */
export const BOARD = {
  /** Half the viewBox: room for the rim and the start marker. */
  half: 540,
  /** Cream disc with the compass star. */
  disc: 290,
  /** Coloured ring: sign name, glyph, then the track the pieces stand on. */
  ringInner: 292,
  ringOuter: 456,
  rim: 474,
  /** Thin line between the label part and the track part of each segment. */
  trackLine: 392,
  nameR: 318,
  glyphR: 360,
  glyphSize: 42,
  pieceR: 424,
  pieceSize: 21,
  /** Degrees between neighbouring pieces on one sign. */
  pieceSpread: 7,
  trapR: 256,
  trapSize: 21,
  startR: 500,
} as const;

export const SIGN_SPAN = 30;

/** Centre angle of a sign in degrees (0 = Aries at 12 o'clock is -90°). */
export function signAngle(sign: number): number {
  return -90 + sign * SIGN_SPAN;
}

export function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [round(r * Math.cos(a)), round(r * Math.sin(a))];
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Annular wedge between radii r0 < r1 and angles a0 < a1 (degrees, clockwise). */
export function wedgePath(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}

/** Positions of n pieces sharing one sign: side by side along the track, centred. */
export function piecePositions(sign: number, n: number): [number, number][] {
  const mid = signAngle(sign);
  return Array.from({ length: n }, (_, i) => polar(BOARD.pieceR, mid + (i - (n - 1) / 2) * BOARD.pieceSpread));
}

/**
 * Where each piece stands: pieces on the same sign side by side, in the order given. The
 * board and the card effects drawn over it both use this, so they always agree.
 */
export function pieceSpots<Id extends string | number>(pieces: readonly { id: Id; sign: number }[]): Map<Id, [number, number]> {
  const bySign = new Map<number, Id[]>();
  for (const p of pieces) bySign.set(p.sign, [...(bySign.get(p.sign) ?? []), p.id]);
  const out = new Map<Id, [number, number]>();
  for (const [sign, ids] of bySign) {
    const spots = piecePositions(sign, ids.length);
    ids.forEach((id, i) => out.set(id, spots[i]!));
  }
  return out;
}

/** An eight-pointed compass star: kite points of the given length and half width. */
export function kitePath(deg: number, length: number, halfWidth: number, base: number): string {
  const [tx, ty] = polar(length, deg);
  const [lx, ly] = polar(halfWidth, deg - 90);
  const [rx, ry] = polar(halfWidth, deg + 90);
  const [bx, by] = polar(base, deg + 180);
  return `M${tx} ${ty} L${lx} ${ly} L${bx} ${by} L${rx} ${ry} Z`;
}

/** Rotation (degrees) that lays text along the ring at angle `mid`; `flipped` on the lower half. */
export function readableTurn(mid: number): { turn: number; flipped: boolean } {
  const turn = ((mid + 90 + 540) % 360) - 180; // (-180, 180]
  if (turn > 90) return { turn: turn - 180, flipped: true };
  if (turn < -90) return { turn: turn + 180, flipped: true };
  return { turn, flipped: false };
}
