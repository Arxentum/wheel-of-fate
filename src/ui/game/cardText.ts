import type { BalanceConfig, FaceKey } from '../../engine';
import { translate, type Lang, type MessageKey, type Params } from '../../i18n';

/**
 * Card texts are dictionary templates filled with the game's own numbers, so a balance
 * change or a 2-player override (balance.cards2p, merged at createGame) shows up on the
 * cards by itself. Character reversed faces add a "(the leader: …)" clause only when the
 * leader bonus applies (3–4 players, rules v5).
 */
export interface FaceText {
  name: MessageKey;
  text: MessageKey;
  params: Params;
}

type Derive = (p: Record<string, number>, lead: number, b: BalanceConfig) => Params;

/** Base number + the leader bonus, for faces whose main number grows against the leader. */
const backFace: Derive = (p, lead) => {
  const back = (p.back ?? 0) + (p.extra ?? 0);
  return { back, lead: back + lead };
};
/** Faces where only the bonus moves the target ("the leader also moves back N"). */
const bonusOnly: Derive = (p, lead) => ({ lead: (p.extra ?? 0) + lead });

const DERIVED: Partial<Record<FaceKey, Derive>> = {
  'fool.reversed': backFace,
  'magician.reversed': backFace,
  'highPriestess.reversed': backFace,
  'empress.reversed': (p, lead) => ({ back: p.extra ?? 0, lead: (p.extra ?? 0) + lead }),
  'emperor.reversed': backFace,
  'hierophant.reversed': bonusOnly,
  'lovers.reversed': (p, lead) => ({ more: p.extra ?? 0, lead: (p.extra ?? 0) + lead }),
  'chariot.reversed': backFace,
  'strength.reversed': backFace,
  'hermit.reversed': backFace,
  'wheelOfFortune.reversed': bonusOnly,
  'justice.reversed': backFace,
  'hangedMan.reversed': bonusOnly,
  'death.reversed': backFace,
  'temperance.reversed': (p, lead) => ({ back: p.extra ?? 0, turns: p.slowedTurns ?? 0, lead: (p.slowedTurns ?? 0) + lead }),
  'devil.reversed': (_p, lead, b) => ({ reach: reach(b), fpLoss: b.chainFpLoss, lead: b.chainFpLoss + lead }),
  'tower.reversed': backFace,
  'star.reversed': backFace,
  'moon.reversed': (_p, lead, b) => ({ reach: reach(b), back: b.illusionBack, lead: b.illusionBack + lead }),
  'sun.reversed': backFace,
  'judgement.reversed': bonusOnly,
  'world.reversed': bonusOnly,
};

function reach(b: BalanceConfig): string {
  return b.trapReach > 0 ? `1–${b.trapReach}` : '1–12';
}

/** Faces that carry a leader clause (the character reversed faces of rules v5). */
const HAS_LEADER = new Set<FaceKey>(Object.keys(DERIVED) as FaceKey[]);

/** The leader bonus that applies in this game (none in a 2-player game). */
export function leaderBonusFor(b: BalanceConfig, players: number): number {
  return b.majorReversedV5 && players >= 3 ? b.leaderBonus : 0;
}

export function faceText(b: BalanceConfig, players: number, key: FaceKey): FaceText & { leader: FaceText | null } {
  const raw = b.cards[key] ?? {};
  const bonus = leaderBonusFor(b, players);
  const derived = DERIVED[key]?.(raw, bonus, b) ?? {};
  const params: Params = { ...raw, ...derived };
  const leader: FaceText | null =
    HAS_LEADER.has(key) && bonus > 0
      ? { name: `face.${key}.name` as MessageKey, text: `face.${key}.leader` as MessageKey, params }
      : null;
  return { name: `face.${key}.name` as MessageKey, text: `face.${key}.text` as MessageKey, params, leader };
}

/** Every face key that has a leader clause in the dictionaries. */
export const LEADER_FACES: readonly FaceKey[] = [...HAS_LEADER];

/** A face's skill name and effect text in one language, numbers and leader clause filled in. */
export function renderFace(lang: Lang, b: BalanceConfig, players: number, key: FaceKey): { name: string; text: string } {
  const f = faceText(b, players, key);
  const leader = f.leader ? translate(lang, f.leader.text, f.leader.params) : '';
  return { name: translate(lang, f.name), text: translate(lang, f.text, { ...f.params, leader }) };
}
