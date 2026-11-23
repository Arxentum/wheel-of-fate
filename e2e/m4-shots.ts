/**
 * Screenshots for the M4 report (docs/m4/*.jpg): How to Play, the Card Gallery and the
 * Rules window over a game, in English and Traditional Chinese at 1280×720.
 * Needs the dev server: npx tsx e2e/m4-shots.ts [url]
 */
import { chromium, type Page } from '@playwright/test';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:5173/';
const out = 'docs/m4';
const browser = await chromium.launch({ channel: 'chrome' });

async function open(lang: string, hash: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript((l) => {
    localStorage.setItem('wof.lang', l);
    localStorage.setItem('wof.setup', JSON.stringify({ seats: { fire: 'human', earth: 'ai', air: 'ai', water: 'off' }, laps: 3 }));
  }, lang);
  await page.goto(base + hash);
  await page.waitForTimeout(900);
  return page;
}

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(500);
  await sharp(await page.screenshot()).jpeg({ quality: 82 }).toFile(`${out}/${name}.jpg`);
  console.log(`${out}/${name}.jpg`);
}

for (const lang of ['en', 'zh-Hant'] as const) {
  const tag = lang === 'en' ? 'en' : 'zh';
  let page = await open(lang, '#/rules');
  await shot(page, `rules-top-${tag}`);
  await page.locator('[data-section="turn"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('[data-section="turn"]')!.scrollIntoView());
  await shot(page, `rules-turn-${tag}`);
  await page.evaluate(() => document.querySelector('[data-section="sides"]')!.scrollIntoView());
  await shot(page, `rules-sides-${tag}`);
  await page.close();

  page = await open(lang, '#/cards');
  await shot(page, `cards-${tag}`);
  await page.locator('[data-card="highPriestess"]').first().click();
  await shot(page, `cards-detail-${tag}`);
  await page.close();

  page = await open(lang, '#/');
  await page.getByRole('button', { name: lang === 'en' ? 'Start game' : '開始遊戲' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: lang === 'en' ? 'Rules' : '規則', exact: true }).click();
  await shot(page, `game-rules-${tag}`);
  await page.close();
}
await browser.close();
