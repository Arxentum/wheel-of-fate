import { bal, emit, player, type Ctx } from '../core/context';
import type { FpReason, PlayerId, PlayerState } from '../types';
import { isActive } from './status';

/** Gains up to the cap (rule §9: excess is lost). Returns what was actually gained. */
export function gainFp(ctx: Ctx, id: PlayerId, n: number, reason: FpReason): number {
  if (n <= 0) return 0;
  const p = player(ctx.s, id);
  const gained = Math.min(n, Math.max(0, bal(ctx).fpCap - p.fp));
  p.fp += gained;
  emit(ctx, { t: 'fp', p: id, delta: gained, reason, lostToCap: n - gained });
  return gained;
}

/** Loses down to 0. Returns what was actually lost. */
export function loseFp(ctx: Ctx, id: PlayerId, n: number, reason: FpReason): number {
  if (n <= 0) return 0;
  const p = player(ctx.s, id);
  const lost = Math.min(n, p.fp);
  p.fp -= lost;
  emit(ctx, { t: 'fp', p: id, delta: -lost, reason, lostToCap: 0 });
  return lost;
}

/** Drained players cannot spend (rule §6); gaining is still allowed (decision D-03). */
export function canSpend(p: PlayerState, n: number): boolean {
  return !isActive(p, 'drained') && p.fp >= n;
}

export function spendFp(ctx: Ctx, id: PlayerId, n: number, reason: FpReason): void {
  const p = player(ctx.s, id);
  if (!canSpend(p, n)) throw new Error(`player ${id} cannot spend ${n} FP`);
  if (n <= 0) return;
  p.fp -= n;
  emit(ctx, { t: 'fp', p: id, delta: -n, reason, lostToCap: 0 });
}

/** Decision D-31: take what the target has; what does not fit under your cap is lost. */
export function stealFp(ctx: Ctx, from: PlayerId, to: PlayerId, n: number): number {
  const taken = loseFp(ctx, from, n, 'steal');
  emit(ctx, { t: 'steal', from, to, what: 'fp', n: taken });
  gainFp(ctx, to, taken, 'steal');
  return taken;
}
