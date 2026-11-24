import { useEffect, useRef, useState } from 'react';
import { cardDef, type CardUid, type GameState, type PlayerId } from '../../../engine';
import { Card, CardBack, MiniCard } from '../../components/Card';
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
  // With a mouse, resting on a card shows it in full above the hand (both sides readable).
  const [hover, setHover] = useState<{ uid: CardUid; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aimed = useRef<CardUid | null>(null);
  const bar = useRef<HTMLElement>(null);
  const endHover = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    aimed.current = null;
    setHover(null);
  };
  const startHover = (uid: CardUid, el: HTMLElement) => {
    // Already waiting for (or showing) this card.
    if (aimed.current === uid) return;
    aimed.current = uid;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const box = bar.current;
      if (!box) return;
      // Centre over the card, kept inside the hand bar (offsets are layout pixels, unaffected by zoom).
      const centre = el.offsetLeft + el.offsetWidth / 2;
      setHover({ uid, left: Math.max(110, Math.min(box.clientWidth - 110, centre)) });
    }, 260);
  };
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(endHover, [me?.hand.length]);
  return (
    <section className={styles.handBar} aria-label={t('game.hand')} ref={bar}>
      <div className={styles.handTitle}>
        <h2 className={styles.panelTitle}>{me ? t('game.yourHand', { player: t(`player.${me.element}`) }) : watching ? t('game.watching') : t('game.handHidden')}</h2>
        {hint && <p className={styles.handHint}>{hint}</p>}
      </div>
      <div className={styles.handCards}>
        {me
          ? me.hand.map((uid) => (
              <span
                key={uid}
                data-hand-card=""
                className={styles.handSlot}
                onPointerMove={(e) => e.pointerType === 'mouse' && startHover(uid, e.currentTarget)}
                onPointerLeave={endHover}
                onPointerDown={endHover}
              >
                <MiniCard
                  id={cardDef(uid)}
                  selected={selected.includes(uid)}
                  disabled={dimmed(uid)}
                  onClick={clickable(uid) ? () => onCard(uid) : undefined}
                />
              </span>
            ))
          : null}
        {me && me.hand.length === 0 && <p className={styles.empty}>{t('game.noCards')}</p>}
        {!me && <p className={styles.empty}>{watching ? t('game.watchingHint') : t('game.handHiddenHint')}</p>}
      </div>
      {hover && me?.hand.includes(hover.uid) && (
        <div className={styles.handPreview} style={{ left: hover.left }} aria-hidden="true">
          <Card id={cardDef(hover.uid)} balance={s.config.balance} players={s.players.length} />
        </div>
      )}
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
