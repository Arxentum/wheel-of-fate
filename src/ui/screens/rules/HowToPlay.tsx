import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  COURTS,
  COURT_COPIES,
  COURT_REQUIRES,
  DECK_SIZE,
  ELEMENTS,
  MINOR_COPIES,
  SIGNS,
  SUITS,
  SUIT_ELEMENT,
  defaultBalance,
  elementOfSign,
  type BalanceConfig,
  type Element,
  type Orientation,
  type StatusKind,
  type TrapKind,
} from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { TRAP_PATHS } from '../../art/glyphs';
import { Board } from '../../components/Board';
import { Card } from '../../components/Card';
import { CardArt } from '../../components/CardArt';
import { Button, NumberBox } from '../../components/controls';
import { ElementIcon } from '../../components/ElementIcon';
import { Piece } from '../../components/Piece';
import { PAGE_HASH, SiteNav } from '../../components/SiteNav';
import { renderFace } from '../../game/cardText';
import { useLang } from '../../hooks/useLang';
import type { MessageKey } from '../../../i18n';
import styles from './HowToPlay.module.css';

type T = ReturnType<typeof useLang>['t'];

interface RulesProps {
  balance: BalanceConfig;
  laps: number;
  /** Number of players the card examples are written for. */
  players?: number;
  onOpenCards: () => void;
  /** The element that scrolls (the dialog body over a game); the window when omitted. */
  scrollRoot?: RefObject<HTMLElement | null>;
  /** Inside the Rules dialog over a game (no page bar above). */
  embedded?: boolean;
}

interface Section {
  id: string;
  title: MessageKey;
  body: ReactNode;
}

/**
 * How to Play: the rulebook (rules v5) retold for players, every number taken from the
 * game's balance so the page never disagrees with the cards. Used as a page and inside
 * the Rules dialog over a game.
 */
export function RulesContent({ balance: b, laps, players = 3, onOpenCards, scrollRoot, embedded = false }: RulesProps) {
  const { t } = useLang();
  const sections: Section[] = [
    { id: 'quick', title: 'rules.quick.title', body: <Quick t={t} laps={laps} /> },
    { id: 'board', title: 'rules.board.title', body: <BoardSection t={t} b={b} /> },
    { id: 'setup', title: 'rules.setup.title', body: <SetupSection t={t} b={b} /> },
    { id: 'turn', title: 'rules.turn.title', body: <TurnSection t={t} b={b} /> },
    { id: 'sides', title: 'rules.sides.title', body: <SidesSection t={t} b={b} players={players} /> },
    { id: 'cards', title: 'rules.cards.title', body: <CardsSection t={t} b={b} players={players} onOpenCards={onOpenCards} /> },
    { id: 'fp', title: 'rules.fp.title', body: <FpSection t={t} b={b} /> },
    { id: 'status', title: 'rules.status.title', body: <StatusSection t={t} b={b} /> },
    { id: 'trap', title: 'rules.trap.title', body: <TrapSection t={t} b={b} /> },
    { id: 'win', title: 'rules.win.title', body: <WinSection t={t} laps={laps} /> },
    { id: 'screen', title: 'rules.screen.title', body: <ScreenSection t={t} /> },
  ];
  const active = useSectionSpy(sections.map((s) => s.id), scrollRoot);
  const refs = useRef(new Map<string, HTMLElement>());
  const go = (id: string) => refs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={embedded ? `${styles.layout} ${styles.embedded}` : styles.layout}>
      <nav className={styles.toc} aria-label={t('rules.toc')}>
        <p className={styles.tocTitle}>{t('rules.toc')}</p>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <button type="button" className={active === s.id ? `${styles.tocLink} ${styles.tocOn}` : styles.tocLink} onClick={() => go(s.id)}>
                <span className={styles.tocNo}>{String(i).padStart(2, '0')}</span>
                {t(s.title)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <article className={styles.article}>
        <header className={styles.head}>
          <h1 className={styles.title}>{t('rules.title')}</h1>
          <p className={styles.intro}>{t('rules.intro')}</p>
          <p className={styles.motto}>{t('app.tagline')}</p>
        </header>
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={`rules-${s.id}`}
            data-section={s.id}
            className={styles.section}
            ref={(el) => {
              if (el) refs.current.set(s.id, el);
              else refs.current.delete(s.id);
            }}
            aria-labelledby={`rules-${s.id}-h`}
          >
            <h2 id={`rules-${s.id}-h`} className={styles.h2}>
              <NumberBox n={String(i).padStart(2, '0')} /> {t(s.title)}
            </h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}

/** The section at the top of the scrolling area (the last one once the bottom is reached). */
function useSectionSpy(ids: string[], scrollRoot?: RefObject<HTMLElement | null>): string {
  const [active, setActive] = useState(ids[0]!);
  const key = ids.join();
  useEffect(() => {
    const root = scrollRoot?.current ?? null;
    const box = root ?? document.documentElement;
    const target: HTMLElement | Window = root ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) {
        setActive(ids[ids.length - 1]!);
        return;
      }
      const top = root ? root.getBoundingClientRect().top : 0;
      const line = top + box.clientHeight * 0.3;
      let current = ids[0]!;
      for (const el of (root ?? document).querySelectorAll<HTMLElement>('[data-section]')) {
        if (el.getBoundingClientRect().top <= line) current = el.dataset.section!;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scrollRoot]);
  return active;
}

// ---------- Sections ----------

function Quick({ t, laps }: { t: T; laps: number }) {
  const items: [string, MessageKey, string][] = [
    ['var(--fire)', 'rules.quick.race.title', t('rules.quick.race.text', { laps })],
    ['var(--earth)', 'rules.quick.turn.title', t('rules.quick.turn.text')],
    ['var(--water)', 'rules.quick.sides.title', t('rules.quick.sides.text')],
  ];
  return (
    <div className={styles.quick}>
      {items.map(([color, title, text], i) => (
        <div key={title} className={styles.quickItem} style={{ ['--accent' as string]: color }}>
          <span className={styles.quickNo}>{i + 1}</span>
          <h3>{t(title)}</h3>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

function BoardSection({ t, b }: { t: T; b: BalanceConfig }) {
  return (
    <div className={styles.split}>
      <div className={styles.prose}>
        <p>{t('rules.board.p1')}</p>
        <p>{t('rules.board.p2', { n: b.elementBonus })}</p>
        <ul className={styles.elementList}>
          {ELEMENTS.map((el) => (
            <li key={el}>
              <span className={styles.elementTag} style={{ background: ELEMENT_COLOR[el], color: el === 'earth' ? 'var(--ink)' : 'var(--paper)' }}>
                <ElementIcon element={el} size={14} weight={14} />
                {t('rules.board.signs', { element: t(`element.${el}`) })}
              </span>
              {SIGNS.filter((_, i) => elementOfSign(i) === el)
                .map((s) => t(`sign.${s}`))
                .join(t('list.sep'))}
            </li>
          ))}
        </ul>
        <h3 className={styles.h3}>{t('rules.board.aheadTitle')}</h3>
        <p>{t('rules.board.ahead')}</p>
        <p>{t('rules.board.leader')}</p>
      </div>
      <div className={styles.boardBox}>
        <Board />
      </div>
    </div>
  );
}

function SetupSection({ t, b }: { t: T; b: BalanceConfig }) {
  const seats: Element[] = ['fire', 'earth', 'air'];
  return (
    <div className={styles.cols}>
      <div className={styles.prose}>
        <ul className={styles.bullets}>
          <li>{t('rules.setup.pieces')}</li>
          <li>{t('rules.setup.character')}</li>
          <li>{t('rules.setup.start', { fp: b.startFp, cards: b.startHand })}</li>
          <li>{t('rules.setup.laps')}</li>
        </ul>
      </div>
      <div className={styles.prose}>
        <h3 className={styles.h3}>{t('rules.order.title')}</h3>
        <p>{t('rules.order.p1')}</p>
        <div className={styles.rotation}>
          {[0, 1, 2].map((r) => (
            <div key={r} className={styles.rotationRow}>
              <span className={styles.rotationLabel}>{t('game.round', { n: r + 1 })}</span>
              {[0, 1, 2].map((k) => {
                const el = seats[(r + k) % 3]!;
                return (
                  <span key={k} className={styles.rotationSeat}>
                    {k > 0 && <span className={styles.arrow}>→</span>}
                    <Piece element={el} size={28} title={t(`player.${el}`)} />
                    {k === 0 && <span className={styles.firstTag}>{t('game.firstShort')}</span>}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <p>{t('rules.order.p2')}</p>
      </div>
    </div>
  );
}

function TurnSection({ t, b }: { t: T; b: BalanceConfig }) {
  const options: [string, MessageKey, string][] = [
    ['A', 'rules.turn.play.a.title', t('rules.turn.play.a', { n: b.resonanceBonus })],
    ['B', 'rules.turn.play.b.title', t('rules.turn.play.b', { n: b.courtDraw })],
    ['C', 'rules.turn.play.c.title', t('rules.turn.play.c', { n: b.skillCost })],
    ['D', 'rules.turn.play.d.title', t('rules.turn.play.d', { cards: b.meditateDraw, fp: b.meditateFp })],
  ];
  const steps: { key: MessageKey; text: string; optional?: boolean; extra?: ReactNode }[] = [
    { key: 'step.draw', text: t('rules.turn.draw', { n: b.drawPerTurn, empty: b.drawWhenEmpty }) },
    {
      key: 'step.play',
      text: t('rules.turn.play'),
      extra: (
        <div className={styles.options}>
          {options.map(([letter, title, text]) => (
            <div key={letter} className={styles.option}>
              <span className={styles.optionLetter}>{letter}</span>
              <div>
                <h4>{t(title)}</h4>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    { key: 'step.flip', text: t('rules.turn.flip', { n: b.flipCost }), optional: true },
    { key: 'step.move', text: t('rules.turn.move', { reroll: b.rerollCost, boost: b.boostCost }) },
    { key: 'step.resolve', text: t('rules.turn.resolve', { eb: b.elementBonus, lap: b.lapBonus }) },
    { key: 'step.end', text: t('rules.turn.end', { n: b.handLimit }) },
  ];
  return (
    <>
      <p className={styles.lead}>{t('rules.turn.intro')}</p>
      <ol className={styles.steps}>
        {steps.map((s, i) => (
          <li key={s.key} className={styles.step}>
            <span className={styles.stepNo}>{i + 1}</span>
            <div className={styles.stepBody}>
              <h3 className={styles.stepName}>
                {t(s.key)}
                {s.optional && <span className={styles.optional}>{t('rules.turn.optional')}</span>}
              </h3>
              <p>{s.text}</p>
              {s.extra}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function SidesSection({ t, b, players }: { t: T; b: BalanceConfig; players: number }) {
  const [turned, setTurned] = useState(false);
  return (
    <>
      <p className={styles.lead}>{t('rules.sides.intro')}</p>
      <div className={styles.sidesGrid}>
        <div className={styles.sideUp}>
          <span className={styles.sideMark} aria-hidden="true">▲</span>
          <h3>{t('rules.sides.up.title')}</h3>
          <p>{t('rules.sides.up')}</p>
        </div>
        <div className={styles.sideDown}>
          <span className={styles.sideMark} aria-hidden="true">▼</span>
          <h3>{t('rules.sides.down.title')}</h3>
          <p>{t('rules.sides.down')}</p>
        </div>
      </div>
      <div className={styles.split}>
        <ul className={`${styles.bullets} ${styles.prose}`}>
          <li>{t('rules.sides.r1')}</li>
          <li>{t('rules.sides.r2')}</li>
          <li>{t('rules.sides.r3')}</li>
          <li>{t('rules.sides.r4', { n: b.leaderBonus })}</li>
        </ul>
        <figure className={styles.example}>
          <div className={styles.exampleCard} style={{ ['--card-w' as string]: '210px' }}>
            <Card id="chariot" balance={b} players={players} turned={turned} />
          </div>
          <figcaption>
            <strong>{t('rules.sides.example')}</strong>
            <span>{t('rules.sides.exampleHint')}</span>
            <Button size="sm" onClick={() => setTurned((v) => !v)}>
              {t('rules.sides.turn')}
            </Button>
          </figcaption>
        </figure>
      </div>
    </>
  );
}

function FuelIcons({ t, els }: { t: T; els: readonly Element[] }) {
  return (
    <span className={styles.fuel} title={t('gallery.needs', { a: t(`element.${els[0]!}`), b: t(`element.${els[1]!}`) })}>
      {els.map((el) => (
        <ElementIcon key={el} element={el} size={16} color={ELEMENT_COLOR[el]} weight={14} />
      ))}
    </span>
  );
}

function CardsSection({ t, b, players, onOpenCards }: { t: T; b: BalanceConfig; players: number; onOpenCards: () => void }) {
  const { lang } = useLang();
  const face = (key: `${string}.${Orientation}`) => renderFace(lang, b, players, key as never);
  return (
    <>
      <p className={styles.lead}>
        {t('rules.cards.deck', { deck: DECK_SIZE, minor: SUITS.length * MINOR_COPIES, court: COURTS.length * COURT_COPIES })}
      </p>

      <h3 className={styles.h3}>{t('rules.cards.minor.title')}</h3>
      <p>{t('rules.cards.minor.intro')}</p>
      <div className={styles.table} role="table">
        {SUITS.map((suit) => {
          const el = SUIT_ELEMENT[suit];
          const up = face(`${suit}.upright`);
          const down = face(`${suit}.reversed`);
          return (
            <div key={suit} className={styles.row} role="row">
              <div className={styles.thumb} role="cell">
                <CardArt id={suit} alt="" />
                <span className={styles.thumbBar} style={{ background: ELEMENT_COLOR[el] }} />
              </div>
              <div className={styles.rowHead} role="cell">
                <strong>{t(`card.${suit}`)}</strong>
                <span className={styles.rowSub}>
                  <ElementIcon element={el} size={14} color={ELEMENT_COLOR[el]} weight={14} /> {t(`element.${el}`)} · {t(`rules.cards.suit.${suit}`)}
                </span>
              </div>
              <div className={styles.faceCell} role="cell">
                <span className={styles.faceMark}>▲ {up.name}</span>
                {up.text}
              </div>
              <div className={styles.faceCell} role="cell">
                <span className={styles.faceMark}>▼ {down.name}</span>
                {down.text}
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.note}>
        {t('rules.cards.resonance', { n: b.resonanceBonus })}
      </p>

      <h3 className={styles.h3}>{t('rules.cards.court.title')}</h3>
      <p>{t('rules.cards.court.intro', { n: b.courtDraw })}</p>
      <div className={styles.table} role="table">
        {COURTS.map((rank) => {
          const up = face(`${rank}.upright`);
          const down = face(`${rank}.reversed`);
          return (
            <div key={rank} className={styles.row} role="row">
              <div className={styles.thumb} role="cell">
                <CardArt id={rank} alt="" />
              </div>
              <div className={styles.rowHead} role="cell">
                <strong>{t(`card.${rank}`)}</strong>
              </div>
              <div className={styles.faceCell} role="cell">
                <span className={styles.faceMark}>
                  ▲ {up.name} <FuelIcons t={t} els={COURT_REQUIRES[rank].upright} />
                </span>
                {up.text}
              </div>
              <div className={styles.faceCell} role="cell">
                <span className={styles.faceMark}>
                  ▼ {down.name} <FuelIcons t={t} els={COURT_REQUIRES[rank].reversed} />
                </span>
                {down.text}
              </div>
            </div>
          );
        })}
      </div>

      <h3 className={styles.h3}>{t('rules.cards.major.title')}</h3>
      <div className={styles.majorRow}>
        <p>{t('rules.cards.major.p', { skill: b.skillCost, flip: b.flipCost })}</p>
        <Button variant="primary" onClick={onOpenCards}>
          {t('rules.cards.gallery')} →
        </Button>
      </div>

      <h3 className={styles.h3}>{t('rules.cards.terms.title')}</h3>
      <ul className={`${styles.bullets} ${styles.prose}`}>
        <li>{t('rules.board.ahead')}</li>
        <li>{t('rules.board.leader')}</li>
        <li>{t('rules.cards.terms.next')}</li>
        <li>{t('rules.cards.terms.start')}</li>
        <li>{t('rules.cards.terms.nextTurn')}</li>
        <li>{t('rules.cards.terms.cap', { cap: b.fpCap })}</li>
      </ul>
    </>
  );
}

function FpSection({ t, b }: { t: T; b: BalanceConfig }) {
  const earn: [MessageKey, number | null][] = [
    ['rules.fp.e.resonance', b.resonanceBonus],
    ['rules.fp.e.element', b.elementBonus],
    ['rules.fp.e.lap', b.lapBonus],
    ['rules.fp.e.meditate', b.meditateFp],
    ['rules.fp.e.trap', b.trapBounty],
    ['rules.fp.e.shield', b.shieldRefund],
    ['rules.fp.e.cards', null],
  ];
  const spend: [MessageKey, number][] = [
    ['rules.fp.s.reroll', b.rerollCost],
    ['rules.fp.s.boost', b.boostCost],
    ['rules.fp.s.flip', b.flipCost],
    ['rules.fp.s.skill', b.skillCost],
  ];
  return (
    <>
      <p className={styles.lead}>{t('rules.fp.intro')}</p>
      <div className={styles.fpGrid}>
        <div className={styles.fpCol}>
          <h3 className={styles.fpHead}>{t('rules.fp.earn')}</h3>
          <ul>
            {earn.map(([k, n]) => (
              <li key={k}>
                <span className={styles.fpAmount}>{n === null ? '+…' : `+${n}`}</span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${styles.fpCol} ${styles.fpSpend}`}>
          <h3 className={styles.fpHead}>{t('rules.fp.spend')}</h3>
          <ul>
            {spend.map(([k, n]) => (
              <li key={k}>
                <span className={styles.fpAmount}>−{n}</span>
                {t(k)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={styles.note}>{t('rules.fp.cap', { cap: b.fpCap })}</p>
    </>
  );
}

const GOOD: StatusKind[] = ['shielded'];
const BAD: StatusKind[] = ['slowed', 'silenced', 'drained', 'stunned', 'rooted', 'wrongTurn'];

function StatusSection({ t, b }: { t: T; b: BalanceConfig }) {
  const n = b.cards['fool.reversed']?.back ?? 2;
  const item = (key: string, good: boolean) => (
    <li key={key} className={good ? styles.statusGood : styles.statusBad}>
      <span className={styles.statusName}>
        {t(`status.${key}` as MessageKey)}
        <span className={styles.statusKind}>{good ? t('rules.status.good') : t('rules.status.bad')}</span>
      </span>
      <span>{t(`status.${key}.desc` as MessageKey, { n })}</span>
    </li>
  );
  return (
    <>
      <ul className={styles.statusGrid}>
        {BAD.map((k) => item(k, false))}
        {GOOD.map((k) => item(k, true))}
        {item('trapImmune', true)}
      </ul>
      <ul className={`${styles.bullets} ${styles.prose}`}>
        <li>{t('rules.status.p1')}</li>
        <li>{t('rules.status.p2')}</li>
      </ul>
    </>
  );
}

export function TrapIcon({ kind, size = 34 }: { kind: TrapKind; size?: number }) {
  return (
    <svg viewBox="-30 -30 60 60" width={size} height={size} aria-hidden="true">
      <rect x={-19} y={-19} width={38} height={38} transform="rotate(45)" fill="var(--ink)" />
      <path d={TRAP_PATHS[kind]} transform="translate(-12 -12) scale(0.24)" fill="none" stroke="var(--paper)" strokeWidth={11} strokeLinejoin="round" />
    </svg>
  );
}

function TrapSection({ t, b }: { t: T; b: BalanceConfig }) {
  const lead = b.leaderBonus;
  const reach = b.trapReach > 0 ? b.trapReach : 12;
  return (
    <>
      <div className={styles.traps}>
        <div className={styles.trap}>
          <TrapIcon kind="chain" />
          <div>
            <h3>{t('trap.chain')}</h3>
            <p>{t('rules.trap.chain', { fp: b.chainFpLoss, lead: b.chainFpLoss + lead })}</p>
          </div>
        </div>
        <div className={styles.trap}>
          <TrapIcon kind="illusion" />
          <div>
            <h3>{t('trap.illusion')}</h3>
            <p>{t('rules.trap.illusion', { back: b.illusionBack, lead: b.illusionBack + lead })}</p>
          </div>
        </div>
      </div>
      <ul className={`${styles.bullets} ${styles.prose}`}>
        <li>{t('rules.trap.p1', { reach, max: b.maxTraps })}</li>
        <li>{t('rules.trap.p2')}</li>
        <li>{t('rules.trap.p3', { n: b.trapBounty })}</li>
      </ul>
    </>
  );
}

function WinSection({ t, laps }: { t: T; laps: number }) {
  return (
    <div className={`${styles.prose} ${styles.win}`}>
      <p>{t('rules.win.p1', { laps })}</p>
      <p>{t('rules.win.p2')}</p>
    </div>
  );
}

function ScreenSection({ t }: { t: T }) {
  const keys: MessageKey[] = [
    'rules.screen.cards',
    'rules.screen.grey',
    'rules.screen.hotseat',
    'rules.screen.computer',
    'rules.screen.lang',
    'rules.screen.sound',
    'rules.screen.log',
    'rules.screen.rules',
  ];
  return (
    <ul className={`${styles.bullets} ${styles.prose}`}>
      {keys.map((k) => (
        <li key={k}>{t(k)}</li>
      ))}
    </ul>
  );
}

/** The How to Play page (outside a game): standard numbers, 3 laps. */
export function HowToPlayPage() {
  const [b] = useState(defaultBalance);
  return (
    <div className={styles.page}>
      <SiteNav page="rules" />
      <RulesContent balance={b} laps={3} onOpenCards={() => (window.location.hash = PAGE_HASH.cards)} />
    </div>
  );
}
