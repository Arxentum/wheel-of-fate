/** Languages and placeholder filling, without the dictionaries (usable where JSON cannot be imported). */

export type Lang = 'en' | 'zh-Hant';
export const LANGS: readonly Lang[] = ['en', 'zh-Hant'];
export const DEFAULT_LANG: Lang = 'en';

export type Params = Record<string, string | number>;

/**
 * Placeholders: `{name}` inserts a value; `{name|one|other}` inserts a number with the
 * singular or plural word ("1 space", "3 spaces"). Chinese messages only need `{name}`.
 */
const PLACEHOLDER = /\{(\w+)(?:\|([^|}]*)\|([^|}]*))?\}/g;

/** Names of the placeholders in a message, sorted, without duplicates. */
export function placeholders(message: string): string[] {
  return [...new Set([...message.matchAll(PLACEHOLDER)].map((m) => m[1]!))].sort();
}

export function format(message: string, params?: Params): string {
  if (!params) return message;
  return message.replace(PLACEHOLDER, (whole, name: string, one?: string, other?: string) => {
    if (!(name in params)) return whole;
    const value = params[name]!;
    if (one === undefined) return String(value);
    return `${value} ${Number(value) === 1 ? one : other}`;
  });
}

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
