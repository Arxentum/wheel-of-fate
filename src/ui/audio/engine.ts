import type { Cue, CueName } from './cues';
import { BEATS_PER_BAR, SECONDS_PER_BEAT, barNotes, type Intensity } from './music';
import { makeImpulse, makeNoise, playCue, playNote, type Out } from './synth';

/**
 * The game's sound: effects and background music on two buses with their own volume,
 * a shared reverb and a limiter. The audio context starts on the first click or key
 * press (browsers do not allow sound before that) and pauses while the tab is hidden.
 */

export interface SoundSettings {
  music: boolean;
  musicVolume: number;
  effects: boolean;
  effectsVolume: number;
}

export type Scene = 'menu' | 'game' | 'final';

export const DEFAULT_SOUND: SoundSettings = { music: true, musicVolume: 0.5, effects: true, effectsVolume: 0.8 };

const STORAGE_KEY = 'wof.sound';
const INTENSITY: Record<Scene, Intensity> = { menu: 0, game: 1, final: 2 };
const BAR_SECONDS = BEATS_PER_BAR * SECONDS_PER_BEAT;

function loadSettings(): SoundSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND;
    const s = JSON.parse(raw) as Partial<SoundSettings>;
    const vol = (v: unknown, d: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : d);
    return {
      music: typeof s.music === 'boolean' ? s.music : DEFAULT_SOUND.music,
      musicVolume: vol(s.musicVolume, DEFAULT_SOUND.musicVolume),
      effects: typeof s.effects === 'boolean' ? s.effects : DEFAULT_SOUND.effects,
      effectsVolume: vol(s.effectsVolume, DEFAULT_SOUND.effectsVolume),
    };
  } catch {
    return DEFAULT_SOUND;
  }
}

interface Graph {
  ctx: AudioContext;
  music: GainNode;
  effects: GainNode;
  noise: AudioBuffer;
}

export class SoundEngine {
  private settings: SoundSettings = loadSettings();
  private readonly listeners = new Set<() => void>();
  private graph: Graph | null = null;
  private scene: Scene = 'menu';
  private bar = 0;
  private nextBar = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly lastCue = new Map<CueName, number>();

  // ---- Settings (React reads them with useSyncExternalStore) ----

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSettings = (): SoundSettings => this.settings;

  set(patch: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...patch };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Not saved; the defaults come back next time.
    }
    this.applyVolumes();
    this.updateMusic();
    for (const fn of this.listeners) fn();
  }

  // ---- Playing ----

  /** Called on a user gesture: creates or resumes the audio context. */
  unlock(): void {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return;
    if (!this.graph) this.graph = this.build();
    if (this.graph.ctx.state === 'suspended' && !document.hidden) void this.graph.ctx.resume();
    this.updateMusic();
  }

  /** Effect sounds for something that just happened. */
  play(cues: readonly Cue[]): void {
    const g = this.graph;
    if (!g || !this.settings.effects || g.ctx.state !== 'running' || cues.length === 0) return;
    const now = g.ctx.currentTime;
    const out: Out = { ctx: g.ctx, dest: g.effects, noise: g.noise };
    for (const c of cues) {
      // The same sound twice within 40 ms (several events at once) plays once.
      const last = this.lastCue.get(c.name) ?? -1;
      if (now - last < 0.04 && !c.delay) continue;
      this.lastCue.set(c.name, now);
      playCue(out, c, now + 0.01);
    }
  }

  /** Which music fits the screen: the start screen, a game, its final round. */
  setScene(scene: Scene): void {
    this.scene = scene;
    this.updateMusic();
  }

  // ---- Internals ----

  private build(): Graph {
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 8;
    limiter.ratio.value = 6;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(limiter).connect(ctx.destination);

    const music = ctx.createGain();
    const effects = ctx.createGain();
    music.gain.value = 0;
    effects.gain.value = 0;
    music.connect(master);
    effects.connect(master);

    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 1;
    reverb.connect(wet).connect(master);
    const musicSend = ctx.createGain();
    musicSend.gain.value = 0.35;
    const effectsSend = ctx.createGain();
    effectsSend.gain.value = 0.2;
    music.connect(musicSend).connect(reverb);
    effects.connect(effectsSend).connect(reverb);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });

    const graph: Graph = { ctx, music, effects, noise: makeNoise(ctx) };
    this.graph = graph;
    this.applyVolumes();
    return graph;
  }

  private applyVolumes(): void {
    const g = this.graph;
    if (!g) return;
    const now = g.ctx.currentTime;
    const s = this.settings;
    g.effects.gain.setTargetAtTime(s.effects ? s.effectsVolume : 0, now, 0.05);
    // The music sits under the effects: half volume at the slider's top.
    g.music.gain.setTargetAtTime(s.music ? s.musicVolume * 0.5 : 0, now, s.music ? 0.6 : 0.15);
  }

  /** Starts or stops the music scheduler to match the settings. */
  private updateMusic(): void {
    const g = this.graph;
    if (!g) return;
    if (this.settings.music && !this.timer) {
      this.nextBar = g.ctx.currentTime + 0.15;
      this.timer = setInterval(() => this.schedule(), 120);
      this.schedule();
    } else if (!this.settings.music && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Writes out the bars that start in the next 0.8 s. */
  private schedule(): void {
    const g = this.graph;
    if (!g || g.ctx.state !== 'running') return;
    const now = g.ctx.currentTime;
    // After a pause (hidden tab) do not catch up on bars that were missed.
    if (this.nextBar < now) this.nextBar = now + 0.05;
    const out: Out = { ctx: g.ctx, dest: g.music, noise: g.noise };
    while (this.nextBar < now + 0.8) {
      for (const n of barNotes(this.bar, INTENSITY[this.scene])) playNote(out, n, this.nextBar + n.beat * SECONDS_PER_BEAT);
      this.bar++;
      this.nextBar += BAR_SECONDS;
    }
  }
}

let engine: SoundEngine | null = null;

/** The one sound engine of the page (made on first use, so importing this file is harmless). */
export function sound(): SoundEngine {
  engine ??= new SoundEngine();
  return engine;
}
