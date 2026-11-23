import { useEffect, useState, type ReactNode } from 'react';
import {
  SUIT_ELEMENT,
  cardDef,
  elementOfSign,
  isSuit,
  signOf,
  type Action,
  type CardId,
  type CardUid,
  type GameState,
  type Orientation,
  type PlayerId,
} from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/controls';
import { Piece } from '../../components/Piece';
import { renderFace } from '../../game/cardText';
import { playerName } from '../../game/logText';
import { cardSideOption } from '../../game/options';
import { useLang } from '../../hooks/useLang';
import { targetOf, type T } from './shared';
import styles from './Game.module.css';

/** A dialog over the game; Escape or the backdrop closes it. */
export function Modal({ children, onClose, label, wide = false }: { children: ReactNode; onClose: () => void; label: string; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={wide ? `${styles.modal} ${styles.modalWide}` : styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function reasonText(t: T, reason: string | undefined): string | undefined {
  return reason ? t(`reason.${reason}` as Parameters<T>[0]) : undefined;
}

/** Label of a court combo's fuel and/or target. */
function variantLabel(t: T, s: GameState, a: Action): string {
  const parts: string[] = [];
  if (a.type === 'playCourt') parts.push(a.fuel.map((u) => t(`card.${cardDef(u)}`)).join(' + '));
  const target = targetOf(a);
  if (target !== undefined) parts.push(playerName(t, s, target));
  return parts.join(' · ');
}

/**
 * A hand card opened to play it: the card on the left (it turns over while you point at the
 * reversed side), both sides on the right with their effect and why a side is not
 * available. Court cards list their fuel; targeted sides list their targets.
 */
export function CardInspector({ s, card, onPlay, onClose }: { s: GameState; card: CardUid; onPlay: (a: Action) => void; onClose: () => void }) {
  const { t, lang } = useLang();
  const id = cardDef(card);
  const [preview, setPreview] = useState<Orientation>('upright');
  const me = s.pending ? s.players[s.pending.player]! : null;
  const resonance = me && isSuit(id) && elementOfSign(signOf(me.progress)) === SUIT_ELEMENT[id];
  return (
    <Modal onClose={onClose} label={t(`card.${id}`)} wide>
      <div className={styles.inspector}>
        <div className={styles.inspectorCard} style={{ ['--card-w' as string]: 'min(290px, calc((100vh - 120px) / 2.06))' }}>
          <Card id={id} balance={s.config.balance} players={s.players.length} turned={preview === 'reversed'} eager />
        </div>
        <div className={styles.sides}>
          <h2 className={styles.inspectorTitle}>{t(`card.${id}`)}</h2>
          {resonance && (
            <p className={styles.badge} style={{ background: ELEMENT_COLOR[SUIT_ELEMENT[id]] }}>
              {t('decide.resonance', { n: s.config.balance.resonanceBonus })}
            </p>
          )}
          {(['upright', 'reversed'] as const).map((side) => {
            const face = renderFace(lang, s.config.balance, s.players.length, `${id}.${side}`);
            const opt = cardSideOption(s, card, side);
            const several = opt.actions.length > 1;
            return (
              <div
                key={side}
                className={opt.ok ? styles.faceBox : `${styles.faceBox} ${styles.faceOff}`}
                onMouseEnter={() => setPreview(side)}
                onFocus={() => setPreview(side)}
              >
                <h3>
                  <span className={styles.sideMark}>{side === 'upright' ? '▲' : '▼'}</span>
                  {t(`sideLabel.${side}`)} · {face.name}
                </h3>
                <p>{face.text}</p>
                {opt.ok && !several && (
                  <Button variant="primary" onClick={() => onPlay(opt.actions[0]!)}>
                    {t('decide.playSide', { side: t(`side.${side}`) })}
                  </Button>
                )}
                {opt.ok && several && (
                  <div className={styles.buttons}>
                    <span className={styles.sub}>{id === 'page' || id === 'knight' || id === 'queen' || id === 'king' ? t('decide.pickFuel') : t('decide.target')}</span>
                    {opt.actions.map((a, i) => (
                      <Button key={i} size="sm" variant="primary" onClick={() => onPlay(a)}>
                        {variantLabel(t, s, a)}
                      </Button>
                    ))}
                  </div>
                )}
                {!opt.ok && <p className={styles.reasonLine}>{reasonText(t, opt.reason)}</p>}
              </div>
            );
          })}
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('decide.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** Any card full size, read only (characters on the player panels). */
export function CardViewer({ s, id, turned, owner, onClose }: { s: GameState; id: CardId; turned: boolean; owner?: PlayerId; onClose: () => void }) {
  const { t, lang } = useLang();
  const [flip, setFlip] = useState(turned);
  const current = owner !== undefined ? s.players[owner]!.orientation : undefined;
  return (
    <Modal onClose={onClose} label={t(`card.${id}`)} wide>
      <div className={styles.inspector}>
        <div className={styles.inspectorCard} style={{ ['--card-w' as string]: 'min(290px, calc((100vh - 120px) / 2.06))' }}>
          <Card id={id} balance={s.config.balance} players={s.players.length} turned={flip} current={current} eager />
        </div>
        <div className={styles.sides}>
          <h2 className={styles.inspectorTitle}>{t(`card.${id}`)}</h2>
          {owner !== undefined && (
            <p className={styles.sub}>
              <Piece element={s.players[owner]!.element} size={20} /> {t('game.characterOf', { player: playerName(t, s, owner) })}
            </p>
          )}
          {(['upright', 'reversed'] as const).map((side) => {
            const face = renderFace(lang, s.config.balance, s.players.length, `${id}.${side}`);
            return (
              <div key={side} className={current === side ? `${styles.faceBox} ${styles.faceCurrent}` : styles.faceBox}>
                <h3>
                  <span className={styles.sideMark}>{side === 'upright' ? '▲' : '▼'}</span>
                  {t(`sideLabel.${side}`)} · {face.name}
                  {current === side && <span className={styles.nowTag}>{t('game.currentSide')}</span>}
                </h3>
                <p>{face.text}</p>
              </div>
            );
          })}
          <div className={styles.buttons}>
            <Button size="sm" onClick={() => setFlip((f) => !f)}>
              {t('game.turnCard')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('decide.close')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** Covers the table until the next human takes the device (hot seat). */
export function Handoff({ s, to, onReady, onLeave }: { s: GameState; to: PlayerId; onReady: () => void; onLeave: () => void }) {
  const { t } = useLang();
  const el = s.players[to]!.element;
  return (
    <div className={styles.handoff} role="dialog" aria-modal="true" aria-label={t('handoff.title', { player: playerName(t, s, to) })}>
      <div className={styles.handoffBox}>
        <span className={styles.handoffBar} style={{ background: ELEMENT_COLOR[el] }} />
        <Piece element={el} size={120} />
        <h2>{t('handoff.title', { player: playerName(t, s, to) })}</h2>
        <p>{t('handoff.text')}</p>
        <Button variant="primary" size="lg" onClick={onReady} autoFocus>
          {t('handoff.ready', { player: playerName(t, s, to) })}
        </Button>
        <Button variant="ghost" size="sm" onClick={onLeave}>
          {t('handoff.leave')}
        </Button>
      </div>
    </div>
  );
}

/** Final ranking. */
export function GameOver({ s, seed, onAgain, onNew, onClose }: { s: GameState; seed: string; onAgain: () => void; onNew: () => void; onClose: () => void }) {
  const { t } = useLang();
  const r = s.result!;
  let place = 1;
  return (
    <Modal onClose={onClose} label={t('over.title')}>
      <div className={styles.over}>
        <h2 className={styles.overTitle}>{t('over.title')}</h2>
        <p className={styles.overWinner}>
          {r.winners.length === 1
            ? t('over.winner', { player: playerName(t, s, r.winners[0]!) })
            : t('over.winners', { players: r.winners.map((w) => playerName(t, s, w)).join(t('list.sep')) })}
        </p>
        <ol className={styles.ranking}>
          {r.ranking.map((group) => {
            const rows = group.map((id) => {
              const p = s.players[id]!;
              return (
                <li key={id} className={r.winners.includes(id) ? styles.rankWin : undefined}>
                  <span className={styles.rankPlace}>{place}</span>
                  <Piece element={p.element} size={30} />
                  <span className={styles.rankName}>{playerName(t, s, id)}</span>
                  <span className={styles.rankCard}>{t(`card.${p.major}`)}</span>
                  <span className={styles.rankStat}>{t('over.progress', { n: p.progress, finish: s.config.finish })}</span>
                  <span className={styles.rankStat}>{t('over.fp', { n: p.fp })}</span>
                </li>
              );
            });
            place += group.length;
            return rows;
          })}
        </ol>
        <p className={styles.sub}>{t('over.meta', { rounds: r.rounds, seed })}</p>
        <div className={styles.buttons}>
          <Button variant="primary" onClick={onAgain} autoFocus>
            {t('over.again')}
          </Button>
          <Button onClick={onNew}>{t('over.new')}</Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('over.board')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
