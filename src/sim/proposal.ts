import type { BalancePatch } from '../engine';

/**
 * Room for the next balance proposal: a patch over the current defaults (rulebook v4) that
 * `npm run sim -- --players 3 --laps 3 --proposal` runs. The M1 proposal was accepted on
 * 2026-11-22 and is now the default (decision D-58); this one is empty.
 */
export const PROPOSAL: BalancePatch = {};
