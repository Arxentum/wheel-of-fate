import { applyBalancePatch, balanceForPlayers, defaultBalance } from '../data/balance';
import { BOARD_SIZE, ELEMENT_ORDER } from '../data/board';
import { DECK_SIZE, MAJORS } from '../data/cards';
import { drawCards } from '../rules/deck';
import type { GameEvent, GameSetup, GameState, MajorId, Orientation, PlayerState } from '../types';
import { makeCtx, emit } from './context';
import { freshTurn, startTurn } from './flow';
import { nextFloat, seedFromString, shuffle } from './rng';

export function validateSetup(setup: GameSetup): void {
  const n = setup.players.length;
  if (n < 2 || n > 4) throw new Error('2-4 players');
  const elements = setup.players.map((p) => p.element);
  if (new Set(elements).size !== n) throw new Error('each player needs a different element');
  if (!Number.isInteger(setup.laps) || setup.laps < 1) throw new Error('laps must be a positive integer');
  const fixed = setup.players.map((p) => p.major).filter((m): m is MajorId => !!m);
  if (new Set(fixed).size !== fixed.length) throw new Error('characters must differ');
}

/** Rule §4: pieces on Aries, a random character each (random side), 3 FP, 3 cards. */
export function createGame(setup: GameSetup, seed: string | number): { state: GameState; events: GameEvent[] } {
  validateSetup(setup);
  const seedText = String(seed);
  const rng = seedFromString(seedText);
  const balance = balanceForPlayers(applyBalancePatch(defaultBalance(), setup.balance), setup.players.length);

  const deck = shuffle(rng, Array.from({ length: DECK_SIZE }, (_, i) => i));
  const taken = new Set(setup.players.map((p) => p.major).filter(Boolean));
  const pool = shuffle(rng, MAJORS.filter((m) => !taken.has(m)));

  const players: PlayerState[] = setup.players.map((ps, id) => {
    const major = ps.major ?? pool.pop()!;
    const orientation: Orientation = ps.orientation ?? (nextFloat(rng) < 0.5 ? 'upright' : 'reversed');
    return {
      id,
      controller: ps.controller,
      element: ps.element,
      progress: 0,
      lapsRewarded: 0,
      fp: balance.startFp,
      hand: [],
      major,
      orientation,
      statuses: [],
      turnNo: 0,
      lastSkillTurn: null,
      onceUsed: { upright: false, reversed: false },
      trapImmuneTurn: null,
    };
  });
  const order = players.map((p) => p.id).sort((a, b) => ELEMENT_ORDER[players[a]!.element] - ELEMENT_ORDER[players[b]!.element]);

  // Optional seat compensation (balance.startProgressBySeat / startFpBySeat).
  order.forEach((id, seat) => {
    const p = players[id]!;
    p.progress += balance.startProgressBySeat[seat] ?? 0;
    p.fp = Math.min(balance.fpCap, p.fp + (balance.startFpBySeat[seat] ?? 0));
  });

  const state: GameState = {
    schema: 1,
    seed: seedText,
    rng,
    config: { laps: setup.laps, finish: BOARD_SIZE * setup.laps, balance },
    players,
    order,
    round: 1,
    turn: freshTurn(order[0]!),
    deck,
    discard: [],
    traps: [],
    trapSeq: 0,
    finalRound: false,
    pending: null,
    result: null,
  };

  const ctx = makeCtx(state);
  emit(ctx, { t: 'gameStart', order: [...order], laps: setup.laps });
  for (const id of order) drawCards(ctx, id, balance.startHand);
  startTurn(ctx, order[0]!);
  return { state, events: ctx.ev };
}
