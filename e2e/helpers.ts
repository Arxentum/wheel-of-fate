import { mkdirSync, readFileSync } from 'node:fs';
import type { Locator, Page } from '@playwright/test';
import type { MessageKey } from '../src/i18n';
import { format, type Lang, type Params } from '../src/i18n/format';

// The dictionaries are read as files: Playwright's loader cannot import JSON modules.
const DICTS = Object.fromEntries(
  (['en', 'zh-Hant'] as const).map((l) => [l, JSON.parse(readFileSync(new URL(`../src/i18n/${l}.json`, import.meta.url), 'utf8')) as Record<string, string>]),
) as Record<Lang, Record<string, string>>;

export interface Tr {
  (key: MessageKey, params?: Params): string;
  /** The message with its placeholders unfilled. */
  raw: (key: MessageKey) => string;
}

export function tr(lang: Lang): Tr {
  const raw = (key: MessageKey) => DICTS[lang][key] ?? key;
  return Object.assign((key: MessageKey, params?: Params) => format(raw(key), params), { raw });
}

const PLACEHOLDER = /\{\w+(?:\|[^|}]*\|[^|}]*)?\}/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A dictionary text as a pattern from its start, every placeholder (with its plural
 * words) a wildcard: "Move {n|space|spaces}" matches "Move 1 space" and "Move 3 spaces".
 */
export function pattern(t: Tr, key: MessageKey): RegExp {
  return new RegExp(`^${t.raw(key).split(PLACEHOLDER).map(escapeRe).join('.*')}`);
}

const SHOTS = 'docs/m5/screenshots';

/** JPEG screenshot for the report. */
export async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}.jpg`, type: 'jpeg', quality: 82 });
}

/** Collects console errors and page errors; the test checks the list is empty at the end. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export interface OpenOptions {
  lang: Lang;
  seats?: Record<'fire' | 'earth' | 'air' | 'water', 'human' | 'ai' | 'off'>;
  hash?: string;
  query?: string;
}

/** Opens the site with a language and the seats of the start screen already chosen. */
export async function openApp(page: Page, { lang, seats, hash = '#/', query = '' }: OpenOptions): Promise<void> {
  await page.addInitScript(
    ([l, s]) => {
      // Only on the first load, so a language switch survives a reload.
      if (!sessionStorage.getItem('e2e')) {
        sessionStorage.setItem('e2e', '1');
        localStorage.setItem('wof.lang', l as string);
        if (s) localStorage.setItem('wof.setup', JSON.stringify({ seats: s, laps: 3 }));
      }
    },
    [lang, seats ?? null] as const,
  );
  await page.goto(`./${query}${hash}`);
}

/** Starts a game from the start screen with a fixed seed. */
export async function startGame(page: Page, t: Tr, seed: string): Promise<void> {
  await page.getByText(t('setup.advanced')).click();
  await page.getByPlaceholder(t('setup.seedPlaceholder')).fill(seed);
  await page.getByRole('button', { name: t('setup.start') }).click();
}

/** The buttons a human needs to get through a turn without playing a card. */
export function turnButtons(page: Page, t: Tr) {
  const b = (name: string | RegExp, exact = false): Locator => page.getByRole('button', { name, exact }).first();
  return {
    handoff: b(pattern(t, 'handoff.ready')),
    meditate: b(t('decide.meditate'), true),
    useSkill: b(t('decide.useSkill'), true),
    keep: b(pattern(t, 'decide.keep')),
    move: b(pattern(t, 'decide.move')),
    discard: b(t('decide.discard'), true),
  };
}

/** Whether a button is on screen and can be pressed now. */
export async function ready(l: Locator): Promise<boolean> {
  return (await l.isVisible()) && (await l.isEnabled());
}

/** The round shown in the top bar. */
export async function roundNumber(page: Page, t: Tr): Promise<number> {
  const text = await page.getByText(pattern(t, 'game.round')).first().innerText();
  return Number(text.match(/\d+/)?.[0] ?? 0);
}
