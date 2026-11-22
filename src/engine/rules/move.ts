import { bal, emit, player, type Ctx } from '../core/context';
import { distanceToNext, distanceToPrev, lapOf } from '../data/board';
import type { Element, MoveCause, PlayerId } from '../types';
import { gainFp } from './fp';

/**
 * Every change of position goes through here: floor at 0 (rule §9), lap bonus only for a
 * new highest lap (decision D-14), and the final-round trigger (decision D-37).
 */
export function moveTo(ctx: Ctx, id: PlayerId, target: number, cause: MoveCause): void {
  const s = ctx.s;
  const p = player(s, id);
  const to = Math.max(0, Math.floor(target));
  const from = p.progress;
  if (to === from) return;
  p.progress = to;
  emit(ctx, { t: 'move', p: id, from, to, cause });

  const lap = lapOf(to);
  if (lap > p.lapsRewarded) {
    const newLaps = lap - p.lapsRewarded;
    for (let l = p.lapsRewarded + 1; l <= lap; l++) emit(ctx, { t: 'lap', p: id, lap: l });
    p.lapsRewarded = lap;
    gainFp(ctx, id, newLaps * bal(ctx).lapBonus, 'lap');
  }
  if (!s.finalRound && to >= s.config.finish) {
    s.finalRound = true;
    emit(ctx, { t: 'finalRound', p: id });
  }
}

export function moveBy(ctx: Ctx, id: PlayerId, delta: number, cause: MoveCause): void {
  moveTo(ctx, id, player(ctx.s, id).progress + delta, cause);
}

/** Rule §9: forward to the next sign of an element (1..4 spaces), then `extra` more. */
export function moveToNext(ctx: Ctx, id: PlayerId, element: Element, extra = 0): void {
  const p = player(ctx.s, id);
  moveBy(ctx, id, distanceToNext(p.progress, element) + extra, 'card');
}

/** Rule §9: back to the previous sign of an element (1..4 spaces), not below 0. */
export function moveBackTo(ctx: Ctx, id: PlayerId, element: Element): void {
  const p = player(ctx.s, id);
  moveBy(ctx, id, -distanceToPrev(p.progress, element), 'card');
}
