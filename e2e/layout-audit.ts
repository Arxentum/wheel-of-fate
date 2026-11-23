/**
 * Layout audit: drives the app into its main states at several laptop and tablet sizes,
 * in both languages, saves a screenshot of each and lists content that is cut off
 * (an overflow:hidden box whose content is taller or wider than the box) or that sticks
 * out of the window. Needs the dev server.
 *
 *   npx tsx e2e/layout-audit.ts [outDir = test-results/layout] [sizes e.g. 1280x720,1180x820] [url]
 */
import { mkdirSync } from 'node:fs';
import { chromium, type Browser, type Page } from '@playwright/test';
import { translate, type Lang, type MessageKey, type Params } from '../src/i18n';

const outDir = process.argv[2] ?? 'test-results/layout';
const SIZES = (process.argv[3] ?? '1280x720,1366x768,1440x900,1920x1080,1024x768,1180x820,1366x1024')
  .split(',')
  .map((s) => s.split('x').map(Number) as [number, number]);
const base = process.argv[4] ?? 'http://localhost:5173/';
mkdirSync(outDir, { recursive: true });

interface Finding {
  where: string;
  kind: 'cut' | 'outside' | 'pageScroll';
  detail: string;
}
const findings: Finding[] = [];

/** Boxes that hide part of their content, and parts outside the window. */
async function audit(page: Page, where: string, allowPageScroll: boolean): Promise<void> {
  const res = await page.evaluate(() => {
    const out: { kind: 'cut' | 'outside'; detail: string }[] = [];
    const name = (el: Element) => {
      const cls = (el.getAttribute('class') ?? '').split(' ')[0]!.replace(/^_|_[a-z0-9]{5,}$/gi, '');
      const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 30);
      return `${el.tagName.toLowerCase()}.${cls} “${label}”`;
    };
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const hiddenY = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
      const hiddenX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      // Card illustrations are cropped on purpose; their img boxes are not text.
      if (el.tagName === 'IMG' || el.closest('svg')) continue;
      // Text cut on purpose with a control that shows all of it.
      if (el.getAttribute('aria-expanded') === 'false') continue;
      const dy = el.scrollHeight - el.clientHeight;
      const dx = el.scrollWidth - el.clientWidth;
      if ((hiddenY && dy > 2) || (hiddenX && dx > 2 && cs.textOverflow !== 'ellipsis')) {
        out.push({ kind: 'cut', detail: `${name(el)} hides ${hiddenY && dy > 2 ? `${dy}px below` : ''}${hiddenX && dx > 2 ? ` ${dx}px right` : ''}` });
      }
      if (r.right > innerWidth + 1 && !el.closest('[class*="handCards"]')) out.push({ kind: 'outside', detail: `${name(el)} ends at x=${Math.round(r.right)}` });
    }
    return { out, scroll: document.documentElement.scrollHeight > innerHeight + 1, scrollX: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  // Report each box once per state.
  const seen = new Set<string>();
  for (const f of res.out) {
    if (seen.has(f.detail)) continue;
    seen.add(f.detail);
    findings.push({ where, ...f });
  }
  if (res.scrollX) findings.push({ where, kind: 'pageScroll', detail: 'page scrolls sideways' });
  if (res.scroll && !allowPageScroll) findings.push({ where, kind: 'pageScroll', detail: 'page scrolls down' });
}

async function shoot(page: Page, where: string, allowPageScroll = false): Promise<void> {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${outDir}/${where}.png` });
  await audit(page, where, allowPageScroll);
}

async function openPage(browser: Browser, lang: Lang, w: number, h: number, seats: Record<string, string>, hash = '#/', query = ''): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  // tsx keeps function names with a __name helper that the page does not have.
  await page.addInitScript({ content: 'window.__name = (f) => f;' });
  await page.addInitScript(
    ([l, s]) => {
      localStorage.setItem('wof.lang', l as string);
      localStorage.setItem('wof.setup', JSON.stringify({ seats: s, laps: 3 }));
    },
    [lang, seats] as const,
  );
  page.on('pageerror', (e) => findings.push({ where: `${lang} ${w}x${h}`, kind: 'outside', detail: `page error: ${e.message}` }));
  await page.goto(`${base}${query}${hash}`);
  await page.waitForTimeout(700);
  return page;
}

async function startGame(page: Page, t: (k: MessageKey, p?: Params) => string, seed: string): Promise<void> {
  await page.getByText(t('setup.advanced')).click();
  await page.getByPlaceholder(t('setup.seedPlaceholder')).fill(seed);
  await page.getByRole('button', { name: t('setup.start') }).click();
}

const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of SIZES) {
  for (const lang of ['en', 'zh-Hant'] as const) {
    const t = (k: MessageKey, p?: Params) => translate(lang, k, p);
    const tag = `${w}x${h}-${lang === 'en' ? 'en' : 'zh'}`;
    console.log(tag);

    // Setup, then a 4-player game with a human (a long character text: the High Priestess).
    let page = await openPage(browser, lang, w, h, { fire: 'human', earth: 'computer', air: 'computer', water: 'computer' }, '#/', '?character=highPriestess.upright');
    await shoot(page, `${tag}-01-setup`, true);
    await startGame(page, t, 'audit-1');
    const meditate = page.getByRole('button', { name: t('decide.meditate'), exact: true });
    await meditate.waitFor({ timeout: 20000 });
    await shoot(page, `${tag}-02-choose`);
    // Open the first card in the hand that can be played.
    const card = page.locator(`section[aria-label="${t('game.hand')}"] button:not([disabled])`).first();
    if (await card.count()) {
      await card.click();
      await shoot(page, `${tag}-03-inspect`);
      await page.keyboard.press('Escape');
    }
    await meditate.click();
    const keep = page.getByRole('button', { name: new RegExp(`^${t('decide.keep', { side: '.*' })}`) });
    await keep.waitFor({ timeout: 20000 });
    await shoot(page, `${tag}-04-flip`);
    await keep.click();
    await page.getByRole('button', { name: new RegExp(`^${t('decide.move', { n: 1 }).replace(/1.*/, '')}`) }).first().waitFor({ timeout: 20000 });
    await shoot(page, `${tag}-05-move`);
    await page.getByRole('button', { name: t('game.rules'), exact: true }).click();
    await shoot(page, `${tag}-06-rules-window`);
    await page.close();

    // Hot seat: two humans.
    page = await openPage(browser, lang, w, h, { fire: 'human', earth: 'human', air: 'off', water: 'off' });
    await startGame(page, t, 'audit-2');
    await page.getByRole('button', { name: t('handoff.ready', { player: t('player.fire') }) }).click();
    await page.getByRole('button', { name: t('decide.meditate'), exact: true }).click();
    await page.getByRole('button', { name: new RegExp(`^${t('decide.keep', { side: '.*' })}`) }).click();
    await page.getByRole('button', { name: new RegExp(`^${t('decide.move', { n: 1 }).replace(/1.*/, '')}`) }).first().click();
    await page.getByRole('button', { name: t('handoff.ready', { player: t('player.earth') }) }).waitFor({ timeout: 20000 });
    await shoot(page, `${tag}-07-handoff`);
    await page.close();

    // All computers, skipped to the end.
    page = await openPage(browser, lang, w, h, { fire: 'computer', earth: 'computer', air: 'computer', water: 'computer' });
    await startGame(page, t, 'audit-3');
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: t('game.skip') }).click();
    await page.getByRole('button', { name: t('over.again') }).waitFor({ timeout: 30000 });
    await shoot(page, `${tag}-08-over`);
    await page.close();

    // The two reference pages (they scroll by design).
    page = await openPage(browser, lang, w, h, {}, '#/rules');
    await shoot(page, `${tag}-09-rules`, true);
    await page.close();
    page = await openPage(browser, lang, w, h, {}, '#/cards');
    await shoot(page, `${tag}-10-cards`, true);
    await page.close();
  }
}
await browser.close();

const byKind = new Map<string, Finding[]>();
for (const f of findings) {
  const key = `${f.kind}: ${f.detail}`;
  byKind.set(key, [...(byKind.get(key) ?? []), f]);
}
console.log(`\n${findings.length} findings, ${byKind.size} distinct`);
for (const [key, list] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`- ${key}\n    in ${list.map((f) => f.where).slice(0, 6).join(', ')}${list.length > 6 ? ` … (${list.length})` : ''}`);
}
