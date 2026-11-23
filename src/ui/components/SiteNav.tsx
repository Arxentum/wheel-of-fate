import { useLang } from '../hooks/useLang';
import { LangSwitch } from './LangSwitch';
import styles from './SiteNav.module.css';

export type Page = 'play' | 'rules' | 'cards';

export const PAGE_HASH: Record<Page, string> = { play: '#/', rules: '#/rules', cards: '#/cards' };

/** Top bar of the pages outside a game: the title, the three pages, the language. */
export function SiteNav({ page }: { page: Page }) {
  const { t } = useLang();
  const links: [Page, string][] = [
    ['play', t('nav.play')],
    ['rules', t('nav.rules')],
    ['cards', t('nav.cards')],
  ];
  return (
    <header className={styles.bar}>
      <a className={styles.brand} href={PAGE_HASH.play}>
        <span className={styles.dots} aria-hidden="true">
          <i style={{ background: 'var(--fire)' }} />
          <i style={{ background: 'var(--earth)' }} />
          <i style={{ background: 'var(--water)' }} />
        </span>
        <span className={styles.name}>{t('app.title')}</span>
      </a>
      <nav className={styles.nav} aria-label={t('nav.label')}>
        {links.map(([p, label], i) => (
          <a key={p} href={PAGE_HASH[p]} className={p === page ? `${styles.link} ${styles.on}` : styles.link} aria-current={p === page ? 'page' : undefined}>
            <span className={styles.no}>{String(i + 1).padStart(2, '0')}</span>
            {label}
          </a>
        ))}
      </nav>
      <LangSwitch compact />
    </header>
  );
}
