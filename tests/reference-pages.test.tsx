import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { defaultBalance } from '../src/engine';
import { LANGS, type Lang } from '../src/i18n';
import { LangProvider } from '../src/ui/hooks/useLang';
import { GalleryContent } from '../src/ui/screens/gallery/Gallery';
import { RulesContent } from '../src/ui/screens/rules/HowToPlay';

/** Visible text of a rendered page (tags and attributes removed). */
function text(lang: Lang, node: React.ReactNode): string {
  const html = renderToStaticMarkup(<LangProvider initial={lang}>{node}</LangProvider>);
  return html.replace(/<[^>]*>/g, ' ');
}

/** Dictionary keys or unfilled placeholders that leaked into the page. */
function leaks(s: string): string[] {
  return [...s.matchAll(/\{[a-zA-Z]+[^}]*\}|\b(?:rules|gallery|nav|game|status|card|face|sign|element|step|trap)\.[a-zA-Z]+(?:\.[a-zA-Z]+)*/g)].map((m) => m[0]);
}

describe('How to Play and the Card Gallery', () => {
  const b = defaultBalance();

  it.each(LANGS.flatMap((lang) => [2, 3, 4].map((n) => [lang, n] as const)))('rules page in %s for %i players has every text filled in', (lang, n) => {
    const s = text(lang, <RulesContent balance={b} laps={3} players={n} onOpenCards={() => {}} />);
    expect(leaks(s)).toEqual([]);
    expect(s.length).toBeGreaterThan(3000);
  });

  it.each(LANGS.flatMap((lang) => [2, 3, 4].map((n) => [lang, n] as const)))('gallery in %s for %i players shows all 30 cards with their texts', (lang, n) => {
    const html = renderToStaticMarkup(
      <LangProvider initial={lang}>
        <GalleryContent balance={b} fixedPlayers={n} />
      </LangProvider>,
    );
    expect(html.match(/data-card="/g)?.length).toBe(30 * 2); // tile button + card
    expect(leaks(html.replace(/<[^>]*>/g, ' '))).toEqual([]);
  });

  it('uses the game numbers (3 laps, Chain Trap 3 FP, leader +2)', () => {
    const en = text('en', <RulesContent balance={b} laps={2} players={3} onOpenCards={() => {}} />);
    expect(en).toContain('completes 2 laps');
    expect(en).toContain('loses 3 Fate Points (the leader: 5)');
    expect(en).toContain('usually 2 more');
    const zh = text('zh-Hant', <RulesContent balance={b} laps={3} players={3} onOpenCards={() => {}} />);
    expect(zh).toContain('跑完 3 圈');
    expect(zh).toContain('失去 3 命運點（領先者 5）');
  });
});
