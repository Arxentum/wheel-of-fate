import { useState } from 'react';
import { ELEMENTS, MAJORS, type Element, type GameSetup, type MajorId, type Orientation, type PlayerSetup } from '../../engine';
import { ELEMENT_COLOR } from '../art/colors';
import { Button, NumberBox, Segmented } from '../components/controls';
import { Piece } from '../components/Piece';
import { PAGE_HASH, SiteNav } from '../components/SiteNav';
import { useLang } from '../hooks/useLang';
import styles from './Setup.module.css';

export type SeatMode = 'human' | 'ai' | 'off';

export interface SetupChoice {
  seats: Record<Element, SeatMode>;
  laps: number;
  seed: string;
}

const STORAGE_KEY = 'wof.setup';
export const DEFAULT_SETUP: SetupChoice = {
  seats: { fire: 'human', earth: 'ai', air: 'ai', water: 'off' },
  laps: 3,
  seed: '',
};

export function loadSetup(): SetupChoice {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETUP;
    const saved = JSON.parse(raw) as Partial<SetupChoice>;
    const seats = { ...DEFAULT_SETUP.seats, ...(saved.seats ?? {}) };
    for (const el of ELEMENTS) if (!['human', 'ai', 'off'].includes(seats[el])) seats[el] = DEFAULT_SETUP.seats[el];
    const laps = [1, 2, 3].includes(saved.laps ?? 0) ? saved.laps! : DEFAULT_SETUP.laps;
    return { seats, laps, seed: '' };
  } catch {
    return DEFAULT_SETUP;
  }
}

function saveSetup(c: SetupChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ seats: c.seats, laps: c.laps }));
  } catch {
    // Not saved; the defaults come back next time.
  }
}

export function seatCount(c: SetupChoice): number {
  return ELEMENTS.filter((el) => c.seats[el] !== 'off').length;
}

/**
 * Optional address parameters for demos and automated tests: `?character=moon.reversed`
 * gives the first human seat that character (characters are otherwise random, D-48).
 */
function characterFromUrl(): { major: MajorId; orientation: Orientation } | null {
  try {
    const v = new URLSearchParams(window.location.search).get('character');
    if (!v) return null;
    const [major, side = 'upright'] = v.split('.');
    if (!(MAJORS as readonly string[]).includes(major!) || (side !== 'upright' && side !== 'reversed')) return null;
    return { major: major as MajorId, orientation: side };
  } catch {
    return null;
  }
}

/** The engine's setup from the screen's choices (random seed when none is typed). */
export function toGameSetup(c: SetupChoice): { setup: GameSetup; seed: string } {
  const fixed = characterFromUrl();
  let given = false;
  const players: PlayerSetup[] = ELEMENTS.filter((el) => c.seats[el] !== 'off').map((element) => {
    const human = c.seats[element] === 'human';
    const p: PlayerSetup = { element, controller: human ? 'human' : 'ai' };
    if (human && fixed && !given) {
      given = true;
      return { ...p, ...fixed };
    }
    return p;
  });
  const seed = c.seed.trim() || Math.random().toString(36).slice(2, 10);
  return { setup: { players, laps: c.laps }, seed };
}

export function Setup({ onStart }: { onStart: (choice: SetupChoice) => void }) {
  const { t } = useLang();
  const [choice, setChoice] = useState<SetupChoice>(loadSetup);
  const n = seatCount(choice);
  const valid = n >= 2 && n <= 4;

  const setSeat = (el: Element, mode: SeatMode) => setChoice((c) => ({ ...c, seats: { ...c.seats, [el]: mode } }));
  const start = () => {
    if (!valid) return;
    saveSetup(choice);
    onStart(choice);
  };

  return (
    <div className={styles.page}>
      <SiteNav page="play" />
      <main className={styles.layout}>
        <section className={styles.hero}>
          <div className={styles.dots} aria-hidden="true">
            <i style={{ background: 'var(--fire)' }} />
            <i style={{ background: 'var(--earth)' }} />
            <i style={{ background: 'var(--water)' }} />
          </div>
          <h1 className={styles.title}>{t('app.title')}</h1>
          <p className={styles.tagline}>{t('app.tagline')}</p>
          <ul className={styles.facts}>
            <li>{t('setup.fact.players')}</li>
            <li>{t('setup.fact.time')}</li>
            <li>{t('setup.fact.characters')}</li>
          </ul>
          <div className={styles.links}>
            <a href={PAGE_HASH.rules}>{t('nav.rules')} →</a>
            <a href={PAGE_HASH.cards}>{t('nav.cards')} →</a>
          </div>
          <div className={styles.decor} aria-hidden="true">
            <span style={{ background: 'var(--fire)' }} />
            <span style={{ background: 'var(--earth)' }} />
            <span style={{ background: 'var(--air)' }} />
            <span style={{ background: 'var(--water)' }} />
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="setup-players">
          <h2 id="setup-players" className={styles.heading}>
            <NumberBox n="01" /> {t('setup.players')}
          </h2>
          <p className={styles.hint}>{t('setup.playersHint')}</p>
          <ul className={styles.seats}>
            {ELEMENTS.map((el, i) => {
              const mode = choice.seats[el];
              return (
                <li key={el} className={mode === 'off' ? `${styles.seat} ${styles.seatOff}` : styles.seat}>
                  <span className={styles.seatBar} style={{ background: ELEMENT_COLOR[el] }} />
                  <Piece element={el} size={46} />
                  <span className={styles.seatName}>
                    <span className={styles.seatOrder}>{i + 1}</span>
                    {t(`player.${el}`)}
                  </span>
                  <Segmented<SeatMode>
                    label={t(`player.${el}`)}
                    value={mode}
                    onChange={(m) => setSeat(el, m)}
                    options={[
                      { value: 'human', label: t('setup.human') },
                      { value: 'ai', label: t('setup.ai') },
                      { value: 'off', label: t('setup.off') },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
          {!valid && <p className={styles.error}>{t('setup.needPlayers')}</p>}

          <h2 className={styles.heading}>
            <NumberBox n="02" /> {t('setup.laps')}
          </h2>
          <div className={styles.row}>
            <Segmented<number>
              label={t('setup.laps')}
              value={choice.laps}
              onChange={(laps) => setChoice((c) => ({ ...c, laps }))}
              options={[1, 2, 3].map((v) => ({ value: v, label: t('setup.lapCount', { n: v }) }))}
            />
            <span className={styles.hint}>{t('setup.lapsHint')}</span>
          </div>

          <details className={styles.advanced}>
            <summary>{t('setup.advanced')}</summary>
            <label className={styles.seedLabel}>
              {t('setup.seed')}
              <input
                className={styles.seed}
                value={choice.seed}
                placeholder={t('setup.seedPlaceholder')}
                onChange={(e) => setChoice((c) => ({ ...c, seed: e.target.value }))}
                maxLength={40}
              />
            </label>
            <span className={styles.hint}>{t('setup.seedHint')}</span>
          </details>

          <div className={styles.startRow}>
            <Button variant="primary" size="lg" onClick={start} disabled={!valid} reason={valid ? undefined : t('setup.needPlayers')}>
              {t('setup.start')}
            </Button>
            <span className={styles.hint}>{t('setup.orderHint')}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
