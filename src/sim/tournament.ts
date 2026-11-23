// Computer player calibration (decision D-54): one player with `hero` weights against a field with `field` weights.
import { applyActionMut, chooseBotAction, createGame, type BotWeights, type BalancePatch, type Element } from '../engine';
import { nextInt, seedFromString, shuffle } from '../engine/core/rng';

export interface TournamentResult {
  games: number;
  rate: number;
  fair: number;
  ci95: number;
}

export function tournament(
  players: number, games: number, hero: Partial<BotWeights>, field: Partial<BotWeights> | undefined,
  balance: BalancePatch, seed: string,
): TournamentResult {
  let wins = 0;
  for (let g = 0; g < games; g++) {
    const r = seedFromString(`${seed}-${g}`);
    const els = shuffle(r, ['fire', 'earth', 'air', 'water'] as Element[]).slice(0, players);
    const { state } = createGame({ laps: 3, balance, players: els.map((element) => ({ controller: 'computer', element })) }, `${seed}-game-${g}`);
    const me = nextInt(r, players);
    while (state.pending) applyActionMut(state, chooseBotAction(state, state.pending.player === me ? hero : field));
    const w = state.result!.winners;
    if (w.includes(me)) wins += 1 / w.length;
  }
  const rate = wins / games;
  return { games, rate, fair: 1 / players, ci95: 1.96 * Math.sqrt((rate * (1 - rate)) / games) };
}
