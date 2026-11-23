import {
  checkAction,
  checkSkillBase,
  faceKey,
  isCourt,
  isSuit,
  othersOf,
  skillChoices,
  cardDef,
  type Action,
  type CardUid,
  type FaceKey,
  type GameState,
  type Orientation,
  type PlayerId,
  type Reason,
  type SkillChoice,
} from '../../engine';

/**
 * What the current human can do, with the reason for every option that is not available.
 * Built from the engine's own checks, so the UI never offers an illegal action.
 */

export interface Option<A = Action> {
  ok: boolean;
  reason?: Reason;
  /** Legal actions behind this option (several when a target or fuel must still be picked). */
  actions: A[];
}

/** First failing reason among candidate actions, or ok with the legal ones. */
function collect(s: GameState, candidates: Action[]): Option {
  const legal: Action[] = [];
  let reason: Reason | undefined;
  for (const a of candidates) {
    const c = checkAction(s, a);
    if (c.ok) legal.push(a);
    else reason ??= c.reason;
  }
  return legal.length > 0 ? { ok: true, actions: legal } : { ok: false, reason: reason ?? 'invalidChoice', actions: [] };
}

/**
 * A face's action without a target if that is legal (the engine ignores a target the face
 * does not use, so we must not offer one); otherwise one variant per other player.
 */
function targeted(s: GameState, actor: PlayerId, base: Action, withTarget: (target: PlayerId) => Action): Option {
  const plain = checkAction(s, base);
  if (plain.ok) return { ok: true, actions: [base] };
  const o = collect(s, othersOf(s, actor).map(withTarget));
  if (!o.ok && plain.reason !== 'noTarget') o.reason = plain.reason;
  return o;
}

/** Pairs of other minor cards in the hand, one per pair of suits. */
function fuelPairs(hand: readonly CardUid[], court: CardUid): [CardUid, CardUid][] {
  const minors = hand.filter((u) => u !== court && isSuit(cardDef(u)));
  const out: [CardUid, CardUid][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < minors.length; i++) {
    for (let j = i + 1; j < minors.length; j++) {
      const key = [cardDef(minors[i]!), cardDef(minors[j]!)].sort().join('+');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([minors[i]!, minors[j]!]);
    }
  }
  return out;
}

/**
 * Playing one card from the hand with one side up. In the Play step (chooseAction) a minor
 * or a court combo; during the Magician's Conjure an extra minor card.
 */
export function cardSideOption(s: GameState, card: CardUid, orientation: Orientation): Option {
  const d = s.pending;
  if (!d) return { ok: false, reason: 'noDecision', actions: [] };
  const def = cardDef(card);
  if (d.kind === 'conjure') {
    if (!isSuit(def)) return { ok: false, reason: 'notMinor', actions: [] };
    return targeted(s, d.player, { type: 'conjurePlay', play: { card, orientation } }, (target) => ({
      type: 'conjurePlay',
      play: { card, orientation, target },
    }));
  }
  if (d.kind !== 'chooseAction') return { ok: false, reason: 'wrongDecision', actions: [] };
  if (isSuit(def)) return targeted(s, d.player, { type: 'playMinor', card, orientation }, (target) => ({ type: 'playMinor', card, orientation, target }));
  if (isCourt(def)) {
    const hand = s.players[d.player]!.hand;
    const pairs = fuelPairs(hand, card);
    if (pairs.length === 0) {
      // Report silenced first, then the missing fuel.
      const c = checkAction(s, { type: 'playCourt', card, fuel: [card, card], orientation });
      return { ok: false, reason: c.ok ? 'needFuel' : c.reason === 'invalidFuel' ? 'needFuel' : c.reason, actions: [] };
    }
    const per = pairs.map((fuel) =>
      targeted(s, d.player, { type: 'playCourt', card, fuel, orientation }, (target) => ({ type: 'playCourt', card, fuel, orientation, target })),
    );
    const actions = per.flatMap((o) => o.actions);
    if (actions.length > 0) return { ok: true, actions };
    // Prefer a reason other than the fuel when some pair had the right elements.
    const reasons = per.map((o) => o.reason!);
    const reason = reasons.find((r) => r !== 'needFuel' && r !== 'invalidFuel') ?? 'needFuel';
    return { ok: false, reason, actions: [] };
  }
  return { ok: false, reason: 'notMinor', actions: [] };
}

/** Whether any card in the hand can be played at all now (for the "play a card" option). */
export function anyCardOption(s: GameState): Option {
  const d = s.pending;
  if (!d || (d.kind !== 'chooseAction' && d.kind !== 'conjure')) return { ok: false, reason: 'wrongDecision', actions: [] };
  const hand = s.players[d.player]!.hand;
  let reason: Reason | undefined;
  const actions: Action[] = [];
  for (const card of hand) {
    for (const o of ['upright', 'reversed'] as const) {
      const opt = cardSideOption(s, card, o);
      if (opt.ok) actions.push(...opt.actions);
      else reason ??= opt.reason;
    }
  }
  return actions.length > 0 ? { ok: true, actions } : { ok: false, reason: reason ?? 'notInHand', actions: [] };
}

export interface SkillOption extends Option {
  face: FaceKey;
  /** What the player still has to pick after choosing the skill. */
  pick: 'none' | 'target' | 'sign' | 'discard';
  /** Legal choices (targets, signs or 'any discard'). */
  choices: SkillChoice[];
}

/** The character skill on its current side. */
export function skillOption(s: GameState, id: PlayerId): SkillOption {
  const p = s.players[id]!;
  const face = faceKey(p.major, p.orientation);
  const none = (reason: Reason): SkillOption => ({ ok: false, reason, actions: [], face, pick: 'none', choices: [] });
  if (s.pending?.kind !== 'chooseAction' || s.pending.player !== id) return none('wrongDecision');
  const base = checkSkillBase(s, p);
  if (!base.ok) return none(base.reason);
  const all = skillChoices(s, id);
  const legal = all.filter((choice) => checkAction(s, { type: 'useSkill', choice }).ok);
  if (legal.length === 0) {
    const c = checkAction(s, { type: 'useSkill', choice: all[0] ?? {} });
    return none(c.ok ? 'invalidChoice' : c.reason);
  }
  const sample = all[0] ?? {};
  const pick: SkillOption['pick'] =
    sample.sign !== undefined ? 'sign' : sample.discard !== undefined ? 'discard' : legal.some((c) => c.target !== undefined) && legal.length > 1 ? 'target' : 'none';
  // Discard skills accept any subset; the UI builds the choice from the selected cards.
  return { ok: true, actions: legal.map((choice) => ({ type: 'useSkill', choice })), face, pick, choices: legal };
}

/** A simple yes/no action of the current decision (flip, reroll, boost, confirm, meditate). */
export function simpleOption(s: GameState, a: Action): Option {
  return collect(s, [a]);
}
