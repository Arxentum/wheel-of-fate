import { useEffect, useMemo, useState } from 'react';
import {
  COURTS,
  COURT_COPIES,
  COURT_REQUIRES,
  MAJORS,
  MINOR_COPIES,
  SUITS,
  SUIT_ELEMENT,
  defaultBalance,
  isCourt,
  isMajor,
  isSuit,
  type BalanceConfig,
  type CardId,
  type Orientation,
} from '../../../engine';
import { translate, type MessageKey } from '../../../i18n';
import { ELEMENT_COLOR } from '../../art/colors';
import { Card } from '../../components/Card';
import { Button, Segmented } from '../../components/controls';
import { ElementIcon } from '../../components/ElementIcon';
import { Modal } from '../../components/Modal';
import { SiteNav } from '../../components/SiteNav';
import { renderFace } from '../../game/cardText';
import { useLang } from '../../hooks/useLang';
import styles from './Gallery.module.css';

type Filter = 'all' | 'majors' | 'minors' | 'courts';

const GROUPS: { id: Exclude<Filter, 'all'>; title: MessageKey; note: MessageKey; label: MessageKey; ids: readonly CardId[] }[] = [
  { id: 'majors', title: 'gallery.majorsTitle', note: 'gallery.majorsNote', label: 'gallery.majors', ids: MAJORS },
  { id: 'minors', title: 'gallery.minorsTitle', note: 'gallery.minorsNote', label: 'gallery.minors', ids: SUITS },
  { id: 'courts', title: 'gallery.courtsTitle', note: 'gallery.courtsNote', label: 'gallery.courts', ids: COURTS },
];

const ALL_IDS: readonly CardId[] = GROUPS.flatMap((g) => g.ids);

/** Whether a card reads differently in a 2-player game (no leader clause, the 2-player lines). */
function differsIn2p(b: BalanceConfig, id: CardId): boolean {
  return (['upright', 'reversed'] as const).some((side) => {
    const key = `${id}.${side}` as const;
    return renderFace('en', b, 2, key).text !== renderFace('en', b, 3, key).text;
  });
}

interface Props {
  balance: BalanceConfig;
  /** In a game the texts follow its player count and the toggle is hidden. */
  fixedPlayers?: number;
  /** Inside the Rules dialog over a game (no page bar above). */
  embedded?: boolean;
}

/** Every card, grouped, both sides readable; texts follow the language and the player count. */
export function GalleryContent({ balance: b, fixedPlayers, embedded = false }: Props) {
  const { t } = useLang();
  const [filter, setFilter] = useState<Filter>('all');
  const [players, setPlayers] = useState(fixedPlayers ?? 3);
  const [sideUp, setSideUp] = useState<Orientation>('upright');
  const [open, setOpen] = useState<CardId | null>(null);
  const n = fixedPlayers ?? players;
  const differs = useMemo(() => new Set(ALL_IDS.filter((id) => differsIn2p(b, id))), [b]);
  const shown = GROUPS.filter((g) => filter === 'all' || g.id === filter);
  const order = shown.flatMap((g) => g.ids);

  return (
    <div className={embedded ? `${styles.gallery} ${styles.embedded}` : styles.gallery}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('gallery.title')}</h1>
        <p className={styles.intro}>{t('gallery.intro')}</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.control}>
          <span>{t('gallery.filter')}</span>
          <Segmented<Filter>
            size="sm"
            label={t('gallery.filter')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `${t('gallery.all')} ${ALL_IDS.length}` },
              ...GROUPS.map((g) => ({ value: g.id, label: `${t(g.label)} ${g.ids.length}` })),
            ]}
          />
        </div>
        <div className={styles.control}>
          <span>{t('gallery.sideUp')}</span>
          <Segmented<Orientation>
            size="sm"
            label={t('gallery.sideUp')}
            value={sideUp}
            onChange={setSideUp}
            options={[
              { value: 'upright', label: `▲ ${t('sideLabel.upright')}` },
              { value: 'reversed', label: `▼ ${t('sideLabel.reversed')}` },
            ]}
          />
        </div>
        {fixedPlayers === undefined && (
          <div className={styles.control} title={t('gallery.playersHint')}>
            <span>{t('gallery.players')}</span>
            <Segmented<number>
              size="sm"
              label={t('gallery.players')}
              value={players}
              onChange={setPlayers}
              options={[
                { value: 3, label: t('gallery.playersMany') },
                { value: 2, label: t('gallery.playersTwo') },
              ]}
            />
          </div>
        )}
      </div>
      {fixedPlayers === undefined && <p className={styles.hint}>{t('gallery.playersHint')}</p>}

      {shown.map((g) => (
        <section key={g.id} className={styles.group} aria-labelledby={`gallery-${g.id}`}>
          <div className={styles.groupHead}>
            <h2 id={`gallery-${g.id}`}>{t(g.title)}</h2>
            <p>{t(g.note)}</p>
          </div>
          <ul className={styles.grid}>
            {g.ids.map((id) => (
              <li key={id}>
                <button type="button" className={styles.tile} onClick={() => setOpen(id)} data-card={id} data-sound="pick">
                  <span className={styles.tileCard}>
                    <Card id={id} balance={b} players={n} turned={sideUp === 'reversed'} />
                  </span>
                  <span className={styles.meta}>
                    <Meta id={id} />
                    {n === 2 && differs.has(id) && <span className={styles.badge}>{t('gallery.differs2p')}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {open && (
        <CardDetail
          id={open}
          b={b}
          players={n}
          differs={differs.has(open)}
          startTurned={sideUp === 'reversed'}
          onClose={() => setOpen(null)}
          onStep={(dir) => {
            const i = order.indexOf(open);
            setOpen(order[(i + dir + order.length) % order.length]!);
          }}
        />
      )}
    </div>
  );
}

/** One line under a card: what kind of card it is and how many are in the deck. */
function Meta({ id }: { id: CardId }) {
  const { t } = useLang();
  if (isMajor(id)) return <span className={styles.kind}>{t('gallery.character')}</span>;
  if (isSuit(id)) {
    const el = SUIT_ELEMENT[id];
    return (
      <span className={styles.kind}>
        <ElementIcon element={el} size={14} color={ELEMENT_COLOR[el]} weight={14} />
        {t(`element.${el}`)} · {t('gallery.copies', { n: MINOR_COPIES })}
      </span>
    );
  }
  return <span className={styles.kind}>{t('gallery.copies', { n: COURT_COPIES })}</span>;
}

interface DetailProps {
  id: CardId;
  b: BalanceConfig;
  players: number;
  differs: boolean;
  startTurned: boolean;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}

function CardDetail({ id, b, players, differs, startTurned, onClose, onStep }: DetailProps) {
  const { t, lang } = useLang();
  const [turned, setTurned] = useState(startTurned);
  const [preview, setPreview] = useState<Orientation | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStep]);

  const showTurned = preview ? preview === 'reversed' : turned;
  return (
    <Modal onClose={onClose} label={t(`card.${id}`)} size="wide">
      <div className={styles.detail}>
        <div className={styles.detailCard} style={{ ['--card-w' as string]: 'min(290px, calc((100vh - 120px) / 2.06))' }}>
          <Card id={id} balance={b} players={players} turned={showTurned} eager />
        </div>
        <div className={styles.detailText}>
          <h2 className={styles.detailTitle}>{t(`card.${id}`)}</h2>
          {lang !== 'en' && <p className={styles.detailEn}>{translate('en', `card.${id}`)}</p>}
          <p className={styles.detailMeta}>
            <Meta id={id} />
            {differs && players === 2 && <span className={styles.badge}>{t('gallery.differs2p')}</span>}
          </p>
          {(['upright', 'reversed'] as const).map((side) => {
            const face = renderFace(lang, b, players, `${id}.${side}`);
            return (
              <div
                key={side}
                className={styles.face}
                onMouseEnter={() => setPreview(side)}
                onMouseLeave={() => setPreview(null)}
                data-side={side}
              >
                <h3>
                  <span className={styles.faceMark}>{side === 'upright' ? '▲' : '▼'}</span>
                  {t(`sideLabel.${side}`)} · {face.name}
                  {isCourt(id) && (
                    <span className={styles.fuel}>
                      {t('gallery.needs', {
                        a: t(`element.${COURT_REQUIRES[id][side][0]}`),
                        b: t(`element.${COURT_REQUIRES[id][side][1]}`),
                      })}
                    </span>
                  )}
                </h3>
                <p>{face.text}</p>
              </div>
            );
          })}
          <div className={styles.detailButtons}>
            <Button size="sm" onClick={() => onStep(-1)}>
              ← {t('gallery.prev')}
            </Button>
            <Button size="sm" onClick={() => onStep(1)}>
              {t('gallery.next')} →
            </Button>
            <Button size="sm" onClick={() => setTurned((v) => !v)}>
              {t('game.turnCard')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              {t('decide.close')}
            </Button>
          </div>
          <p className={styles.keys}>{t('gallery.keys')}</p>
        </div>
      </div>
    </Modal>
  );
}

/** The Card Gallery page (outside a game). */
export function GalleryPage() {
  const [b] = useState(defaultBalance);
  return (
    <div className={styles.page}>
      <SiteNav page="cards" />
      <GalleryContent balance={b} />
    </div>
  );
}
