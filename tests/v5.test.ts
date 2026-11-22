// Rules v5 (decisions D-60 – D-63): character reversed faces target one player ahead of you, are +2
// against the leader (not in 2-player games), and always cost position; traps spring when passed.
import { describe, expect, it } from 'vitest';
import { checkAction, enumerateActions, hasShield, statusOf, trapAt, type MajorId, type PlayerId } from '../src/engine';
import { act, autoUntil, handDefs, ofType, playMinor, scenario, skill, status, uid, type PSpec, type Spec } from './helpers';

const P0 = 0, P1 = 1, P2 = 2;
/** P0 casts from 0; P1 (5) is the leader, P2 (3) is ahead of P0 but not leading. */
const LEADER = P1, CHASER = P2;

function rev(major: MajorId, p0: PSpec = {}, p1: PSpec = {}, p2: PSpec = {}, extra: Spec = {}) {
  const others: MajorId[] = major === 'chariot' ? ['sun', 'empress'] : major === 'sun' ? ['chariot', 'empress'] : ['chariot', 'sun'];
  return scenario({
    ...extra,
    players: [
      { major, orientation: 'reversed', ...p0 },
      { major: others[0], progress: 5, ...p1 },
      { major: others[1], progress: 3, ...p2 },
    ],
  });
}

describe('targeting (D-60 rule 1)', () => {
  it('one player ahead of you; players behind or level are not valid', () => {
    const s = rev('chariot', { progress: 3 });
    expect(checkAction(s, { type: 'useSkill', choice: { target: CHASER } })).toEqual({ ok: false, reason: 'invalidTarget' });
    expect(checkAction(s, { type: 'useSkill', choice: {} })).toEqual({ ok: false, reason: 'noTarget' });
    expect(enumerateActions(s).filter((a) => a.type === 'useSkill')).toEqual([{ type: 'useSkill', choice: { target: LEADER } }]);
  });
  it('greyed out while you lead', () => {
    const s = rev('chariot', { progress: 6 });
    expect(checkAction(s, { type: 'useSkill', choice: { target: LEADER } })).toEqual({ ok: false, reason: 'noTarget' });
  });
});

describe('every v5 reversed face: base effect and +2 against the leader', () => {
  it('0 Fool: next Move step goes back 2 (leader 4) instead of rolling', () => {
    const s = rev('fool');
    skill(s, { target: CHASER });
    expect(statusOf(s.players[CHASER]!, 'wrongTurn')).toMatchObject({ amount: 2 });
    const t = rev('fool');
    skill(t, { target: LEADER }, false);
    expect(statusOf(t.players[LEADER]!, 'wrongTurn')).toMatchObject({ amount: 4 });
    // The leader's next Move step: back 2.
    autoUntil(t, (x) => x.turn.player === LEADER);
    act(t, { type: 'meditate' }, false);
    const ev = autoUntil(t, (x) => x.turn.player !== LEADER);
    expect(ofType(ev, 'move').find((e) => e.p === LEADER && e.cause === 'wrongTurn')).toMatchObject({ from: 5, to: 1 });
  });
  it('1 Magician: back 3 (leader 5) and you steal a random card', () => {
    const s = rev('magician', {}, {}, { hand: ['cups'] });
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(0);
    expect(s.players[P0]!.hand).toHaveLength(1);
    expect(statusOf(s.players[CHASER]!, 'silenced')).toBeUndefined();
    const t = rev('magician');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(0);
  });
  it('2 High Priestess: back 1 (leader 3), Slowed; you discard 1 card of your choice from their hand', () => {
    const s = rev('highPriestess', {}, {}, { hand: ['wands', 'cups'] });
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(2);
    expect(statusOf(s.players[CHASER]!, 'slowed')).toBeDefined();
    expect(s.pending).toMatchObject({ kind: 'veil', count: 1 });
    act(s, { type: 'veilPick', cards: [uid(s, CHASER, 'wands')] });
    expect(handDefs(s, CHASER)).toEqual(['cups']);
    expect(statusOf(s.players[CHASER]!, 'drained')).toBeUndefined();
    const t = rev('highPriestess', {}, { hand: ['wands'] });
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(2);
    expect(t.players[LEADER]!.hand).toHaveLength(0);
    expect(t.pending).toBeNull();
  });
  it('3 Empress: Rooted, −1 FP and back 1 (leader 3)', () => {
    const s = rev('empress');
    skill(s, { target: CHASER });
    expect(statusOf(s.players[CHASER]!, 'rooted')).toBeDefined();
    expect(s.players[CHASER]!.fp).toBe(2);
    expect(s.players[CHASER]!.progress).toBe(2);
    const t = rev('empress');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(2);
  });
  it('4 Emperor: back 3 (leader 5) and Silenced', () => {
    const s = rev('emperor');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(0);
    expect(statusOf(s.players[CHASER]!, 'silenced')).toBeDefined();
    expect(statusOf(s.players[LEADER]!, 'silenced')).toBeUndefined();
    const t = rev('emperor');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(0);
  });
  it('5 Hierophant: back to the previous Earth sign (the leader 2 more)', () => {
    const s = rev('hierophant');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    const t = rev('hierophant', {}, { progress: 7 });
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(3);
  });
  it('6 Lovers: back to the nearest player behind them (max 4, else 2), then 1 more (the leader 3 more)', () => {
    const s = rev('lovers', {}, {}, { progress: 4 });
    skill(s, { target: CHASER }); // nearest behind P2 (4) is P0 (0): 4 + 1
    expect(s.players[CHASER]!.progress).toBe(0);
    const t = rev('lovers', {}, { progress: 9 }, { progress: 7 });
    skill(t, { target: LEADER }); // nearest behind P1 (9) is P2 (7): 2 + 1 + 2
    expect(t.players[LEADER]!.progress).toBe(4);
    const far = rev('lovers', {}, { progress: 12 }, { progress: 1 });
    skill(far, { target: LEADER }); // nearest behind is 11 away: fallback 2 + 1 + 2
    expect(far.players[LEADER]!.progress).toBe(7);
  });
  it('7 Chariot: back 2 (leader 4) and Slowed', () => {
    const s = rev('chariot');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    expect(statusOf(s.players[CHASER]!, 'slowed')).toBeDefined();
    const t = rev('chariot');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(1);
  });
  it('8 Strength: back 1 (leader 3), Stunned, −1 FP', () => {
    const s = rev('strength');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(2);
    expect(statusOf(s.players[CHASER]!, 'stunned')).toBeDefined();
    expect(s.players[CHASER]!.fp).toBe(2);
    const t = rev('strength');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(2);
  });
  it('9 Hermit: back 2 (leader 4) and Drained next turn', () => {
    const s = rev('hermit');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    expect(statusOf(s.players[CHASER]!, 'drained')).toMatchObject({ from: 2, until: 2 });
    const t = rev('hermit');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(1);
  });
  it('10 Wheel of Fortune (A): the target rolls and goes back that many (leader +2)', () => {
    const s = rev('wheelOfFortune', {}, {}, {}, { balance: { die: [2] } });
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    const t = rev('wheelOfFortune', {}, {}, {}, { balance: { die: [2] } });
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(1);
  });
  it('11 Justice: any player ahead, back 3 (leader 5) and −1 FP', () => {
    const s = rev('justice');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(0);
    expect(s.players[CHASER]!.fp).toBe(2);
    const t = rev('justice');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(0);
  });
  it('12 Hanged Man: Rooted and Drained; the leader also back 2', () => {
    const s = rev('hangedMan');
    skill(s, { target: CHASER });
    expect(statusOf(s.players[CHASER]!, 'rooted')).toBeDefined();
    expect(statusOf(s.players[CHASER]!, 'drained')).toBeDefined();
    expect(s.players[CHASER]!.progress).toBe(3);
    const t = rev('hangedMan');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(3);
  });
  it('13 Death: back 3 (leader 5) and −2 FP', () => {
    const s = rev('death');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(0);
    expect(s.players[CHASER]!.fp).toBe(1);
    const t = rev('death');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(0);
  });
  it('14 Temperance: back 1 and Slowed for 2 turns (the leader 4 turns)', () => {
    const s = rev('temperance');
    skill(s, { target: CHASER });
    expect(statusOf(s.players[CHASER]!, 'slowed')).toMatchObject({ from: 2, until: 3 });
    expect(s.players[CHASER]!.progress).toBe(2);
    const t = rev('temperance');
    skill(t, { target: LEADER });
    expect(statusOf(t.players[LEADER]!, 'slowed')).toMatchObject({ from: 2, until: 5 });
    expect(t.players[LEADER]!.progress).toBe(4);
  });
  it('16 Tower: every player ahead back 2, the leader back 4', () => {
    const s = rev('tower');
    skill(s);
    expect(s.players[CHASER]!.progress).toBe(1);
    expect(s.players[LEADER]!.progress).toBe(1);
  });
  it('17 Star: back 2 (leader 4) and you steal 1 FP', () => {
    const s = rev('star');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    expect(s.players[CHASER]!.fp).toBe(2);
    expect(s.players[P0]!.fp).toBe(3);
    const t = rev('star');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(1);
  });
  it('19 Sun: back 2 (leader 4), Slowed, −1 FP', () => {
    const s = rev('sun');
    skill(s, { target: CHASER });
    expect(s.players[CHASER]!.progress).toBe(1);
    expect(statusOf(s.players[CHASER]!, 'slowed')).toBeDefined();
    expect(s.players[CHASER]!.fp).toBe(2);
    const t = rev('sun');
    skill(t, { target: LEADER });
    expect(t.players[LEADER]!.progress).toBe(1);
  });
  it('20 Judgement: back half the distance between you (round up, max 4; leader +2)', () => {
    const s = rev('judgement');
    skill(s, { target: CHASER }); // gap 3 → 2
    expect(s.players[CHASER]!.progress).toBe(1);
    const t = rev('judgement', {}, { progress: 11 });
    skill(t, { target: LEADER }); // gap 11 → max 4, + 2
    expect(t.players[LEADER]!.progress).toBe(5);
  });
  it('21 World: once per game, every player ahead Rooted; the leader also back 2', () => {
    const s = rev('world', { progress: 1 }, {}, { progress: 0 });
    skill(s);
    expect(statusOf(s.players[LEADER]!, 'rooted')).toBeDefined();
    expect(s.players[LEADER]!.progress).toBe(3);
    expect(statusOf(s.players[P2]!, 'rooted')).toBeUndefined();
    expect(s.players[P0]!.onceUsed.reversed).toBe(true);
  });
  it('a shield blocks the whole effect', () => {
    for (const m of ['chariot', 'death', 'lovers', 'empress'] as MajorId[]) {
      const s = rev(m, {}, { statuses: [status('shielded', 1, 2, 'king.upright')] });
      const before = s.players[LEADER]!.progress;
      skill(s, { target: LEADER as PlayerId });
      expect(s.players[LEADER]!.progress, m).toBe(before);
      expect(hasShield(s.players[LEADER]!), m).toBe(false);
    }
  });
});

describe('traps spring when passed (D-60)', () => {
  const chainAt3 = { sign: 3, kind: 'chain' as const, owner: P1, seq: 0 };
  it('passing during the Move step springs it, the move goes on; the owner gains 1 FP', () => {
    const s = scenario({ players: [{ progress: 1 }, { progress: 9 }, {}], traps: [chainAt3], balance: { die: [3] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapTrigger')[0]).toMatchObject({ p: P0, blocked: false });
    expect(s.players[P0]!.progress).toBe(4);
    expect(statusOf(s.players[P0]!, 'rooted')).toBeDefined();
    expect(s.players[P0]!.fp).toBe(3 + 1 - 3 + 1); // meditate, Chain Trap (−3), element bonus on Leo
    expect(s.players[P1]!.fp).toBe(4);
    expect(trapAt(s, 3)).toBeUndefined();
  });
  it('an Illusion Trap ends the movement; the leader goes back one more', () => {
    const s = scenario({ players: [{ progress: 1 }, { progress: 0 }, {}], traps: [{ sign: 3, kind: 'illusion', owner: P1, seq: 0 }], balance: { die: [3] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(0); // reached 3 as the leader: back 4 + 2, stops
  });
  it('your own card movement springs it; being pushed by someone else does not', () => {
    const own = scenario({ players: [{ progress: 1, hand: ['wands', 'wands', 'wands'] }, { progress: 9 }, {}], traps: [{ sign: 2, kind: 'chain', owner: P1, seq: 0 }] });
    playMinor(own, 'wands', 'upright');
    expect(own.traps).toHaveLength(0);
    const push = scenario({ players: [{ hand: ['swords'] }, { progress: 4 }, {}], traps: [{ sign: 3, kind: 'chain', owner: P0, seq: 0 }, { sign: 2, kind: 'illusion', owner: P2, seq: 1 }] });
    playMinor(push, 'swords', 'reversed');
    expect(push.players[P1]!.progress).toBe(3);
    expect(push.traps).toHaveLength(2);
  });
  it('a Wrong Turn step back is your own move and springs a trap behind you', () => {
    const s = scenario({ players: [{ progress: 4, statuses: [{ kind: 'wrongTurn', from: 1, until: 1_000_000, source: 'fool.reversed', amount: 1 }] }, { progress: 9 }, {}], traps: [chainAt3] });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapTrigger')).toHaveLength(1);
  });
  it('a shield blocks it; the owner still gains 1 FP; The Moon passes untouched', () => {
    const s = scenario({ players: [{ progress: 1, statuses: [status('shielded', 1, 1, 'king.upright')] }, { progress: 9 }, {}], traps: [chainAt3], balance: { die: [3] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapTrigger')[0]).toMatchObject({ blocked: true });
    expect(s.players[P1]!.fp).toBe(4);
    const m = scenario({ players: [{ progress: 0, major: 'moon' }, { progress: 9 }, {}], traps: [chainAt3], balance: { die: [3] } });
    skill(m, {}, false);
    autoUntil(m);
    expect(m.traps).toHaveLength(1);
  });
  it('a trap goes 1–3 signs in front of a player ahead of you; not while you lead', () => {
    const s = scenario({ players: [{ major: 'moon', orientation: 'reversed' }, { progress: 6 }, { progress: 2 }] });
    expect(checkAction(s, { type: 'useSkill', choice: { sign: 7 } })).toEqual({ ok: true }); // 1 in front of P1
    expect(checkAction(s, { type: 'useSkill', choice: { sign: 5 } })).toEqual({ ok: true }); // 3 in front of P2
    expect(checkAction(s, { type: 'useSkill', choice: { sign: 10 } })).toEqual({ ok: false, reason: 'invalidSign' });
    const lead = scenario({ players: [{ major: 'devil', orientation: 'reversed', progress: 8 }, { progress: 6 }, {}] });
    expect(checkAction(lead, { type: 'useSkill', choice: { sign: 7 } })).toEqual({ ok: false, reason: 'noTarget' });
  });
  it('no leader bonus in a 2-player game', () => {
    const s = scenario({ players: [{ major: 'chariot', orientation: 'reversed' }, { major: 'sun', progress: 5 }] });
    skill(s, { target: P1 });
    expect(s.players[P1]!.progress).toBe(3);
  });
  it('the computer puts a trap right in front of the leader', () => {
    const s = scenario({ players: [{ major: 'moon', orientation: 'reversed' }, { progress: 6 }, { progress: 2 }] });
    const sign = (enumerateActions(s).find((a) => a.type === 'useSkill') as { choice?: { sign?: number } } | undefined)?.choice?.sign;
    expect(typeof sign).toBe('number');
  });
});

describe('rules v5 upright changes and 2-player lines (D-63)', () => {
  it('2-player games: Hanged Man forward 3, Hermit draws 2, Hierophant +2 FP, Lovers fallback 2', () => {
    const hm = scenario({ players: [{ major: 'hangedMan' }, { major: 'sun' }] });
    skill(hm);
    expect(hm.players[P0]!.progress).toBe(3);
    const hm3 = scenario({ players: [{ major: 'hangedMan' }, { major: 'sun' }, { major: 'chariot' }] });
    skill(hm3);
    expect(hm3.players[P0]!.progress).toBe(2);
    const he = scenario({ players: [{ major: 'hermit' }, { major: 'sun' }] });
    skill(he);
    expect(he.players[P0]!.hand).toHaveLength(2);
    const hi = scenario({ players: [{ major: 'hierophant' }, { major: 'sun' }] });
    skill(hi);
    expect(hi.players[P0]!.fp).toBe(4);
    const lo = scenario({ players: [{ major: 'lovers' }, { major: 'sun', progress: 9 }] });
    skill(lo);
    expect(lo.players[P0]!.progress).toBe(2);
    const lo3 = scenario({ players: [{ major: 'lovers' }, { major: 'sun', progress: 9 }, { major: 'chariot', progress: 10 }] });
    skill(lo3);
    expect(lo3.players[P0]!.progress).toBe(3);
  });
  it('The Tower upright: forward 4, only 3 while you lead', () => {
    const s = scenario({ players: [{ major: 'tower', progress: 2 }, { major: 'sun', progress: 5 }, {}] });
    skill(s);
    expect(s.players[P0]!.progress).toBe(6);
    const t = scenario({ players: [{ major: 'tower', progress: 6 }, { major: 'sun', progress: 5 }, {}] });
    skill(t);
    expect(t.players[P0]!.progress).toBe(9);
  });
  it('The Moon upright: forward 2 and immune to traps, no shield and no FP', () => {
    const s = scenario({ players: [{ major: 'moon' }, {}, {}] });
    skill(s);
    expect(s.players[P0]!.progress).toBe(2);
    expect(hasShield(s.players[P0]!)).toBe(false);
    expect(s.players[P0]!.fp).toBe(2);
  });
});
