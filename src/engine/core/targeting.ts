import { FACES } from '../data/cards';
import type { FaceKey, GameState, PlayerId, SkillChoice, Targeting } from '../types';
import { playersAhead } from './context';
import { V5_ONE_AHEAD } from '../effects/reversedV5';

/** Faces that keep their single target even with balance.reversedAhead (they need a choice about one player). */
const KEEP_SINGLE: ReadonlySet<FaceKey> = new Set<FaceKey>(['highPriestess.reversed', 'lovers.reversed']);

/** Targeting of a face under the game's balance options. */
export function faceTargeting(s: GameState, key: FaceKey): Targeting {
  if (s.config.balance.majorReversedV5) {
    if (V5_ONE_AHEAD.has(key)) return 'aheadOne';
    if (key === 'world.reversed') return 'ahead';
  }
  const t = FACES[key].targeting;
  if (t === 'other' && key.endsWith('.reversed') && s.config.balance.reversedAhead && !KEEP_SINGLE.has(key)) return 'ahead';
  return t;
}

/** The players a single-target face hits: the chosen one, or everyone ahead of the actor. */
export function targetsFor(s: GameState, actor: PlayerId, choice: SkillChoice, key: FaceKey): PlayerId[] {
  if (faceTargeting(s, key) === 'ahead') return playersAhead(s, actor);
  if (choice.target === undefined) throw new Error('target missing');
  return [choice.target];
}
