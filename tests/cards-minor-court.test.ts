// Rule §9.1 and §9.2: every face of the minor arcana and the court combos.
import { describe, expect, it } from 'vitest';
import { checkAction, statusOf, hasShield } from '../src/engine';
import { act, handDefs, ofType, playMinor, resume, scenario, uid, status } from './helpers';

const P0 = 0, P1 = 1, P2 = 2;

describe('Wands (fire, movement)', () => {
  it('upright: move forward 1', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['wands'] }, {}, {}] });
    const ev = playMinor(s, 'wands', 'upright');
    expect(s.players[P0]!.progress).toBe(2);
    expect(ofType(ev, 'play')[0]).toMatchObject({ kind: 'minor', face: 'wands.upright', resonance: false });
    expect(s.players[P0]!.fp).toBe(3);
  });
  it('upright on a fire sign resonates: +1 FP (D-01: judged before moving)', () => {
    const s = scenario({ players: [{ progress: 0, hand: ['wands'] }, {}, {}] });
    const ev = playMinor(s, 'wands', 'upright');
    expect(s.players[P0]!.fp).toBe(4);
    expect(s.players[P0]!.progress).toBe(1);
    expect(ofType(ev, 'fp')[0]).toMatchObject({ reason: 'resonance', delta: 1 });
  });
  it('reversed: target Slowed on their next turn', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['wands'] }, { turnNo: 1 }, {}] });
    playMinor(s, 'wands', 'reversed', P1);
    expect(statusOf(s.players[P1]!, 'slowed')).toMatchObject({ from: 2, until: 2 });
  });
  it('reversed needs a target', () => {
    const s = scenario({ players: [{ hand: ['wands'] }, {}, {}] });
    expect(checkAction(s, { type: 'playMinor', card: uid(s, P0, 'wands'), orientation: 'reversed' })).toEqual({ ok: false, reason: 'noTarget' });
    expect(checkAction(s, { type: 'playMinor', card: uid(s, P0, 'wands'), orientation: 'reversed', target: P0 })).toEqual({ ok: false, reason: 'invalidTarget' });
  });
});

describe('Pentacles (earth, Fate Points)', () => {
  it('upright: gain 2 FP', () => {
    const s = scenario({ players: [{ progress: 2, hand: ['pentacles'] }, {}, {}] });
    playMinor(s, 'pentacles', 'upright');
    expect(s.players[P0]!.fp).toBe(5);
  });
  it('upright: FP stop at the cap of 10, the rest is lost', () => {
    const s = scenario({ players: [{ progress: 2, fp: 9, hand: ['pentacles'] }, {}, {}] });
    const ev = playMinor(s, 'pentacles', 'upright');
    expect(s.players[P0]!.fp).toBe(10);
    expect(ofType(ev, 'fp')[0]).toMatchObject({ delta: 1, lostToCap: 1 });
  });
  it('reversed: steal 1 FP', () => {
    const s = scenario({ players: [{ progress: 2, hand: ['pentacles'] }, {}, {}] });
    playMinor(s, 'pentacles', 'reversed', P1);
    expect(s.players[P1]!.fp).toBe(2);
    expect(s.players[P0]!.fp).toBe(4);
  });
  it('reversed: nothing to steal from 0 FP (D-31)', () => {
    const s = scenario({ players: [{ progress: 2, hand: ['pentacles'] }, { fp: 0 }, {}] });
    playMinor(s, 'pentacles', 'reversed', P1);
    expect(s.players[P1]!.fp).toBe(0);
    expect(s.players[P0]!.fp).toBe(3);
  });
});

describe('Swords (air, die and position)', () => {
  it('upright: +1 FP and roll twice keeping the higher die this turn', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['swords'] }, {}, {}] });
    playMinor(s, 'swords', 'upright', undefined, false);
    expect(s.players[P0]!.fp).toBe(4);
    expect(s.turn.rollMode).toBe('advantage');
    const ev = act(s, { type: 'flip', flip: false }, false);
    const roll = ofType(ev, 'roll')[0]!;
    expect(roll.dice).toHaveLength(2);
    expect(roll.value).toBe(Math.max(...roll.dice));
  });
  it('reversed: target moves back 1, never below 0', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['swords', 'swords'] }, { progress: 5 }, { progress: 0 }] });
    playMinor(s, 'swords', 'reversed', P1);
    expect(s.players[P1]!.progress).toBe(4);
    const t = scenario({ players: [{ progress: 1, hand: ['swords'] }, {}, { progress: 0 }] });
    playMinor(t, 'swords', 'reversed', P2);
    expect(t.players[P2]!.progress).toBe(0);
  });
});

describe('Cups (water, cards)', () => {
  it('upright: draw 2', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['cups'] }, {}, {}], deckTop: ['wands', 'swords'] });
    playMinor(s, 'cups', 'upright');
    expect(handDefs(s, P0)).toEqual(['swords', 'wands']);
  });
  it('reversed: target discards 2 random cards (or what they have)', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['cups', 'cups'] }, { hand: ['wands', 'swords', 'pentacles'] }, { hand: ['wands'] }] });
    playMinor(s, 'cups', 'reversed', P1);
    expect(s.players[P1]!.hand).toHaveLength(1);
    resume(s);
    playMinor(s, 'cups', 'reversed', P2);
    expect(s.players[P2]!.hand).toHaveLength(0);
  });
});

describe('Court combos (rule §9.2)', () => {
  it('cannot be played alone and need the listed elements (D-06)', () => {
    const s = scenario({ players: [{ hand: ['page', 'wands', 'swords', 'cups', 'cups'] }, {}, {}] });
    const card = uid(s, P0, 'page');
    expect(checkAction(s, { type: 'playCourt', card, fuel: [uid(s, P0, 'wands'), uid(s, P0, 'swords')], orientation: 'upright' }))
      .toEqual({ ok: false, reason: 'needFuel' });
    expect(checkAction(s, { type: 'playCourt', card, fuel: [uid(s, P0, 'cups'), uid(s, P0, 'cups', 1)], orientation: 'upright' }))
      .toEqual({ ok: true });
    expect(checkAction(s, { type: 'playCourt', card, fuel: [uid(s, P0, 'cups'), uid(s, P0, 'cups')], orientation: 'upright' }))
      .toEqual({ ok: false, reason: 'invalidFuel' });
  });
  it('no resonance for combos (D-01); the three cards go to the discard pile and you draw 1', () => {
    const s = scenario({ players: [{ progress: 2, hand: ['page', 'swords', 'cups'] }, {}, {}], deckTop: ['king', 'wands', 'wands'] });
    const ev = act(s, { type: 'playCourt', card: uid(s, P0, 'page'), fuel: [uid(s, P0, 'swords'), uid(s, P0, 'cups')], orientation: 'upright' });
    expect(ofType(ev, 'fp')).toHaveLength(0);
    expect(s.discard).toHaveLength(3);
    expect(s.players[P0]!.hand).toHaveLength(3); // draw 2 (Page) + 1 (combo)
  });

  it('Page upright: to the next Air sign and draw 2', () => {
    const s = scenario({ players: [{ progress: 0, hand: ['page', 'swords', 'cups'] }, {}, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'page'), fuel: [uid(s, P0, 'swords'), uid(s, P0, 'cups')], orientation: 'upright' });
    expect(s.players[P0]!.progress).toBe(2);
    expect(s.players[P0]!.hand).toHaveLength(3);
  });
  it('Page reversed: target back 1, discards 2 random, Silenced next turn', () => {
    const s = scenario({ players: [{ hand: ['page', 'wands', 'pentacles'] }, { progress: 5, hand: ['cups', 'cups', 'cups'] }, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'page'), fuel: [uid(s, P0, 'wands'), uid(s, P0, 'pentacles')], orientation: 'reversed', target: P1 });
    expect(s.players[P1]!.progress).toBe(4);
    expect(s.players[P1]!.hand).toHaveLength(1);
    expect(statusOf(s.players[P1]!, 'silenced')).toMatchObject({ from: 2, until: 2 });
  });

  it('Knight upright: to the next Fire sign, then 1 more', () => {
    const s = scenario({ players: [{ progress: 0, hand: ['knight', 'wands', 'cups'] }, {}, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'knight'), fuel: [uid(s, P0, 'wands'), uid(s, P0, 'cups')], orientation: 'upright' });
    expect(s.players[P0]!.progress).toBe(5);
  });
  it('Knight reversed: target back to the previous Earth sign and Stunned', () => {
    const s = scenario({ players: [{ hand: ['knight', 'pentacles', 'swords'] }, { progress: 7 }, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'knight'), fuel: [uid(s, P0, 'pentacles'), uid(s, P0, 'swords')], orientation: 'reversed', target: P1 });
    expect(s.players[P1]!.progress).toBe(5);
    expect(statusOf(s.players[P1]!, 'stunned')).toMatchObject({ from: 2, until: 2 });
  });

  it('Queen upright: +2 spaces, +2 FP and a shield', () => {
    const s = scenario({ players: [{ progress: 0, hand: ['queen', 'cups', 'pentacles'] }, {}, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'queen'), fuel: [uid(s, P0, 'cups'), uid(s, P0, 'pentacles')], orientation: 'upright' });
    expect(s.players[P0]!.progress).toBe(2);
    expect(s.players[P0]!.fp).toBe(5);
    expect(hasShield(s.players[P0]!)).toBe(true);
  });
  it('Queen reversed: target back to the previous Fire sign, −3 FP', () => {
    const s = scenario({ players: [{ hand: ['queen', 'wands', 'swords'] }, { progress: 7 }, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'queen'), fuel: [uid(s, P0, 'wands'), uid(s, P0, 'swords')], orientation: 'reversed', target: P1 });
    expect(s.players[P1]!.progress).toBe(4);
    expect(s.players[P1]!.fp).toBe(0);
  });

  it('King upright: +3 spaces and a shield', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['king', 'pentacles', 'wands'] }, {}, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'king'), fuel: [uid(s, P0, 'pentacles'), uid(s, P0, 'wands')], orientation: 'upright' });
    expect(s.players[P0]!.progress).toBe(4);
    expect(hasShield(s.players[P0]!)).toBe(true);
  });
  it('King reversed: target back 2, Silenced and Drained; every other player Drained (D-29)', () => {
    const s = scenario({ players: [{ hand: ['king', 'cups', 'swords'] }, { progress: 6 }, {}] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'king'), fuel: [uid(s, P0, 'cups'), uid(s, P0, 'swords')], orientation: 'reversed', target: P1 });
    expect(s.players[P1]!.progress).toBe(4);
    expect(statusOf(s.players[P1]!, 'silenced')).toBeDefined();
    expect(statusOf(s.players[P1]!, 'drained')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'drained')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'silenced')).toBeUndefined();
    expect(s.players[P0]!.statuses).toHaveLength(0);
  });
  it('King reversed: a shield blocks the part aimed at that player only', () => {
    const s = scenario({
      players: [{ hand: ['king', 'cups', 'swords'] }, { progress: 6 }, { statuses: [status('shielded', 1, 2, 'king.upright')] }],
    });
    act(s, { type: 'playCourt', card: uid(s, P0, 'king'), fuel: [uid(s, P0, 'cups'), uid(s, P0, 'swords')], orientation: 'reversed', target: P1 });
    expect(s.players[P1]!.progress).toBe(4);
    expect(s.players[P2]!.statuses).toHaveLength(0);
  });
});
