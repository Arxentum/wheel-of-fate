/**
 * The background music as notes: an 8-bar loop in A minor at 80 beats a minute. It is
 * written out bar by bar from a seed, so every pass varies a little but stays the same
 * piece. Three levels build on each other: 0 the start screen (pad and music box), 1 a
 * game (bass and a bell tune), 2 the final round (a heartbeat drum and hi-hats).
 */

export type Voice = 'pad' | 'bass' | 'box' | 'bell' | 'kick' | 'hat';
export type Intensity = 0 | 1 | 2;

export interface Note {
  voice: Voice;
  /** Start within the bar, in beats. */
  beat: number;
  /** Length in beats. */
  beats: number;
  /** MIDI note number (69 = A4); drums ignore it. */
  midi: number;
  /** Loudness 0..1. */
  vel: number;
}

export const BPM = 80;
export const BEATS_PER_BAR = 4;
export const LOOP_BARS = 8;
export const SECONDS_PER_BEAT = 60 / BPM;

interface Chord {
  bass: number;
  tones: number[];
  /** A second chord for the bar's last two beats. */
  then?: { bass: number; tones: number[] };
}

/** Am(add9) | Fmaj7 | C(add9) | G6 | Am | Fmaj7 | Dm7 | Esus4 → E. */
export const PROGRESSION: Chord[] = [
  { bass: 45, tones: [57, 60, 64, 71] },
  { bass: 41, tones: [53, 57, 60, 64] },
  { bass: 48, tones: [55, 60, 62, 64] },
  { bass: 43, tones: [55, 59, 62, 64] },
  { bass: 45, tones: [57, 60, 64, 69] },
  { bass: 41, tones: [53, 57, 60, 64] },
  { bass: 38, tones: [53, 57, 60, 62] },
  { bass: 40, tones: [52, 57, 59, 64], then: { bass: 40, tones: [52, 56, 59, 64] } },
];

/** A minor pentatonic, for the bell tune. */
const PENTATONIC = [0, 3, 5, 7, 10];

/** Small seeded random numbers (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inPentatonic(midi: number): boolean {
  return PENTATONIC.includes((((midi - 57) % 12) + 12) % 12);
}

/** The notes of one bar (`bar` counts from the start of the music; the chords repeat every 8). */
export function barNotes(bar: number, intensity: Intensity, seed = 1): Note[] {
  const chord = PROGRESSION[((bar % LOOP_BARS) + LOOP_BARS) % LOOP_BARS]!;
  const r = rng(seed * 7919 + bar * 104729);
  const notes: Note[] = [];
  const halves = chord.then ? [{ ...chord, at: 0, len: 2 }, { ...chord.then, at: 2, len: 2 }] : [{ ...chord, at: 0, len: 4 }];

  // Pad: the chord held through the bar.
  for (const h of halves) for (const m of h.tones) notes.push({ voice: 'pad', beat: h.at, beats: h.len, midi: m, vel: 0.5 });

  // Bass: the root, more often as the music builds.
  for (const h of halves) {
    if (intensity === 0) notes.push({ voice: 'bass', beat: h.at, beats: h.len, midi: h.bass, vel: 0.45 });
    else {
      notes.push({ voice: 'bass', beat: h.at, beats: Math.min(2, h.len), midi: h.bass, vel: 0.7 });
      if (h.len === 4) notes.push({ voice: 'bass', beat: 2, beats: 2, midi: r() < 0.5 ? h.bass + 7 : h.bass, vel: 0.55 });
      if (intensity === 2) notes.push({ voice: 'bass', beat: h.at + h.len - 0.5, beats: 0.5, midi: h.bass + 12, vel: 0.4 });
    }
  }

  // Music box: the chord an octave up as an arpeggio; sparse on the start screen.
  const up = (h: (typeof halves)[number]) => [...h.tones.map((m) => m + 12), h.tones[1]! + 24];
  if (intensity === 0) {
    for (const beat of [0, 1.5, 2.5]) {
      const h = halves.find((x) => beat >= x.at && beat < x.at + x.len)!;
      const tones = up(h);
      notes.push({ voice: 'box', beat, beats: 1.5, midi: tones[Math.floor(r() * tones.length)]!, vel: 0.5 });
    }
  } else {
    const rising = bar % 2 === 0;
    for (let i = 0; i < 8; i++) {
      const beat = i / 2;
      const h = halves.find((x) => beat >= x.at && beat < x.at + x.len)!;
      const tones = up(h);
      if (intensity === 1 && i > 0 && r() < 0.22) continue;
      const k = rising ? i % tones.length : tones.length - 1 - (i % tones.length);
      notes.push({ voice: 'box', beat, beats: 0.5, midi: tones[k]!, vel: i % 2 === 0 ? 0.55 : 0.4 });
    }
  }

  // Bell tune: a short motif every other bar, from the chord's notes on the pentatonic scale.
  if (intensity >= 1 && bar % 2 === 0) {
    const pool = chord.tones.map((m) => m + 24).filter(inPentatonic);
    const pick = () => pool[Math.floor(r() * pool.length)] ?? chord.tones[0]! + 24;
    for (const beat of [0, 1, 2.5]) notes.push({ voice: 'bell', beat, beats: 1.5, midi: pick(), vel: beat === 0 ? 0.55 : 0.4 });
  }

  // Final round: a heartbeat on beats 1 and 3, and soft off-beat hi-hats.
  if (intensity === 2) {
    for (const beat of [0, 2]) {
      notes.push({ voice: 'kick', beat, beats: 0.25, midi: 0, vel: 0.85 });
      notes.push({ voice: 'kick', beat: beat + 0.4, beats: 0.25, midi: 0, vel: 0.55 });
    }
    for (const beat of [0.5, 1.5, 2.5, 3.5]) notes.push({ voice: 'hat', beat, beats: 0.1, midi: 0, vel: 0.35 });
  }
  return notes;
}

/** Frequency of a MIDI note. */
export function freq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
