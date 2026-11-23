import { COURT_REQUIRES, isCourt, isMajor, isSuit, SUIT_ELEMENT, type BalanceConfig, type CardId, type Orientation } from '../../engine';
import { ELEMENT_COLOR } from '../art/colors';
import { renderFace } from '../game/cardText';
import { useLang } from '../hooks/useLang';
import { translate } from '../../i18n';
import { CardArt } from './CardArt';
import { ElementIcon } from './ElementIcon';
import { FitText } from './FitText';
import styles from './Card.module.css';

interface CardProps {
  id: CardId;
  balance: BalanceConfig;
  players: number;
  /** Turn the whole card upside down (a reversed character, or previewing the reversed side). */
  turned?: boolean;
  /** Mark one side as the side in play (characters). */
  current?: Orientation;
  className?: string;
  eager?: boolean;
}

/** Small marker of a side: a solid triangle pointing up (upright) — the reversed band shows it upside down. */
function SideMark({ id, side }: { id: CardId; side: Orientation }) {
  if (isCourt(id)) {
    const [a, b] = COURT_REQUIRES[id][side];
    return (
      <span className={styles.fuel}>
        <ElementIcon element={a} size={15} color={ELEMENT_COLOR[a]} weight={14} />
        <ElementIcon element={b} size={15} color={ELEMENT_COLOR[b]} weight={14} />
      </span>
    );
  }
  return (
    <svg className={styles.mark} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3 L18 17 H2 Z" fill="var(--ink)" />
    </svg>
  );
}

/**
 * A full card, drawn like the printed one: the reversed effect upside down at the top, the
 * illustration, the name plate, the upright effect at the bottom. Texts follow the
 * current language and the game's numbers.
 */
export function Card({ id, balance, players, turned = false, current, className, eager }: CardProps) {
  const { lang, t } = useLang();
  const up = renderFace(lang, balance, players, `${id}.upright`);
  const down = renderFace(lang, balance, players, `${id}.reversed`);
  const suit = isSuit(id) ? SUIT_ELEMENT[id] : null;
  const band = (side: Orientation, face: { name: string; text: string }) => (
    <div
      className={[styles.band, side === 'reversed' ? styles.top : styles.bottom, current === side ? styles.current : current ? styles.idle : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.bandInner}>
        <SideMark id={id} side={side} />
        <FitText max={13.5} min={8.5} className={styles.text}>
          <span>
            <strong className={styles.faceName}>{face.name}</strong> {face.text}
          </span>
        </FitText>
      </div>
    </div>
  );
  return (
    <div
      className={[styles.card, turned ? styles.turned : '', className].filter(Boolean).join(' ')}
      data-card={id}
      aria-label={t(`card.${id}`)}
      role="img"
    >
      {band('reversed', down)}
      <div className={styles.art}>
        <CardArt id={id} alt="" eager={eager} />
        {isMajor(id) && <span className={styles.number}>{MAJOR_NUMERALS[id]}</span>}
        {suit && <span className={styles.suit} style={{ background: ELEMENT_COLOR[suit] }} />}
      </div>
      <div className={styles.plate}>
        <span className={styles.name}>{t(`card.${id}`)}</span>
        {lang !== 'en' && <span className={styles.nameEn}>{translate('en', `card.${id}`)}</span>}
      </div>
      {band('upright', up)}
    </div>
  );
}

const MAJOR_NUMERALS: Record<string, string> = {
  fool: '0', magician: 'I', highPriestess: 'II', empress: 'III', emperor: 'IV', hierophant: 'V', lovers: 'VI',
  chariot: 'VII', strength: 'VIII', hermit: 'IX', wheelOfFortune: 'X', justice: 'XI', hangedMan: 'XII', death: 'XIII',
  temperance: 'XIV', devil: 'XV', tower: 'XVI', star: 'XVII', moon: 'XVIII', sun: 'XIX', judgement: 'XX', world: 'XXI',
};

interface MiniProps {
  id: CardId;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  label?: string;
  className?: string;
}

/** A hand card: illustration and name only (the full card opens on click). */
export function MiniCard({ id, selected = false, disabled = false, onClick, label, className }: MiniProps) {
  const { t } = useLang();
  const suit = isSuit(id) ? SUIT_ELEMENT[id] : null;
  const body = (
    <>
      <div className={styles.miniArt}>
        <CardArt id={id} alt="" />
        {suit && <span className={styles.suit} style={{ background: ELEMENT_COLOR[suit] }} />}
        {suit && (
          <span className={styles.miniIcon}>
            <ElementIcon element={suit} size={16} color="var(--paper)" weight={14} />
          </span>
        )}
      </div>
      <div className={styles.miniPlate}>
        <span>{t(`card.${id}`)}</span>
      </div>
    </>
  );
  const cls = [styles.mini, selected ? styles.selected : '', disabled ? styles.disabled : '', className].filter(Boolean).join(' ');
  if (!onClick) return <div className={cls}>{body}</div>;
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={selected} aria-label={label ?? t(`card.${id}`)}>
      {body}
    </button>
  );
}

/** The back of a fate card (hidden hands, the deck). */
export function CardBack({ className, count }: { className?: string; count?: number }) {
  return (
    <div className={[styles.back, className].filter(Boolean).join(' ')}>
      <CardArt id="back" alt="" />
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </div>
  );
}
