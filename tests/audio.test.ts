import { describe, expect, it } from 'vitest';
import { applyActionMut, chooseBotAction, createGame, type GameEvent, type GameSetup } from '../src/engine';
import { CUE_NAMES, cuesFor, stepCue, type CueContext } from '../src/ui/audio/cues';
import { BEATS_PER_BAR, LOOP_BARS, barNotes, freq, type Intensity } from '../src/ui/audio/music';

const ctx3: CueContext = { humans: [0], elements: ['fire', 'earth', 'air'] };

describe('sound cues', () => {
  it('give every event of real games known sounds (or silence)', () => {
    const seen = new Set<string>();
    for (const n of [2, 3, 4]) {
      for (let g = 0; g < 6; g++) {
        const els = (['fire', 'earth', 'air', 'water'] as const).slice(0, n);
        const setup: GameSetup = { players: els.map((element) => ({ controller: 'computer', element })), laps: 2 };
        const { state, events } = createGame(setup, `cues-${n}-${g}`);
        const all: GameEvent[] = [...events];
        while (state.pending) all.push(...applyActionMut(state, chooseBotAction(state)));
        const ctx: CueContext = { humans: [], elements: [...els] };
        for (const e of all) {
          for (const c of cuesFor(e, ctx)) {
            expect(CUE_NAMES).toContain(c.name);
            if (c.pan !== undefined) expect(Math.abs(c.pan)).toBeLessThanOrEqual(1);
            seen.add(c.name);
          }
        }
      }
    }
    // The everyday sounds all turn up.
    for (const name of ['cardUp', 'cardDown', 'dice', 'fpGain', 'draw', 'turn', 'fanfare', 'land']) expect(seen).toContain(name);
  });

  it('sounds upright cards bright and reversed ones dark', () => {
    expect(cuesFor({ t: 'play', p: 1, kind: 'minor', face: 'wands.upright' }, ctx3)[0]!.name).toBe('cardUp');
    expect(cuesFor({ t: 'play', p: 1, kind: 'minor', face: 'wands.reversed' }, ctx3)[0]!.name).toBe('cardDown');
    expect(cuesFor({ t: 'play', p: 1, kind: 'skill', face: 'moon.reversed' }, ctx3)[0]!.name).toBe('skillDark');
    const res = cuesFor({ t: 'play', p: 1, kind: 'minor', face: 'cups.upright', resonance: true }, ctx3);
    expect(res.map((c) => c.name)).toEqual(['cardUp', 'resonance']);
  });

  it('tells spending, gaining and losing Fate Points apart', () => {
    expect(cuesFor({ t: 'fp', p: 0, delta: -2, reason: 'boost', lostToCap: 0 }, ctx3)[0]!.name).toBe('spend');
    expect(cuesFor({ t: 'fp', p: 0, delta: -3, reason: 'card', lostToCap: 0 }, ctx3)[0]!.name).toBe('fpLoss');
    expect(cuesFor({ t: 'fp', p: 0, delta: 2, reason: 'card', lostToCap: 0 }, ctx3)[0]).toMatchObject({ name: 'fpGain', pitch: 1 });
    expect(cuesFor({ t: 'fp', p: 0, delta: 0, reason: 'card', lostToCap: 2 }, ctx3)).toEqual([]);
  });

  it('marks the human turn and the end of the game for the people at the table', () => {
    expect(cuesFor({ t: 'turnStart', p: 0, round: 1, turnNo: 1 }, ctx3)[0]!.name).toBe('yourTurn');
    expect(cuesFor({ t: 'turnStart', p: 2, round: 1, turnNo: 1 }, ctx3)[0]!.name).toBe('turn');
    const over = (winners: number[]): GameEvent => ({ t: 'gameOver', result: { ranking: [winners], winners, rounds: 9 } });
    expect(cuesFor(over([0]), ctx3)[0]!.name).toBe('win');
    expect(cuesFor(over([2]), ctx3)[0]!.name).toBe('lose');
    expect(cuesFor(over([2]), { ...ctx3, humans: [] })[0]!.name).toBe('fanfare');
  });

  it('does not repeat the sound of cards that were just played', () => {
    expect(cuesFor({ t: 'discard', p: 0, cards: ['wands'], reason: 'played' }, ctx3)).toEqual([]);
    expect(cuesFor({ t: 'discard', p: 0, cards: ['wands'], reason: 'random' }, ctx3)[0]!.name).toBe('discard');
  });

  it('places each player left or right and steps forward high, back low', () => {
    expect(stepCue(0, 1, ctx3)).toEqual({ name: 'step', pan: -0.4 });
    expect(stepCue(2, -1, ctx3)).toEqual({ name: 'stepBack', pan: 0.14 });
  });
});

describe('music', () => {
  // A natural minor plus G sharp (the E major chord at the end of the loop).
  const A_MINOR = new Set([9, 11, 0, 2, 4, 5, 7, 8]);
  const levels: Intensity[] = [0, 1, 2];

  it('writes the same bar the same way, and varies from bar to bar', () => {
    expect(barNotes(3, 1)).toEqual(barNotes(3, 1));
    expect(barNotes(3, 1)).not.toEqual(barNotes(11, 1));
  });

  it('stays in A minor and inside the bar', () => {
    for (const level of levels) {
      for (let bar = 0; bar < LOOP_BARS * 2; bar++) {
        for (const n of barNotes(bar, level)) {
          expect(n.beat).toBeGreaterThanOrEqual(0);
          expect(n.beat).toBeLessThan(BEATS_PER_BAR);
          expect(n.beat + n.beats).toBeLessThanOrEqual(BEATS_PER_BAR + 0.001);
          expect(n.vel).toBeGreaterThan(0);
          expect(n.vel).toBeLessThanOrEqual(1);
          if (n.voice !== 'kick' && n.voice !== 'hat') expect(A_MINOR.has(n.midi % 12)).toBe(true);
        }
      }
    }
  });

  it('builds up layer by layer', () => {
    const voices = (level: Intensity) => new Set(Array.from({ length: LOOP_BARS }, (_, b) => barNotes(b, level)).flat().map((n) => n.voice));
    expect([...voices(0)].sort()).toEqual(['bass', 'box', 'pad']);
    expect([...voices(1)].sort()).toEqual(['bass', 'bell', 'box', 'pad']);
    expect([...voices(2)].sort()).toEqual(['bass', 'bell', 'box', 'hat', 'kick', 'pad']);
  });

  it('tunes A4 to 440 Hz', () => {
    expect(freq(69)).toBe(440);
    expect(freq(81)).toBeCloseTo(880);
  });
});
