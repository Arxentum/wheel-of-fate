import type { GameResult, GameState, PlayerId } from '../types';

/** Rule §8 / decision D-38: highest progress wins, then FP; still tied = shared win. */
export function computeResult(s: GameState): GameResult {
  const ids = s.players.map((p) => p.id);
  ids.sort((a, b) => {
    const pa = s.players[a]!, pb = s.players[b]!;
    return pb.progress - pa.progress || pb.fp - pa.fp;
  });
  const ranking: PlayerId[][] = [];
  for (const id of ids) {
    const last = ranking[ranking.length - 1];
    const ref = last ? s.players[last[0]!]! : null;
    const p = s.players[id]!;
    if (ref && ref.progress === p.progress && ref.fp === p.fp) last!.push(id);
    else ranking.push([id]);
  }
  return { ranking, winners: [...ranking[0]!], rounds: s.round };
}
