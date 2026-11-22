import { describe, expect, it } from 'vitest';
import { BOARD, piecePositions, polar, readableTurn, signAngle } from '../src/ui/components/boardGeometry';

describe('board geometry', () => {
  it('puts Aries at the top and goes clockwise', () => {
    const [ax, ay] = polar(100, signAngle(0));
    const [tx, ty] = polar(100, signAngle(1));
    const [cx] = polar(100, signAngle(3));
    expect([Math.round(ax), Math.round(ay)]).toEqual([0, -100]);
    expect(tx).toBeGreaterThan(0); // Taurus to the right of Aries…
    expect(ty).toBeLessThan(0); // …still on the upper half
    expect(Math.round(cx)).toBe(100); // Cancer at 3 o'clock
  });

  it('keeps up to four pieces on one sign apart and inside the segment', () => {
    for (let n = 1; n <= 4; n++) {
      const spots = piecePositions(5, n);
      expect(spots).toHaveLength(n);
      for (let i = 1; i < n; i++) {
        const d = Math.hypot(spots[i]![0] - spots[i - 1]![0], spots[i]![1] - spots[i - 1]![1]);
        expect(d).toBeGreaterThan(BOARD.pieceSize * 2.3);
      }
      const spread = (n - 1) * BOARD.pieceSpread;
      expect(spread / 2 + 3).toBeLessThan(15); // centre of the outer pieces at least 3° from the edge
    }
  });

  it('never turns sign names upside down', () => {
    for (let sign = 0; sign < 12; sign++) {
      const { turn } = readableTurn(signAngle(sign));
      expect(Math.abs(turn)).toBeLessThanOrEqual(90);
    }
  });
});
