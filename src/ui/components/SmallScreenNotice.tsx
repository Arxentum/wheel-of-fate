import { useEffect, useState } from 'react';
import { useLang } from '../hooks/useLang';
import { Button } from './controls';
import styles from './SmallScreenNotice.module.css';

/** Phones and tablets held upright: the table needs a laptop or a tablet held sideways. */
const QUERY = '(max-width: 999px), (max-height: 599px)';
const KEY = 'wof.smallScreenOk';

function dismissed(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** A notice over the page on small screens; it can be dismissed for this visit. */
export function SmallScreenNotice() {
  const { t } = useLang();
  const [small, setSmall] = useState(() => window.matchMedia(QUERY).matches);
  const [ok, setOk] = useState(dismissed);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setSmall(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  if (!small || ok) return null;
  const go = () => {
    setOk(true);
    try {
      window.sessionStorage.setItem(KEY, '1');
    } catch {
      // Shown again next time; nothing else depends on it.
    }
  };
  return (
    <div className={styles.cover} role="dialog" aria-modal="true" aria-labelledby="small-title">
      <div className={styles.box}>
        <svg className={styles.icon} viewBox="0 0 80 60" aria-hidden="true">
          <rect x="4" y="12" width="56" height="36" rx="5" fill="none" stroke="currentColor" strokeWidth="5" />
          <path d="M66 14 A20 20 0 0 1 70 40" fill="none" stroke="var(--fire)" strokeWidth="5" />
          <path d="M64 36 L70 44 L76 35" fill="none" stroke="var(--fire)" strokeWidth="5" strokeLinejoin="round" />
        </svg>
        <h2 id="small-title">{t('small.title')}</h2>
        <p>{t('small.text')}</p>
        <Button variant="primary" onClick={go}>
          {t('small.continue')}
        </Button>
      </div>
    </div>
  );
}
