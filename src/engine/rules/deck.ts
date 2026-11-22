import { emit, player, type Ctx } from '../core/context';
import { nextInt, shuffle } from '../core/rng';
import { cardDef } from '../data/cards';
import type { CardUid, CardsReason, PlayerId } from '../types';

/** Rule §3.3: when the deck is empty, the discard pile is shuffled into a new deck. */
function refill(ctx: Ctx): boolean {
  const s = ctx.s;
  if (s.deck.length > 0) return true;
  if (s.discard.length === 0) return false;
  s.deck = shuffle(s.rng, s.discard);
  s.discard = [];
  emit(ctx, { t: 'reshuffle', n: s.deck.length });
  return true;
}

/** Takes the top card of the deck, or null when no card is left anywhere. */
export function takeTop(ctx: Ctx): CardUid | null {
  if (!refill(ctx)) return null;
  return ctx.s.deck.pop()!;
}

/** Decision D-08: draws what is there. Returns the number drawn. */
export function drawCards(ctx: Ctx, id: PlayerId, n: number): number {
  const p = player(ctx.s, id);
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    const c = takeTop(ctx);
    if (c === null) break;
    p.hand.push(c);
    drawn++;
  }
  if (drawn > 0) emit(ctx, { t: 'draw', p: id, n: drawn });
  return drawn;
}

export function removeFromHand(ctx: Ctx, id: PlayerId, uid: CardUid): void {
  const p = player(ctx.s, id);
  const i = p.hand.indexOf(uid);
  if (i < 0) throw new Error(`card ${uid} not in hand of ${id}`);
  p.hand.splice(i, 1);
}

export function discardCards(ctx: Ctx, id: PlayerId, uids: readonly CardUid[], reason: CardsReason): void {
  if (uids.length === 0) return;
  for (const u of uids) removeFromHand(ctx, id, u);
  ctx.s.discard.push(...uids);
  emit(ctx, { t: 'discard', p: id, cards: uids.map(cardDef), reason });
}

/** Decision D-31: discards up to `n` random cards. */
export function discardRandom(ctx: Ctx, id: PlayerId, n: number): number {
  const p = player(ctx.s, id);
  const picked: CardUid[] = [];
  for (let i = 0; i < n && p.hand.length > 0; i++) {
    const uid = p.hand[nextInt(ctx.s.rng, p.hand.length)]!;
    removeFromHand(ctx, id, uid);
    picked.push(uid);
  }
  if (picked.length === 0) return 0;
  ctx.s.discard.push(...picked);
  emit(ctx, { t: 'discard', p: id, cards: picked.map(cardDef), reason: 'random' });
  return picked.length;
}

export function stealRandomCard(ctx: Ctx, from: PlayerId, to: PlayerId): boolean {
  const victim = player(ctx.s, from);
  if (victim.hand.length === 0) return false;
  const uid = victim.hand[nextInt(ctx.s.rng, victim.hand.length)]!;
  removeFromHand(ctx, from, uid);
  player(ctx.s, to).hand.push(uid);
  emit(ctx, { t: 'steal', from, to, what: 'card', n: 1 });
  return true;
}

/**
 * Decision D-05: takes the top `n` cards off the deck. If fewer are left, the shuffled
 * discard pile goes underneath first.
 */
export function takeTopCards(ctx: Ctx, n: number): CardUid[] {
  const s = ctx.s;
  if (s.deck.length < n && s.discard.length > 0) {
    const under = shuffle(s.rng, s.discard);
    s.discard = [];
    s.deck = [...under, ...s.deck];
    emit(ctx, { t: 'reshuffle', n: under.length });
  }
  const out: CardUid[] = [];
  for (let i = 0; i < n && s.deck.length > 0; i++) out.push(s.deck.pop()!);
  return out;
}

export function putOnBottom(ctx: Ctx, uids: readonly CardUid[]): void {
  ctx.s.deck.unshift(...uids);
}
