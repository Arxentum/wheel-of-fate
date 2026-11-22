import type { FaceKey, GameState } from '../types';
import { REVERSED_V5 } from './reversedV5';
import { FACES } from '../data/cards';
import { COURT_HANDLERS } from './court';
import { MAJOR_HANDLERS } from './major';
import { MINOR_HANDLERS, type Handler } from './minor';

export type { Handler } from './minor';

/** The effect of a face under the game's rules (v5 character reversed faces when enabled). */
export function handlerFor(s: GameState, key: FaceKey): Handler {
  return (s.config.balance.majorReversedV5 && REVERSED_V5[key]) || HANDLERS[key];
}

export const HANDLERS: Record<FaceKey, Handler> = (() => {
  const all = { ...MINOR_HANDLERS, ...COURT_HANDLERS, ...MAJOR_HANDLERS };
  for (const key of Object.keys(FACES) as FaceKey[]) {
    if (!all[key]) throw new Error(`no handler for ${key}`);
  }
  return all as Record<FaceKey, Handler>;
})();
