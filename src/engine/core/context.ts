import type { BalanceConfig, FaceKey, GameEvent, GameState, PlayerId, PlayerState } from '../types';

/** Options for applying an action. */
export interface ApplyOptions {
  /**
   * Stop as soon as the current player's Play step is over (before Flip), leaving
   * `pending` null. Used by the AI to evaluate an action without moving on.
   */
  haltAfterPlay?: boolean;
}

/** The mutable working context of one engine call. */
export interface Ctx {
  s: GameState;
  ev: GameEvent[];
  opts: ApplyOptions;
  halted: boolean;
}

export function makeCtx(s: GameState, opts: ApplyOptions = {}): Ctx {
  return { s, ev: [], opts, halted: false };
}

export function emit(ctx: Ctx, e: GameEvent): void {
  ctx.ev.push(e);
}

export function bal(ctx: Ctx): BalanceConfig {
  return ctx.s.config.balance;
}

/** Parameters of one face under the game's balance. */
export function params(ctx: Ctx, key: FaceKey): Record<string, number> {
  return ctx.s.config.balance.cards[key];
}

export function player(s: GameState, id: PlayerId): PlayerState {
  const p = s.players[id];
  if (!p) throw new Error(`no player ${id}`);
  return p;
}

export function current(s: GameState): PlayerState {
  return player(s, s.turn.player);
}

/** Turn order of the current round (rotated each round when balance.rotateStart is on). */
export function roundOrder(s: GameState, round = s.round): PlayerId[] {
  if (!s.config.balance.rotateStart) return s.order;
  const k = (round - 1) % s.order.length;
  return [...s.order.slice(k), ...s.order.slice(0, k)];
}

/** Other players in turn order starting after `id`. */
export function othersOf(s: GameState, id: PlayerId): PlayerId[] {
  const i = s.order.indexOf(id);
  const out: PlayerId[] = [];
  for (let k = 1; k < s.order.length; k++) out.push(s.order[(i + k) % s.order.length]!);
  return out;
}

/** Turn order starting with `id`. */
export function orderFrom(s: GameState, id: PlayerId): PlayerId[] {
  return [id, ...othersOf(s, id)];
}

export function maxProgress(s: GameState, ids: readonly PlayerId[]): number {
  let m = -Infinity;
  for (const id of ids) m = Math.max(m, player(s, id).progress);
  return m;
}

/** Decision D-26: you are leading when nobody is strictly ahead of you. */
export function isLeading(s: GameState, id: PlayerId): boolean {
  const me = player(s, id).progress;
  return s.players.every((p) => p.progress <= me);
}

/** The leading players among `ids` (several when tied). */
export function leadersAmong(s: GameState, ids: readonly PlayerId[]): PlayerId[] {
  const m = maxProgress(s, ids);
  return ids.filter((id) => player(s, id).progress === m);
}

/** v5 leader bonus for an effect on `id`: only when they lead, and never in a 2-player game (D-60). */
export function leaderBonusOn(s: GameState, id: PlayerId): number {
  return s.players.length >= 3 && isLeading(s, id) ? s.config.balance.leaderBonus : 0;
}

/** Decision D-27: players ahead of you by progress. */
export function playersAhead(s: GameState, id: PlayerId): PlayerId[] {
  const me = player(s, id).progress;
  return othersOf(s, id).filter((o) => player(s, o).progress > me);
}
