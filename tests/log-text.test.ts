import { describe, expect, it } from 'vitest';
import { applyActionMut, chooseBotAction, createGame, type GameEvent, type GameSetup } from '../src/engine';
import { LANGS, translate, type MessageKey, type Params } from '../src/i18n';
import { describeEvent } from '../src/ui/game/logText';

describe('log lines', () => {
  it.each(LANGS)('describe every event of computer games without gaps (%s)', (lang) => {
    const t = (k: MessageKey, p?: Params) => translate(lang, k, p);
    const seen = new Set<string>();
    for (const [n, seed] of [[2, 'log-a'], [3, 'log-b'], [4, 'log-c']] as const) {
      const elements = ['fire', 'earth', 'air', 'water'] as const;
      const setup: GameSetup = { players: elements.slice(0, n).map((element) => ({ controller: 'computer', element })), laps: 2 };
      const { state, events } = createGame(setup, seed);
      const all: GameEvent[] = [...events];
      while (state.pending) all.push(...applyActionMut(state, chooseBotAction(state)));
      for (const e of all) {
        seen.add(e.t);
        const line = describeEvent(t, state, e);
        if (line === null) continue;
        expect(line, JSON.stringify(e)).not.toMatch(/\b(log|card|face|status|sign|player|side|trap|fpReason)\.[a-zA-Z]|\{|\}|undefined|NaN/);
      }
    }
    // The games above should cover the common events.
    for (const kind of ['play', 'move', 'roll', 'fp', 'draw', 'status', 'gameOver']) expect(seen.has(kind), kind).toBe(true);
  });
});
