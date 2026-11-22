// Every legal action of the current decision. Identical cards (same suit or court rank) give
// identical outcomes, so only one representative of each is listed.
import { ORIENTATIONS, cardDef, faceKey, isCourt, isSuit } from '../data/cards';
import type { Action, CardUid, GameState, PlayerId, SkillChoice } from '../types';
import { checkAction, checkSkillBase } from './check';
import { faceTargeting } from './targeting';
import { leadersAmong, othersOf, player } from './context';

/** One card uid per distinct definition. */
export function representatives(cards: readonly CardUid[], keep: (u: CardUid) => boolean = () => true): CardUid[] {
  const seen = new Set<string>();
  const out: CardUid[] = [];
  for (const u of cards) {
    if (!keep(u)) continue;
    const d = cardDef(u);
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(u);
  }
  return out;
}

/** Subsets of `cards` with sizes in [min, max], one per multiset of definitions. */
export function subsetsByDef(cards: readonly CardUid[], min: number, max: number): CardUid[][] {
  const out: CardUid[][] = [];
  const seen = new Set<string>();
  const n = cards.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const pick: CardUid[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) pick.push(cards[i]!);
    if (pick.length < min || pick.length > max) continue;
    const key = pick.map(cardDef).sort().join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pick);
  }
  return out;
}

/** Fuel pairs for a court face, one per pair of definitions. */
export function fuelPairs(hand: readonly CardUid[], court: CardUid): [CardUid, CardUid][] {
  const minors = hand.filter((u) => u !== court && isSuit(cardDef(u)));
  const out: [CardUid, CardUid][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < minors.length; i++) {
    for (let j = i + 1; j < minors.length; j++) {
      const a = minors[i]!, b = minors[j]!;
      const key = [cardDef(a), cardDef(b)].sort().join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([a, b]);
    }
  }
  return out;
}

/** All choices a skill could be used with (before legality filtering). */
export function skillChoices(s: GameState, id: PlayerId): SkillChoice[] {
  const p = player(s, id);
  const key = faceKey(p.major, p.orientation);
  const others = othersOf(s, id);
  switch (faceTargeting(s, key)) {
    case 'none':
    case 'others':
    case 'ahead':
      return [{}];
    case 'other':
      return others.map((target) => ({ target }));
    case 'twoOthers': {
      if (s.players.length === 2) return others.map((target) => ({ target }));
      const out: SkillChoice[] = [];
      for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) out.push({ targets: [others[i]!, others[j]!] });
      }
      return out;
    }
    case 'leaderTie': {
      const leaders = leadersAmong(s, others);
      return leaders.length > 1 ? leaders.map((target) => ({ target })) : [{}];
    }
    case 'sign':
      return Array.from({ length: 12 }, (_, sign) => ({ sign }));
    case 'discardAny':
      return subsetsByDef(p.hand, 0, p.hand.length).map((discard) => ({ discard }));
    case 'discardUpTo':
      return subsetsByDef(p.hand, 0, s.config.balance.cards[key].max!).map((discard) => ({ discard }));
  }
}

/** Play-step candidates: meditate, minor cards, court combos and the skill. */
function playCandidates(s: GameState, id: PlayerId): Action[] {
  const p = player(s, id);
  const others = othersOf(s, id);
  const out: Action[] = [{ type: 'meditate' }];
  for (const card of representatives(p.hand, (u) => isSuit(cardDef(u)))) {
    out.push({ type: 'playMinor', card, orientation: 'upright' });
    if (faceTargeting(s, faceKey(cardDef(card), 'reversed')) === 'ahead') out.push({ type: 'playMinor', card, orientation: 'reversed' });
    else for (const target of others) out.push({ type: 'playMinor', card, orientation: 'reversed', target });
  }
  for (const card of representatives(p.hand, (u) => isCourt(cardDef(u)))) {
    for (const fuel of fuelPairs(p.hand, card)) {
      out.push({ type: 'playCourt', card, fuel, orientation: 'upright' });
      if (faceTargeting(s, faceKey(cardDef(card), 'reversed')) === 'ahead') out.push({ type: 'playCourt', card, fuel, orientation: 'reversed' });
      else for (const target of others) out.push({ type: 'playCourt', card, fuel, orientation: 'reversed', target });
    }
  }
  if (checkSkillBase(s, p).ok) {
    for (const choice of skillChoices(s, id)) out.push({ type: 'useSkill', choice });
  }
  return out;
}

export function enumerateActions(s: GameState): Action[] {
  const d = s.pending;
  if (!d) return [];
  const raw: Action[] = [];
  switch (d.kind) {
    case 'chooseAction':
      raw.push(...playCandidates(s, d.player));
      break;
    case 'conjure': {
      raw.push({ type: 'conjurePlay', play: null });
      const p = player(s, d.player);
      for (const card of representatives(p.hand, (u) => isSuit(cardDef(u)))) {
        raw.push({ type: 'conjurePlay', play: { card, orientation: 'upright' } });
        if (faceTargeting(s, faceKey(cardDef(card), 'reversed')) === 'ahead') raw.push({ type: 'conjurePlay', play: { card, orientation: 'reversed' } });
        else for (const target of othersOf(s, d.player)) {
          raw.push({ type: 'conjurePlay', play: { card, orientation: 'reversed', target } });
        }
      }
      break;
    }
    case 'foresight': {
      const minors = d.cards.filter((u) => isSuit(cardDef(u)));
      const uses: (CardUid | null)[] = minors.length > 0 ? minors : [null];
      for (const use of uses) {
        const rest = d.cards.filter((u) => u !== use);
        const takes: (CardUid | null)[] = rest.length > 0 ? rest : [null];
        for (const take of takes) raw.push({ type: 'foresightPick', use, take });
      }
      break;
    }
    case 'veil':
      for (const cards of subsetsByDef(player(s, d.target).hand, d.count, d.count)) raw.push({ type: 'veilPick', cards });
      break;
    case 'wheelTarget':
      for (const target of othersOf(s, d.player)) raw.push({ type: 'chooseTarget', target });
      break;
    case 'flip':
      raw.push({ type: 'flip', flip: false }, { type: 'flip', flip: true });
      break;
    case 'move':
      raw.push({ type: 'confirmMove' }, { type: 'reroll' }, { type: 'boost' });
      break;
    case 'discardToLimit':
      for (const cards of subsetsByDef(player(s, d.player).hand, d.count, d.count)) raw.push({ type: 'discard', cards });
      break;
  }
  return raw.filter((a) => checkAction(s, a).ok);
}

export { ORIENTATIONS };
