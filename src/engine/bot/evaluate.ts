// Rule §12: how the computer values a game state, from one player's point of view.
import { isLeading, player } from '../core/context';
import { isActive } from '../rules/status';
import type { GameState, PlayerId, PlayerState, Status, StatusKind } from '../types';

/** Rule §12 weights (points). */
export interface BotWeights {
  space: number; oppSpace: number; oppSpace2p: number; nonLeaderFactor: number; fp: number; card: number;
  leadBias: number; shieldWhenLeading: number; trap: number; trapHitChance: number; finalRoundResources: number; boostKeep: number;
  /** Multiplier on the value of opponents' statuses (1 = rule §10 values). */
  oppStatusFactor: number;
}

/**
 * Decision D-54: a tournament of computer players (one tuned against standard ones) showed that rule §12's
 * 1.5 points for an opponent's space and the full §10 status values overrate attacks in 3–4
 * player games. These defaults won 37% of 3-player games against the rulebook weights (fair 33%).
 */
export const W: BotWeights = {
  space: 2,
  oppSpace: 1.0,
  oppSpace2p: 2,
  /** Rule §12 'target the leader first': the leader counts the full 1.5, the others less. */
  nonLeaderFactor: 0.75,
  fp: 0.5,
  card: 0.5,
  /** Rule §12: favour upright / shields when leading, reversed when behind. */
  leadBias: 1.15,
  shieldWhenLeading: 1.5,
  /** A trap of yours on the board: about 3 spaces of harm × a 40% chance to be hit × 1.5. */
  trap: 1.8,
  /** v5 traps spring when passed: the chance one is sprung before the game ends. */
  trapHitChance: 0.85,
  /** In the final round FP, cards and later statuses barely matter. */
  finalRoundResources: 0.3,
  /** Decision D-53: boost whenever at least this many FP remain afterwards (unused FP are wasted). */
  boostKeep: 3,
  oppStatusFactor: 0.5,
};

/** The exact weights of rule §12 (kept for comparison). */
export const RULEBOOK_WEIGHTS: BotWeights = { ...W, oppSpace: 1.5, oppStatusFactor: 1 };

/** Rule §10: status values in spaces (Wrong Turn: −1 instead of about +2). */
export const STATUS_SPACES: Record<StatusKind, number> = {
  rooted: 2,
  stunned: 1.5,
  slowed: 1,
  silenced: 1,
  drained: 1,
  wrongTurn: 3,
  shielded: 1,
};

export const ADVANTAGE_ROLL = 22 / 9; // E[max of two 1..3 dice]

export interface Perspective {
  me: PlayerId;
  w: BotWeights;
  /** Points per space for each opponent (the leader counts more). */
  oppSpace: number[];
  leading: boolean;
}

export function perspective(s: GameState, me: PlayerId, w: BotWeights = W): Perspective {
  const base = s.players.length === 2 ? w.oppSpace2p : w.oppSpace;
  const top = Math.max(...s.players.map((p) => p.progress));
  const oppSpace = s.players.map((p) => (p.id === me ? 0 : base * (p.progress === top ? 1 : w.nonLeaderFactor)));
  return { me, w, oppSpace, leading: isLeading(s, me) };
}

/** Own turns of `q` still to come that a status covers. */
function futureTurns(s: GameState, q: PlayerState, st: Status): number {
  const isCurrent = s.turn.player === q.id && s.turn.step !== 'over';
  if (st.kind === 'wrongTurn') {
    // Consumed this turn already counts in expectedMove.
    if (isCurrent && st.from <= q.turnNo) return 0;
    return 1;
  }
  const next = q.turnNo + 1;
  return Math.max(0, st.until - Math.max(st.from, next) + 1);
}

/** Status value of a player in spaces: + for their shield, − for negative statuses. */
function statusSpaces(s: GameState, q: PlayerState, shieldValue: number): number {
  let v = 0;
  for (const st of q.statuses) {
    if (st.kind === 'shielded') v += shieldValue;
    // Wrong Turn: about 2 spaces not gained plus the spaces lost (its amount, rules v5).
    else if (st.kind === 'wrongTurn' && st.amount !== undefined) v -= (st.amount + 2) * futureTurns(s, q, st);
    else v -= STATUS_SPACES[st.kind] * futureTurns(s, q, st);
  }
  return v;
}

/** Expected spaces of the current player's Move step if it has not happened yet. */
export function expectedMove(s: GameState, id: PlayerId): number {
  const t = s.turn;
  if (t.player !== id || (t.step !== 'play' && t.step !== 'flip')) return 0;
  const p = player(s, id);
  if (t.skipMove || isActive(p, 'rooted')) return 0;
  const wrong = p.statuses.find((st) => st.kind === 'wrongTurn');
  if (wrong && wrong.from <= p.turnNo) return -(wrong.amount ?? s.config.balance.cards['fool.reversed'].back!);
  if (isActive(p, 'slowed')) return 1;
  if (t.rollMode === 'fixed3') return s.config.balance.cards['emperor.upright'].roll!;
  if (t.rollMode === 'advantage') return ADVANTAGE_ROLL;
  const die = s.config.balance.die;
  return die.reduce((a, b) => a + b, 0) / die.length;
}

/**
 * Expected value of one of your traps. v3/v4 (spring when stopped on): a fixed estimate. v5 (spring when
 * passed): nearly always sprung on the leader, so its harm in the leader's weights plus the FP bounty.
 */
export function trapWorth(s: GameState, kind: 'chain' | 'illusion', P: Perspective): number {
  const b = s.config.balance;
  if (!b.trapOnPass) return P.w.trap;
  const top = Math.max(...P.oppSpace);
  const harm = kind === 'illusion'
    ? (b.illusionBack + b.leaderBonus) * top
    : (b.chainRootedTurns * STATUS_SPACES.rooted * P.w.oppStatusFactor + (b.chainFpLoss + b.leaderBonus) * P.w.fp / 2) * top;
  return P.w.trapHitChance * harm + P.w.fp * b.trapBounty;
}

/** Score of a state for `P.me`. Only differences between states matter. */
export function score(s: GameState, P: Perspective): number {
  const limit = s.config.balance.handLimit;
  const W = P.w;
  const res = s.finalRound ? W.finalRoundResources : 1;
  let v = 0;
  for (const q of s.players) {
    const cards = Math.min(q.hand.length, limit);
    if (q.id === P.me) {
      const shield = P.leading ? W.shieldWhenLeading : 1;
      v += W.space * q.progress;
      v += res * (W.fp * q.fp + W.card * cards);
      v += res * W.space * statusSpaces(s, q, shield);
      v += W.space * expectedMove(s, q.id);
    } else {
      const w = P.oppSpace[q.id]!;
      const wRes = W.fp * (w / W.space);
      v -= w * q.progress;
      v -= res * wRes * (q.fp + cards);
      v -= res * w * W.oppStatusFactor * statusSpaces(s, q, 1);
    }
  }
  for (const t of s.traps) if (t.owner === P.me) v += res * trapWorth(s, t.kind, P);
  return v;
}
