/**
 * M2: crop the illustration out of each finished card (../卡牌成品/*.png, read only)
 * and write WebP files to public/cards/{1x,2x}/<id>.webp.
 *
 * Only the middle illustration is kept (decision D-43). The text areas, the name
 * plate, the dotted border and the triangle icons are redrawn in code.
 *
 * Per card the script finds:
 *  - the black rule under the reversed text (top of the illustration),
 *  - the top line of the name plate (bottom of the illustration),
 *  - the dotted side borders (measured in the upright text area, where no art is).
 * Every card is then cut to the same size, centred in its own box, so all faces
 * share one aspect ratio. The card back keeps its own crop (the star and a margin).
 *
 * Also writes docs/m2/crop-check.jpg (originals with the crop drawn in) and
 * docs/m2/crop-results.jpg (the 1x output), plus public/cards/manifest.json.
 *
 * Run: npm run cards
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(ROOT, '..', '卡牌成品');
const OUT = join(ROOT, 'public', 'cards');
const DOCS = join(ROOT, 'docs', 'm2');

/** Source file name (without .png) → card id used by the engine and the UI. */
const FILES: Record<string, string> = {
  愚者: 'fool', 魔术师: 'magician', 女祭司: 'highPriestess', 皇后: 'empress', 皇帝: 'emperor',
  教皇: 'hierophant', 恋人: 'lovers', 战车: 'chariot', 力量: 'strength', 隐士: 'hermit',
  命运之轮: 'wheelOfFortune', 正义: 'justice', 倒吊人: 'hangedMan', 死神: 'death',
  节制: 'temperance', 恶魔: 'devil', 高塔: 'tower', 星星: 'star', 月亮: 'moon', 太阳: 'sun',
  审判: 'judgement', 世界: 'world',
  权杖: 'wands', 星币: 'pentacles', 宝剑: 'swords', 圣杯: 'cups',
  侍从: 'page', 骑士: 'knight', 王后: 'queen', 国王: 'king',
  背面: 'back',
};

/** Pixels kept clear of a detected line. */
const GAP = 3;
/** Luminance below this counts as ink. */
const DARK = 110;
const WIDTH_1X = 390;
const QUALITY = 84;

interface Gray {
  data: Uint8Array;
  width: number;
  height: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Detected {
  file: string;
  id: string;
  width: number;
  height: number;
  /** Area between the detected lines, already inset by GAP. */
  inner: Box;
}

async function loadGray(path: string): Promise<Gray> {
  const { data, info } = await sharp(path)
    .flatten({ background: '#ffffff' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

function darkShareOfRow(g: Gray, y: number, x0: number, x1: number): number {
  let n = 0;
  for (let x = x0; x < x1; x++) if (g.data[y * g.width + x]! < DARK) n++;
  return n / (x1 - x0);
}

function darkShareOfColumn(g: Gray, x: number, y0: number, y1: number): number {
  let n = 0;
  for (let y = y0; y < y1; y++) if (g.data[y * g.width + x]! < DARK) n++;
  return n / (y1 - y0);
}

/** Rows in [y0, y1) whose middle part is all ink: the solid horizontal rules (dark art, e.g. the Star's night sky, stays below 0.97). */
function solidRows(g: Gray, y0: number, y1: number): number[] {
  const x0 = Math.round(g.width * 0.06);
  const x1 = Math.round(g.width * 0.94);
  const rows: number[] = [];
  for (let y = y0; y < y1; y++) if (darkShareOfRow(g, y, x0, x1) > 0.97) rows.push(y);
  return rows;
}

/** Columns in [x0, x1) that look like the dotted border inside the upright text area. */
function borderColumns(g: Gray, x0: number, x1: number): number[] {
  const y0 = Math.round(g.height * 0.905);
  const y1 = Math.round(g.height * 0.965);
  const cols: number[] = [];
  for (let x = x0; x < x1; x++) if (darkShareOfColumn(g, x, y0, y1) > 0.2) cols.push(x);
  return cols;
}

function detectFace(file: string, id: string, g: Gray): Detected {
  const top = solidRows(g, Math.round(g.height * 0.07), Math.round(g.height * 0.14));
  const bottom = solidRows(g, Math.round(g.height * 0.78), Math.round(g.height * 0.86));
  const left = borderColumns(g, 0, Math.round(g.width * 0.07));
  const right = borderColumns(g, Math.round(g.width * 0.93), g.width);
  if (!top.length || !bottom.length || !left.length || !right.length) {
    throw new Error(`${file}: lines not found (top ${top.length}, bottom ${bottom.length}, left ${left.length}, right ${right.length})`);
  }
  const x0 = Math.max(...left) + 1 + GAP;
  const x1 = Math.min(...right) - GAP;
  const y0 = Math.max(...top) + 1 + GAP;
  const y1 = Math.min(...bottom) - GAP;
  return { file, id, width: g.width, height: g.height, inner: { left: x0, top: y0, width: x1 - x0, height: y1 - y0 } };
}

/** The back has no text areas: keep the bounding box of the art inside the rounded border. */
function detectBack(file: string, g: Gray): Detected {
  const inset = Math.round(g.width * 0.04);
  // The rounded corners of the border reach inside the inset; the art never goes there.
  const corner = Math.round(g.width * 0.12);
  let x0 = g.width;
  let y0 = g.height;
  let x1 = 0;
  let y1 = 0;
  for (let y = inset; y < g.height - inset; y++) {
    for (let x = inset; x < g.width - inset; x++) {
      const inCorner = (x < corner || x >= g.width - corner) && (y < corner || y >= g.height - corner);
      if (!inCorner && g.data[y * g.width + x]! < 235) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const pad = 24;
  const left = Math.max(inset, x0 - pad);
  const top = Math.max(inset, y0 - pad);
  return {
    file,
    id: 'back',
    width: g.width,
    height: g.height,
    inner: { left, top, width: Math.min(g.width - inset, x1 + pad) - left, height: Math.min(g.height - inset, y1 + pad) - top },
  };
}

/** A W×H box centred in `inner`. */
function centred(inner: Box, w: number, h: number): Box {
  return {
    left: inner.left + Math.floor((inner.width - w) / 2),
    top: inner.top + Math.floor((inner.height - h) / 2),
    width: w,
    height: h,
  };
}

async function writeWebp(src: string, box: Box, id: string): Promise<{ w2: number; h2: number; w1: number; h1: number }> {
  const base = sharp(src).flatten({ background: '#ffffff' }).extract(box);
  await base.clone().webp({ quality: QUALITY }).toFile(join(OUT, '2x', `${id}.webp`));
  const h1 = Math.round((box.height * WIDTH_1X) / box.width);
  await base.clone().resize(WIDTH_1X, h1).webp({ quality: QUALITY }).toFile(join(OUT, '1x', `${id}.webp`));
  return { w2: box.width, h2: box.height, w1: WIDTH_1X, h1 };
}

async function contactSheet(tiles: { input: Buffer; w: number; h: number }[], cols: number, out: string): Promise<void> {
  const cellW = Math.max(...tiles.map((t) => t.w)) + 16;
  const cellH = Math.max(...tiles.map((t) => t.h)) + 16;
  const rows = Math.ceil(tiles.length / cols);
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: '#FAF6F2' } })
    .composite(tiles.map((t, i) => ({ input: t.input, left: (i % cols) * cellW + 8, top: Math.floor(i / cols) * cellH + 8 })))
    .jpeg({ quality: 82 })
    .toFile(out);
}

async function main(): Promise<void> {
  for (const dir of [join(OUT, '1x'), join(OUT, '2x'), DOCS]) mkdirSync(dir, { recursive: true });
  const present = new Set(readdirSync(SOURCE).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
  const missing = Object.keys(FILES).filter((f) => !present.has(f));
  if (missing.length) throw new Error(`missing source files: ${missing.join(', ')}`);

  const faces: Detected[] = [];
  let back: Detected | undefined;
  for (const [file, id] of Object.entries(FILES)) {
    const g = await loadGray(join(SOURCE, `${file}.png`));
    if (id === 'back') back = detectBack(file, g);
    else faces.push(detectFace(file, id, g));
  }
  if (!back) throw new Error('no back');

  // One size for every face: the smallest detected area, so no card shows a line.
  const w = Math.min(...faces.map((f) => f.inner.width));
  const h = Math.min(...faces.map((f) => f.inner.height));

  const manifest: Record<string, unknown> = {};
  const checks: { input: Buffer; w: number; h: number }[] = [];
  const results: { input: Buffer; w: number; h: number }[] = [];
  const scale = 0.25;
  for (const d of [...faces, back]) {
    const box = d.id === 'back' ? d.inner : centred(d.inner, w, h);
    const src = join(SOURCE, `${d.file}.png`);
    const size = await writeWebp(src, box, d.id);
    manifest[d.id] = { source: `${d.file}.png`, sourceSize: [d.width, d.height], crop: box, '2x': [size.w2, size.h2], '1x': [size.w1, size.h1] };

    const sw = Math.round(d.width * scale);
    const sh = Math.round(d.height * scale);
    const rect = `<rect x="${box.left * scale}" y="${box.top * scale}" width="${box.width * scale}" height="${box.height * scale}" fill="none" stroke="#D14135" stroke-width="2"/>`;
    const label = `<text x="4" y="${sh - 4}" font-family="Arial" font-size="13" fill="#111">${d.id}</text>`;
    const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}">${rect}${label}</svg>`);
    checks.push({
      input: await sharp(src).flatten({ background: '#ffffff' }).resize(sw, sh).composite([{ input: overlay }]).png().toBuffer(),
      w: sw,
      h: sh,
    });
    const tw = Math.round(size.w1 / 2);
    const th = Math.round(size.h1 / 2);
    results.push({ input: await sharp(join(OUT, '1x', `${d.id}.webp`)).resize(tw, th).png().toBuffer(), w: tw, h: th });
  }
  writeFileSync(join(OUT, 'manifest.json'), `${JSON.stringify({ faceSize2x: [w, h], cards: manifest }, null, 2)}\n`);
  await contactSheet(checks, 8, join(DOCS, 'crop-check.jpg'));
  await contactSheet(results, 8, join(DOCS, 'crop-results.jpg'));

  const lefts = faces.map((f) => f.inner.left);
  const tops = faces.map((f) => f.inner.top);
  console.log(`faces: ${faces.length}, size 2x ${w}×${h} (aspect ${(w / h).toFixed(3)}), 1x ${WIDTH_1X}×${Math.round((h * WIDTH_1X) / w)}`);
  console.log(`inner left ${Math.min(...lefts)}–${Math.max(...lefts)}, top ${Math.min(...tops)}–${Math.max(...tops)}`);
  console.log(`widths ${Math.min(...faces.map((f) => f.inner.width))}–${Math.max(...faces.map((f) => f.inner.width))}, heights ${Math.min(...faces.map((f) => f.inner.height))}–${Math.max(...faces.map((f) => f.inner.height))}`);
  console.log(`back crop ${JSON.stringify(back.inner)}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
