import type { Decision, GameState } from '../types';

function cloneDecision(d: Decision | null): Decision | null {
  if (!d) return null;
  switch (d.kind) {
    case 'foresight':
      return { ...d, cards: [...d.cards] };
    case 'wheelTarget':
      return { ...d, queue: [...d.queue] };
    default:
      return { ...d };
  }
}

/**
 * Fast deep copy. `config` and `order` are never mutated, `result` is final once set,
 * so they are shared.
 */
export function cloneState(s: GameState): GameState {
  return {
    schema: s.schema,
    seed: s.seed,
    rng: [s.rng[0], s.rng[1], s.rng[2], s.rng[3]],
    config: s.config,
    players: s.players.map((p) => ({
      ...p,
      hand: [...p.hand],
      statuses: p.statuses.map((st) => ({ ...st })),
      onceUsed: { ...p.onceUsed },
    })),
    order: s.order,
    round: s.round,
    turn: { ...s.turn, roll: s.turn.roll ? { ...s.turn.roll, dice: [...s.turn.roll.dice] } : null },
    deck: [...s.deck],
    discard: [...s.discard],
    traps: s.traps.map((t) => ({ ...t })),
    trapSeq: s.trapSeq,
    finalRound: s.finalRound,
    pending: cloneDecision(s.pending),
    result: s.result,
  };
}
