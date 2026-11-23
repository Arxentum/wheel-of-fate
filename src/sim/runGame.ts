import { applyActionMut, chooseBotAction, createGame, type BalancePatch, type Element } from '../engine';
import { seedFromString, shuffle } from '../engine/core/rng';
import type { Stats } from './stats';

export interface SimConfig {
  players: number;
  laps: number;
  balance?: BalancePatch;
}

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];

/** One computer-only game; elements and characters are random (D-39). */
export function runGame(cfg: SimConfig, seed: string, stats: Stats): void {
  const setupRng = seedFromString(`${seed}:setup`);
  const elements = shuffle(setupRng, [...ELEMENTS]).slice(0, cfg.players);
  const { state, events } = createGame(
    { laps: cfg.laps, balance: cfg.balance, players: elements.map((element) => ({ controller: 'computer', element })) },
    seed,
  );
  stats.beginGame(state);
  for (const e of events) stats.event(e);
  let guard = 0;
  while (state.pending) {
    stats.beforeDecision(state);
    const a = chooseBotAction(state);
    const ev = applyActionMut(state, a);
    stats.afterDecision(state, a);
    for (const e of ev) stats.event(e);
    if (++guard > 20_000) throw new Error(`game ${seed} did not end`);
  }
  stats.endGame(state);
}

export function runMany(cfg: SimConfig, games: number, seedPrefix: string, stats: Stats): Stats {
  for (let g = 0; g < games; g++) runGame(cfg, `${seedPrefix}-${g}`, stats);
  return stats;
}
