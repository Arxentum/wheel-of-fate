// Rule §12: the single-difficulty computer player.
import { applyActionMut } from '../core/apply';
import { checkAction, checkSkillBase, hasFuel } from '../core/check';
import { cloneState } from '../core/clone';
import { othersOf, player } from '../core/context';
import { enumerateActions, skillChoices } from '../core/enumerate';
import { canBoost, canReroll, freshTurn } from '../core/flow';
import { deriveRng, shuffle } from '../core/rng';
import { signOf } from '../data/board';
import { FACES, ONCE_PER_GAME, ORIENTATIONS, cardDef, faceKey, isCourt, isSuit } from '../data/cards';
import { canSpend } from '../rules/fp';
import { hasShield } from '../rules/status';
import { trapAt } from '../rules/trap';
import type { Action, CardUid, FaceKey, GameState, Orientation, PlayerId, PlayerState, Suit } from '../types';
import { W, perspective, score, type AiWeights, type Perspective } from './evaluate';

const MINOR_VALUE: Record<Suit, number> = { wands: 1.0, swords: 0.9, pentacles: 0.85, cups: 0.8 };
/** Flip only when the other face looks this many points better (the flip costs 1 FP = 0.5). */
const FLIP_MARGIN = 1.0;
const RANDOM_SAMPLES = 4;
const RANDOM_FACES: ReadonlySet<FaceKey> = new Set<FaceKey>([
  ...(Object.keys(FACES) as FaceKey[]).filter((k) => FACES[k].random),
  'highPriestess.upright',
  'magician.upright',
]);

/** Keep-or-discard value of a card in a player's hand. */
export function cardValue(p: PlayerState, uid: CardUid): number {
  const d = cardDef(uid);
  if (isSuit(d)) return MINOR_VALUE[d];
  if (isCourt(d)) return ORIENTATIONS.some((o) => hasFuel(p, uid, d, o)) ? 1.6 : 0.4;
  return 0;
}

function lowest(p: PlayerState, cards: readonly CardUid[], n: number): CardUid[] {
  return [...cards].sort((a, b) => cardValue(p, a) - cardValue(p, b)).slice(0, n);
}

function highest(p: PlayerState, cards: readonly CardUid[], n: number): CardUid[] {
  return [...cards].sort((a, b) => cardValue(p, b) - cardValue(p, a)).slice(0, n);
}

/** The orientation an action uses (for the leading / behind bias). */
function orientationOf(s: GameState, a: Action): Orientation | null {
  switch (a.type) {
    case 'playMinor':
    case 'playCourt':
      return a.orientation;
    case 'conjurePlay':
      return a.play?.orientation ?? null;
    case 'useSkill': {
      const d = s.pending;
      return d ? player(s, d.player).orientation : null;
    }
    case 'chooseTarget':
      return 'reversed';
    default:
      return null;
  }
}

function isRandomAction(s: GameState, a: Action): boolean {
  if (a.type !== 'useSkill' || !s.pending) return false;
  const p = player(s, s.pending.player);
  return RANDOM_FACES.has(faceKey(p.major, p.orientation));
}

// ---------- Cheap policies for decisions inside an evaluation ----------

function leadingOther(s: GameState, me: PlayerId): PlayerId {
  const others = othersOf(s, me);
  const sorted = [...others].sort((a, b) => {
    const pa = player(s, a), pb = player(s, b);
    return Number(hasShield(pa)) - Number(hasShield(pb)) || pb.progress - pa.progress;
  });
  return sorted[0]!;
}

function quickAction(s: GameState): Action {
  const d = s.pending!;
  const p = player(s, d.player);
  switch (d.kind) {
    case 'conjure': {
      const minors = p.hand.filter((u) => isSuit(cardDef(u)));
      if (minors.length === 0) return { type: 'conjurePlay', play: null };
      return { type: 'conjurePlay', play: { card: highest(p, minors, 1)[0]!, orientation: 'upright' } };
    }
    case 'foresight':
      return foresightPick(s, p, d.cards, null);
    case 'veil':
      return { type: 'veilPick', cards: highest(player(s, d.target), player(s, d.target).hand, d.count) };
    case 'wheelTarget':
      return { type: 'chooseTarget', target: leadingOther(s, d.player) };
    default:
      throw new Error(`no quick policy for ${d.kind}`);
  }
}

function foresightPick(s: GameState, p: PlayerState, cards: readonly CardUid[], use: CardUid | null | undefined): Action {
  const minors = cards.filter((u) => isSuit(cardDef(u)));
  const u = use !== undefined && use !== null ? use : minors.length > 0 ? highest(p, minors, 1)[0]! : null;
  const rest = cards.filter((c) => c !== u);
  const take = rest.length > 0 ? highest(p, rest, 1)[0]! : null;
  void s;
  return { type: 'foresightPick', use: u, take };
}

// ---------- Evaluation by playing the action on a hidden-information copy ----------

function determinize(s: GameState, salt: number): GameState {
  const c = cloneState(s);
  c.rng = deriveRng(s.rng, salt);
  shuffle(c.rng, c.deck);
  return c;
}

function runToHalt(c: GameState, a: Action): void {
  applyActionMut(c, a, { haltAfterPlay: true });
  let guard = 0;
  while (c.pending && ['conjure', 'foresight', 'veil', 'wheelTarget'].includes(c.pending.kind)) {
    applyActionMut(c, quickAction(c), { haltAfterPlay: true });
    if (++guard > 20) throw new Error('evaluation did not settle');
  }
}

function evalAction(s: GameState, a: Action, P: Perspective, base: number): number {
  const samples = isRandomAction(s, a) ? RANDOM_SAMPLES : 1;
  let total = 0;
  for (let k = 0; k < samples; k++) {
    const c = determinize(s, k + 1);
    runToHalt(c, a);
    total += score(c, P) - base;
  }
  let v = total / samples;
  if (v > 0) {
    const o = orientationOf(s, a);
    if ((o === 'upright' && P.leading) || (o === 'reversed' && !P.leading)) v *= P.w.leadBias;
  }
  return v;
}

function best(s: GameState, me: PlayerId, actions: readonly Action[], w: AiWeights): Action {
  if (actions.length === 0) throw new Error('no legal action');
  if (actions.length === 1) return actions[0]!;
  const P = perspective(s, me, w);
  const base = score(s, P);
  let top = actions[0]!;
  let topV = -Infinity;
  for (const a of actions) {
    const v = evalAction(s, a, P, base);
    if (v > topV) {
      topV = v;
      top = a;
    }
  }
  return top;
}

// ---------- Candidates with the heuristic choices of rule §12 ----------

/** Rule §12: a trap two spaces ahead of the leading other player (next free sign if taken). */
function trapSign(s: GameState, me: PlayerId): number {
  const leader = leadingOther(s, me);
  const at = player(s, leader).progress;
  for (const d of [2, 3, 1, 4, 5, 6, 7, 8, 9, 10, 11, 0]) {
    const sign = signOf(at + d);
    if (!trapAt(s, sign)) return sign;
  }
  return signOf(at + 2);
}

function playCandidates(s: GameState, me: PlayerId): Action[] {
  const p = player(s, me);
  const key = faceKey(p.major, p.orientation);
  const targeting = FACES[key].targeting;
  if (targeting !== 'sign' && targeting !== 'discardAny' && targeting !== 'discardUpTo') return enumerateActions(s);
  const out = enumerateActions(s).filter((a) => a.type !== 'useSkill');
  if (!checkSkillBase(s, p).ok) return out;
  const extra: Action[] = [];
  if (targeting === 'sign') extra.push({ type: 'useSkill', choice: { sign: trapSign(s, me) } });
  if (targeting === 'discardAny') {
    extra.push({ type: 'useSkill', choice: { discard: p.hand.filter((u) => cardValue(p, u) < 0.7) } });
  }
  if (targeting === 'discardUpTo') {
    const max = Math.min(p.hand.length, s.config.balance.cards[key].max!);
    for (let k = 0; k <= max; k++) extra.push({ type: 'useSkill', choice: { discard: lowest(p, p.hand, k) } });
  }
  return [...out, ...extra.filter((a) => checkAction(s, a).ok)];
}

// ---------- Flip and Move (rule §12) ----------

/** Best value of using the skill with `o` at the start of a fresh turn (a proxy for next turn). */
function skillValue(s: GameState, me: PlayerId, o: Orientation, w: AiWeights): number {
  const c = cloneState(s);
  const p = player(c, me);
  p.orientation = o;
  p.lastSkillTurn = null;
  p.turnNo += 1;
  c.turn = { ...freshTurn(me), step: 'play' };
  c.pending = { kind: 'chooseAction', player: me };
  if (!checkSkillBase(c, p).ok) return -Infinity;
  const P = perspective(c, me, w);
  const base = score(c, P);
  let top = -Infinity;
  const choices = playCandidates(c, me).filter((a) => a.type === 'useSkill');
  for (const a of choices) top = Math.max(top, evalAction(c, a, P, base));
  return top;
}

function decideFlip(s: GameState, me: PlayerId, w: AiWeights): Action {
  const p = player(s, me);
  const no: Action = { type: 'flip', flip: false };
  if (!canSpend(p, s.config.balance.flipCost) || p.fp < 3) return no;
  if (p.lastSkillTurn === p.turnNo) return no; // next turn is on cooldown
  const other: Orientation = p.orientation === 'upright' ? 'reversed' : 'upright';
  if (ONCE_PER_GAME.has(p.major) && p.onceUsed[other]) return no;
  const now = skillValue(s, me, p.orientation, w);
  const then = skillValue(s, me, other, w);
  return then > now + FLIP_MARGIN ? { type: 'flip', flip: true } : no;
}

function threatAt(s: GameState, p: PlayerState, progress: number): boolean {
  const trap = trapAt(s, signOf(progress));
  return !!trap && trap.owner !== p.id && p.trapImmuneTurn !== p.turnNo;
}

/**
 * Rule §12: reroll a 1 with FP ≥ 3; boost when 1 space short of the finish with FP ≥ 2.
 * Additions (decision D-53): avoid a rival's trap; in the final round every space counts.
 */
function decideMove(s: GameState, me: PlayerId, w: AiWeights): Action {
  const p = player(s, me);
  const roll = s.turn.roll!.value;
  const landing = p.progress + roll;
  const threat = threatAt(s, p, landing);
  if (canReroll(s) && ((roll === 1 && p.fp >= 3) || (threat && p.fp >= 2))) return { type: 'reroll' };
  if (canBoost(s) && p.fp >= 2) {
    if (s.config.finish - landing === 1) return { type: 'boost' };
    if (threat && !threatAt(s, p, landing + 1)) return { type: 'boost' };
    if (s.finalRound) return { type: 'boost' };
    if (p.fp - s.config.balance.boostCost >= w.boostKeep) return { type: 'boost' };
  }
  return { type: 'confirmMove' };
}

/** The computer's action for the current decision. */
export function chooseAiAction(s: GameState, tuning?: Partial<AiWeights>): Action {
  const w: AiWeights = tuning ? { ...W, ...tuning } : W;
  const d = s.pending;
  if (!d) throw new Error('no decision pending');
  const p = player(s, d.player);
  switch (d.kind) {
    case 'chooseAction':
      return best(s, d.player, playCandidates(s, d.player), w);
    case 'conjure':
      return best(s, d.player, enumerateActions(s), w);
    case 'foresight': {
      const minors = d.cards.filter((u) => isSuit(cardDef(u)));
      const uses: (CardUid | null)[] = minors.length > 0 ? minors : [null];
      return best(s, d.player, uses.map((u) => foresightPick(s, p, d.cards, u)), w);
    }
    case 'veil':
      return quickAction(s);
    case 'wheelTarget':
      return best(s, d.player, enumerateActions(s), w);
    case 'flip':
      return decideFlip(s, d.player, w);
    case 'move':
      return decideMove(s, d.player, w);
    case 'discardToLimit':
      return { type: 'discard', cards: lowest(p, p.hand, d.count) };
  }
}

export { skillChoices };
