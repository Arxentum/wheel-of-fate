import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LANG, isLang, translate, type Lang, type MessageKey, type Params } from '../../i18n';

const STORAGE_KEY = 'wof.lang';

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, params?: Params) => string;
}

const LangContext = createContext<LangValue | null>(null);

function storedLang(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode); the default language is fine then.
  }
  return DEFAULT_LANG;
}

/** `initial` fixes the starting language (tests); otherwise the saved one or the default. */
export function LangProvider({ children, initial }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? storedLang());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, 'app.title');
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // See storedLang.
    }
  }, []);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: (key, params) => translate(lang, key, params) }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const value = useContext(LangContext);
  if (!value) throw new Error('useLang outside LangProvider');
  return value;
}
