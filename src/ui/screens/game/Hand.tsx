import { cardDef, type CardUid, type GameState, type PlayerId } from '../../../engine';
import { CardBack, MiniCard } from '../../components/Card';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

interface Props {
  s: GameState;
  viewer: PlayerId | null;
  /** Cards that can be clicked now, and what a click does. */
  clickable: (uid: CardUid) => boolean;
  dimmed: (uid: CardUid) => boolean;
  selected: readonly CardUid[];
  onCard: (uid: CardUid) => void;
  hint: string | null;
}

/** The viewer's hand (or card backs when it is hidden), plus the deck and discard pile. */
export function Hand({ s, viewer, clickable, dimmed, selected, onCard, hint }: Props) {
  const { t } = useLang();
  const me = viewer !== null ? s.players[viewer]! : null;
  const top = s.discard.at(-1);
  const watching = s.players.every((p) => p.controller === 'computer');
  return (
    <section className={styles.handBar} aria-label={t('game.hand')}>
      <div className={styles.handTitle}>
        <h2 className={styles.panelTitle}>{me ? t('game.yourHand', { player: t(`player.${me.element}`) }) : watching ? t('game.watching') : t('game.handHidden')}</h2>
        {hint && <p className={styles.handHint}>{hint}</p>}
      </div>
      <div className={styles.handCards}>
        {me
          ? me.hand.map((uid) => (
              <MiniCard
                key={uid}
                id={cardDef(uid)}
                selected={selected.includes(uid)}
                disabled={dimmed(uid)}
                onClick={clickable(uid) ? () => onCard(uid) : undefined}
              />
            ))
          : null}
        {me && me.hand.length === 0 && <p className={styles.empty}>{t('game.noCards')}</p>}
        {!me && <p className={styles.empty}>{watching ? t('game.watchingHint') : t('game.handHiddenHint')}</p>}
      </div>
      <div className={styles.piles}>
        <figure className={styles.pile}>
          <CardBack count={s.deck.length} />
          <figcaption>{t('game.deck')}</figcaption>
        </figure>
        <figure className={styles.pile}>
          {top !== undefined ? <MiniCard id={cardDef(top)} /> : <div className={styles.emptyPile} />}
          <figcaption>{t('game.discard', { n: s.discard.length })}</figcaption>
        </figure>
      </div>
    </section>
  );
}
