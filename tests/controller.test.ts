import { describe, expect, it } from 'vitest';
import { enumerateActions, type GameSetup } from '../src/engine';
import { GameController, type Scheduler } from '../src/ui/game/controller';

/** A scheduler that runs nothing until flushed; tracks virtual time. */
function manualScheduler() {
  let tasks: { fn: () => void; at: number; id: number }[] = [];
  let now = 0;
  let seq = 0;
  const s: Scheduler & { flush: (limit?: number) => number; pending: () => number } = {
    set: (fn, ms) => {
      const id = ++seq;
      tasks.push({ fn, at: now + ms, id });
      return id;
    },
    clear: (h) => {
      tasks = tasks.filter((t) => t.id !== h);
    },
    flush: (limit = 100000) => {
      let n = 0;
      while (tasks.length && n < limit) {
        tasks.sort((a, b) => a.at - b.at);
        const t = tasks.shift()!;
        now = t.at;
        t.fn();
        n++;
      }
      return n;
    },
    pending: () => tasks.length,
  };
  return s;
}

const allAi: GameSetup = {
  players: [
    { controller: 'ai', element: 'fire' },
    { controller: 'ai', element: 'earth' },
    { controller: 'ai', element: 'air' },
  ],
  laps: 1,
};

describe('GameController', () => {
  it('plays an all-computer game to the end, event by event', () => {
    const sch = manualScheduler();
    const c = new GameController(allAi, 'ctl-1', { scheduler: sch });
    sch.flush();
    const v = c.getView();
    expect(v.latest.result).not.toBeNull();
    expect(v.shown).toBe(v.latest);
    expect(v.busy).toBe(false);
    expect(v.pieces).toEqual(v.latest.players.map((p) => p.progress));
    expect(v.log.at(-1)!.event.t).toBe('gameOver');
  });

  it('skip finishes an all-computer game at once', () => {
    const sch = manualScheduler();
    const c = new GameController(allAi, 'ctl-2', { scheduler: sch });
    c.skip();
    expect(c.getView().latest.result).not.toBeNull();
    expect(sch.pending()).toBe(0);
  });

  it('holds the playback and the computer turns while paused', () => {
    const sch = manualScheduler();
    const c = new GameController(allAi, 'ctl-pause', { scheduler: sch });
    sch.flush(40);
    const logged = c.getView().log.length;
    c.setPaused(true);
    expect(c.getView().paused).toBe(true);
    expect(sch.pending()).toBe(0);
    sch.flush();
    expect(c.getView().log.length).toBe(logged);
    c.setPaused(false);
    sch.flush();
    expect(c.getView().latest.result).not.toBeNull();
    expect(c.getView().log.at(-1)!.event.t).toBe('gameOver');
  });

  it('waits for the human, then plays their action back', () => {
    const sch = manualScheduler();
    const setup: GameSetup = { players: [{ controller: 'human', element: 'fire' }, { controller: 'ai', element: 'water' }], laps: 1 };
    const c = new GameController(setup, 'ctl-3', { scheduler: sch });
    sch.flush();
    let v = c.getView();
    expect(v.busy).toBe(false);
    expect(v.viewer).toBe(0);
    expect(v.latest.pending?.player).toBe(0);
    expect(c.canAct()).toBe(true);
    c.act({ type: 'meditate' });
    v = c.getView();
    expect(v.busy).toBe(true);
    expect(c.canAct()).toBe(false);
    // The panels keep the old state until the playback is over.
    expect(v.shown).not.toBe(v.latest);
    sch.flush();
    v = c.getView();
    expect(v.log.some((i) => i.event.t === 'play' && i.event.kind === 'meditate')).toBe(true);
  });

  it('asks to pass the device between two humans', () => {
    const sch = manualScheduler();
    const setup: GameSetup = { players: [{ controller: 'human', element: 'fire' }, { controller: 'human', element: 'earth' }], laps: 1 };
    const c = new GameController(setup, 'ctl-4', { scheduler: sch });
    sch.flush();
    expect(c.getView().handoffTo).toBe(0);
    expect(c.getView().viewer).toBeNull();
    expect(c.canAct()).toBe(false);
    c.takeOver();
    expect(c.getView().viewer).toBe(0);
    // Play fire's whole turn with the first legal option each time.
    for (let i = 0; i < 20 && c.getView().latest.pending?.player === 0; i++) {
      c.act(enumerateActions(c.getView().latest)[0]!);
      sch.flush();
    }
    expect(c.getView().handoffTo).toBe(1);
    expect(c.getView().viewer).toBeNull();
  });
});
