import { FOREVER, faceKey, roundOrder, signOf, type GameState, type PlayerId } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Piece } from '../../components/Piece';
import { renderFace } from '../../game/cardText';
import { signName } from '../../game/logText';
import { useLang } from '../../hooks/useLang';
import { activeStatuses, statusDesc, tagFor } from './shared';
import styles from './Game.module.css';

interface Props {
  s: GameState;
  id: PlayerId;
  /** Player whose turn it is. */
  active: boolean;
  /** Can be picked as the target of the action being chosen. */
  targetable?: boolean;
  onTarget?: () => void;
  onViewCharacter: () => void;
}

export function PlayerPanel({ s, id, active, targetable = false, onTarget, onViewCharacter }: Props) {
  const { t, lang } = useLang();
  const p = s.players[id]!;
  const finish = s.config.finish;
  const lap = Math.min(s.config.laps, Math.floor(p.progress / 12) + 1);
  const finished = p.progress >= finish;
  const first = roundOrder(s)[0] === id;
  const face = faceKey(p.major, p.orientation);
  const skill = renderFace(lang, s.config.balance, s.players.length, face);
  const cooldown = p.lastSkillTurn !== null && p.lastSkillTurn >= p.turnNo - (active ? 1 : 0);
  const used = p.major === 'world' && p.onceUsed[p.orientation];
  const { statuses, immune } = activeStatuses(s, id);

  return (
    <article
      className={[styles.player, active ? styles.playerActive : '', targetable ? styles.playerTarget : ''].filter(Boolean).join(' ')}
      aria-label={t(`player.${p.element}`)}
      data-player={p.element}
    >
      <span className={styles.playerBar} style={{ background: ELEMENT_COLOR[p.element] }} />
      <header className={styles.playerHead}>
        <Piece element={p.element} size={28} active={active} />
        <span className={styles.playerName}>{t(`player.${p.element}`)}</span>
        <span className={styles.playerTag}>{tagFor(t, s, id)}</span>
        {first && (
          <span className={styles.firstMark} title={t('game.firstPlayer')}>
            {t('game.firstShort')}
          </span>
        )}
        {targetable && onTarget && (
          <button type="button" className={styles.targetButton} onClick={onTarget}>
            {t('game.chooseThis')}
          </button>
        )}
        <span className={styles.headStats}>
          <span className={styles.fpValue} title={t('game.fpTitle')}>
            {p.fp}
            <small>{t('game.fp')}</small>
          </span>
          <span className={styles.handCount} title={t('game.handTitle')}>
            <span className={styles.miniBack} aria-hidden="true" />
            {p.hand.length}
          </span>
        </span>
      </header>

      <div className={styles.playerStats}>
        <div className={styles.where}>
          <span className={styles.sign}>{signName(t, signOf(p.progress))}</span>
          <span className={styles.lap}>{finished ? t('game.finished') : t('game.lap', { lap, laps: s.config.laps })}</span>
          <span className={styles.track} aria-hidden="true">
            <span style={{ width: `${Math.min(100, (p.progress / finish) * 100)}%`, background: ELEMENT_COLOR[p.element] }} />
          </span>
        </div>
        <span className={styles.pips} aria-hidden="true" title={t('game.fpTitle')}>
          {Array.from({ length: s.config.balance.fpCap }, (_, i) => (
            <i key={i} className={i < p.fp ? styles.pipOn : undefined} />
          ))}
        </span>
      </div>

      <div className={styles.charRow}>
      <button type="button" className={styles.character} onClick={onViewCharacter} title={t('game.viewCard')}>
        <span className={styles.charSide} data-side={p.orientation}>
          {p.orientation === 'upright' ? '▲' : '▼'}
        </span>
        <span className={styles.charName}>{t(`card.${p.major}`)}</span>
        <span className={styles.charFace}>{skill.name}</span>
        <span className={used ? styles.skillUsed : cooldown ? styles.skillCool : styles.skillReady}>
          {used ? t('game.skillUsed') : cooldown ? t('game.skillCooldown') : t('game.skillReady')}
        </span>
      </button>

      {(statuses.length > 0 || immune) && (
        // A tap opens the character card with every status explained (no hover on a tablet).
        <button type="button" className={styles.statuses} onClick={onViewCharacter} title={t('game.viewCard')}>
          {statuses.map((st) => (
            <span key={st.kind} className={st.kind === 'shielded' ? styles.statusGood : styles.statusBad} title={statusDesc(t, s, st.kind, st.amount)}>
              {t(`status.${st.kind}`)}
              {/* During your own turn, mark what only starts next turn. Off turn, everything shown is for your next turn. */}
              {active && st.kind !== 'shielded' && st.until < FOREVER && st.from > p.turnNo && <small>{t('game.statusNext')}</small>}
            </span>
          ))}
          {immune && (
            <span className={styles.statusGood} title={statusDesc(t, s, 'trapImmune')}>
              {t('status.trapImmune')}
            </span>
          )}
        </button>
      )}
      </div>
    </article>
  );
}
