import { useState } from 'react';
import {
  cardDef,
  faceKey,
  isSuit,
  splitFace,
  type Action,
  type CardUid,
  type Decision,
  type GameEvent,
  type GameState,
  type PlayerId,
} from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { MiniCard } from '../../components/Card';
import { Button } from '../../components/controls';
import { Piece } from '../../components/Piece';
import { renderFace } from '../../game/cardText';
import type { GameController, GameView } from '../../game/controller';
import { playerName } from '../../game/logText';
import { anyCardOption, simpleOption, skillOption } from '../../game/options';
import { useLang } from '../../hooks/useLang';
import { lastPlay, turnOnScreen } from '../../game/tableFx';
import { CardArt } from '../../components/CardArt';
import { TurnSteps } from './TurnSteps';
import { reasonText, targetOf, type T, type UiMode } from './shared';
import styles from './Game.module.css';

interface Props {
  c: GameController;
  v: GameView;
  ui: UiMode;
  setUi: (ui: UiMode) => void;
  selected: CardUid[];
  setSelected: (cards: CardUid[]) => void;
  /** After the game, when the results were closed: shows them again. */
  onShowResults?: () => void;
  /** Extra control at the end of the header (the emote button). */
  extra?: React.ReactNode;
}

export function DecisionPanel({ c, v, ui, setUi, selected, setSelected, onShowResults, extra }: Props) {
  const { t } = useLang();
  const s = v.latest;
  const shown = v.shown;
  // Follow the playback: once it has reached the next turn, show that turn (just begun).
  const events = v.log.map((i) => i.event);
  const reached = s.result ? null : turnOnScreen(events);
  const turnPlayer = reached?.p ?? shown.turn.player;
  const step = reached && reached.p !== shown.turn.player ? 'draw' : shown.turn.step;
  const header = (
    <header className={styles.decisionHead}>
      <span className={styles.turnOf} title={t('game.turnOf', { player: playerName(t, shown, turnPlayer) })}>
        <i style={{ background: ELEMENT_COLOR[shown.players[turnPlayer]!.element] }} />
        {playerName(t, shown, turnPlayer)}
      </span>
      <TurnSteps step={step} />
      {extra && <span className={styles.headExtra}>{extra}</span>}
    </header>
  );

  let body: React.ReactNode;
  if (s.result && !v.busy)
    body = (
      <div className={styles.choose}>
        <p className={styles.prompt}>{t('game.overShort')}</p>
        {onShowResults && (
          <Button variant="primary" size="sm" onClick={onShowResults}>
            {t('over.show')}
          </Button>
        )}
      </div>
    );
  else if (v.handoffTo !== null) body = <p className={styles.prompt}>{t('game.waitingFor', { player: playerName(t, s, v.handoffTo) })}</p>;
  else if (!c.canAct()) {
    // The player whose turn is on screen (during playback the next decision may already be someone else's).
    const who = turnPlayer;
    body = (
      <p className={`${styles.prompt} ${styles.thinking}`}>
        <Piece element={shown.players[who]!.element} size={26} />
        {shown.players[who]!.controller === 'computer' ? t('game.computerPlaying', { player: playerName(t, shown, who) }) : t('game.playing')}
      </p>
    );
    const play = lastPlay(events, who);
    if (play) body = (
      <>
        {body}
        <PlayedCard s={shown} play={play} />
      </>
    );
  } else {
    body = <Choose s={s} d={s.pending!} c={c} ui={ui} setUi={setUi} selected={selected} setSelected={setSelected} t={t} />;
  }

  const live = c.canAct();
  return (
    <section
      className={live ? `${styles.decision} ${styles.decisionLive}` : styles.decision}
      aria-label={t('game.decision')}
      style={live ? { ['--accent' as string]: ELEMENT_COLOR[s.players[s.pending!.player]!.element] } : undefined}
    >
      {header}
      <div className={styles.decisionBody}>{body}</div>
    </section>
  );
}

interface ChooseProps {
  s: GameState;
  d: Decision;
  c: GameController;
  ui: UiMode;
  setUi: (ui: UiMode) => void;
  selected: CardUid[];
  setSelected: (cards: CardUid[]) => void;
  t: T;
}

function Choose(props: ChooseProps) {
  const { s, d, c, t } = props;
  const { lang } = useLang();
  const me = s.players[d.player]!;
  const b = s.config.balance;
  const n = s.players.length;

  switch (d.kind) {
    case 'chooseAction': {
      if (props.ui.kind === 'skill') return <SkillPick {...props} />;
      if (props.ui.kind === 'target') return <TargetPick {...props} actions={props.ui.actions} />;
      const cards = anyCardOption(s);
      const skill = skillOption(s, d.player);
      const face = renderFace(lang, b, n, faceKey(me.major, me.orientation));
      const meditate = simpleOption(s, { type: 'meditate' });
      return (
        <div className={styles.choose}>
          <div className={styles.optionGrid} role="group" aria-label={t('decide.chooseAction')}>
            <div className={styles.option}>
              <span className={styles.optionKey}>A·B</span>
              <div className={styles.optionMain}>
                <strong>{t('decide.playCard')}</strong>
                <p className={cards.ok ? undefined : styles.reasonLine}>{cards.ok ? t('decide.playCardHint') : reasonText(t, s, cards.reason)}</p>
              </div>
            </div>
            <div className={styles.option}>
              <span className={styles.optionKey}>C</span>
              <div className={styles.optionMain}>
                <strong>
                  {t('decide.skill', { face: face.name })} · {t('decide.cost', { n: b.skillCost })}
                </strong>
                <ClampText text={face.text} />
                {!skill.ok && <p className={styles.reasonLine}>{reasonText(t, s, skill.reason)}</p>}
              </div>
              <Button size="sm" variant="primary" disabled={!skill.ok} onClick={() => startSkill(props, skill)} shortcut="s">
                {t('decide.useSkill')}
              </Button>
            </div>
            <div className={styles.option}>
              <span className={styles.optionKey}>D</span>
              <div className={styles.optionMain}>
                <strong>{t('decide.meditate')}</strong>
                <p>{t('decide.meditateText', { draw: b.meditateDraw, fp: b.meditateFp })}</p>
              </div>
              <Button size="sm" disabled={!meditate.ok} onClick={() => c.act({ type: 'meditate' })} shortcut="m">
                {t('decide.meditate')}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    case 'conjure':
      return (
        <div className={styles.choose}>
          <p className={styles.prompt}>{t('decide.conjure', { n: d.left })}</p>
          <p className={styles.sub}>{t('decide.conjureHint')}</p>
          <Button variant="primary" onClick={() => c.act({ type: 'conjurePlay', play: null })} shortcut="space">
            {t('decide.conjureDone')}
          </Button>
        </div>
      );
    case 'foresight':
      return <ForesightPick {...props} d={d} />;
    case 'veil':
      return <VeilPick {...props} d={d} />;
    case 'flip': {
      const other = me.orientation === 'upright' ? 'reversed' : 'upright';
      const next = renderFace(lang, b, n, faceKey(me.major, other));
      const flip = simpleOption(s, { type: 'flip', flip: true });
      return (
        <div className={styles.choose}>
          <p className={styles.prompt}>{t('decide.flip', { card: t(`card.${me.major}`) })}</p>
          <p className={styles.sub}>
            <strong>
              {t(`sideLabel.${other}`)} · {next.name}
            </strong>{' '}
            {next.text}
          </p>
          <div className={styles.buttons}>
            <Button variant="primary" onClick={() => c.act({ type: 'flip', flip: false })} shortcut="space">
              {t('decide.keep', { side: t(`side.${me.orientation}`) })}
            </Button>
            <Button disabled={!flip.ok} reason={reasonText(t, s, flip.reason)} onClick={() => c.act({ type: 'flip', flip: true })} shortcut="f">
              {t('decide.flipTo', { side: t(`side.${other}`), n: b.flipCost })}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => props.setUi({ kind: 'view', id: me.major, turned: me.orientation === 'reversed', owner: me.id })}>
              {t('game.viewCard')}
            </Button>
          </div>
        </div>
      );
    }
    case 'move': {
      const roll = s.turn.roll;
      const steps = (roll?.value ?? 0) + (s.turn.boosted ? 1 : 0);
      const reroll = simpleOption(s, { type: 'reroll' });
      const boost = simpleOption(s, { type: 'boost' });
      return (
        <div className={styles.choose}>
          <p className={styles.prompt}>
            {t('decide.rolled', { value: roll?.value ?? 0 })}
            {s.turn.boosted ? ` ${t('decide.boosted')}` : ''}
          </p>
          <div className={styles.buttons}>
            <Button variant="primary" onClick={() => c.act({ type: 'confirmMove' })} autoFocus shortcut="space">
              {t('decide.move', { n: steps })}
            </Button>
            <Button disabled={!reroll.ok} reason={reasonText(t, s, reroll.reason)} onClick={() => c.act({ type: 'reroll' })} shortcut="r">
              {t('decide.reroll', { n: b.rerollCost })}
            </Button>
            <Button disabled={!boost.ok} reason={reasonText(t, s, boost.reason)} onClick={() => c.act({ type: 'boost' })} shortcut="b">
              {t('decide.boost', { n: b.boostCost })}
            </Button>
          </div>
        </div>
      );
    }
    case 'discardToLimit': {
      const ok = props.selected.length === d.count;
      return (
        <div className={styles.choose}>
          <p className={styles.prompt}>{t('decide.discardToLimit', { n: d.count, limit: b.handLimit })}</p>
          <p className={styles.sub}>{t('decide.selectInHand', { n: props.selected.length, total: d.count })}</p>
          <Button
            variant="primary"
            disabled={!ok}
            reason={ok ? undefined : t('decide.selectExactly', { n: d.count })}
            onClick={() => {
              c.act({ type: 'discard', cards: [...props.selected] });
              props.setSelected([]);
            }}
          >
            {t('decide.discard')}
          </Button>
        </div>
      );
    }
    case 'wheelTarget':
      return (
        <div className={styles.choose}>
          <p className={styles.prompt}>{t('decide.target')}</p>
          <div className={styles.buttons}>
            {s.players
              .filter((p) => p.id !== d.player)
              .map((p) => (
                <Button key={p.id} onClick={() => c.act({ type: 'chooseTarget', target: p.id })}>
                  {playerName(t, s, p.id)}
                </Button>
              ))}
          </div>
        </div>
      );
  }
}

/** A skill without choices is used at once; otherwise the panel asks for the target, sign or cards. */
function startSkill(props: ChooseProps, skill: ReturnType<typeof skillOption>): void {
  if (!skill.ok) return;
  if (skill.pick === 'none') {
    props.c.act(skill.actions[0]!);
    return;
  }
  props.setSelected([]);
  props.setUi({ kind: 'skill' });
}

/** After choosing the skill: confirm, or pick its target, sign or cards. */
function SkillPick(props: ChooseProps) {
  const { s, d, c, t, selected } = props;
  const { lang } = useLang();
  const me = s.players[d.player]!;
  const skill = skillOption(s, d.player);
  const face = renderFace(lang, s.config.balance, s.players.length, faceKey(me.major, me.orientation));
  const cancel = () => {
    props.setUi({ kind: 'idle' });
    props.setSelected([]);
  };
  let pick: React.ReactNode;
  if (!skill.ok) pick = <p className={styles.reasonLine}>{reasonText(t, s, skill.reason)}</p>;
  else if (skill.pick === 'target')
    pick = <Targets s={s} t={t} actions={skill.actions} onPick={(a) => c.act(a)} />;
  else if (skill.pick === 'sign') pick = <p className={styles.sub}>{t('decide.pickSign')}</p>;
  else if (skill.pick === 'discard') {
    const action: Action = { type: 'useSkill', choice: { discard: [...selected] } };
    const check = c.check(action);
    pick = (
      <>
        <p className={styles.sub}>{t('decide.selectDiscard', { n: selected.length })}</p>
        <Button variant="primary" disabled={!check.ok} reason={check.ok ? undefined : reasonText(t, s, check.reason)} onClick={() => c.act(action)} shortcut="space">
          {t('decide.useWithDiscard', { n: selected.length })}
        </Button>
      </>
    );
  } else
    pick = (
      <Button variant="primary" onClick={() => c.act(skill.actions[0]!)} autoFocus shortcut="space">
        {t('decide.useSkill')}
      </Button>
    );
  return (
    <div className={styles.choose}>
      <p className={styles.prompt}>
        {t(`card.${me.major}`)} · {face.name}
      </p>
      <p className={styles.sub}>{face.text}</p>
      <div className={styles.buttons}>
        {pick}
        <Button variant="ghost" size="sm" onClick={cancel}>
          {t('decide.cancel')}
        </Button>
      </div>
    </div>
  );
}

function TargetPick(props: ChooseProps & { actions: Action[] }) {
  const { s, c, t } = props;
  return (
    <div className={styles.choose}>
      <p className={styles.prompt}>{t('decide.target')}</p>
      <div className={styles.buttons}>
        <Targets s={s} t={t} actions={props.actions} onPick={(a) => c.act(a)} />
        <Button variant="ghost" size="sm" onClick={() => props.setUi({ kind: 'idle' })}>
          {t('decide.cancel')}
        </Button>
      </div>
    </div>
  );
}

/** One button per target player of the given actions. */
export function Targets({ s, t, actions, onPick }: { s: GameState; t: T; actions: Action[]; onPick: (a: Action) => void }) {
  return (
    <>
      {actions.map((a) => {
        const target = targetOf(a);
        if (target === undefined) return null;
        return (
          <Button key={target} onClick={() => onPick(a)}>
            <Piece element={s.players[target]!.element} size={22} />
            {playerName(t, s, target)}
          </Button>
        );
      })}
    </>
  );
}

/** The High Priestess upright: use one minor's upright effect, take another card. */
function ForesightPick(props: ChooseProps & { d: Extract<Decision, { kind: 'foresight' }> }) {
  const { s, d, c, t } = props;
  const minors = d.cards.filter((u) => isSuit(cardDef(u)));
  const [use, setUse] = useState<CardUid | null>(minors[0] ?? null);
  const rest = d.cards.filter((u) => u !== use);
  const [take, setTake] = useState<CardUid | null>(rest[0] ?? null);
  const takeNow = take !== null && rest.includes(take) ? take : (rest[0] ?? null);
  const action: Action = { type: 'foresightPick', use, take: takeNow };
  const check = c.check(action);
  return (
    <div className={styles.choose}>
      <p className={styles.prompt}>{t('decide.foresight')}</p>
      <div className={styles.foresight}>
        {d.cards.map((u) => {
          const isUse = u === use;
          const isTake = u === takeNow;
          return (
            <div key={u} className={styles.foresightCard}>
              <MiniCard id={cardDef(u)} selected={isUse || isTake} />
              <div className={styles.foresightButtons}>
                <Button size="sm" variant={isUse ? 'primary' : 'ghost'} disabled={!isSuit(cardDef(u))} onClick={() => setUse(u)}>
                  {t('decide.foresightUse')}
                </Button>
                <Button size="sm" variant={isTake ? 'primary' : 'ghost'} disabled={isUse} onClick={() => setTake(u)}>
                  {t('decide.foresightTake')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <Button variant="primary" disabled={!check.ok} reason={check.ok ? undefined : reasonText(t, s, check.reason)} onClick={() => c.act(action)} shortcut="space">
        {t('decide.confirm')}
      </Button>
    </div>
  );
}

/** The High Priestess reversed: look at the target's hand and discard some of it. */
function VeilPick(props: ChooseProps & { d: Extract<Decision, { kind: 'veil' }> }) {
  const { s, d, c, t } = props;
  const [pick, setPick] = useState<CardUid[]>([]);
  const hand = s.players[d.target]!.hand;
  const toggle = (u: CardUid) =>
    setPick((cur) => (cur.includes(u) ? cur.filter((x) => x !== u) : cur.length < d.count ? [...cur, u] : [...cur.slice(1), u]));
  const action: Action = { type: 'veilPick', cards: pick };
  const ok = pick.length === d.count && c.check(action).ok;
  return (
    <div className={styles.choose}>
      <p className={styles.prompt}>{t('decide.veil', { player: playerName(t, s, d.target as PlayerId), n: d.count })}</p>
      <div className={styles.foresight}>
        {hand.map((u) => (
          <MiniCard key={u} id={cardDef(u)} selected={pick.includes(u)} onClick={() => toggle(u)} />
        ))}
      </div>
      <Button variant="primary" disabled={!ok} reason={ok ? undefined : t('decide.selectExactly', { n: d.count })} onClick={() => c.act(action)} shortcut="space">
        {t('decide.discard')}
      </Button>
    </div>
  );
}

/** A long effect text cut to a few lines; a click or tap shows all of it. */
function ClampText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={open ? `${styles.optionText} ${styles.optionTextOpen}` : styles.optionText}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      title={text}
    >
      {text}
    </button>
  );
}

/** The card (or action) the player on screen has just played, large, with its effect. */
function PlayedCard({ s, play }: { s: GameState; play: Extract<GameEvent, { t: 'play' }> }) {
  const { t, lang } = useLang();
  const b = s.config.balance;
  if (!play.face) {
    // Meditate has no card.
    return (
      <div className={styles.played}>
        <div className={styles.playedBody}>
          <span className={styles.playedKind}>{t(`played.${play.kind}`)}</span>
          <p>{t('decide.meditateText', { draw: b.meditateDraw, fp: b.meditateFp })}</p>
        </div>
      </div>
    );
  }
  const [card, side] = splitFace(play.face);
  const face = renderFace(lang, b, s.players.length, play.face);
  const hits = play.targets ?? (play.target !== undefined ? [play.target] : []);
  return (
    <div className={side === 'reversed' ? `${styles.played} ${styles.playedDark}` : styles.played}>
      <div className={styles.playedArt}>
        <CardArt id={card} alt="" eager />
        {side === 'reversed' && <span className={styles.spotRev}>▼</span>}
      </div>
      <div className={styles.playedBody}>
        <span className={styles.playedKind}>
          {t(`played.${play.kind}`)} · {t(`card.${card}`)} · {t(`sideLabel.${side}`)}
        </span>
        <strong className={styles.playedName}>{face.name}</strong>
        <p>{face.text}</p>
        {hits.length > 0 && (
          <span className={styles.playedTarget}>→ {hits.map((h) => playerName(t, s, h)).join(t('list.sep'))}</span>
        )}
      </div>
    </div>
  );
}
