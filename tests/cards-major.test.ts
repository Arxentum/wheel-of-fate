// Rulebook v4 §9.3: both faces of the 22 characters (v4 = v3 + the M1 balance changes, D-58).
// Single-target reversed faces hit every player ahead of you, so targets are placed ahead.
import { describe, expect, it } from 'vitest';
import { canReroll, checkAction, hasShield, statusOf, trapAt, type MajorId, type Orientation, type PlayerId } from '../src/engine';
import { act, autoUntil, handDefs, ofType, scenario, skill, status, uid, type PSpec, type Spec } from './helpers';

const P0 = 0, P1 = 1, P2 = 2;

/** P0 holds `major` with face `o`; other player specs follow. */
function withMajor(major: MajorId, o: Orientation, p0: PSpec = {}, others: PSpec[] = [{}, {}], extra: Spec = {}) {
  const fallback: MajorId[] = major === 'chariot' ? ['sun', 'empress'] : major === 'sun' ? ['chariot', 'empress'] : major === 'empress' ? ['chariot', 'sun'] : ['chariot', 'sun'];
  return scenario({
    ...extra,
    players: [{ major, orientation: o, ...p0 }, ...others.map((p, i) => ({ major: fallback[i], ...p }))],
  });
}

describe('0 The Fool', () => {
  it('upright: roll the Fate Die and move that + 1', () => {
    const s = withMajor('fool', 'upright', {}, [{}, {}], { balance: { die: [2] } });
    const ev = skill(s);
    expect(ofType(ev, 'effectRoll')[0]!.dice).toEqual([2]);
    expect(s.players[P0]!.progress).toBe(3);
    expect(s.players[P0]!.fp).toBe(2);
  });
  it('reversed: Wrong Turn on the target (consumed by their next Move step, D-16)', () => {
    const s = withMajor('fool', 'reversed', {}, [{ progress: 4 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'wrongTurn')).toMatchObject({ from: 2 });
    expect(statusOf(s.players[P2]!, 'wrongTurn')).toBeUndefined();
  });
});

describe('1 The Magician', () => {
  it('upright: draw 2, then may play up to two Minor cards for free (with resonance, M14)', () => {
    const s = withMajor('magician', 'upright', { progress: 1 }, [{}, {}], { deckTop: ['pentacles', 'wands'] });
    skill(s);
    expect(s.pending).toMatchObject({ kind: 'conjure', player: P0, left: 2 });
    act(s, { type: 'conjurePlay', play: { card: uid(s, P0, 'pentacles'), orientation: 'upright' } });
    expect(s.players[P0]!.fp).toBe(3 - 1 + 2 + 1);
    expect(s.pending).toMatchObject({ kind: 'conjure', left: 1 });
    act(s, { type: 'conjurePlay', play: { card: uid(s, P0, 'wands'), orientation: 'upright' } });
    expect(s.players[P0]!.progress).toBe(2);
    expect(s.pending).toBeNull();
  });
  it('upright: the extra play may be skipped', () => {
    const s = withMajor('magician', 'upright', {}, [{}, {}], { deckTop: ['wands', 'cups'] });
    skill(s);
    act(s, { type: 'conjurePlay', play: null });
    expect(s.players[P0]!.hand).toHaveLength(2);
  });
  it('upright while Silenced: draws but no extra play (D-04)', () => {
    const s = withMajor('magician', 'upright', { statuses: [status('silenced', 1, 1)] }, [{}, {}], { deckTop: ['wands', 'cups'] });
    skill(s);
    expect(s.pending).toBeNull();
    expect(s.players[P0]!.hand).toHaveLength(2);
  });
  it('reversed: steal a random card; the target is Silenced next turn', () => {
    const s = withMajor('magician', 'reversed', {}, [{ progress: 3, hand: ['cups', 'swords'] }, {}]);
    skill(s);
    expect(s.players[P0]!.hand).toHaveLength(1);
    expect(s.players[P1]!.hand).toHaveLength(1);
    expect(statusOf(s.players[P1]!, 'silenced')).toMatchObject({ from: 2 });
  });
});

describe('2 The High Priestess', () => {
  it('upright: forward 1, look at 3, use one Minor upright, keep one, the rest to the bottom (M10)', () => {
    const s = withMajor('highPriestess', 'upright', { progress: 1 }, [{}, {}], { deckTop: ['wands', 'cups', 'king'] });
    skill(s);
    const d = s.pending!;
    expect(d.kind).toBe('foresight');
    const cards = d.kind === 'foresight' ? d.cards : [];
    const [w, c, k] = cards;
    act(s, { type: 'foresightPick', use: w!, take: k! });
    expect(s.players[P0]!.progress).toBe(3); // 1 + forward 1 + Wands upright
    expect(handDefs(s, P0)).toEqual(['king']);
    expect(s.deck[0]).toBe(c); // Cups to the bottom
    expect(s.players[P0]!.fp).toBe(3 - 1);
  });
  it('upright with no Minor among the three: keep one, use nothing (D-05)', () => {
    const s = withMajor('highPriestess', 'upright', {}, [{}, {}], { deckTop: ['page', 'knight', 'queen'] });
    skill(s);
    const cards = s.pending?.kind === 'foresight' ? s.pending.cards : [];
    expect(checkAction(s, { type: 'foresightPick', use: cards[0]!, take: cards[1]! }).ok).toBe(false);
    act(s, { type: 'foresightPick', use: null, take: cards[2]! });
    expect(handDefs(s, P0)).toEqual(['queen']);
  });
  it('reversed: look at the target hand, discard 2 of your choice; Drained next turn', () => {
    const s = withMajor('highPriestess', 'reversed', {}, [{ hand: ['wands', 'cups', 'swords', 'pentacles'] }, {}]);
    skill(s, { target: P1 });
    expect(s.pending).toMatchObject({ kind: 'veil', player: P0, target: P1, count: 2 });
    act(s, { type: 'veilPick', cards: [uid(s, P1, 'wands'), uid(s, P1, 'cups')] });
    expect(handDefs(s, P1)).toEqual(['pentacles', 'swords']);
    expect(statusOf(s.players[P1]!, 'drained')).toMatchObject({ from: 2 });
  });
  it('reversed: with 2 cards or fewer, all are discarded without a choice', () => {
    const s = withMajor('highPriestess', 'reversed', {}, [{ hand: ['wands', 'cups'] }, {}]);
    skill(s, { target: P1 });
    expect(s.pending).toBeNull();
    expect(s.players[P1]!.hand).toHaveLength(0);
  });
});

describe('3 The Empress', () => {
  it('upright: forward 1, +3 FP and draw 1 (M8)', () => {
    const s = withMajor('empress', 'upright');
    skill(s);
    expect(s.players[P0]!.progress).toBe(1);
    expect(s.players[P0]!.fp).toBe(5);
    expect(s.players[P0]!.hand).toHaveLength(1);
  });
  it('reversed: target Rooted next turn and −1 FP', () => {
    const s = withMajor('empress', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'rooted')).toMatchObject({ from: 2, until: 2 });
    expect(s.players[P1]!.fp).toBe(2);
  });
});

describe('4 The Emperor', () => {
  it('upright: +1 FP, a shield, and the Move roll counts as 4 (no reroll, boost allowed, D-11, M13)', () => {
    const s = withMajor('emperor', 'upright', { progress: 1 });
    skill(s, {}, false);
    expect(s.players[P0]!.fp).toBe(3);
    expect(hasShield(s.players[P0]!)).toBe(true);
    const ev = act(s, { type: 'flip', flip: false }, false);
    expect(ofType(ev, 'roll')[0]).toMatchObject({ value: 4, mode: 'fixed' });
    expect(s.pending?.kind).toBe('move');
    expect(canReroll(s)).toBe(false);
    act(s, { type: 'boost' }, false);
    expect(s.players[P0]!.progress).toBe(6);
  });
  it('reversed: all other players Silenced, the leader among them also Drained', () => {
    const s = withMajor('emperor', 'reversed', {}, [{ progress: 5 }, { progress: 3 }]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'silenced')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'silenced')).toBeDefined();
    expect(statusOf(s.players[P1]!, 'drained')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'drained')).toBeUndefined();
  });
  it('reversed: a tied lead is broken by your choice (D-26)', () => {
    const s = withMajor('emperor', 'reversed', {}, [{ progress: 5 }, { progress: 5 }]);
    expect(checkAction(s, { type: 'useSkill', choice: {} })).toEqual({ ok: false, reason: 'noTarget' });
    skill(s, { target: P2 });
    expect(statusOf(s.players[P2]!, 'drained')).toBeDefined();
    expect(statusOf(s.players[P1]!, 'drained')).toBeUndefined();
  });
});

describe('5 The Hierophant', () => {
  it('upright: removes all your negative statuses (now and queued, D-22), +2 FP, draw 1, shield', () => {
    const s = withMajor('hierophant', 'upright', { statuses: [status('slowed', 1, 1), status('rooted', 2, 2)] });
    skill(s);
    const p = s.players[P0]!;
    expect(p.statuses.map((st) => st.kind)).toEqual(['shielded']);
    expect(p.progress).toBe(1);
    expect(p.fp).toBe(4);
    expect(p.hand).toHaveLength(1);
  });
  it('reversed: target back to the previous Earth sign', () => {
    const s = withMajor('hierophant', 'reversed', {}, [{ progress: 7 }, {}]);
    skill(s, { target: P1 });
    expect(s.players[P1]!.progress).toBe(5);
  });
});

describe('6 The Lovers', () => {
  it('upright: to the space of the nearest player ahead within 5 (M3)', () => {
    const s = withMajor('lovers', 'upright', { progress: 1 }, [{ progress: 4 }, { progress: 9 }]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(4);
  });
  it('upright: nobody within 5 ahead → forward 2', () => {
    const s = withMajor('lovers', 'upright', { progress: 1 }, [{ progress: 7 }, { progress: 10 }]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(3);
  });
  it('upright: a lapped player is not ahead of you (D-27)', () => {
    const s = withMajor('lovers', 'upright', { progress: 14 }, [{ progress: 3 }, { progress: 0 }]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(16);
  });
  it('reversed: swap two other players (progress, laps included; D-28)', () => {
    const s = withMajor('lovers', 'reversed', {}, [{ progress: 3 }, { progress: 13 }]);
    s.players[P2]!.lapsRewarded = 1;
    skill(s, { targets: [P1, P2] });
    expect(s.players[P1]!.progress).toBe(13);
    expect(s.players[P2]!.progress).toBe(3);
    expect(s.players[P1]!.fp).toBe(5); // new lap: +2
  });
  it('reversed: a shield on either player cancels the swap (D-20)', () => {
    const s = withMajor('lovers', 'reversed', {}, [{ progress: 8, statuses: [status('shielded', 1, 2, 'king.upright')] }, { progress: 2 }]);
    const ev = skill(s, { targets: [P1, P2] });
    expect(s.players[P1]!.progress).toBe(8);
    expect(s.players[P2]!.progress).toBe(2);
    expect(hasShield(s.players[P1]!)).toBe(false);
    expect(ofType(ev, 'swapFailed')).toHaveLength(1);
  });
  it('reversed in a 2-player game: target back 2', () => {
    const s = scenario({ players: [{ major: 'lovers', orientation: 'reversed' }, { major: 'sun', progress: 6 }] });
    skill(s, { target: P1 });
    expect(s.players[P1]!.progress).toBe(4);
  });
});

describe('7 The Chariot', () => {
  it('upright: forward 3', () => {
    const s = withMajor('chariot', 'upright');
    skill(s);
    expect(s.players[P0]!.progress).toBe(3);
  });
  it('reversed: target back 2 and Slowed', () => {
    const s = withMajor('chariot', 'reversed', {}, [{ progress: 5 }, {}]);
    skill(s, { target: P1 });
    expect(s.players[P1]!.progress).toBe(3);
    expect(statusOf(s.players[P1]!, 'slowed')).toMatchObject({ from: 2, until: 2 });
  });
});

describe('8 Strength', () => {
  it('upright: to the next Fire sign, no shield (M1)', () => {
    const s = withMajor('strength', 'upright', { progress: 1 });
    skill(s);
    expect(s.players[P0]!.progress).toBe(4);
    expect(hasShield(s.players[P0]!)).toBe(false);
  });
  it('reversed: target Stunned and −1 FP', () => {
    const s = withMajor('strength', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'stunned')).toBeDefined();
    expect(s.players[P1]!.fp).toBe(2);
  });
});

describe('9 The Hermit', () => {
  it('upright: forward 1, +2 FP, draw 1, shield (M7)', () => {
    const s = withMajor('hermit', 'upright');
    skill(s);
    expect(s.players[P0]!.progress).toBe(1);
    expect(s.players[P0]!.fp).toBe(4);
    expect(s.players[P0]!.hand).toHaveLength(1);
    expect(hasShield(s.players[P0]!)).toBe(true);
  });
  it('reversed: target Drained for their next 2 turns', () => {
    const s = withMajor('hermit', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'drained')).toMatchObject({ from: 2, until: 3 });
  });
});

describe('10 Wheel of Fortune', () => {
  it('upright: roll twice, move the lower, gain the higher in FP (M2)', () => {
    const s = withMajor('wheelOfFortune', 'upright', {}, [{}, {}], { balance: { die: [1, 3] } });
    const ev = skill(s);
    const dice = ofType(ev, 'effectRoll')[0]!.dice;
    expect(s.players[P0]!.progress).toBe(Math.min(...dice));
    expect(s.players[P0]!.fp).toBe(2 + Math.max(...dice));
  });
  it('reversed: everyone from you reveals the top card and uses its reversed face; courts discarded (D-32)', () => {
    const s = withMajor('wheelOfFortune', 'reversed', {}, [{ progress: 5 }, {}], { deckTop: ['swords', 'page', 'pentacles'] });
    skill(s);
    // P0 (at 0) reveals Swords: everyone ahead (P1) back 1. P1 reveals a Page: discarded.
    // P2 (at 0) reveals Pentacles: steals 1 FP from everyone ahead of P2 (P1).
    expect(s.pending).toBeNull();
    expect(s.players[P1]!.progress).toBe(4);
    expect(s.players[P1]!.fp).toBe(2);
    expect(s.players[P2]!.fp).toBe(4);
    expect(s.players[P0]!.fp).toBe(2);
    expect(s.discard).toHaveLength(3);
  });
});

describe('11 Justice', () => {
  it('upright, behind: forward half the gap to the leader (round up, max 5)', () => {
    const s = withMajor('justice', 'upright', { progress: 1 }, [{ progress: 8 }, { progress: 4 }]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(5);
    const t = withMajor('justice', 'upright', { progress: 1 }, [{ progress: 20 }, {}]);
    skill(t);
    expect(t.players[P0]!.progress).toBe(6);
  });
  it('upright, leading (a tie counts, D-26): forward 1 and +2 FP (M15)', () => {
    const s = withMajor('justice', 'upright', { progress: 6 }, [{ progress: 6 }, {}]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(7);
    expect(s.players[P0]!.fp).toBe(4);
  });
  it('upright, behind by 1: still at least 2 (M15)', () => {
    const s = withMajor('justice', 'upright', { progress: 3 }, [{ progress: 4 }, {}]);
    skill(s);
    expect(s.players[P0]!.progress).toBe(5);
  });
  it('reversed: the leading other player back 2 and −1 FP', () => {
    const s = withMajor('justice', 'reversed', {}, [{ progress: 8 }, { progress: 4 }]);
    skill(s);
    expect(s.players[P1]!.progress).toBe(6);
    expect(s.players[P1]!.fp).toBe(2);
  });
  it('reversed: a tied lead needs your choice', () => {
    const s = withMajor('justice', 'reversed', {}, [{ progress: 8 }, { progress: 8 }]);
    expect(checkAction(s, { type: 'useSkill' }).ok).toBe(false);
    skill(s, { target: P2 });
    expect(s.players[P2]!.progress).toBe(6);
  });
});

describe('12 The Hanged Man', () => {
  it('upright: forward 2, +3 FP, draw 1, shield; Slowed next turn; this turn moves normally (M18)', () => {
    const s = withMajor('hangedMan', 'upright', { progress: 1 }, [{}, {}], { balance: { die: [2] } });
    skill(s, {}, false);
    const p = s.players[P0]!;
    expect(p.progress).toBe(3);
    expect(p.fp).toBe(5);
    expect(p.hand).toHaveLength(1);
    expect(hasShield(p)).toBe(true);
    expect(statusOf(p, 'slowed')).toMatchObject({ from: 2, until: 2 });
    const ev = [...act(s, { type: 'flip', flip: false }, false), ...autoUntil(s)];
    expect(ofType(ev, 'moveSkipped')).toHaveLength(0);
    expect(s.players[P0]!.progress).toBe(5);
  });
  it('reversed: target Rooted and Drained next turn', () => {
    const s = withMajor('hangedMan', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'rooted')).toBeDefined();
    expect(statusOf(s.players[P1]!, 'drained')).toBeDefined();
  });
});

describe('13 Death', () => {
  it('upright: forward 2, discard any, draw up to 5, clear statuses, +1 FP (M11)', () => {
    const s = withMajor('death', 'upright', { hand: ['page', 'knight', 'wands'], statuses: [status('slowed', 1, 1)] });
    skill(s, { discard: [uid(s, P0, 'page'), uid(s, P0, 'knight')] });
    const p = s.players[P0]!;
    expect(p.progress).toBe(2);
    expect(p.hand).toHaveLength(5);
    expect(p.statuses).toHaveLength(0);
    expect(p.fp).toBe(3);
  });
  it('reversed: target −3 FP and discards 1 random card', () => {
    const s = withMajor('death', 'reversed', {}, [{ progress: 2, hand: ['wands', 'cups'] }, {}]);
    skill(s);
    expect(s.players[P1]!.fp).toBe(0);
    expect(s.players[P1]!.hand).toHaveLength(1);
  });
});

describe('14 Temperance', () => {
  it('upright: to the next Water sign, no card (M5)', () => {
    const s = withMajor('temperance', 'upright');
    skill(s);
    expect(s.players[P0]!.progress).toBe(3);
    expect(s.players[P0]!.hand).toHaveLength(0);
  });
  it('reversed: target Slowed for 2 turns', () => {
    const s = withMajor('temperance', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(statusOf(s.players[P1]!, 'slowed')).toMatchObject({ from: 2, until: 3 });
  });
});

describe('15 The Devil', () => {
  it('upright: +5 FP, forward 2, and you are Drained next turn (your own shield does not stop it, M12)', () => {
    const s = withMajor('devil', 'upright', { statuses: [status('shielded', 1, 2, 'king.upright')] });
    skill(s);
    const p = s.players[P0]!;
    expect(p.fp).toBe(7);
    expect(p.progress).toBe(2);
    expect(statusOf(p, 'drained')).toMatchObject({ from: 2, until: 2 });
    expect(hasShield(p)).toBe(true);
  });
  it('reversed: a Chain Trap on any free sign', () => {
    const s = withMajor('devil', 'reversed', {}, [{}, {}], { traps: [{ sign: 4, kind: 'illusion', owner: P1, seq: 0 }] });
    expect(checkAction(s, { type: 'useSkill', choice: { sign: 4 } })).toEqual({ ok: false, reason: 'trapThere' });
    skill(s, { sign: 5 });
    expect(trapAt(s, 5)).toMatchObject({ kind: 'chain', owner: P0 });
  });
});

describe('16 The Tower', () => {
  it('upright: forward 4, then discard your whole hand', () => {
    const s = withMajor('tower', 'upright', { hand: ['wands', 'cups'] });
    skill(s);
    expect(s.players[P0]!.progress).toBe(4);
    expect(s.players[P0]!.hand).toHaveLength(0);
  });
  it('reversed: every player ahead of you back 2', () => {
    const s = withMajor('tower', 'reversed', { progress: 6 }, [{ progress: 5 }, { progress: 9 }]);
    skill(s);
    expect(s.players[P1]!.progress).toBe(5);
    expect(s.players[P2]!.progress).toBe(7);
  });
  it('reversed: greyed out when nobody is ahead (D-36)', () => {
    const s = withMajor('tower', 'reversed', { progress: 9 }, [{ progress: 5 }, { progress: 9 }]);
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'noTarget' });
  });
});

describe('17 The Star', () => {
  it('upright: to the next Water sign; FP back up to 2 (after paying, D-34, M4)', () => {
    const s = withMajor('star', 'upright', { progress: 1, fp: 1 });
    skill(s);
    expect(s.players[P0]!.progress).toBe(3);
    expect(s.players[P0]!.fp).toBe(2);
    const t = withMajor('star', 'upright', { progress: 1, fp: 5 });
    skill(t);
    expect(t.players[P0]!.fp).toBe(4);
  });
  it('reversed: steal 2 FP', () => {
    const s = withMajor('star', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(s.players[P1]!.fp).toBe(1);
    expect(s.players[P0]!.fp).toBe(4);
  });
});

describe('18 The Moon', () => {
  it('upright: forward 2, +1 FP, a shield, and traps do not affect you this turn (M17)', () => {
    const s = withMajor('moon', 'upright');
    skill(s);
    const p = s.players[P0]!;
    expect(p.progress).toBe(2);
    expect(p.fp).toBe(3);
    expect(hasShield(p)).toBe(true);
    expect(p.trapImmuneTurn).toBe(p.turnNo);
  });
  it('reversed: an Illusion Trap on any free sign', () => {
    const s = withMajor('moon', 'reversed');
    skill(s, { sign: 7 });
    expect(trapAt(s, 7)).toMatchObject({ kind: 'illusion', owner: P0 });
  });
});

describe('19 The Sun', () => {
  it('upright: forward 2 and +2 FP', () => {
    const s = withMajor('sun', 'upright');
    skill(s);
    expect(s.players[P0]!.progress).toBe(2);
    expect(s.players[P0]!.fp).toBe(4);
  });
  it('reversed: target −2 FP and Slowed', () => {
    const s = withMajor('sun', 'reversed', {}, [{ progress: 2 }, {}]);
    skill(s);
    expect(s.players[P1]!.fp).toBe(1);
    expect(statusOf(s.players[P1]!, 'slowed')).toBeDefined();
  });
});

describe('20 Judgement', () => {
  it('upright: discard up to 4, forward 1 per card, then draw 2 (M16)', () => {
    const s = withMajor('judgement', 'upright', { hand: ['wands', 'cups', 'page', 'king', 'swords'] });
    const all = s.players[P0]!.hand;
    expect(checkAction(s, { type: 'useSkill', choice: { discard: [...all] } })).toEqual({ ok: false, reason: 'invalidChoice' });
    skill(s, { discard: all.slice(0, 3) });
    expect(s.players[P0]!.progress).toBe(3);
    expect(s.players[P0]!.hand).toHaveLength(4);
  });
  it('reversed: pool all FP and split evenly, the remainder to you (D-33)', () => {
    const s = withMajor('judgement', 'reversed', {}, [{ fp: 9 }, { fp: 0 }]);
    skill(s);
    expect(s.players.map((p) => p.fp)).toEqual([5, 3, 3]);
  });
  it('reversed: a shielded player stays out of the pool', () => {
    const s = withMajor('judgement', 'reversed', {}, [{ fp: 9, statuses: [status('shielded', 1, 2, 'king.upright')] }, { fp: 0 }]);
    skill(s);
    expect(s.players.map((p) => p.fp)).toEqual([1, 9, 1]);
    expect(hasShield(s.players[P1]!)).toBe(false);
  });
});

describe('21 The World', () => {
  it('upright: once per game, forward to Pisces', () => {
    const s = withMajor('world', 'upright', { progress: 3 });
    skill(s);
    expect(s.players[P0]!.progress).toBe(11);
    expect(s.players[P0]!.onceUsed.upright).toBe(true);
    s.players[P0]!.turnNo = 5;
    s.players[P0]!.progress = 15;
    s.turn.player = P0;
    s.pending = { kind: 'chooseAction', player: P0 };
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'onceUsed' });
  });
  it('upright: at most 8 spaces (M6)', () => {
    const s = withMajor('world', 'upright', { progress: 12 });
    skill(s);
    expect(s.players[P0]!.progress).toBe(20);
  });
  it('upright: not usable on Pisces (D-30)', () => {
    const s = withMajor('world', 'upright', { progress: 23 });
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'onPisces' });
  });
  it('reversed: once per game, all other players Rooted next turn', () => {
    const s = withMajor('world', 'reversed');
    skill(s);
    expect(statusOf(s.players[P1]!, 'rooted')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'rooted')).toBeDefined();
    expect(s.players[P0]!.onceUsed.reversed).toBe(true);
  });
});

describe('every reversed single-target effect is blocked by a shield (D-19)', () => {
  const singles: MajorId[] = ['fool', 'magician', 'highPriestess', 'empress', 'hierophant', 'chariot', 'strength', 'hermit', 'hangedMan', 'death', 'temperance', 'star', 'sun'];
  for (const m of singles) {
    it(`${m} reversed`, () => {
      const s = withMajor(m, 'reversed', {}, [{ progress: 7, hand: ['cups', 'cups', 'cups'], statuses: [status('shielded', 1, 2, 'king.upright')] }, {}]);
      const before = JSON.stringify({ ...s.players[P1]!, statuses: [] });
      const ev = skill(s, { target: P1 as PlayerId });
      expect(ofType(ev, 'shieldBlock')).toHaveLength(1);
      expect(JSON.stringify(s.players[P1]!)).toBe(before);
    });
  }
});

describe('autoUntil helper sanity', () => {
  it('runs a plain turn to the next player', () => {
    const s = withMajor('chariot', 'upright', {}, [{}, {}], { balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.turn.player).toBe(P1);
  });
});
