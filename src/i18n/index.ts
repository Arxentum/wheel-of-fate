import en from './en.json';
import zhHant from './zh-Hant.json';
import { format, type Lang, type Params } from './format';

export { DEFAULT_LANG, LANGS, format, isLang, placeholders, type Lang, type Params } from './format';

/** Every UI string has a key in en.json; zh-Hant.json must have the same keys (tests/i18n.test.ts). */
export type MessageKey = keyof typeof en;

export const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = {
  en,
  'zh-Hant': zhHant as Record<MessageKey, string>,
};

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
  const message = DICTIONARIES[lang][key] ?? DICTIONARIES.en[key] ?? key;
  return format(message, params);
}
