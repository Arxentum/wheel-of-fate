import { ELEMENTS, SIGNS, elementOfSign } from '../../engine/data/board';
import { COURTS, MAJORS, SUITS } from '../../engine/data/cards';
import { ELEMENT_COLOR } from '../art/colors';
import { ZODIAC_PATHS } from '../art/glyphs';
import { Board, type BoardPiece, type BoardTrap } from '../components/Board';
import { CardArt, type CardArtId } from '../components/CardArt';
import { ElementIcon } from '../components/ElementIcon';
import { LangSwitch } from '../components/LangSwitch';
import { Piece } from '../components/Piece';
import { useLang } from '../hooks/useLang';
import styles from './AssetPreview.module.css';

const SAMPLE_PIECES: BoardPiece[] = [
  { id: 0, element: 'fire', sign: 0 },
  { id: 1, element: 'earth', sign: 2 },
  { id: 3, element: 'water', sign: 2 },
  { id: 2, element: 'air', sign: 4 },
];
const SAMPLE_TRAPS: BoardTrap[] = [
  { sign: 5, kind: 'chain', owner: 'water' },
  { sign: 7, kind: 'illusion', owner: 'fire' },
];

/** Milestone 2 review page: board, element icons, pieces and every card illustration. */
export function AssetPreview() {
  const { t } = useLang();
  const fate: CardArtId[] = [...SUITS, ...COURTS, 'back'];
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.dots} aria-hidden="true">
            <i style={{ background: 'var(--fire)' }} />
            <i style={{ background: 'var(--earth)' }} />
            <i style={{ background: 'var(--water)' }} />
          </span>
          <div>
            <h1 className={styles.title}>{t('app.title')}</h1>
            <p className={styles.tagline}>{t('app.tagline')}</p>
          </div>
        </div>
        <LangSwitch />
      </header>

      <p className={styles.note}>
        <span className={styles.tag}>{t('preview.title')}</span> {t('preview.note')}
      </p>

      <section className={styles.boardSection}>
        <SectionTitle n="01" title={t('preview.board')} />
        <div className={styles.boardWrap}>
          <Board pieces={SAMPLE_PIECES} traps={SAMPLE_TRAPS} activeId={2} selectable={[6, 7, 8]} onSelectSign={() => {}} />
        </div>
        <p className={styles.caption}>{t('preview.boardNote')}</p>
      </section>

      <section>
        <SectionTitle n="02" title={t('preview.elements')} />
        <ul className={styles.elements}>
          {ELEMENTS.map((el) => (
            <li key={el} className={styles.element}>
              <span className={styles.swatch} style={{ background: ELEMENT_COLOR[el] }} />
              <ElementIcon element={el} size={56} title={t(`element.${el}`)} />
              <Piece element={el} size={56} title={t('piece.label', { element: t(`element.${el}`) })} />
              <Piece element={el} size={56} active />
              <span className={styles.elementName}>{t(`element.${el}`)}</span>
            </li>
          ))}
        </ul>
        <h3 className={styles.subhead}>{t('preview.signs')}</h3>
        <ul className={styles.signs}>
          {SIGNS.map((id) => (
            <li key={id} className={styles.signTile}>
              <svg viewBox="-10 -10 120 120" width={64} height={64} aria-hidden="true">
                <path d={ZODIAC_PATHS[id]} fill="none" stroke={ELEMENT_COLOR[elementOfSign(SIGNS.indexOf(id))]} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t(`sign.${id}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle n="03" title={t('preview.cards')} />
        <p className={styles.caption}>{t('preview.cardsNote')}</p>
        <h3 className={styles.subhead}>{t('preview.majors')}</h3>
        <ul className={styles.cards}>
          {MAJORS.map((id, i) => (
            <CardTile key={id} id={id} label={t(`card.${id}`)} number={i} />
          ))}
        </ul>
        <h3 className={styles.subhead}>{t('preview.fate')}</h3>
        <ul className={styles.cards}>
          {fate.map((id) => (
            <CardTile key={id} id={id} label={t(`card.${id}`)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <h2 className={styles.sectionTitle}>
      <span className={styles.number}>{n}</span>
      {title}
    </h2>
  );
}

function CardTile({ id, label, number }: { id: CardArtId; label: string; number?: number }) {
  return (
    <li className={styles.card}>
      <div className={id === 'back' ? `${styles.art} ${styles.back}` : styles.art}>
        <CardArt id={id} alt={label} />
      </div>
      <div className={styles.cardName}>
        {number !== undefined && <span className={styles.cardNumber}>{number}</span>}
        {label}
      </div>
    </li>
  );
}
