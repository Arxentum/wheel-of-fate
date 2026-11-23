import { splitFace, type GameState } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Board, type BoardPiece } from '../../components/Board';
import { CardArt } from '../../components/CardArt';
import type { DiceView, Spotlight } from '../../game/controller';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

interface Props {
  s: GameState;
  pieces: number[];
  spotlight: Spotlight | null;
  dice: DiceView | null;
  selectable?: number[];
  onSelectSign?: (sign: number) => void;
}

/** The board with the card just played and the last roll shown on the centre disc. */
export function BoardStage({ s, pieces, spotlight, dice, selectable, onSelectSign }: Props) {
  const { t } = useLang();
  const boardPieces: BoardPiece[] = s.players.map((p) => ({ id: p.id, element: p.element, sign: ((pieces[p.id] ?? 0) % 12 + 12) % 12 }));
  const traps = s.traps.map((tr) => ({ sign: tr.sign, kind: tr.kind, owner: s.players[tr.owner]!.element }));
  return (
    <div className={styles.stage}>
      <Board
        pieces={boardPieces}
        traps={traps}
        activeId={s.result ? undefined : s.turn.player}
        selectable={selectable}
        onSelectSign={onSelectSign}
      />
      <div className={styles.centre} aria-live="polite">
        {spotlight && (
          <div key={`${spotlight.p}-${spotlight.face}-${spotlight.kind}`} className={styles.spot}>
            <div className={styles.spotArt} style={{ borderColor: ELEMENT_COLOR[s.players[spotlight.p]!.element] }}>
              <CardArt id={splitFace(spotlight.face)[0]} alt="" eager />
              {splitFace(spotlight.face)[1] === 'reversed' && <span className={styles.spotRev}>▼</span>}
            </div>
            <div className={styles.spotText}>
              <strong>{t(`face.${spotlight.face}.name`)}</strong>
              <span>
                {t(`card.${splitFace(spotlight.face)[0]}`)} · {t(`side.${splitFace(spotlight.face)[1]}`)}
              </span>
            </div>
          </div>
        )}
        {dice && (
          <div key={dice.n} className={styles.dice} title={t('game.dice')}>
            {dice.mode === 'slowed' ? (
              <span className={styles.die}>1</span>
            ) : dice.dice.length === 0 ? (
              <span className={styles.die}>{dice.value}</span>
            ) : (
              dice.dice.map((d, i) => (
                <span key={i} className={d === dice.value ? styles.die : `${styles.die} ${styles.dieLow}`}>
                  {d}
                </span>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
