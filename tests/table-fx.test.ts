import { describe, expect, it } from 'vitest';
import { applyActionMut, chooseBotAction, createGame, type GameEvent } from '../src/engine';
import { bannerFor, floatsFor, lastPlay, turnOnScreen } from '../src/ui/game/tableFx';

describe('floating notes', () => {
  it('show Fate Point changes, statuses, laps, traps and blocks', () => {
    expect(floatsFor({ t: 'fp', p: 1, delta: -2, reason: 'boost', lostToCap: 0 })).toEqual([{ p: 1, spec: { kind: 'fp', n: -2 } }]);
    expect(floatsFor({ t: 'fp', p: 1, delta: 0, reason: 'card', lostToCap: 1 })).toEqual([]);
    expect(floatsFor({ t: 'status', p: 0, kind: 'slowed', from: 3, until: 3 })).toEqual([{ p: 0, spec: { kind: 'status', status: 'slowed' } }]);
    expect(floatsFor({ t: 'lap', p: 2, lap: 2 })).toEqual([{ p: 2, spec: { kind: 'lap', lap: 2 } }]);
    expect(floatsFor({ t: 'trapTrigger', p: 0, trap: { sign: 3, kind: 'chain', owner: 1, seq: 1 }, blocked: false })[0]!.spec).toEqual({ kind: 'trap', trap: 'chain' });
    expect(floatsFor({ t: 'shieldBlock', p: 0, source: 'trap' })[0]!.spec).toEqual({ kind: 'blocked' });
  });

  it('leave out the everyday card moves', () => {
    expect(floatsFor({ t: 'draw', p: 0, n: 1 })).toEqual([]);
    expect(floatsFor({ t: 'draw', p: 0, n: 2 })).toEqual([{ p: 0, spec: { kind: 'cards', n: 2 } }]);
    expect(floatsFor({ t: 'discard', p: 0, cards: ['wands'], reason: 'played' })).toEqual([]);
    expect(floatsFor({ t: 'discard', p: 0, cards: ['wands'], reason: 'limit' })).toEqual([]);
    expect(floatsFor({ t: 'discard', p: 0, cards: ['wands', 'cups'], reason: 'random' })).toEqual([{ p: 0, spec: { kind: 'cards', n: -2 } }]);
  });

  it('show a stolen card on both panels', () => {
    expect(floatsFor({ t: 'steal', from: 1, to: 0, what: 'card', n: 1 })).toEqual([
      { p: 1, spec: { kind: 'cards', n: -1 } },
      { p: 0, spec: { kind: 'cards', n: 1 } },
    ]);
  });
});

describe('banners', () => {
  const turn = (p: number, round: number): GameEvent => ({ t: 'turnStart', p, round, turnNo: 1 });

  it('announce a new round and who goes first', () => {
    expect(bannerFor(turn(1, 2), { round: 1, player: 2 }, [0])).toEqual({ kind: 'round', round: 2, first: 1, again: false });
  });

  it('say so when the same player goes twice in a row (2 players)', () => {
    expect(bannerFor(turn(0, 3), { round: 2, player: 0 }, [0])).toEqual({ kind: 'round', round: 3, first: 0, again: true });
  });

  it('mark the only human player turn, but not in the first round or with a hot seat', () => {
    expect(bannerFor(turn(0, 1), null, [0])).toEqual({ kind: 'turn', p: 0 });
    expect(bannerFor(turn(1, 1), { round: 1, player: 0 }, [0])).toBeNull();
    expect(bannerFor(turn(0, 1), { round: 1, player: 1 }, [0, 1])).toBeNull();
    expect(bannerFor(turn(0, 1), null, [])).toBeNull();
  });

  it('come up at every round of a real 2-player game, with the double turns marked', () => {
    const { state, events } = createGame({ players: [{ controller: 'computer', element: 'fire' }, { controller: 'computer', element: 'water' }], laps: 1 }, 'banner');
    const all: GameEvent[] = [...events];
    while (state.pending) all.push(...applyActionMut(state, chooseBotAction(state)));
    let prev: { round: number; player: number } | null = null;
    const banners = [];
    for (const e of all) {
      const b = bannerFor(e, prev, []);
      if (b) banners.push(b);
      if (e.t === 'turnStart') prev = { round: e.round, player: e.p };
    }
    expect(banners.length).toBe(state.result!.rounds - 1);
    // The first player moves on every round, so with 2 players every new round is a double turn.
    expect(banners.every((b) => b.kind === 'round' && b.again)).toBe(true);
  });
});

describe('lastPlay', () => {
  it('finds the card of the turn on screen, not of an earlier turn', () => {
    const play: GameEvent = { t: 'play', p: 1, kind: 'minor', face: 'cups.upright' };
    expect(lastPlay([{ t: 'turnStart', p: 1, round: 1, turnNo: 1 }, play, { t: 'draw', p: 1, n: 2 }], 1)).toBe(play);
    expect(lastPlay([play, { t: 'turnStart', p: 2, round: 1, turnNo: 1 }], 2)).toBeNull();
  });
});

describe('turnOnScreen', () => {
  it('is the last turn start played back', () => {
    expect(turnOnScreen([{ t: 'turnStart', p: 0, round: 1, turnNo: 1 }, { t: 'draw', p: 0, n: 1 }, { t: 'turnStart', p: 1, round: 1, turnNo: 1 }])).toEqual({ p: 1, round: 1 });
    expect(turnOnScreen([{ t: 'gameStart', order: [0, 1], laps: 1 }])).toBeNull();
  });
});
