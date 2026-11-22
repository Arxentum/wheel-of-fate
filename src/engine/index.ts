// Public API of the engine. Pure TypeScript: no DOM, no Node APIs.
export * from './types';
export { createGame, validateSetup } from './core/setup';
export { applyAction, applyActionMut, IllegalActionError, whoDecides } from './core/apply';
export { checkAction, checkSkillBase, checkFaceChoice, checkFuel, hasFuel, checkMinorFace } from './core/check';
export { enumerateActions, skillChoices } from './core/enumerate';
export { cloneState } from './core/clone';
export { canBoost, canReroll } from './core/flow';
export { isLeading, leadersAmong, othersOf, playersAhead } from './core/context';
export { defaultBalance, applyBalancePatch } from './data/balance';
export * from './data/board';
export * from './data/cards';
export { isActive, hasShield, statusOf, NEGATIVE_STATUSES, FOREVER } from './rules/status';
export { trapAt } from './rules/trap';
export { canSpend } from './rules/fp';
export { chooseAiAction, chooseAmong } from './ai/bot';
export { W as AI_WEIGHTS, RULEBOOK_WEIGHTS as RULEBOOK_AI_WEIGHTS, type AiWeights } from './ai/evaluate';
