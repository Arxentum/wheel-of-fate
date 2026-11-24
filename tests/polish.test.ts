import { describe, expect, it } from 'vitest';
import { applyActionMut, chooseBotAction, createGame, type GameEvent, type GameState } from '../src/engine';
import { movePreviewFor } from '../src/ui/game/movePreview';
import { gameStats } from '../src/ui/game/stats';
import { tipFor, type TipId } from '../src/ui/game/tips';

function playGame(seed: string, n = 3) {
  const els = (['fire', 'earth', 'air', 'water'] as const).slice(0, n);
  const { state, events } = createGame({ players: els.map((element) => ({ controller: 'computer', element })), laps: 2 }, seed);
  const all: GameEvent[] = [...events];
  while (state.pending) all.push(...applyActionMut(state, chooseBotAction(state)));
  return { state, all };
}

describe('game stats', () => {
  it('follow every player round by round to the final positions', () => {
    for (const seed of ['st-1', 'st-2', 'st-3']) {
      const { state, all } = playGame(seed);
      const stats = gameStats(all, state.players.length);
      for (const p of state.players) {
        const series = stats.progress[p.id]!;
        expect(series[0]).toBe(0);
        expect(series.at(-1)).toBe(p.progress);
        expect(series.length).toBe(state.result!.rounds + 1);
      }
    }
  });

  it('count cards played, pushes given and spaces lost consistently', () => {
    const { state, all } = playGame('st-4', 4);
    const stats = gameStats(all, state.players.length);
    const plays = all.filter((e) => e.t === 'play' && e.kind !== 'meditate').length;
    expect(stats.players.reduce((n, p) => n + p.played, 0)).toBe(plays);
    const hits = stats.players.reduce((n, p) => n + p.hits, 0);
    const lost = stats.players.reduce((n, p) => n + p.lost, 0);
    expect(lost).toBeGreaterThanOrEqual(hits);
    expect(hits).toBeGreaterThan(0);
    const gained = all.filter((e) => e.t === 'fp' && e.delta > 0).reduce((n, e) => n + (e.t === 'fp' ? e.delta : 0), 0);
    expect(stats.players.reduce((n, p) => n + p.gained, 0)).toBe(gained);
  });

  it('credit a push to the player who played the card', () => {
    const events: GameEvent[] = [
      { t: 'turnStart', p: 0, round: 1, turnNo: 1 },
      { t: 'play', p: 0, kind: 'minor', face: 'swords.reversed' },
      { t: 'move', p: 1, from: 5, to: 4, cause: 'push' },
      { t: 'move', p: 2, from: 6, to: 5, cause: 'push' },
      { t: 'move', p: 0, from: 2, to: 4, cause: 'move' },
    ];
    const s = gameStats(events, 3);
    expect(s.players[0]).toMatchObject({ played: 1, hits: 2, lost: 0 });
    expect(s.players[1]!.lost).toBe(1);
  });
});

describe('first-game tips', () => {
  const { state } = createGame({ players: [{ controller: 'human', element: 'fire' }, { controller: 'computer', element: 'earth' }], laps: 1 }, 'tips');
  const none = () => false;

  it('explain the first action, then reversed sides once someone is ahead', () => {
    expect(tipFor(state, none)).toBe('choose');
    const seen = (id: TipId) => id === 'choose';
    expect(tipFor(state, seen)).toBeNull();
    const behind: GameState = { ...state, players: state.players.map((p) => (p.id === 1 ? { ...p, progress: 4 } : p)) };
    expect(tipFor(behind, seen)).toBe('reversed');
  });

  it('come once for flipping and moving, and never when turned off', () => {
    expect(tipFor({ ...state, pending: { kind: 'flip', player: 0 } }, none)).toBe('flip');
    expect(tipFor({ ...state, pending: { kind: 'move', player: 0 } }, none)).toBe('move');
    expect(tipFor({ ...state, pending: { kind: 'move', player: 0 } }, () => true)).toBeNull();
  });
});

describe('move preview', () => {
  const { state } = createGame({ players: [{ controller: 'human', element: 'fire' }, { controller: 'computer', element: 'earth' }], laps: 1 }, 'mp');

  it('marks the way, the landing sign, the boost and traps in the way', () => {
    const s: GameState = {
      ...state,
      players: state.players.map((p) => (p.id === 0 ? { ...p, progress: 10, fp: 5 } : p)),
      turn: { ...state.turn, player: 0, roll: { dice: [3], value: 3, mode: 'normal' }, boosted: false },
      traps: [{ sign: 0, kind: 'chain', owner: 1, seq: 1 }],
      pending: { kind: 'move', player: 0 },
    };
    const m = movePreviewFor(s, 0)!;
    expect(m.path).toEqual([11, 0, 1]);
    expect(m.land).toBe(1);
    expect(m.boostLand).toBe(2);
    expect(m.danger).toEqual([0]);
    // Your own traps are no danger; without Fate Points there is no boost.
    const poor: GameState = { ...s, players: s.players.map((p) => (p.id === 0 ? { ...p, fp: 0 } : p)), traps: [{ sign: 0, kind: 'chain', owner: 0, seq: 1 }] };
    expect(movePreviewFor(poor, 0)).toMatchObject({ danger: [] });
    expect(movePreviewFor(poor, 0)!.boostLand).toBeUndefined();
  });
});
