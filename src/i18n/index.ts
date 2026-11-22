import en from './en.json';
import zhHant from './zh-Hant.json';

export type Lang = 'en' | 'zh-Hant';
export const LANGS: readonly Lang[] = ['en', 'zh-Hant'];
export const DEFAULT_LANG: Lang = 'en';

/** Every UI string has a key in en.json; zh-Hant.json must have the same keys (tests/i18n.test.ts). */
export type MessageKey = keyof typeof en;
export type Params = Record<string, string | number>;

export const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = {
  en,
  'zh-Hant': zhHant as Record<MessageKey, string>,
};

/** `{name}` placeholders in a message. */
export function placeholders(message: string): string[] {
  return [...message.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
}

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
  const message = DICTIONARIES[lang][key] ?? DICTIONARIES.en[key] ?? key;
  if (!params) return message;
  return message.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
