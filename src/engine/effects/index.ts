import type { FaceKey } from '../types';
import { FACES } from '../data/cards';
import { COURT_HANDLERS } from './court';
import { MAJOR_HANDLERS } from './major';
import { MINOR_HANDLERS, type Handler } from './minor';

export type { Handler } from './minor';

export const HANDLERS: Record<FaceKey, Handler> = (() => {
  const all = { ...MINOR_HANDLERS, ...COURT_HANDLERS, ...MAJOR_HANDLERS };
  for (const key of Object.keys(FACES) as FaceKey[]) {
    if (!all[key]) throw new Error(`no handler for ${key}`);
  }
  return all as Record<FaceKey, Handler>;
})();
