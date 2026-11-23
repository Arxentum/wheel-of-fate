import { useEffect, useRef } from 'react';
import type { GameState } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import type { LogItem } from '../../game/controller';
import { describeEvent, playerName } from '../../game/logText';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

const MAX_ITEMS = 400;

/** The game log: one heading per turn, one line per event, newest at the bottom. */
export function LogPanel({ s, items }: { s: GameState; items: LogItem[] }) {
  const { t } = useLang();
  const end = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    if (stick.current) end.current?.scrollIntoView({ block: 'end' });
  }, [items.length]);

  const shown = items.slice(-MAX_ITEMS);
  return (
    <section className={styles.log} aria-label={t('game.log')}>
      <h2 className={styles.panelTitle}>{t('game.log')}</h2>
      <div
        ref={list}
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
          const line = describeEvent(t, s, event);
          if (!line) return null;
          const important = event.t === 'play' || event.t === 'trapTrigger' || event.t === 'finalRound' || event.t === 'gameOver';
          return (
            <p key={id} className={important ? `${styles.logLine} ${styles.logStrong}` : styles.logLine}>
              {line}
            </p>
          );
        })}
        <div ref={end} />
      </div>
    </section>
  );
}
