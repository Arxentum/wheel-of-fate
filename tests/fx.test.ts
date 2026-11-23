import { describe, expect, it } from 'vitest';
import { MAJORS, COURTS, SUITS, applyActionMut, chooseBotAction, createGame, type GameEvent, type GameState } from '../src/engine';
import { CUE_NAMES } from '../src/ui/audio/cues';
import { EMOTES, emoteWishes, replyTo } from '../src/ui/game/emotes';
import { FACE_FX, fxFor } from '../src/ui/fx/faceFx';
import { ICONS } from '../src/ui/fx/icons';
import { EMOTE_FACES } from '../src/ui/fx/emoteFaces';

const FACES = [...SUITS, ...COURTS, ...MAJORS].flatMap((id) => [`${id}.upright`, `${id}.reversed`] as const);

describe('card effects', () => {
  it('give every one of the 60 sides an effect with a known icon and sound', () => {
    expect(Object.keys(FACE_FX).sort()).toEqual([...FACES].sort());
    for (const key of FACES) {
      const fx = FACE_FX[key];
      expect(ICONS[fx.icon], key).toBeDefined();
      expect(CUE_NAMES, key).toContain(fx.sound);
      expect(fx.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('play upright sides on the player and reversed sides at others (or a trap sign)', () => {
    for (const key of FACES) {
      const fx = FACE_FX[key];
      if (key.endsWith('.upright')) expect(['aura', 'rain', 'burst', 'dash', 'leap', 'bolt'], key).toContain(fx.fx);
      else expect(['shot', 'drain', 'slash', 'stamp', 'cloud', 'wrap', 'wave', 'beam', 'meteor', 'trap'], key).toContain(fx.fx);
    }
    expect(FACE_FX['swords.reversed']).toMatchObject({ fx: 'slash', icon: 'sword' });
    expect(FACE_FX['death.reversed']).toMatchObject({ fx: 'slash', icon: 'scythe' });
    expect(FACE_FX['devil.reversed'].fx).toBe('trap');
  });

  it('aim at the target, everyone ahead, or the trap sign', () => {
    const { state } = createGame({ players: [{ controller: 'computer', element: 'fire' }, { controller: 'computer', element: 'earth' }, { controller: 'computer', element: 'air' }], laps: 1 }, 'fx');
    const s: GameState = { ...state, players: state.players.map((p, i) => ({ ...p, progress: [2, 6, 9][i]! })) };
    expect(fxFor({ t: 'play', p: 0, kind: 'minor', face: 'wands.upright' }, s)).toMatchObject({ targets: [0], side: 'upright', fx: 'dash' });
    // Swords reversed hits every player ahead of Fire: Earth and Air.
    expect(fxFor({ t: 'play', p: 0, kind: 'minor', face: 'swords.reversed' }, s)?.targets).toEqual([1, 2]);
    expect(fxFor({ t: 'play', p: 0, kind: 'skill', face: 'chariot.reversed', target: 2 }, s)?.targets).toEqual([2]);
    expect(fxFor({ t: 'play', p: 0, kind: 'skill', face: 'moon.reversed', sign: 8 }, s)).toMatchObject({ targets: [], sign: 8, fx: 'trap' });
    expect(fxFor({ t: 'play', p: 0, kind: 'meditate' }, s)).toMatchObject({ fx: 'aura', targets: [0] });
  });

  it('have an effect for every card played in real games', () => {
    for (let g = 0; g < 8; g++) {
      const { state } = createGame({ players: [{ controller: 'computer', element: 'fire' }, { controller: 'computer', element: 'earth' }, { controller: 'computer', element: 'air' }], laps: 2 }, `fx-${g}`);
      while (state.pending) {
        const before: GameState = JSON.parse(JSON.stringify(state));
        for (const e of applyActionMut(state, chooseBotAction(state))) {
          if (e.t !== 'play') continue;
          const plan = fxFor(e, before);
          expect(plan).not.toBeNull();
          expect(plan!.targets.length > 0 || plan!.sign !== undefined).toBe(true);
        }
      }
    }
  });
});

describe('emotes', () => {
  it('each have a face', () => {
    expect(Object.keys(EMOTE_FACES).sort()).toEqual([...EMOTES].sort());
  });

  const { state } = createGame({ players: [{ controller: 'computer', element: 'fire' }, { controller: 'human', element: 'earth' }, { controller: 'computer', element: 'air' }], laps: 1 }, 'emote');
  const s: GameState = { ...state, players: state.players.map((p, i) => ({ ...p, progress: [2, 9, 5][i]! })) };

  it('let the attacker taunt the leader it hits, and the targets complain', () => {
    const play: GameEvent = { t: 'play', p: 0, kind: 'minor', face: 'swords.reversed' };
    const wishes = emoteWishes(play, s, fxFor(play, s));
    expect(wishes.find((w) => w.p === 0)?.emotes).toContain('taunt');
    expect(wishes.filter((w) => w.p !== 0).map((w) => w.p).sort()).toEqual([1, 2]);
  });

  it('react to traps, shields and the end of the game', () => {
    const trap: GameEvent = { t: 'trapTrigger', p: 2, trap: { sign: 4, kind: 'chain', owner: 0, seq: 1 }, blocked: false };
    const w = emoteWishes(trap, s, null);
    expect(w.find((x) => x.p === 2)?.emotes).toContain('shock');
    expect(w.find((x) => x.p === 0)?.emotes).toContain('laugh');
    expect(emoteWishes({ t: 'shieldBlock', p: 0, source: 'trap' }, s, null)[0]!.emotes).toEqual(['cool']);
    const over = emoteWishes({ t: 'gameOver', result: { ranking: [[1], [0], [2]], winners: [1], rounds: 8 } }, s, null);
    expect(over.find((x) => x.p === 1)?.emotes).toContain('cool');
    expect(over.find((x) => x.p === 2)?.emotes).toContain('gg');
  });

  it('stay quiet for upright cards and answer taunts', () => {
    const play: GameEvent = { t: 'play', p: 0, kind: 'minor', face: 'cups.upright' };
    expect(emoteWishes(play, s, fxFor(play, s))).toEqual([]);
    expect(replyTo('taunt')).toContain('angry');
    expect(replyTo('cool')).toBeNull();
  });
});
