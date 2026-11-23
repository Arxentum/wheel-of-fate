/**
 * Checks that every card's effect text fits its frame: the Card Gallery (the smallest
 * cards, 190 px wide) in both languages, for 3–4 and 2 players. Reports any text cut
 * off and the smallest font sizes used. Needs the dev server: npx tsx e2e/check-card-text.ts [url]
 */
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;
for (const lang of ['en', 'zh-Hant']) {
  for (const players of ['3', '2']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript((l) => localStorage.setItem('wof.lang', l), lang);
    await page.goto(`${base}#/cards`);
    await page.waitForSelector('[data-card]');
    if (players === '2') await page.getByRole('radio').filter({ hasText: lang === 'en' ? '2 players' : '兩人局' }).click();
    await page.waitForTimeout(500);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-card] div[style*="overflow"]')].map((el) => ({
        card: el.closest<HTMLElement>('[data-card]')!.dataset.card!,
        side: el.closest('[class*="top"]') ? 'reversed' : 'upright',
        size: parseFloat(el.style.fontSize),
        cut: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      })),
    );
    const cut = rows.filter((r) => r.cut);
    const smallest = [...rows].sort((a, b) => a.size - b.size).slice(0, 3);
    problems += cut.length;
    console.log(
      `${lang} · ${players === '3' ? '3–4' : '2'} players: ${rows.length} texts, ${cut.length} cut off` +
        (cut.length ? ` (${cut.map((r) => `${r.card}.${r.side}`).join(', ')})` : '') +
        `; smallest ${smallest.map((r) => `${r.card}.${r.side} ${r.size}px`).join(', ')}`,
    );
    await page.close();
  }
}
await browser.close();
if (problems) process.exitCode = 1;
