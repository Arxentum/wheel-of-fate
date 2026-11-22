import { emit, player, type Ctx } from '../core/context';
import { gainFp } from './fp';
import type { FaceKey, GameState, PlayerId, PlayerState, Status, StatusKind } from '../types';

/** Wrong Turn lasts until consumed; a big number keeps GameState JSON-safe. */
export const FOREVER = 1_000_000;

export const NEGATIVE_STATUSES: readonly StatusKind[] = [
  'slowed', 'silenced', 'drained', 'stunned', 'rooted', 'wrongTurn',
];

export function statusOf(p: PlayerState, kind: StatusKind): Status | undefined {
  return p.statuses.find((st) => st.kind === kind);
}

/** The status applies to the player's current own turn (or, for a shield, is held now). */
export function isActive(p: PlayerState, kind: StatusKind): boolean {
  const st = statusOf(p, kind);
  return !!st && st.from <= p.turnNo && p.turnNo <= st.until;
}

export function hasShield(p: PlayerState): boolean {
  return p.statuses.some((st) => st.kind === 'shielded');
}

function put(ctx: Ctx, id: PlayerId, st: Status): void {
  const p = player(ctx.s, id);
  const old = statusOf(p, st.kind);
  if (old) {
    // Rule §6: the same status does not stack; keep the longer window.
    old.from = Math.min(old.from, st.from);
    old.until = Math.max(old.until, st.until);
    old.source = st.source;
  } else {
    p.statuses.push(st);
  }
  const now = statusOf(p, st.kind)!;
  emit(ctx, { t: 'status', p: id, kind: st.kind, from: now.from, until: now.until });
}

/**
 * Decision D-17: a negative status starts on the target's NEXT own turn and lasts `turns`
 * own turns, also when given during the target's own turn.
 */
export function addStatus(
  ctx: Ctx, id: PlayerId, kind: StatusKind, turns: number, source: FaceKey | 'trap',
): void {
  if (turns <= 0 || kind === 'shielded') return;
  const p = player(ctx.s, id);
  const from = p.turnNo + 1;
  const until = kind === 'wrongTurn' ? FOREVER : from + turns - 1;
  put(ctx, id, { kind, from, until, source });
}

/** Decision D-18: a shield holds from now to the end of your next turn; gaining again refreshes it. */
export function grantShield(ctx: Ctx, id: PlayerId, source: FaceKey): void {
  const p = player(ctx.s, id);
  put(ctx, id, { kind: 'shielded', from: p.turnNo, until: p.turnNo + 1, source });
}

export function removeStatus(p: PlayerState, kind: StatusKind): void {
  p.statuses = p.statuses.filter((st) => st.kind !== kind);
}

/**
 * Decisions D-19/D-20: an effect of someone else's reversed face (or a trap) reaches `target`
 * unless a shield blocks it. Call it once per effect and target.
 */
export function hit(ctx: Ctx, target: PlayerId, source: FaceKey | 'trap'): boolean {
  const p = player(ctx.s, target);
  if (isFinishSafe(ctx.s, p)) {
    emit(ctx, { t: 'finishSafe', p: target, source });
    return false;
  }
  if (!hasShield(p)) return true;
  removeStatus(p, 'shielded');
  emit(ctx, { t: 'shieldBlock', p: target, source });
  return false;
}

/** Optional rule (balance.finishSafe): players past the finish ignore reversed effects and traps. */
export function isFinishSafe(s: GameState, p: PlayerState): boolean {
  return s.config.balance.finishSafe && p.progress >= s.config.finish;
}

/** Decision D-22: removes every negative status (now and queued), never the shield. */
export function cleanseNegatives(ctx: Ctx, id: PlayerId): void {
  const p = player(ctx.s, id);
  const kinds = p.statuses.filter((st) => NEGATIVE_STATUSES.includes(st.kind)).map((st) => st.kind);
  if (kinds.length === 0) return;
  p.statuses = p.statuses.filter((st) => !NEGATIVE_STATUSES.includes(st.kind));
  emit(ctx, { t: 'statusCleared', p: id, kinds });
}

/**
 * End of the player's turn: drop statuses whose last turn was this one (rule §5 ⑥).
 * Decision D-59: a shield that runs out without blocking anything returns FP.
 */
export function expireStatuses(ctx: Ctx, id: PlayerId): void {
  const p = player(ctx.s, id);
  const shield = statusOf(p, 'shielded');
  p.statuses = p.statuses.filter((st) => st.until > p.turnNo);
  if (shield && shield.until <= p.turnNo) {
    emit(ctx, { t: 'shieldExpire', p: id });
    gainFp(ctx, id, ctx.s.config.balance.shieldRefund, 'shieldRefund');
  }
}
