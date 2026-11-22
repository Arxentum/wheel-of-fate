import { LANGS } from '../../i18n';
import { useLang } from '../hooks/useLang';
import styles from './LangSwitch.module.css';

/** Two-way language toggle; each option is labelled in its own language. */
export function LangSwitch() {
  const { lang, setLang, t } = useLang();
  return (
    <div className={styles.switch} role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          className={l === lang ? `${styles.option} ${styles.on}` : styles.option}
          aria-pressed={l === lang}
          onClick={() => setLang(l)}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
