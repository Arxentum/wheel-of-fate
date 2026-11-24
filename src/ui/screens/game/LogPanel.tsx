import { useEffect, useRef, useState } from 'react';
import type { GameEvent, GameState, PlayerId } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import type { LogItem } from '../../game/controller';
import { describeEvent, playerName } from '../../game/logText';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

const MAX_ITEMS = 400;
const FILTER_KEY = 'wof.logKey';

/** Events worth seeing when only the key events are shown. */
function isKey(e: GameEvent): boolean {
  switch (e.t) {
    case 'play':
    case 'trapPlace':
    case 'trapTrigger':
    case 'status':
    case 'shieldBlock':
    case 'lap':
    case 'finalRound':
    case 'gameOver':
    case 'steal':
      return true;
    case 'move':
      return e.cause !== 'move';
    default:
      return false;
  }
}

/** The player a line is about (its colour bar). */
function who(e: GameEvent): PlayerId | undefined {
  if (e.t === 'steal') return e.to;
  if (e.t === 'trapPlace' || e.t === 'trapExpire') return e.trap.owner;
  return 'p' in e ? e.p : undefined;
}

/** Good or bad news for that player: ▲ / ▼ at the start of the line. */
function tone(e: GameEvent): 'up' | 'down' | undefined {
  if (e.t === 'fp') return e.delta > 0 ? 'up' : e.delta < 0 ? 'down' : undefined;
  if (e.t === 'move') return e.to > e.from ? 'up' : e.to < e.from ? 'down' : undefined;
  if (e.t === 'status') return e.kind === 'shielded' ? 'up' : 'down';
  if (e.t === 'trapTrigger') return e.blocked ? undefined : 'down';
  if (e.t === 'lap' || e.t === 'shieldBlock') return 'up';
  return undefined;
}

function loadFilter(): boolean {
  try {
    return window.localStorage.getItem(FILTER_KEY) === '1';
  } catch {
    return false;
  }
}

/** The game log: one heading per turn, one line per event, newest at the bottom. */
export function LogPanel({ s, items }: { s: GameState; items: LogItem[] }) {
  const { t } = useLang();
  const end = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [keyOnly, setKeyOnly] = useState(loadFilter);

  useEffect(() => {
    if (stick.current) end.current?.scrollIntoView({ block: 'end' });
  }, [items.length, keyOnly]);

  const toggle = () => {
    setKeyOnly((v) => {
      try {
        window.localStorage.setItem(FILTER_KEY, v ? '0' : '1');
      } catch {
        // Not saved.
      }
      return !v;
    });
  };

  const shown = items.slice(-MAX_ITEMS);
  return (
    <section className={styles.log} aria-label={t('game.log')}>
      <header className={styles.logTop}>
        <h2 className={styles.panelTitle}>{t('game.log')}</h2>
        <button type="button" className={keyOnly ? `${styles.logFilter} ${styles.logFilterOn}` : styles.logFilter} aria-pressed={keyOnly} onClick={toggle}>
          {t('game.logKey')}
        </button>
      </header>
      <div
        className={styles.logList}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        aria-live="polite"
      >
        {shown.map(({ id, event }) => {
          if (event.t === 'turnStart') {
            const el = s.players[event.p]!.element;
            return (
              <div key={id} className={styles.logHead}>
                <i style={{ background: ELEMENT_COLOR[el] }} />
                {t('log.turnHeading', { round: event.round, player: playerName(t, s, event.p) })}
              </div>
            );
          }
          if (keyOnly && !isKey(event)) return null;
          const line = describeEvent(t, s, event);
          if (!line) return null;
          const important = event.t === 'play' || event.t === 'trapTrigger' || event.t === 'finalRound' || event.t === 'gameOver';
          const p = who(event);
          const mood = tone(event);
          return (
            <p
              key={id}
              className={important ? `${styles.logLine} ${styles.logStrong}` : styles.logLine}
              style={p !== undefined ? { ['--who' as string]: ELEMENT_COLOR[s.players[p]!.element] } : undefined}
              data-tone={mood}
            >
              {line}
            </p>
          );
        })}
        <div ref={end} />
      </div>
    </section>
  );
}
