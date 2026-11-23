import {
  DECK_SIZE, applyActionMut, cardDef, createGame, lapOf,
  type Action, type BalancePatch, type CardUid, type Element, type FateCardId, type GameEvent,
  type GameState, type MajorId, type Orientation, type PlayerId, type SkillChoice, type Status, type Trap,
} from '../src/engine';
import { freshTurn } from '../src/engine/core/flow';

export interface PSpec {
  element?: Element;
  major?: MajorId;
  orientation?: Orientation;
  progress?: number;
  fp?: number;
  hand?: FateCardId[];
  statuses?: Status[];
  turnNo?: number;
  lastSkillTurn?: number | null;
}

export interface Spec {
  players?: PSpec[];
  laps?: number;
  current?: PlayerId;
  /** Top of the deck first. */
  deckTop?: FateCardId[];
  traps?: Trap[];
  balance?: BalancePatch;
  seed?: string;
}

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];
const DEFAULT_MAJORS: MajorId[] = ['chariot', 'sun', 'empress', 'hermit'];

/**
 * A precise game situation: the given hands, positions and statuses, the current player
 * at the start of the Play step. Players default to fire, earth, air order (ids = turn order).
 */
export function scenario(spec: Spec = {}): GameState {
  const specs = spec.players ?? [{}, {}, {}];
  const { state: s } = createGame(
    {
      laps: spec.laps ?? 2,
      balance: spec.balance,
      players: specs.map((p, i) => ({
        controller: 'computer',
        element: p.element ?? ELEMENTS[i]!,
        major: p.major ?? DEFAULT_MAJORS[i]!,
        orientation: p.orientation ?? 'upright',
      })),
    },
    spec.seed ?? 'test',
  );

  const pool = new Map<FateCardId, CardUid[]>();
  for (let u = 0; u < DECK_SIZE; u++) {
    const d = cardDef(u);
    pool.set(d, [...(pool.get(d) ?? []), u]);
  }
  const take = (d: FateCardId): CardUid => {
    const list = pool.get(d)!;
    if (list.length === 0) throw new Error(`no ${d} left`);
    return list.shift()!;
  };

  s.players.forEach((p, i) => {
    const ps = specs[i]!;
    p.hand = (ps.hand ?? []).map(take);
    p.progress = ps.progress ?? 0;
    p.lapsRewarded = lapOf(p.progress);
    p.fp = ps.fp ?? 3;
    p.statuses = (ps.statuses ?? []).map((st) => ({ ...st }));
    p.turnNo = ps.turnNo ?? 1;
    p.lastSkillTurn = ps.lastSkillTurn ?? null;
  });
  const top = (spec.deckTop ?? []).map(take);
  const rest = [...pool.values()].flat().sort((a, b) => a - b);
  s.deck = [...rest, ...top.reverse()];
  s.discard = [];
  s.traps = (spec.traps ?? []).map((t) => ({ ...t }));
  s.trapSeq = s.traps.length;
  s.round = 1;
  s.finalRound = false;
  const cur = spec.current ?? 0;
  s.turn = { ...freshTurn(cur), step: 'play' };
  s.pending = { kind: 'chooseAction', player: cur };
  return s;
}

/** Applies an action; by default stops right after the Play step. */
export function act(s: GameState, a: Action, halt = true): GameEvent[] {
  return applyActionMut(s, a, { haltAfterPlay: halt });
}

/** Test-only: reopens the Play step of the current player (to play several cards in a row). */
export function resume(s: GameState, id: PlayerId = s.turn.player): void {
  s.turn = { ...freshTurn(id), step: 'play' };
  s.pending = { kind: 'chooseAction', player: id };
}

export function uid(s: GameState, id: PlayerId, d: FateCardId, nth = 0): CardUid {
  const found = s.players[id]!.hand.filter((u) => cardDef(u) === d);
  if (found.length <= nth) throw new Error(`player ${id} has no ${d}`);
  return found[nth]!;
}

export function handDefs(s: GameState, id: PlayerId): FateCardId[] {
  return s.players[id]!.hand.map(cardDef).sort();
}

export function playMinor(s: GameState, d: FateCardId, o: Orientation, target?: PlayerId, halt = true): GameEvent[] {
  const card = uid(s, s.turn.player, d);
  return act(s, { type: 'playMinor', card, orientation: o, ...(target !== undefined ? { target } : {}) }, halt);
}

export function skill(s: GameState, choice: SkillChoice = {}, halt = true): GameEvent[] {
  return act(s, { type: 'useSkill', choice }, halt);
}

/** Answers flip / move / discard decisions plainly until `stop` holds or a Play step comes up. */
export function autoUntil(s: GameState, stop: (s: GameState) => boolean = () => false): GameEvent[] {
  const all: GameEvent[] = [];
  let guard = 0;
  while (s.pending && !stop(s)) {
    const d = s.pending;
    let a: Action;
    if (d.kind === 'flip') a = { type: 'flip', flip: false };
    else if (d.kind === 'move') a = { type: 'confirmMove' };
    else if (d.kind === 'discardToLimit') a = { type: 'discard', cards: s.players[d.player]!.hand.slice(0, d.count) };
    else break;
    all.push(...applyActionMut(s, a));
    if (++guard > 100) throw new Error('autoUntil did not stop');
  }
  return all;
}

export function ofType<T extends GameEvent['t']>(events: GameEvent[], t: T): Extract<GameEvent, { t: T }>[] {
  return events.filter((e): e is Extract<GameEvent, { t: T }> => e.t === t);
}

/** Every fate card is in exactly one place. */
export function cardLocations(s: GameState): CardUid[] {
  const all = [...s.deck, ...s.discard, ...s.players.flatMap((p) => p.hand)];
  const d = s.pending;
  if (d?.kind === 'foresight') all.push(...d.cards);
  if (d?.kind === 'wheelTarget') all.push(d.card);
  return all;
}

export function status(kind: Status['kind'], from: number, until: number, source: Status['source'] = 'trap'): Status {
  return { kind, from, until, source };
}
