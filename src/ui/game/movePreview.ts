import { canBoost, type GameState, type PlayerId } from '../../engine';
import type { MovePreview } from '../components/boardGeometry';

/**
 * What the board marks while a player chooses how to move: the signs walked, the landing
 * sign, the landing sign with a boost (if a boost is still possible) and the traps of other
 * players on the way, which would spring (unless the player is immune to traps).
 */
export function movePreviewFor(s: GameState, id: PlayerId): MovePreview | null {
  const p = s.players[id]!;
  const roll = s.turn.roll;
  if (!roll) return null;
  const steps = roll.value + (s.turn.boosted ? 1 : 0);
  if (steps <= 0) return null;
  const sign = (n: number) => ((n % 12) + 12) % 12;
  const path = Array.from({ length: steps }, (_, i) => sign(p.progress + i + 1));
  const boost = canBoost(s);
  const immune = p.trapImmuneTurn !== null && p.trapImmuneTurn >= p.turnNo;
  const reach = boost ? [...path, sign(p.progress + steps + 1)] : path;
  const danger = immune ? [] : s.traps.filter((t) => t.owner !== id && reach.includes(t.sign)).map((t) => t.sign);
  return { path, land: sign(p.progress + steps), ...(boost ? { boostLand: sign(p.progress + steps + 1) } : {}), danger };
}
