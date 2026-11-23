import { useEffect, useMemo, useRef, useState } from 'react';
import { cardDef, isSuit, type Action, type CardUid } from '../../../engine';
import { Button, Segmented } from '../../components/controls';
import { LangSwitch } from '../../components/LangSwitch';
import { SoundButton } from '../../components/SoundButton';
import { EmoteButton } from '../../components/EmoteButton';
import { useFx } from './useFx';
import { useGameSound, useMusicScene } from '../../audio/useSound';
import type { GameController, Speed } from '../../game/controller';
import { cardSideOption, skillOption } from '../../game/options';
import { useLang } from '../../hooks/useLang';
import { BoardStage } from './BoardStage';
import { DecisionPanel } from './DecisionPanel';
import { Hand } from './Hand';
import { LogPanel } from './LogPanel';
import { CardInspector, CardViewer, GameOver, Handoff } from './Overlays';
import { PlayerPanel } from './PlayerPanel';
import { Reference } from './Reference';
import { TurnBanner } from './TurnBanner';
import { useTableFx } from './useTableFx';
import { turnOnScreen } from '../../game/tableFx';
import { targetOf, useGameView, type UiMode } from './shared';
import styles from './Game.module.css';

interface Props {
  controller: GameController;
  seed: string;
  onNewGame: () => void;
  onRematch: () => void;
}

export function Game({ controller: c, seed, onNewGame, onRematch }: Props) {
  const { t } = useLang();
  const v = useGameView(c);
  const s = v.shown;
  const [ui, setUi] = useState<UiMode>({ kind: 'idle' });
  const [selected, setSelected] = useState<CardUid[]>([]);
  const [overOpen, setOverOpen] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  // The game waits while the rules are open.
  const openRules = (on: boolean) => {
    setRulesOpen(on);
    c.setPaused(on);
  };

  // A new decision (or a new playback) clears what was being chosen.
  const decisionKey = `${v.latest.pending?.kind ?? 'none'}-${v.latest.pending?.player ?? -1}-${v.log.length}`;
  const actNow = c.canAct();
  useEffect(() => {
    setUi((u) => (u.kind === 'view' ? u : { kind: 'idle' }));
    setSelected([]);
  }, [decisionKey]);

  const d = actNow ? v.latest.pending : null;
  const skill = d?.kind === 'chooseAction' ? skillOption(v.latest, d.player) : null;
  const discardMode = d?.kind === 'discardToLimit' || (ui.kind === 'skill' && skill?.ok && skill.pick === 'discard');
  const playMode = d?.kind === 'chooseAction' ? ui.kind === 'idle' || ui.kind === 'inspect' : d?.kind === 'conjure';

  const act = (a: Action) => {
    setUi({ kind: 'idle' });
    setSelected([]);
    c.act(a);
  };

  // Hand clicks: open a card to play it, or select cards to discard.
  const playable = useMemo(() => {
    const ok = new Set<CardUid>();
    if (!playMode || !d) return ok;
    for (const uid of v.latest.players[d.player]!.hand) {
      if (d.kind === 'conjure' && !isSuit(cardDef(uid))) continue;
      if (cardSideOption(v.latest, uid, 'upright').ok || cardSideOption(v.latest, uid, 'reversed').ok) ok.add(uid);
    }
    return ok;
  }, [playMode, d, v.latest]);

  const onCard = (uid: CardUid) => {
    if (discardMode) {
      setSelected((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid]));
      return;
    }
    if (playMode) setUi({ kind: 'inspect', card: uid });
  };

  const handHint = !actNow
    ? null
    : discardMode
      ? t('decide.handDiscardHint')
      : playMode
        ? d?.kind === 'conjure'
          ? t('decide.conjureHint')
          : t('decide.playCardHint')
        : null;

  // Targets can also be picked on the player panels.
  const targetActions: Action[] =
    ui.kind === 'target' ? ui.actions : ui.kind === 'skill' && skill?.ok && skill.pick === 'target' ? skill.actions : [];
  const targetOfPlayer = (id: number) => targetActions.find((a) => targetOf(a) === id);

  // Signs for a trap.
  const signChoices = ui.kind === 'skill' && skill?.ok && skill.pick === 'sign' ? skill.choices.map((ch) => ch.sign!) : [];

  const over = v.latest.result && !v.busy;
  const round = s.round;
  // Whose turn the playback has reached (the panels' numbers follow a little later).
  const turnNow = s.result ? null : (turnOnScreen(v.log.map((i) => i.event))?.p ?? s.turn.player);
  useGameSound(c);
  const fx = useTableFx(c);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardFx = useFx(c, stageRef);
  useMusicScene(over ? 'menu' : s.finalRound ? 'final' : 'game');
  // Playback starts once the sounds and table effects above are listening.
  useEffect(() => c.start(), [c]);

  return (
    <div className={styles.game}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandDots} aria-hidden="true">
            <i style={{ background: 'var(--fire)' }} />
            <i style={{ background: 'var(--earth)' }} />
            <i style={{ background: 'var(--water)' }} />
          </span>
          <span className={styles.brandName}>{t('app.title')}</span>
        </div>
        <div className={styles.roundInfo}>
          <span className={styles.round}>{t('game.round', { n: round })}</span>
          <span className={styles.lapsGoal}>{t('game.goal', { laps: s.config.laps })}</span>
          {s.finalRound && !s.result && <span className={styles.finalBadge}>{t('game.finalRound')}</span>}
        </div>
        <div className={styles.controls}>
          <span className={styles.controlLabel}>{t('game.speed')}</span>
          <Segmented<Speed>
            size="sm"
            label={t('game.speed')}
            value={v.speed}
            onChange={(sp) => c.setSpeed(sp)}
            options={[1, 2, 4].map((n) => ({ value: n as Speed, label: `${n}×` }))}
          />
          <Button size="sm" variant="ghost" onClick={() => c.skip()} disabled={!v.busy || v.handoffTo !== null} title={t('game.skipTitle')}>
            {t('game.skip')}
          </Button>
          <EmoteButton disabled={v.viewer === null} onSend={(e) => v.viewer !== null && cardFx.sendEmote(v.viewer, e)} />
          <SoundButton />
          <Button size="sm" onClick={() => openRules(true)} title={t('game.rulesTitle')}>
            {t('game.rules')}
          </Button>
          <LangSwitch compact />
          {confirmLeave ? (
            <Button size="sm" variant="danger" onClick={onNewGame}>
              {t('game.confirmLeave')}
            </Button>
          ) : (
            <Button size="sm" onClick={() => (over ? onNewGame() : setConfirmLeave(true))}>
              {t('game.newGame')}
            </Button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.boardCol}>
          {fx.banner && <TurnBanner s={v.latest} banner={fx.banner} />}
          <BoardStage
            s={s}
            activePlayer={turnNow}
            fx={cardFx.items}
            bubbles={cardFx.bubbles}
            stageRef={stageRef}
            pieces={v.pieces}
            spotlight={v.spotlight}
            dice={v.dice}
            selectable={signChoices}
            onSelectSign={signChoices.length ? (sign) => act({ type: 'useSkill', choice: { sign } }) : undefined}
          />
        </div>
        <div className={styles.side}>
          <div className={styles.players} data-count={s.players.length}>
            {s.order.map((id) => {
              const target = targetOfPlayer(id);
              return (
                <PlayerPanel
                  key={id}
                  s={s}
                  id={id}
                  active={turnNow === id}
                  targetable={!!target}
                  onTarget={target ? () => act(target) : undefined}
                  onViewCharacter={() => setUi({ kind: 'view', id: s.players[id]!.major, turned: s.players[id]!.orientation === 'reversed', owner: id })}
                  floaters={fx.floaters.filter((f) => f.p === id)}
                />
              );
            })}
          </div>
          <div className={styles.lower}>
            <DecisionPanel
              c={c}
              v={v}
              ui={ui}
              setUi={setUi}
              selected={selected}
              setSelected={setSelected}
              onShowResults={over && !overOpen ? () => setOverOpen(true) : undefined}
            />
            <LogPanel s={s} items={v.log} />
          </div>
        </div>
      </main>

      <Hand
        s={s}
        viewer={v.viewer}
        clickable={(uid) => (discardMode ? true : playable.has(uid))}
        dimmed={(uid) => !!playMode && !playable.has(uid)}
        selected={selected}
        onCard={onCard}
        hint={handHint}
      />

      {ui.kind === 'inspect' && actNow && (
        <CardInspector s={v.latest} card={ui.card} onClose={() => setUi({ kind: 'idle' })} onPlay={act} />
      )}
      {ui.kind === 'view' && (
        <CardViewer s={s} id={ui.id} turned={ui.turned} owner={ui.owner} onClose={() => setUi({ kind: 'idle' })} />
      )}
      {v.handoffTo !== null && !v.busy && <Handoff s={v.latest} to={v.handoffTo} onReady={() => c.takeOver()} onLeave={onNewGame} />}
      {rulesOpen && <Reference s={v.latest} onClose={() => openRules(false)} />}
      {over && overOpen && <GameOver s={v.latest} seed={seed} onAgain={onRematch} onNew={onNewGame} onClose={() => setOverOpen(false)} />}
    </div>
  );
}
