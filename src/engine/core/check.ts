// Legality of every action, with the reason shown on greyed-out options.
import { PISCES, SUIT_ELEMENT, signOf } from '../data/board';
import { COURT_REQUIRES, FACES, ONCE_PER_GAME, cardDef, faceKey, isCourt, isSuit } from '../data/cards';
import { canSpend } from '../rules/fp';
import { isActive } from '../rules/status';
import { trapAt, trapSignAllowed } from '../rules/trap';
import type {
  Action, CardUid, Check, CourtRank, FaceKey, GameState, Orientation, PlayerId, PlayerState,
  Reason, SkillChoice, Suit,
} from '../types';
import { canBoost, canReroll } from './flow';
import { faceTargeting } from './targeting';
import { leadersAmong, othersOf, player, playersAhead } from './context';

const OK: Check = { ok: true };
const fail = (reason: Reason): Check => ({ ok: false, reason });

function isOrientation(o: unknown): o is Orientation {
  return o === 'upright' || o === 'reversed';
}

function distinct(list: readonly CardUid[]): boolean {
  return new Set(list).size === list.length;
}

function allIn(list: readonly CardUid[], pool: readonly CardUid[]): boolean {
  return list.every((u) => pool.includes(u));
}

function checkOther(s: GameState, actor: PlayerId, target: PlayerId | undefined): Check {
  if (target === undefined) return fail('noTarget');
  return othersOf(s, actor).includes(target) ? OK : fail('invalidTarget');
}

/** Single-target faces: a valid other player, or (balance.reversedAhead) someone ahead of you. */
function checkTargeted(s: GameState, actor: PlayerId, key: FaceKey, target?: PlayerId): Check {
  const tg = faceTargeting(s, key);
  if (tg === 'ahead') return playersAhead(s, actor).length > 0 ? OK : fail('noTarget');
  return tg === 'other' ? checkOther(s, actor, target) : OK;
}

/** A minor card's face: upright needs nothing; reversed needs a target (or someone ahead). */
export function checkMinorFace(s: GameState, actor: PlayerId, suit: Suit, o: Orientation, target?: PlayerId): Check {
  if (!isOrientation(o)) return fail('invalidChoice');
  return checkTargeted(s, actor, faceKey(suit, o), target);
}

/** Rule §9.2 / decision D-06: two different minors from hand, each of a listed element. */
export function checkFuel(p: PlayerState, court: CardUid, rank: CourtRank, o: Orientation, fuel: readonly CardUid[]): Check {
  if (fuel.length !== 2 || !distinct(fuel) || fuel.includes(court)) return fail('invalidFuel');
  if (!allIn(fuel, p.hand)) return fail('notInHand');
  const need = COURT_REQUIRES[rank][o];
  for (const u of fuel) {
    const d = cardDef(u);
    if (!isSuit(d)) return fail('invalidFuel');
    if (!need.includes(SUIT_ELEMENT[d])) return fail('needFuel');
  }
  return OK;
}

/** Whether the player has fuel for a court face at all (for greying out). */
export function hasFuel(p: PlayerState, court: CardUid, rank: CourtRank, o: Orientation): boolean {
  const need = COURT_REQUIRES[rank][o];
  const ok = p.hand.filter((u) => u !== court && isSuit(cardDef(u)) && need.includes(SUIT_ELEMENT[cardDef(u) as Suit]));
  return ok.length >= 2;
}

/** Skill checks that do not depend on the choice (rule §5 C, decisions D-02, D-30, D-36). */
export function checkSkillBase(s: GameState, p: PlayerState): Check {
  if (isActive(p, 'drained')) return fail('drained');
  if (p.lastSkillTurn !== null && p.lastSkillTurn >= p.turnNo - 1) return fail('cooldown');
  if (!canSpend(p, s.config.balance.skillCost)) return fail('notEnoughFp');
  if (ONCE_PER_GAME.has(p.major) && p.onceUsed[p.orientation]) return fail('onceUsed');
  const key = faceKey(p.major, p.orientation);
  if (key === 'world.upright' && signOf(p.progress) === PISCES) return fail('onPisces');
  if (key === 'tower.reversed' && playersAhead(s, p.id).length === 0) return fail('noTarget');
  const tg = faceTargeting(s, key);
  if ((tg === 'aheadOne' || tg === 'ahead') && playersAhead(s, p.id).length === 0) return fail('noTarget');
  if (tg === 'sign' && s.config.balance.trapReach > 0 && playersAhead(s, p.id).length === 0) return fail('noTarget');
  return OK;
}

/** The choice made when using a face, by its targeting (decisions D-21, D-23, D-26, D-35). */
export function checkFaceChoice(s: GameState, actor: PlayerId, key: FaceKey, choice: SkillChoice = {}): Check {
  const def = FACES[key];
  const p = player(s, actor);
  const others = othersOf(s, actor);
  switch (faceTargeting(s, key)) {
    case 'none':
    case 'others':
      return OK;
    case 'other':
      return checkOther(s, actor, choice.target);
    case 'ahead':
      return playersAhead(s, actor).length > 0 ? OK : fail('noTarget');
    case 'aheadOne': {
      const ahead = playersAhead(s, actor);
      if (ahead.length === 0 || choice.target === undefined) return fail('noTarget');
      return ahead.includes(choice.target) ? OK : fail('invalidTarget');
    }
    case 'twoOthers': {
      if (s.players.length === 2) return checkOther(s, actor, choice.target);
      const t = choice.targets;
      if (!t || t.length !== 2) return fail('noTarget');
      if (t[0] === t[1] || !others.includes(t[0]) || !others.includes(t[1])) return fail('invalidTarget');
      return OK;
    }
    case 'leaderTie': {
      const leaders = leadersAmong(s, others);
      if (leaders.length > 1) {
        if (choice.target === undefined) return fail('noTarget');
        return leaders.includes(choice.target) ? OK : fail('invalidTarget');
      }
      if (choice.target !== undefined && choice.target !== leaders[0]) return fail('invalidTarget');
      return OK;
    }
    case 'sign': {
      const sign = choice.sign;
      if (sign === undefined || !Number.isInteger(sign) || sign < 0 || sign > 11) return fail('invalidSign');
      if (trapAt(s, sign)) return fail('trapThere');
      return trapSignAllowed(s, actor, sign) ? OK : fail('invalidSign');
    }
    case 'discardAny':
    case 'discardUpTo': {
      const cards = choice.discard ?? [];
      if (!distinct(cards) || !allIn(cards, p.hand)) return fail('invalidChoice');
      if (def.targeting === 'discardUpTo' && cards.length > s.config.balance.cards[key].max!) return fail('invalidChoice');
      return OK;
    }
  }
}

function checkPlay(s: GameState, a: Action, p: PlayerState): Check {
  switch (a.type) {
    case 'meditate':
      return OK;
    case 'playMinor': {
      if (isActive(p, 'silenced')) return fail('silenced');
      if (!p.hand.includes(a.card)) return fail('notInHand');
      const def = cardDef(a.card);
      if (!isSuit(def)) return fail('notMinor');
      return checkMinorFace(s, p.id, def, a.orientation, a.target);
    }
    case 'playCourt': {
      if (isActive(p, 'silenced')) return fail('silenced');
      if (!p.hand.includes(a.card)) return fail('notInHand');
      const def = cardDef(a.card);
      if (!isCourt(def)) return fail('notCourt');
      if (!isOrientation(a.orientation)) return fail('invalidChoice');
      const fuel = checkFuel(p, a.card, def, a.orientation, a.fuel ?? []);
      if (!fuel.ok) return fuel;
      return checkTargeted(s, p.id, faceKey(def, a.orientation), a.target);
    }
    case 'useSkill': {
      const base = checkSkillBase(s, p);
      if (!base.ok) return base;
      return checkFaceChoice(s, p.id, faceKey(p.major, p.orientation), a.choice);
    }
    default:
      return fail('wrongDecision');
  }
}

export function checkAction(s: GameState, a: Action): Check {
  const d = s.pending;
  if (!d) return fail('noDecision');
  const p = player(s, d.player);
  switch (d.kind) {
    case 'chooseAction':
      return checkPlay(s, a, p);
    case 'conjure': {
      if (a.type !== 'conjurePlay') return fail('wrongDecision');
      if (a.play === null) return OK;
      if (!p.hand.includes(a.play.card)) return fail('notInHand');
      const def = cardDef(a.play.card);
      if (!isSuit(def)) return fail('notMinor');
      return checkMinorFace(s, p.id, def, a.play.orientation, a.play.target);
    }
    case 'foresight': {
      if (a.type !== 'foresightPick') return fail('wrongDecision');
      const minors = d.cards.filter((u) => isSuit(cardDef(u)));
      let rest = d.cards;
      if (a.use === null) {
        if (minors.length > 0) return fail('invalidChoice');
      } else {
        if (!minors.includes(a.use)) return fail('invalidChoice');
        rest = rest.filter((u) => u !== a.use);
      }
      if (a.take === null) return rest.length === 0 ? OK : fail('invalidChoice');
      return rest.includes(a.take) ? OK : fail('invalidChoice');
    }
    case 'veil': {
      if (a.type !== 'veilPick') return fail('wrongDecision');
      const hand = player(s, d.target).hand;
      if (a.cards.length !== d.count || !distinct(a.cards) || !allIn(a.cards, hand)) return fail('invalidChoice');
      return OK;
    }
    case 'wheelTarget':
      if (a.type !== 'chooseTarget') return fail('wrongDecision');
      return checkOther(s, d.player, a.target);
    case 'flip':
      if (a.type !== 'flip') return fail('wrongDecision');
      if (a.flip && !canSpend(p, s.config.balance.flipCost)) return fail('cannotFlip');
      return OK;
    case 'move':
      if (a.type === 'confirmMove') return OK;
      if (a.type === 'reroll') return canReroll(s) ? OK : fail('cannotReroll');
      if (a.type === 'boost') return canBoost(s) ? OK : fail('cannotBoost');
      return fail('wrongDecision');
    case 'discardToLimit':
      if (a.type !== 'discard') return fail('wrongDecision');
      if (a.cards.length !== d.count || !distinct(a.cards) || !allIn(a.cards, p.hand)) return fail('invalidChoice');
      return OK;
  }
}
