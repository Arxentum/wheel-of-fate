import { BOARD } from '../../components/boardGeometry';
import { EmoteFace } from '../../fx/EmoteFace';
import { useLang } from '../../hooks/useLang';
import type { Bubble } from './useFx';
import styles from './Game.module.css';

/** Emote bubbles over the pieces (inside the board's box, positioned in percent). */
export function EmoteBubbles({ bubbles }: { bubbles: readonly Bubble[] }) {
  const { t } = useLang();
  const pct = (v: number) => `${((v + BOARD.half) / (BOARD.half * 2)) * 100}%`;
  return (
    <>
      {bubbles.map((b) => (
        <div
          key={b.id}
          // Near the top of the board the bubble hangs below the piece, so it stays on the board.
          className={b.at[1] < -BOARD.half * 0.45 ? `${styles.bubble} ${styles.bubbleBelow}` : styles.bubble}
          style={{ left: pct(b.at[0]), top: pct(b.at[1]) }}
          role="status"
        >
          <EmoteFace emote={b.emote} size={30} />
          <span>{t(`emote.${b.emote}`)}</span>
        </div>
      ))}
    </>
  );
}
