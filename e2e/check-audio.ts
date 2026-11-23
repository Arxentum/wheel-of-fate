/**
 * Renders every sound effect and 8 bars of each music level offline in the browser and
 * reports their levels: silent sounds, clipping and sounds much louder or quieter than the
 * rest are flagged. Needs the dev server: npx tsx e2e/check-audio.ts [url]
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.addInitScript({ content: 'window.__name = (f) => f;' });
await page.goto(base);

interface Level {
  name: string;
  peak: number;
  /** Loudest 50 ms window, dBFS. */
  loud: number;
  seconds: number;
}

const levels: Level[] = await page.evaluate(async () => {
  const load = (p: string) => import(/* @vite-ignore */ p);
  const synth = await load('/src/ui/audio/synth.ts');
  const cues = await load('/src/ui/audio/cues.ts');
  const music = await load('/src/ui/audio/music.ts');
  const rate = 44100;

  const measure = (name: string, buf: AudioBuffer) => {
    let peak = 0;
    let loud = 0;
    let last = 0;
    const win = Math.floor(rate * 0.05);
    const chans = [buf.getChannelData(0), buf.getChannelData(1)];
    for (let i = 0; i + win <= buf.length; i += win) {
      let sum = 0;
      for (const d of chans) {
        for (let j = i; j < i + win; j++) {
          const v = Math.abs(d[j]!);
          if (v > peak) peak = v;
          sum += v * v;
        }
      }
      const rms = Math.sqrt(sum / (win * 2));
      if (rms > loud) loud = rms;
      if (rms > 0.001) last = (i + win) / rate;
    }
    return { name, peak, loud: 20 * Math.log10(Math.max(loud, 1e-6)), seconds: last };
  };

  const out = [];
  for (const name of cues.CUE_NAMES as string[]) {
    const ctx = new OfflineAudioContext(2, rate * 4, rate);
    const bus = ctx.createGain();
    bus.gain.value = 0.8;
    bus.connect(ctx.destination);
    synth.playCue({ ctx, dest: bus, noise: synth.makeNoise(ctx) }, { name, pan: 0.3 }, 0.05);
    out.push(measure(name, await ctx.startRendering()));
  }
  const bar = music.BEATS_PER_BAR * music.SECONDS_PER_BEAT;
  for (const level of [0, 1, 2]) {
    const ctx = new OfflineAudioContext(2, Math.ceil(rate * (bar * 8 + 3)), rate);
    const bus = ctx.createGain();
    bus.gain.value = 0.25; // the default music volume (0.5) at half, as in engine.ts
    bus.connect(ctx.destination);
    const o = { ctx, dest: bus, noise: synth.makeNoise(ctx) };
    for (let b = 0; b < 8; b++) for (const n of music.barNotes(b, level)) synth.playNote(o, n, 0.05 + b * bar + n.beat * music.SECONDS_PER_BEAT);
    out.push(measure(`music level ${level}`, await ctx.startRendering()));
  }
  return out;
});
await browser.close();

const effects = levels.filter((l) => !l.name.startsWith('music'));
const sorted = effects.map((l) => l.loud).sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)]!;
let problems = 0;
console.log(`effects: median loudest 50 ms ${median.toFixed(1)} dBFS\n`);
for (const l of levels) {
  const notes: string[] = [];
  if (l.peak < 0.003) notes.push('SILENT');
  if (l.peak > 0.95) notes.push('CLIPS');
  if (!l.name.startsWith('music') && l.loud > median + 9) notes.push('much louder than the rest');
  if (!l.name.startsWith('music') && l.loud < median - 12) notes.push('much quieter than the rest');
  if (notes.length) problems++;
  console.log(`${l.name.padEnd(16)} peak ${l.peak.toFixed(3)}  loud ${l.loud.toFixed(1).padStart(6)} dB  ${l.seconds.toFixed(2)} s  ${notes.join(', ')}`);
}
if (problems) process.exitCode = 1;
