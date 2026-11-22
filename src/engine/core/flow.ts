// The turn state machine (rule §5, plan §3.4). It runs every step that needs no decision
// and stops at the next decision (`s.pending`) or at the end of the game.
import { elementOfSign, signOf } from '../data/board';
import { drawCards } from '../rules/deck';
import { canSpend, gainFp, spendFp } from '../rules/fp';
import { moveBy } from '../rules/move';
import { expireStatuses, isActive, removeStatus, statusOf } from '../rules/status';
import { landOn } from '../rules/trap';
import { computeResult } from '../rules/victory';
import { pick } from './rng';
import type { GameState, PlayerId, TurnState } from '../types';
import { bal, current, emit, params, player, roundOrder, type Ctx } from './context';

export function freshTurn(id: PlayerId): TurnState {
  return {
    player: id,
    step: 'draw',
    action: null,
    rollMode: 'normal',
    skipMove: false,
    roll: null,
    rerolled: false,
    boosted: false,
    flipped: false,
    moved: false,
  };
}

/** ① Draw, then ② Play (or straight to ④ Move when Stunned). */
export function startTurn(ctx: Ctx, id: PlayerId): void {
  const s = ctx.s;
  const p = player(s, id);
  p.turnNo += 1;
  s.turn = freshTurn(id);
  s.pending = null;
  emit(ctx, { t: 'turnStart', p: id, round: s.round, turnNo: p.turnNo });

  const b = bal(ctx);
  drawCards(ctx, id, p.hand.length === 0 ? b.drawWhenEmpty : b.drawPerTurn);

  if (isActive(p, 'stunned')) {
    // Rule §6: Stunned skips Play and Flip.
    s.turn.action = 'skipped';
    emit(ctx, { t: 'actionSkipped', p: id });
    enterMove(ctx);
    return;
  }
  s.turn.step = 'play';
  s.pending = { kind: 'chooseAction', player: id };
}

/** Called after every Play-step action; continues once no decision is waiting. */
export function afterPlay(ctx: Ctx): void {
  if (ctx.s.pending) return;
  enterFlip(ctx);
}

/** ③ Flip (optional, 1 FP). */
function enterFlip(ctx: Ctx): void {
  const s = ctx.s;
  s.turn.step = 'flip';
  if (ctx.opts.haltAfterPlay) {
    ctx.halted = true;
    return;
  }
  const p = current(s);
  if (!canSpend(p, bal(ctx).flipCost)) {
    enterMove(ctx);
    return;
  }
  s.pending = { kind: 'flip', player: p.id };
}

export function doFlip(ctx: Ctx, flip: boolean): void {
  const s = ctx.s;
  const p = current(s);
  if (flip) {
    spendFp(ctx, p.id, bal(ctx).flipCost, 'flip');
    p.orientation = p.orientation === 'upright' ? 'reversed' : 'upright';
    s.turn.flipped = true;
    emit(ctx, { t: 'flip', p: p.id, orientation: p.orientation });
  }
  enterMove(ctx);
}

/** ④ Move. */
export function enterMove(ctx: Ctx): void {
  const s = ctx.s;
  const t = s.turn;
  const p = current(s);
  t.step = 'move';

  if (t.skipMove) {
    emit(ctx, { t: 'moveSkipped', p: p.id, reason: 'hangedMan' });
    enterResolve(ctx);
    return;
  }
  if (isActive(p, 'rooted')) {
    emit(ctx, { t: 'moveSkipped', p: p.id, reason: 'rooted' });
    enterResolve(ctx);
    return;
  }
  // Decision D-16: Wrong Turn replaces the roll with a step back.
  const wrong = statusOf(p, 'wrongTurn');
  if (wrong && wrong.from <= p.turnNo) {
    removeStatus(p, 'wrongTurn');
    t.moved = true;
    moveBy(ctx, p.id, -params(ctx, 'fool.reversed').back!, 'wrongTurn');
    landOn(ctx, p.id);
    enterResolve(ctx);
    return;
  }
  // Decision D-12: Slowed moves exactly 1, no roll.
  if (isActive(p, 'slowed')) {
    t.moved = true;
    t.roll = { dice: [], value: 1, mode: 'slowed' };
    emit(ctx, { t: 'roll', p: p.id, dice: [], value: 1, mode: 'slowed', reroll: false });
    moveBy(ctx, p.id, 1, 'move');
    landOn(ctx, p.id);
    enterResolve(ctx);
    return;
  }
  if (t.rollMode === 'fixed3') {
    // Decision D-11: the Emperor's roll counts as 3; no roll, so no reroll.
    const value = params(ctx, 'emperor.upright').roll!;
    t.roll = { dice: [], value, mode: 'fixed' };
    emit(ctx, { t: 'roll', p: p.id, dice: [], value, mode: 'fixed', reroll: false });
  } else {
    roll(ctx, false);
  }
  offerMove(ctx);
}

function roll(ctx: Ctx, reroll: boolean): void {
  const s = ctx.s;
  const t = s.turn;
  const n = t.rollMode === 'advantage' ? 2 : 1;
  const dice: number[] = [];
  for (let i = 0; i < n; i++) dice.push(pick(s.rng, bal(ctx).die));
  const value = Math.max(...dice);
  const mode = t.rollMode === 'advantage' ? 'advantage' : 'normal';
  t.roll = { dice, value, mode };
  emit(ctx, { t: 'roll', p: t.player, dice, value, mode, reroll });
}

/** Decision D-09: roll → optional reroll (once) → optional boost (once) → move. */
export function canReroll(s: GameState): boolean {
  const t = s.turn;
  if (!t.roll || t.rerolled || t.boosted) return false;
  if (t.roll.mode !== 'normal' && t.roll.mode !== 'advantage') return false;
  return canSpend(current(s), s.config.balance.rerollCost);
}

export function canBoost(s: GameState): boolean {
  const t = s.turn;
  if (!t.roll || t.boosted || t.roll.mode === 'slowed') return false;
  return canSpend(current(s), s.config.balance.boostCost);
}

function offerMove(ctx: Ctx): void {
  const s = ctx.s;
  if (canReroll(s) || canBoost(s)) {
    s.pending = { kind: 'move', player: s.turn.player };
    return;
  }
  confirmMove(ctx);
}

export function doReroll(ctx: Ctx): void {
  spendFp(ctx, ctx.s.turn.player, bal(ctx).rerollCost, 'reroll');
  ctx.s.turn.rerolled = true;
  roll(ctx, true);
  offerMove(ctx);
}

export function doBoost(ctx: Ctx): void {
  spendFp(ctx, ctx.s.turn.player, bal(ctx).boostCost, 'boost');
  ctx.s.turn.boosted = true;
  emit(ctx, { t: 'boost', p: ctx.s.turn.player });
  offerMove(ctx);
}

export function confirmMove(ctx: Ctx): void {
  const s = ctx.s;
  const t = s.turn;
  s.pending = null;
  t.moved = true;
  const steps = (t.roll?.value ?? 0) + (t.boosted ? 1 : 0);
  moveBy(ctx, t.player, steps, 'move');
  landOn(ctx, t.player);
  enterResolve(ctx);
}

/** ⑤ Resolve. Decision D-15: element bonus only after a real Move step, on the sign you end on. */
function enterResolve(ctx: Ctx): void {
  const s = ctx.s;
  const p = current(s);
  s.turn.step = 'resolve';
  if (s.turn.moved && elementOfSign(signOf(p.progress)) === p.element) {
    gainFp(ctx, p.id, bal(ctx).elementBonus, 'element');
  }
  enterEnd(ctx);
}

/** ⑥ End: discard to the hand limit (your choice, decision D-08), expire statuses, next player. */
function enterEnd(ctx: Ctx): void {
  const s = ctx.s;
  const p = current(s);
  s.turn.step = 'end';
  const over = p.hand.length - bal(ctx).handLimit;
  if (over > 0) {
    s.pending = { kind: 'discardToLimit', player: p.id, count: over };
    return;
  }
  finishTurn(ctx);
}

export function finishTurn(ctx: Ctx): void {
  const s = ctx.s;
  const p = current(s);
  s.pending = null;
  expireStatuses(ctx, p.id);
  const order = roundOrder(s);
  const idx = order.indexOf(p.id);
  const last = idx === order.length - 1;
  // Rule §8 / decision D-37: once triggered, the round is played out to the last seat.
  if (s.finalRound && (last || bal(ctx).endRule === 'immediate')) {
    s.turn.step = 'over';
    s.result = computeResult(s);
    emit(ctx, { t: 'gameOver', result: s.result });
    return;
  }
  if (last) {
    s.round += 1;
    startTurn(ctx, roundOrder(s)[0]!);
    return;
  }
  startTurn(ctx, order[idx + 1]!);
}
