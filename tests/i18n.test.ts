import { describe, expect, it } from 'vitest';
import { DICTIONARIES, LANGS, placeholders, translate } from '../src/i18n';
import { MAJORS, SUITS, COURTS } from '../src/engine/data/cards';
import { SIGNS, ELEMENTS } from '../src/engine/data/board';

describe('dictionaries', () => {
  const en = DICTIONARIES.en;
  const keys = Object.keys(en).sort();

  it.each(LANGS)('%s has exactly the English keys', (lang) => {
    expect(Object.keys(DICTIONARIES[lang]).sort()).toEqual(keys);
  });

  it.each(LANGS)('%s has no empty messages', (lang) => {
    const empty = Object.entries(DICTIONARIES[lang]).filter(([, v]) => !v.trim());
    expect(empty).toEqual([]);
  });

  it.each(LANGS)('%s uses the same placeholders as English', (lang) => {
    const wrong = keys.filter(
      (k) => placeholders(DICTIONARIES[lang][k as keyof typeof en]).join() !== placeholders(en[k as keyof typeof en]).join(),
    );
    expect(wrong).toEqual([]);
  });

  it('names every sign, element and card the engine knows', () => {
    const needed = [
      ...SIGNS.map((s) => `sign.${s}`),
      ...ELEMENTS.map((e) => `element.${e}`),
      ...[...MAJORS, ...SUITS, ...COURTS].map((c) => `card.${c}`),
    ];
    expect(needed.filter((k) => !(k in en))).toEqual([]);
  });

  it('fills placeholders', () => {
    expect(translate('en', 'board.signLabel', { sign: 'Aries', element: 'Fire' })).toBe('Aries, Fire');
    expect(translate('zh-Hant', 'piece.label', { element: '火象' })).toBe('火象棋子');
  });
});
