import { bal, emit, player, type Ctx } from '../core/context';
import { signOf } from '../data/board';
import type { GameState, PlayerId, Trap, TrapKind } from '../types';
import { loseFp } from './fp';
import { moveBy } from './move';
import { addStatus, hasShield, isFinishSafe, removeStatus } from './status';

export function trapAt(s: GameState, sign: number): Trap | undefined {
  return s.traps.find((t) => t.sign === sign);
}

/** Rule §7 / decision D-23: one trap per sign; a 4th trap removes the oldest. */
export function placeTrap(ctx: Ctx, owner: PlayerId, kind: TrapKind, sign: number): void {
  const s = ctx.s;
  if (trapAt(s, sign)) throw new Error(`sign ${sign} already has a trap`);
  if (s.traps.length >= bal(ctx).maxTraps) {
    const oldest = s.traps.reduce((a, b) => (a.seq <= b.seq ? a : b));
    s.traps = s.traps.filter((t) => t !== oldest);
    emit(ctx, { t: 'trapExpire', trap: oldest, reason: 'replaced' });
  }
  const trap: Trap = { sign, kind, owner, seq: s.trapSeq++ };
  s.traps.push(trap);
  emit(ctx, { t: 'trapPlace', trap });
}

/**
 * Called once at the end of a Move step (rule §7). Card pushes never call it.
 * Decision D-24: The Moon's immunity leaves the trap (and the shield) in place.
 */
export function landOn(ctx: Ctx, id: PlayerId): void {
  const s = ctx.s;
  const p = player(s, id);
  const trap = trapAt(s, signOf(p.progress));
  if (!trap || trap.owner === id) return;
  if (p.trapImmuneTurn === p.turnNo || isFinishSafe(s, p)) {
    emit(ctx, { t: 'trapIgnored', p: id, trap });
    return;
  }
  s.traps = s.traps.filter((t) => t !== trap);
  if (hasShield(p)) {
    removeStatus(p, 'shielded');
    emit(ctx, { t: 'shieldBlock', p: id, source: 'trap' });
    emit(ctx, { t: 'trapTrigger', p: id, trap, blocked: true });
    return;
  }
  emit(ctx, { t: 'trapTrigger', p: id, trap, blocked: false });
  const b = bal(ctx);
  if (trap.kind === 'chain') {
    addStatus(ctx, id, 'rooted', b.chainRootedTurns, 'trap');
    loseFp(ctx, id, b.chainFpLoss, 'trap');
  } else {
    moveBy(ctx, id, -b.illusionBack, 'trap');
  }
}
