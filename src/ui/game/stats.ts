import type { GameEvent, PlayerId } from '../../engine';

/** What each player did in a game, for the results screen. */
export interface PlayerStats {
  /** Cards and skills played (meditating not counted). */
  played: number;
  /** Times this player pushed someone back (a card, a skill or their trap). */
  hits: number;
  /** Spaces this player lost to other players. */
  lost: number;
  /** Fate Points gained. */
  gained: number;
  /** This player's traps that sprung on someone. */
  traps: number;
}

export interface GameStats {
  players: PlayerStats[];
  /** Each player's progress at the start, after every round and at the end. */
  progress: number[][];
}

/** Statistics from the events of a whole game (in the order they happened). */
export function gameStats(events: readonly GameEvent[], players: number): GameStats {
  const stats: PlayerStats[] = Array.from({ length: players }, () => ({ played: 0, hits: 0, lost: 0, gained: 0, traps: 0 }));
  const now = Array.from({ length: players }, () => 0);
  const progress = now.map(() => [0]);
  let round = 1;
  /** Who is acting right now (for pushes), and whose trap just sprung. */
  let actor: PlayerId | null = null;
  let trapOwner: PlayerId | null = null;

  for (const e of events) {
    switch (e.t) {
      case 'turnStart':
        if (e.round > round) {
          round = e.round;
          now.forEach((v, p) => progress[p]!.push(v));
        }
        actor = e.p;
        break;
      case 'play':
        actor = e.p;
        if (e.kind !== 'meditate') stats[e.p]!.played++;
        break;
      case 'trapTrigger':
        trapOwner = e.trap.owner;
        if (e.trap.owner !== e.p) stats[e.trap.owner]!.traps++;
        break;
      case 'move': {
        if (e.to < e.from) {
          const by = e.cause === 'trap' ? trapOwner : e.cause === 'card' || e.cause === 'push' ? actor : null;
          if (by !== null && by !== e.p) {
            stats[e.p]!.lost += e.from - e.to;
            stats[by]!.hits++;
          }
        }
        now[e.p] = e.to;
        break;
      }
      case 'fp':
        if (e.delta > 0) stats[e.p]!.gained += e.delta;
        break;
      case 'gameOver':
        now.forEach((v, p) => progress[p]!.push(v));
        break;
      default:
        break;
    }
  }
  return { players: stats, progress };
}
