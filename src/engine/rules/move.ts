import { bal, emit, player, type Ctx } from '../core/context';
import { distanceToNext, distanceToPrev, lapOf, signOf } from '../data/board';
import type { Element, MoveCause, PlayerId } from '../types';
import { gainFp } from './fp';
import { springTrap, trapAt } from './trap';

/** Sets the position: floor at 0 (rule §9), lap bonus for a new highest lap (D-14), final round (D-37). */
function place(ctx: Ctx, id: PlayerId, to: number, cause: MoveCause): void {
  const s = ctx.s;
  const p = player(s, id);
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

/** Own movement springs traps on the way when balance.trapOnPass is on (decision D-60). */
function springsTraps(ctx: Ctx, cause: MoveCause): boolean {
  return bal(ctx).trapOnPass && (cause === 'move' || cause === 'wrongTurn' || cause === 'card');
}

/** Every change of position goes through here. */
export function moveTo(ctx: Ctx, id: PlayerId, target: number, cause: MoveCause): void {
  const s = ctx.s;
  const p = player(s, id);
  const to = Math.max(0, Math.floor(target));
  if (to === p.progress) return;
  if (springsTraps(ctx, cause) && s.traps.length > 0) {
    const dir = to > p.progress ? 1 : -1;
    for (let q = p.progress + dir; dir > 0 ? q <= to : q >= to; q += dir) {
      const trap = trapAt(s, signOf(q));
      if (!trap || trap.owner === id) continue;
      place(ctx, id, q, cause);
      if (springTrap(ctx, id, trap)) return; // an Illusion Trap ends the movement
    }
  }
  place(ctx, id, to, cause);
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
export function moveBackTo(ctx: Ctx, id: PlayerId, element: Element, cause: MoveCause = 'push'): void {
  const p = player(ctx.s, id);
  moveBy(ctx, id, -distanceToPrev(p.progress, element), cause);
}
