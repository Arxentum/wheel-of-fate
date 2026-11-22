import { bal, emit, leaderBonusOn, player, playersAhead, type Ctx } from '../core/context';
import { signOf } from '../data/board';
import type { GameState, PlayerId, Trap, TrapKind } from '../types';
import { gainFp, loseFp } from './fp';
import { moveBy } from './move';
import { addStatus, hasShield, isFinishSafe, removeStatus } from './status';

export function trapAt(s: GameState, sign: number): Trap | undefined {
  return s.traps.find((t) => t.sign === sign);
}

/** v5 (D-60): a trap goes 1..trapReach signs in front of a player ahead of you (0 = anywhere). */
export function trapSignAllowed(s: GameState, owner: PlayerId, sign: number): boolean {
  const reach = s.config.balance.trapReach;
  if (reach <= 0) return true;
  return playersAhead(s, owner).some((o) => {
    const d = (sign - signOf(player(s, o).progress) + 12) % 12;
    return d >= 1 && d <= reach;
  });
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
 * Rules v3/v4 (balance.trapOnPass off): called once at the end of a Move step (rule §7).
 * With trapOnPass on, moveTo springs traps on the way instead.
 */
export function landOn(ctx: Ctx, id: PlayerId): void {
  const trap = trapAt(ctx.s, signOf(player(ctx.s, id).progress));
  if (trap && trap.owner !== id) springTrap(ctx, id, trap);
}

/**
 * A trap springs on `id`. Returns true when it ends the current movement (an Illusion Trap).
 * Decision D-24: The Moon's immunity leaves the trap (and the shield) in place.
 * Decision D-60: the owner gains balance.trapBounty FP (also when a shield blocks it) and the
 * effect is +balance.leaderBonus against the leading player.
 */
export function springTrap(ctx: Ctx, id: PlayerId, trap: Trap): boolean {
  const s = ctx.s;
  const p = player(s, id);
  const b = bal(ctx);
  if (p.trapImmuneTurn === p.turnNo || isFinishSafe(s, p)) {
    emit(ctx, { t: 'trapIgnored', p: id, trap });
    return false;
  }
  s.traps = s.traps.filter((t) => t !== trap);
  const blocked = hasShield(p);
  if (blocked) {
    removeStatus(p, 'shielded');
    emit(ctx, { t: 'shieldBlock', p: id, source: 'trap' });
  }
  emit(ctx, { t: 'trapTrigger', p: id, trap, blocked });
  gainFp(ctx, trap.owner, b.trapBounty, 'trapBounty');
  if (blocked) return false;
  const lead = leaderBonusOn(s, id);
  if (trap.kind === 'chain') {
    addStatus(ctx, id, 'rooted', b.chainRootedTurns, 'trap');
    loseFp(ctx, id, b.chainFpLoss + lead, 'trap');
    return false;
  }
  moveBy(ctx, id, -(b.illusionBack + lead), 'trap');
  return true;
}
