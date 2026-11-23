/**
 * Screenshot of a page of the running dev server (layout checks without the browser pane).
 * npx tsx e2e/screenshot.ts <url> <out.png> [en|zh-Hant] [full=1] [width] [height]
 * Uses the installed Chrome (no browser download).
 */
import { chromium } from '@playwright/test';

const [url, out, lang = 'en', full = '0', w = '1280', h = '720'] = process.argv.slice(2);
if (!url || !out) throw new Error('usage: screenshot.ts <url> <out.png> [lang] [full] [width] [height]');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.addInitScript((l) => localStorage.setItem('wof.lang', l), lang);
await page.goto(url);
await page.waitForTimeout(800);
if (full === '1') {
  // Scroll through once so lazy card images load.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
