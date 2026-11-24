import { useMemo, useState } from 'react';
import { gameStats } from '../../game/stats';
import { ProgressChart, StatsTable } from './GameStats';
import {
  SUIT_ELEMENT,
  cardDef,
  elementOfSign,
  isSuit,
  signOf,
  type Action,
  type CardId,
  type CardUid,
  type GameEvent,
  type GameState,
  type Orientation,
  type PlayerId,
} from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/controls';
import { Modal } from '../../components/Modal';
import { Piece } from '../../components/Piece';
import { renderFace } from '../../game/cardText';
import { playerName } from '../../game/logText';
import { cardSideOption } from '../../game/options';
import { useLang } from '../../hooks/useLang';
import { activeStatuses, reasonText, statusDesc, targetOf, type T } from './shared';
import styles from './Game.module.css';

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
    <Modal onClose={onClose} label={t(`card.${id}`)} size="wide">
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
                onClick={() => setPreview(side)}
              >
                <h3>
                  <span className={styles.sideMark}>{side === 'upright' ? '▲' : '▼'}</span>
                  {t(`sideLabel.${side}`)} · {face.name}
                </h3>
                <p>{face.text}</p>
                {opt.ok && !several && (
                  <Button variant="primary" onClick={() => onPlay(opt.actions[0]!)} shortcut={side === 'upright' ? 'up' : 'down'}>
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
                {!opt.ok && <p className={styles.reasonLine}>{reasonText(t, s, opt.reason)}</p>}
              </div>
            );
          })}
          <div className={styles.buttons}>
            <Button size="sm" onClick={() => setPreview((p) => (p === 'upright' ? 'reversed' : 'upright'))}>
              {t('game.turnCard')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('decide.cancel')}
            </Button>
          </div>
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
    <Modal onClose={onClose} label={t(`card.${id}`)} size="wide">
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
          {owner !== undefined && <StatusList s={s} owner={owner} />}
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

/** The owner's statuses with what each one does (the panels only show their names). */
function StatusList({ s, owner }: { s: GameState; owner: PlayerId }) {
  const { t } = useLang();
  const { statuses, immune } = activeStatuses(s, owner);
  if (statuses.length === 0 && !immune) return null;
  const rows = [
    ...statuses.map((st) => ({ kind: st.kind, good: st.kind === 'shielded', desc: statusDesc(t, s, st.kind, st.amount) })),
    ...(immune ? [{ kind: 'trapImmune' as const, good: true, desc: statusDesc(t, s, 'trapImmune') }] : []),
  ];
  return (
    <ul className={styles.statusList}>
      {rows.map((r) => (
        <li key={r.kind}>
          <span className={r.good ? styles.statusGood : styles.statusBad}>{t(`status.${r.kind}`)}</span>
          {r.desc}
        </li>
      ))}
    </ul>
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
        <Button variant="primary" size="lg" onClick={onReady} autoFocus shortcut="space">
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
export function GameOver({
  s,
  seed,
  events,
  onAgain,
  onNew,
  onClose,
}: {
  s: GameState;
  seed: string;
  /** The whole game's events (for the statistics). */
  events: readonly GameEvent[];
  onAgain: () => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const { t } = useLang();
  const r = s.result!;
  const stats = useMemo(() => gameStats(events, s.players.length), [events, s.players.length]);
  let place = 1;
  return (
    <Modal onClose={onClose} label={t('over.title')} size="wide">
      <div className={styles.overGrid}>
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
                  <span className={styles.rankWho}>
                    <span className={styles.rankName}>{playerName(t, s, id)}</span>
                    <span className={styles.rankCard}>{t(`card.${p.major}`)}</span>
                  </span>
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
      <div className={styles.overStats}>
        <h3 className={styles.overHeading}>{t('over.chart')}</h3>
        <ProgressChart s={s} stats={stats} />
        <h3 className={styles.overHeading}>{t('over.stats')}</h3>
        <StatsTable s={s} stats={stats} />
      </div>
      </div>
    </Modal>
  );
}
