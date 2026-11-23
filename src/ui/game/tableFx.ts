import type { GameEvent, PlayerId, StatusKind, TrapKind } from '../../engine';

/**
 * What the table shows for a moment while an action plays back: small notes floating up
 * from a player's panel ("+2 FP", "Slowed"), and a banner when a new round or your turn
 * begins. Plain data; the screen turns it into text.
 */

export type FloatSpec =
  | { kind: 'fp'; n: number }
  | { kind: 'cards'; n: number }
  | { kind: 'status'; status: StatusKind }
  | { kind: 'lap'; lap: number }
  | { kind: 'trap'; trap: TrapKind }
  | { kind: 'blocked' };

/** The notes one event puts on players' panels. */
export function floatsFor(e: GameEvent): { p: PlayerId; spec: FloatSpec }[] {
  switch (e.t) {
    case 'fp':
      return e.delta === 0 ? [] : [{ p: e.p, spec: { kind: 'fp', n: e.delta } }];
    case 'status':
      return [{ p: e.p, spec: { kind: 'status', status: e.kind } }];
    case 'lap':
      return [{ p: e.p, spec: { kind: 'lap', lap: e.lap } }];
    case 'draw':
      // The everyday draw of one card is not news; an effect drawing several is.
      return e.n >= 2 ? [{ p: e.p, spec: { kind: 'cards', n: e.n } }] : [];
    case 'discard':
      return e.reason === 'random' || e.reason === 'chosen' || e.reason === 'whole' ? [{ p: e.p, spec: { kind: 'cards', n: -e.cards.length } }] : [];
    case 'steal':
      return e.what === 'card'
        ? [
            { p: e.from, spec: { kind: 'cards', n: -e.n } },
            { p: e.to, spec: { kind: 'cards', n: e.n } },
          ]
        : [];
    case 'trapTrigger':
      return [{ p: e.p, spec: { kind: 'trap', trap: e.trap.kind } }];
    case 'shieldBlock':
      return [{ p: e.p, spec: { kind: 'blocked' } }];
    default:
      return [];
  }
}

export type BannerSpec =
  /** A new round: who goes first, and whether they also played the last turn (2 players). */
  | { kind: 'round'; round: number; first: PlayerId; again: boolean }
  /** The only person at the table is up. */
  | { kind: 'turn'; p: PlayerId };

export interface TurnMark {
  round: number;
  player: PlayerId;
}

/**
 * The banner a turn start brings, given the turn before it. Round 1 needs none (the game
 * just started); with several people at the table the hand-over screen already says whose
 * turn it is.
 */
export function bannerFor(e: GameEvent, prev: TurnMark | null, humans: readonly PlayerId[]): BannerSpec | null {
  if (e.t !== 'turnStart') return null;
  if (prev && e.round > prev.round) return { kind: 'round', round: e.round, first: e.p, again: prev.player === e.p };
  if (humans.length === 1 && humans[0] === e.p) return { kind: 'turn', p: e.p };
  return null;
}

/** The latest card or action played in the turn that is on screen (null before the Play step). */
export function lastPlay(events: readonly GameEvent[], player: PlayerId): Extract<GameEvent, { t: 'play' }> | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (e.t === 'turnStart') return null;
    if (e.t === 'play' && e.p === player) return e;
  }
  return null;
}

/**
 * The turn the playback has reached: the last turn start shown. The panels switch to the
 * new state only when a whole action has played back, so this runs ahead of them.
 */
export function turnOnScreen(events: readonly GameEvent[]): { p: PlayerId; round: number } | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]!;
    if (e.t === 'turnStart') return { p: e.p, round: e.round };
  }
  return null;
}
