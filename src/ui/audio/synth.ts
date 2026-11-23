import type { Cue, CueName } from './cues';
import { SECONDS_PER_BEAT, freq, type Note } from './music';

/**
 * Every sound is made here with the Web Audio API: no audio files. Works with an
 * AudioContext (the game) or an OfflineAudioContext (the level check, e2e/check-audio.ts).
 */

export interface Out {
  ctx: BaseAudioContext;
  /** Where the sound goes (the effects or the music bus). */
  dest: AudioNode;
  /** One second of white noise, shared. */
  noise: AudioBuffer;
}

export function makeNoise(ctx: BaseAudioContext): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 22222;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return buf;
}

/** A stereo reverb tail made from decaying noise. */
export function makeImpulse(ctx: BaseAudioContext, seconds = 2.6): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = 7 + ch * 31;
    for (let i = 0; i < len; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = ((seed / 2147483647) * 2 - 1) * (1 - i / len) ** 3;
    }
  }
  return buf;
}

const SILENT = 0.0001;

interface Shape {
  t: number;
  /** Seconds until the sound has faded out. */
  dur: number;
  peak: number;
  attack?: number;
  pan?: number;
}

/** Gain envelope (fast attack, exponential decay) and stereo position, ending at `out.dest`. */
function chain(o: Out, s: Shape): AudioNode {
  const g = o.ctx.createGain();
  const a = s.attack ?? 0.004;
  g.gain.setValueAtTime(SILENT, s.t);
  g.gain.exponentialRampToValueAtTime(Math.max(s.peak, SILENT * 2), s.t + a);
  g.gain.exponentialRampToValueAtTime(SILENT, s.t + Math.max(s.dur, a + 0.01));
  if (s.pan) {
    const p = o.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, s.pan));
    g.connect(p).connect(o.dest);
  } else g.connect(o.dest);
  return g;
}

interface ToneOpts extends Shape {
  f: number;
  type?: OscillatorType;
  /** Glide to this frequency over the sound. */
  to?: number;
  detune?: number;
  lowpass?: number;
}

function tone(o: Out, x: ToneOpts): void {
  const osc = o.ctx.createOscillator();
  osc.type = x.type ?? 'sine';
  osc.frequency.setValueAtTime(x.f, x.t);
  if (x.to) osc.frequency.exponentialRampToValueAtTime(x.to, x.t + x.dur);
  if (x.detune) osc.detune.value = x.detune;
  let node: AudioNode = osc;
  if (x.lowpass) {
    const f = o.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = x.lowpass;
    node = node.connect(f);
  }
  node.connect(chain(o, x));
  osc.start(x.t);
  osc.stop(x.t + x.dur + 0.05);
}

interface NoiseOpts extends Shape {
  filter: BiquadFilterType;
  f: number;
  to?: number;
  q?: number;
}

function noise(o: Out, x: NoiseOpts): void {
  const src = o.ctx.createBufferSource();
  src.buffer = o.noise;
  src.loop = true;
  const f = o.ctx.createBiquadFilter();
  f.type = x.filter;
  f.frequency.setValueAtTime(x.f, x.t);
  if (x.to) f.frequency.exponentialRampToValueAtTime(x.to, x.t + x.dur);
  f.Q.value = x.q ?? 1;
  src.connect(f).connect(chain(o, x));
  src.start(x.t, Math.random() * 0.5);
  src.stop(x.t + x.dur + 0.05);
}

/** Struck metal: inharmonic partials, the higher ones fading first. */
function bell(o: Out, x: Shape & { f: number }): void {
  const partials: [number, number, number][] = [
    [1, 1, 1],
    [2.0, 0.5, 0.7],
    [3.01, 0.32, 0.5],
    [4.2, 0.2, 0.35],
    [5.43, 0.12, 0.25],
  ];
  for (const [ratio, amp, life] of partials) tone(o, { ...x, f: x.f * ratio, peak: x.peak * amp, dur: x.dur * life });
}

/** A music-box tine: a pure tone with a faint overtone and a quick fade. */
function tine(o: Out, x: Shape & { f: number }): void {
  tone(o, { ...x, attack: 0.002 });
  tone(o, { ...x, f: x.f * 3, peak: x.peak * 0.12, dur: x.dur * 0.4, attack: 0.002 });
}

/** A short knock on wood. */
function wood(o: Out, x: Shape & { f: number }): void {
  tone(o, { ...x, type: 'triangle', to: x.f * 0.82, attack: 0.001 });
  noise(o, { t: x.t, dur: 0.025, peak: x.peak * 0.4, filter: 'bandpass', f: x.f * 2.2, q: 2, pan: x.pan, attack: 0.001 });
}

const st = (semitones = 0) => 2 ** (semitones / 12);

type Maker = (o: Out, t: number, c: Cue) => void;

/** The effect sounds. Levels are balanced for the effects bus at full volume. */
const MAKERS: Record<CueName, Maker> = {
  click: (o, t, c) => wood(o, { t, dur: 0.035, peak: 0.07, f: 1900, pan: c.pan }),
  pick: (o, t, c) => {
    noise(o, { t, dur: 0.07, peak: 0.1, filter: 'bandpass', f: 2200, to: 4200, q: 1.4, pan: c.pan });
    wood(o, { t: t + 0.02, dur: 0.04, peak: 0.05, f: 1500, pan: c.pan });
  },
  start: (o, t) => {
    for (const [i, m] of [57, 64, 69].entries()) bell(o, { t: t + i * 0.09, dur: 2.2, peak: 0.1, f: freq(m), attack: 0.02 });
  },
  yourTurn: (o, t, c) => {
    bell(o, { t, dur: 1.1, peak: 0.12, f: freq(76), pan: c.pan });
    bell(o, { t: t + 0.13, dur: 1.4, peak: 0.13, f: freq(81), pan: c.pan });
  },
  turn: (o, t, c) => wood(o, { t, dur: 0.05, peak: 0.035, f: 700, pan: c.pan }),
  draw: (o, t, c) => noise(o, { t, dur: 0.18, peak: 0.09, filter: 'bandpass', f: 1200, to: 3600, q: 1.2, pan: c.pan, attack: 0.03 }),
  shuffle: (o, t) => {
    for (let i = 0; i < 12; i++) noise(o, { t: t + i * 0.028, dur: 0.03, peak: 0.06, filter: 'bandpass', f: 2600 + (i % 3) * 300, q: 3 });
  },
  denied: (o, t, c) => {
    tone(o, { t, dur: 0.28, peak: 0.13, f: 190, to: 120, type: 'triangle', pan: c.pan });
    noise(o, { t, dur: 0.12, peak: 0.08, filter: 'lowpass', f: 500, pan: c.pan });
  },
  cardUp: (o, t, c) => {
    noise(o, { t, dur: 0.08, peak: 0.2, filter: 'bandpass', f: 1900, q: 0.9, pan: c.pan, attack: 0.002 });
    tone(o, { t, dur: 0.09, peak: 0.14, f: 240, to: 120, pan: c.pan });
    bell(o, { t: t + 0.03, dur: 0.6, peak: 0.05, f: freq(88), pan: c.pan });
  },
  cardDown: (o, t, c) => {
    noise(o, { t, dur: 0.09, peak: 0.2, filter: 'bandpass', f: 900, q: 0.9, pan: c.pan, attack: 0.002 });
    tone(o, { t, dur: 0.12, peak: 0.18, f: 150, to: 70, pan: c.pan });
    tone(o, { t: t + 0.02, dur: 0.7, peak: 0.08, f: freq(40), type: 'triangle', lowpass: 700, pan: c.pan });
    tone(o, { t: t + 0.02, dur: 0.7, peak: 0.045, f: freq(41), type: 'triangle', lowpass: 700, pan: c.pan });
  },
  resonance: (o, t, c) => {
    for (const [i, m] of [81, 85, 88].entries()) bell(o, { t: t + i * 0.06, dur: 0.9, peak: 0.06, f: freq(m), pan: c.pan });
  },
  skill: (o, t, c) => {
    noise(o, { t, dur: 0.4, peak: 0.1, filter: 'bandpass', f: 400, to: 3200, q: 2, pan: c.pan, attack: 0.15 });
    bell(o, { t: t + 0.32, dur: 1.4, peak: 0.1, f: freq(81), pan: c.pan });
    bell(o, { t: t + 0.32, dur: 1.4, peak: 0.07, f: freq(88), pan: c.pan });
  },
  skillDark: (o, t, c) => {
    noise(o, { t, dur: 0.4, peak: 0.1, filter: 'bandpass', f: 3200, to: 350, q: 2, pan: c.pan, attack: 0.05 });
    tone(o, { t: t + 0.3, dur: 0.25, peak: 0.2, f: 110, to: 50, pan: c.pan });
    bell(o, { t: t + 0.3, dur: 1.4, peak: 0.09, f: freq(62), pan: c.pan });
    bell(o, { t: t + 0.3, dur: 1.4, peak: 0.06, f: freq(68), pan: c.pan });
  },
  meditate: (o, t, c) => {
    tone(o, { t, dur: 2.2, peak: 0.1, f: 220, attack: 0.06, pan: c.pan });
    tone(o, { t, dur: 2.0, peak: 0.06, f: 440 * 1.004, attack: 0.06, pan: c.pan });
    tone(o, { t, dur: 1.2, peak: 0.03, f: 220 * 3.1, attack: 0.06, pan: c.pan });
  },
  step: (o, t, c) => wood(o, { t, dur: 0.05, peak: 0.09, f: 1050 * st(c.pitch), pan: c.pan }),
  stepBack: (o, t, c) => wood(o, { t, dur: 0.07, peak: 0.09, f: 620 * st(c.pitch), pan: c.pan }),
  land: (o, t, c) => {
    tone(o, { t, dur: 0.14, peak: 0.1, f: 170, to: 90, pan: c.pan });
    noise(o, { t, dur: 0.05, peak: 0.05, filter: 'lowpass', f: 700, pan: c.pan });
  },
  fpGain: (o, t, c) => {
    bell(o, { t, dur: 0.35, peak: 0.07, f: freq(91 + (c.pitch ?? 0)), pan: c.pan });
    bell(o, { t: t + 0.07, dur: 0.45, peak: 0.07, f: freq(96 + (c.pitch ?? 0)), pan: c.pan });
  },
  fpLoss: (o, t, c) => {
    tone(o, { t, dur: 0.18, peak: 0.08, f: freq(84), type: 'triangle', lowpass: 2500, pan: c.pan });
    tone(o, { t: t + 0.09, dur: 0.3, peak: 0.08, f: freq(79), type: 'triangle', lowpass: 1800, pan: c.pan });
  },
  spend: (o, t, c) => {
    bell(o, { t, dur: 0.18, peak: 0.06, f: freq(100), pan: c.pan });
    bell(o, { t: t + 0.05, dur: 0.25, peak: 0.05, f: freq(95), pan: c.pan });
  },
  discard: (o, t, c) => noise(o, { t, dur: 0.16, peak: 0.08, filter: 'bandpass', f: 1600, to: 800, q: 1.2, pan: c.pan, attack: 0.02 }),
  steal: (o, t, c) => {
    noise(o, { t, dur: 0.16, peak: 0.08, filter: 'bandpass', f: 2200, to: 600, q: 1.5, pan: c.pan });
    bell(o, { t: t + 0.12, dur: 0.3, peak: 0.06, f: freq(93), pan: c.pan });
  },
  shield: (o, t, c) => {
    for (const [i, m] of [76, 81, 85, 88].entries()) tone(o, { t: t + i * 0.03, dur: 0.9, peak: 0.035, f: freq(m), attack: 0.08, pan: c.pan });
    noise(o, { t, dur: 0.6, peak: 0.03, filter: 'highpass', f: 6000, attack: 0.2, pan: c.pan });
  },
  curse: (o, t, c) => {
    tone(o, { t, dur: 0.8, peak: 0.06, f: 98, type: 'sawtooth', lowpass: 500, pan: c.pan, attack: 0.02 });
    tone(o, { t, dur: 0.8, peak: 0.06, f: 104, type: 'sawtooth', lowpass: 500, pan: c.pan, attack: 0.02 });
    tone(o, { t, dur: 0.15, peak: 0.12, f: 120, to: 60, pan: c.pan });
  },
  cleanse: (o, t, c) => {
    for (const [i, m] of [81, 85, 88, 93].entries()) tine(o, { t: t + i * 0.05, dur: 0.6, peak: 0.06, f: freq(m), pan: c.pan });
  },
  block: (o, t, c) => {
    bell(o, { t, dur: 0.7, peak: 0.08, f: freq(86), pan: c.pan });
    noise(o, { t, dur: 0.03, peak: 0.1, filter: 'highpass', f: 4000, pan: c.pan });
  },
  shieldFade: (o, t, c) => tone(o, { t, dur: 0.7, peak: 0.05, f: freq(88), to: freq(76), attack: 0.05, pan: c.pan }),
  trapSet: (o, t, c) => {
    tone(o, { t, dur: 0.16, peak: 0.06, f: 300, type: 'square', lowpass: 1600, pan: c.pan });
    tone(o, { t, dur: 0.16, peak: 0.05, f: 451, type: 'square', lowpass: 1600, pan: c.pan });
    noise(o, { t, dur: 0.12, peak: 0.08, filter: 'bandpass', f: 1400, q: 2, pan: c.pan });
  },
  trapFade: (o, t) => tone(o, { t, dur: 0.45, peak: 0.05, f: 600, to: 300 }),
  trap: (o, t, c) => {
    noise(o, { t, dur: 0.05, peak: 0.22, filter: 'highpass', f: 2500, pan: c.pan, attack: 0.001 });
    tone(o, { t, dur: 0.55, peak: 0.3, f: 95, to: 40, pan: c.pan });
    tone(o, { t: t + 0.02, dur: 0.5, peak: 0.05, f: 220, type: 'sawtooth', lowpass: 1200, pan: c.pan });
    tone(o, { t: t + 0.02, dur: 0.5, peak: 0.05, f: 233, type: 'sawtooth', lowpass: 1200, pan: c.pan });
  },
  flip: (o, t, c) => {
    noise(o, { t, dur: 0.04, peak: 0.1, filter: 'bandpass', f: 3000, q: 2, pan: c.pan });
    noise(o, { t: t + 0.07, dur: 0.05, peak: 0.12, filter: 'bandpass', f: 2400, q: 2, pan: c.pan });
    tine(o, { t: t + 0.09, dur: 0.5, peak: 0.05, f: 880 * st(c.pitch), pan: c.pan });
  },
  dice: (o, t, c) => {
    const hits = [0, 0.06, 0.13, 0.19, 0.27, 0.33, 0.42];
    hits.forEach((h, i) => wood(o, { t: t + h, dur: 0.03, peak: 0.07 - i * 0.004, f: 2300 + ((i * 397) % 900), pan: c.pan }));
    wood(o, { t: t + 0.5, dur: 0.08, peak: 0.12, f: 520, pan: c.pan });
  },
  boost: (o, t, c) => {
    noise(o, { t, dur: 0.32, peak: 0.1, filter: 'bandpass', f: 300, to: 2600, q: 1.5, pan: c.pan, attack: 0.1 });
    tone(o, { t, dur: 0.3, peak: 0.05, f: 440, to: 880, pan: c.pan, attack: 0.05 });
  },
  lap: (o, t, c) => {
    for (const [i, m] of [69, 73, 76, 81].entries()) bell(o, { t: t + i * 0.08, dur: 1.0, peak: 0.08, f: freq(m), pan: c.pan });
  },
  gong: (o, t) => {
    for (const [ratio, amp] of [[1, 1], [1.5, 0.4], [2.08, 0.5], [2.73, 0.3], [3.2, 0.2]] as const) {
      tone(o, { t, dur: 3.2, peak: 0.12 * amp, f: 98 * ratio, attack: 0.02 });
    }
    noise(o, { t, dur: 1.5, peak: 0.05, filter: 'lowpass', f: 400, attack: 0.3 });
  },
  peek: (o, t, c) => {
    tine(o, { t, dur: 0.3, peak: 0.04, f: 1200, pan: c.pan });
    tine(o, { t: t + 0.06, dur: 0.3, peak: 0.035, f: 1500, pan: c.pan });
  },
  win: (o, t) => {
    for (const [i, m] of [69, 73, 76, 81].entries()) bell(o, { t: t + i * 0.12, dur: 1.6, peak: 0.1, f: freq(m) });
    for (const m of [57, 64, 69, 73]) tone(o, { t: t + 0.5, dur: 2.2, peak: 0.035, f: freq(m), type: 'sawtooth', lowpass: 1500, attack: 0.08 });
  },
  lose: (o, t) => {
    for (const [i, m] of [69, 67, 64].entries()) bell(o, { t: t + i * 0.18, dur: 1.2, peak: 0.08, f: freq(m) });
    for (const m of [45, 52, 57, 60]) tone(o, { t: t + 0.6, dur: 2.2, peak: 0.035, f: freq(m), type: 'sawtooth', lowpass: 900, attack: 0.1 });
  },
  fanfare: (o, t) => {
    for (const [i, m] of [69, 76, 81].entries()) bell(o, { t: t + i * 0.12, dur: 1.6, peak: 0.1, f: freq(m) });
    for (const m of [57, 64, 69]) tone(o, { t: t + 0.4, dur: 2, peak: 0.035, f: freq(m), type: 'sawtooth', lowpass: 1200, attack: 0.08 });
  },
};

/**
 * Level trims from the level check (e2e/check-audio.ts): the big moments a few dB above
 * the everyday sounds, not ten; the quiet card sounds brought up.
 */
const LEVEL: Partial<Record<CueName, number>> = {
  start: 0.45, gong: 0.6, win: 0.7, fanfare: 0.65, trap: 0.55, skillDark: 0.65, skill: 0.85, yourTurn: 0.8,
  turn: 1.8, draw: 2.1, shuffle: 3.2, discard: 2.3, click: 1.3, pick: 1.3,
};

/** Plays one effect at time `t` (seconds, on the context's clock). */
export function playCue(o: Out, c: Cue, t: number): void {
  const level = LEVEL[c.name] ?? 1;
  let out = o;
  if (level !== 1) {
    const g = o.ctx.createGain();
    g.gain.value = level;
    g.connect(o.dest);
    out = { ...o, dest: g };
  }
  MAKERS[c.name](out, t + (c.delay ?? 0), c);
}

/** Plays one note of the music, starting at `t`. */
export function playNote(o: Out, n: Note, t: number): void {
  const len = n.beats * SECONDS_PER_BEAT;
  const f = freq(n.midi);
  switch (n.voice) {
    case 'pad': {
      // Two detuned saws through a soft filter, slow in and out.
      for (const detune of [-7, 7]) {
        const osc = o.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = detune;
        const lp = o.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        const g = o.ctx.createGain();
        const peak = 0.018 * n.vel;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + Math.min(0.8, len / 2));
        g.gain.setValueAtTime(peak, t + len);
        g.gain.linearRampToValueAtTime(0, t + len + 0.9);
        osc.connect(lp).connect(g).connect(o.dest);
        osc.start(t);
        osc.stop(t + len + 1);
      }
      return;
    }
    case 'bass':
      tone(o, { t, dur: len + 0.2, peak: 0.16 * n.vel, f, type: 'triangle', lowpass: 450, attack: 0.02 });
      tone(o, { t, dur: len + 0.2, peak: 0.1 * n.vel, f: f / 2, attack: 0.02 });
      return;
    case 'box':
      tine(o, { t, dur: 1.4, peak: 0.07 * n.vel, f });
      return;
    case 'bell':
      bell(o, { t, dur: 2.4, peak: 0.06 * n.vel, f });
      return;
    case 'kick':
      tone(o, { t, dur: 0.32, peak: 0.2 * n.vel, f: 110, to: 42, attack: 0.002 });
      return;
    case 'hat':
      noise(o, { t, dur: 0.05, peak: 0.035 * n.vel, filter: 'highpass', f: 7000, attack: 0.001 });
      return;
  }
}
