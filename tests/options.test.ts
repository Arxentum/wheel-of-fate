// Balance options used by the M1 proposal (src/sim/proposal.ts) and the experiments in the report.
import { describe, expect, it } from 'vitest';
import {
  applyActionMut, applyBalancePatch, checkAction, chooseAiAction, createGame, defaultBalance,
  enumerateActions, hasShield, statusOf, type GameState,
} from '../src/engine';
import { PROPOSAL } from '../src/sim/proposal';
import { act, autoUntil, ofType, playMinor, scenario, skill, uid } from './helpers';

const P0 = 0, P1 = 1, P2 = 2;

function playOut(s: GameState): void {
  let n = 0;
  while (s.pending) {
    applyActionMut(s, chooseAiAction(s));
    if (++n > 5000) throw new Error('game did not end');
  }
}

describe('rotateStart (S1: the first player moves on each round)', () => {
  it('round 2 starts with the second seat, round 3 with the third', () => {
    const s = scenario({ current: P2, balance: { rotateStart: true, die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s, (x) => x.turn.player !== P2);
    expect(s.round).toBe(2);
    expect(s.turn.player).toBe(P1);
    for (const next of [P2, P0]) {
      act(s, { type: 'meditate' }, false);
      autoUntil(s, (x) => x.turn.player === next);
      expect(s.turn.player).toBe(next);
    }
    act(s, { type: 'meditate' }, false);
    autoUntil(s, (x) => x.round === 3);
    expect(s.turn.player).toBe(P2);
  });
  it('the final round still ends with its last player', () => {
    const s = scenario({ current: P2, balance: { rotateStart: true, die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s, (x) => x.round === 2);
    s.finalRound = true;
    for (const p of [P1, P2, P0]) {
      expect(s.turn.player).toBe(p);
      act(s, { type: 'meditate' }, false);
      autoUntil(s, (x) => x.turn.player !== p || x.result !== null);
    }
    expect(s.result).not.toBeNull();
  });
});

describe('reversedAhead (S2: single-target reversed faces hit every player ahead)', () => {
  const ahead = { reversedAhead: true };
  it('a minor reversed hits everyone ahead, nobody behind, and needs no target', () => {
    const s = scenario({ balance: ahead, players: [{ progress: 3, hand: ['swords'] }, { progress: 6 }, { progress: 1 }] });
    const card = uid(s, P0, 'swords');
    expect(enumerateActions(s).filter((a) => a.type === 'playMinor' && a.orientation === 'reversed')).toEqual([{ type: 'playMinor', card, orientation: 'reversed' }]);
    playMinor(s, 'swords', 'reversed');
    expect(s.players.map((p) => p.progress)).toEqual([3, 5, 1]);
  });
  it('greyed out while you lead', () => {
    const s = scenario({ balance: ahead, players: [{ progress: 6, hand: ['wands'] }, { progress: 6 }, { progress: 1 }] });
    expect(checkAction(s, { type: 'playMinor', card: uid(s, P0, 'wands'), orientation: 'reversed' })).toEqual({ ok: false, reason: 'noTarget' });
  });
  it('court combos and characters follow the same rule; each shield counts separately', () => {
    const s = scenario({ balance: ahead, players: [{ hand: ['knight', 'pentacles', 'swords'] }, { progress: 7 }, { progress: 6, statuses: [{ kind: 'shielded', from: 1, until: 2, source: 'king.upright' }] }] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'knight'), fuel: [uid(s, P0, 'pentacles'), uid(s, P0, 'swords')], orientation: 'reversed' });
    expect(s.players[P1]!.progress).toBe(5);
    expect(statusOf(s.players[P1]!, 'stunned')).toBeDefined();
    expect(s.players[P2]!.progress).toBe(6);
    expect(hasShield(s.players[P2]!)).toBe(false);

    const c = scenario({ balance: ahead, players: [{ major: 'chariot', orientation: 'reversed' }, { progress: 5 }, { progress: 4 }] });
    skill(c);
    expect(c.players[P1]!.progress).toBe(3);
    expect(c.players[P2]!.progress).toBe(2);
  });
  it('King reversed: the players ahead get the full effect, the others are Drained', () => {
    const s = scenario({ balance: ahead, players: [{ progress: 4, hand: ['king', 'cups', 'swords'] }, { progress: 6 }, { progress: 1 }] });
    act(s, { type: 'playCourt', card: uid(s, P0, 'king'), fuel: [uid(s, P0, 'cups'), uid(s, P0, 'swords')], orientation: 'reversed' });
    expect(s.players[P1]!.progress).toBe(4);
    expect(statusOf(s.players[P1]!, 'silenced')).toBeDefined();
    expect(statusOf(s.players[P2]!, 'silenced')).toBeUndefined();
    expect(statusOf(s.players[P2]!, 'drained')).toBeDefined();
  });
  it('The High Priestess reversed still picks one target', () => {
    const s = scenario({ balance: ahead, players: [{ major: 'highPriestess', orientation: 'reversed' }, { progress: 5, hand: ['cups'] }, {}] });
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'noTarget' });
    skill(s, { target: P1 });
    expect(s.players[P1]!.hand).toHaveLength(0);
  });
  it('The Wheel Turns needs no target choices', () => {
    const s = scenario({ balance: ahead, players: [{ major: 'wheelOfFortune', orientation: 'reversed' }, { progress: 5 }, { progress: 2 }], deckTop: ['swords', 'swords', 'swords'] });
    skill(s);
    expect(s.pending).toBeNull();
    // P0 (at 0) hits P1 and P2; P1 (at 4) hits nobody ahead... P2 (at 1) hits P1.
    expect(s.players[P1]!.progress).toBe(3);
    expect(s.players[P2]!.progress).toBe(1);
  });
});

describe('experimental end-game options (report §3)', () => {
  it('endRule immediate: the game ends after the turn the finish is reached', () => {
    const s = scenario({ laps: 1, players: [{ progress: 11 }, {}, {}], balance: { endRule: 'immediate', die: [2] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.result?.winners).toEqual([P0]);
  });
  it('finishSafe: players past the finish ignore reversed effects', () => {
    const s = scenario({ laps: 1, current: P1, players: [{ progress: 12 }, { hand: ['swords'] }, {}], balance: { finishSafe: true } });
    const ev = playMinor(s, 'swords', 'reversed', P0);
    expect(s.players[P0]!.progress).toBe(12);
    expect(ofType(ev, 'finishSafe')).toHaveLength(1);
  });
  it('seat compensation adds progress and FP by turn order', () => {
    const { state } = createGame({ laps: 2, balance: { startProgressBySeat: [2, 1, 0], startFpBySeat: [1, 0, 0] }, players: [
      { controller: 'ai', element: 'air' }, { controller: 'ai', element: 'fire' }, { controller: 'ai', element: 'earth' },
    ] }, 1);
    expect(state.players.map((p) => p.progress)).toEqual([0, 2, 1]);
    expect(state.players[1]!.fp).toBe(4);
  });
});

describe('proposal parameters (report §6)', () => {
  const B = (cards: NonNullable<Parameters<typeof scenario>[0]>['balance']) => cards;
  it('M1 Strength without shield; M3 Lovers without the extra space; M5 Temperance without the card', () => {
    const s = scenario({ balance: B({ cards: { 'strength.upright': { shield: 0 } } }), players: [{ major: 'strength', progress: 1 }, {}, {}] });
    skill(s);
    expect(hasShield(s.players[P0]!)).toBe(false);
    const l = scenario({ balance: B({ cards: { 'lovers.upright': { extra: 0 } } }), players: [{ major: 'lovers', progress: 1 }, { progress: 4 }, {}] });
    skill(l);
    expect(l.players[P0]!.progress).toBe(4);
    const t = scenario({ balance: B({ cards: { 'temperance.upright': { draw: 0 } } }), players: [{ major: 'temperance' }, {}, {}] });
    skill(t);
    expect(t.players[P0]!.hand).toHaveLength(0);
  });
  it('M2 Wheel of Fortune moves the lower die and gains the higher', () => {
    const s = scenario({ balance: B({ die: [1, 3], cards: { 'wheelOfFortune.upright': { moveHigher: 0 } } }), players: [{ major: 'wheelOfFortune' }, {}, {}] });
    const ev = skill(s);
    const dice = ofType(ev, 'effectRoll')[0]!.dice;
    expect(s.players[P0]!.progress).toBe(Math.min(...dice));
    expect(s.players[P0]!.fp).toBe(2 + Math.max(...dice));
  });
  it('M4 Star restores to 2; M6 World stops after 8 spaces', () => {
    const s = scenario({ balance: B({ cards: { 'star.upright': { fpFloor: 2 } } }), players: [{ major: 'star', fp: 1 }, {}, {}] });
    skill(s);
    expect(s.players[P0]!.fp).toBe(2);
    const w = scenario({ balance: B({ cards: { 'world.upright': { max: 8 } } }), players: [{ major: 'world' }, {}, {}] });
    skill(w);
    expect(w.players[P0]!.progress).toBe(8);
  });
  it('M7–M12: resource characters move first', () => {
    const cases = [
      ['hermit', { move: 1, draw: 1 }, 1],
      ['empress', { move: 1, draw: 1 }, 1],
      ['hierophant', { move: 1 }, 1],
      ['highPriestess', { move: 1, fp: 0 }, 1],
      ['death', { move: 2 }, 2],
      ['devil', { move: 2 }, 2],
    ] as const;
    for (const [major, params, move] of cases) {
      const s = scenario({ balance: B({ cards: { [`${major}.upright`]: params } }), players: [{ major }, { major: 'chariot' }, { major: 'sun' }], deckTop: ['wands', 'cups', 'king'] });
      skill(s);
      if (s.pending?.kind === 'foresight') act(s, { type: 'foresightPick', use: s.pending.cards[0]!, take: s.pending.cards[1]! }, true);
      expect(s.players[P0]!.progress, major).toBeGreaterThanOrEqual(move);
    }
  });
  it('M13 Emperor: roll counts as 4; M14 Magician: up to 2 extra minor cards', () => {
    const e = scenario({ balance: B({ cards: { 'emperor.upright': { roll: 4, fp: 1 } } }), players: [{ major: 'emperor', progress: 2 }, {}, {}] });
    skill(e, {}, false);
    const ev = act(e, { type: 'flip', flip: false }, false);
    expect(ofType(ev, 'roll')[0]).toMatchObject({ value: 4, mode: 'fixed' });
    const m = scenario({ balance: B({ cards: { 'magician.upright': { extraPlays: 2 } } }), players: [{ major: 'magician', progress: 2 }, {}, {}], deckTop: ['wands', 'wands'] });
    skill(m);
    act(m, { type: 'conjurePlay', play: { card: uid(m, P0, 'wands'), orientation: 'upright' } });
    expect(m.pending).toMatchObject({ kind: 'conjure', left: 1 });
    act(m, { type: 'conjurePlay', play: { card: uid(m, P0, 'wands'), orientation: 'upright' } });
    expect(m.players[P0]!.progress).toBe(4);
    expect(m.pending).toBeNull();
  });
  it('M15 Justice: at least 2 when behind; +1 space and 2 FP when leading', () => {
    const s = scenario({ balance: B({ cards: { 'justice.upright': { min: 2, moveIfLeading: 1 } } }), players: [{ major: 'justice', progress: 3 }, { progress: 4 }, {}] });
    skill(s);
    expect(s.players[P0]!.progress).toBe(5);
    const l = scenario({ balance: B({ cards: { 'justice.upright': { min: 2, moveIfLeading: 1 } } }), players: [{ major: 'justice', progress: 6 }, { progress: 4 }, {}] });
    skill(l);
    expect(l.players[P0]!.progress).toBe(7);
    expect(l.players[P0]!.fp).toBe(4);
  });
  it('M16 Judgement draws 2; M17 Moon +1 FP; Tower can cost FP', () => {
    const j = scenario({ balance: B({ cards: { 'judgement.upright': { draw: 2 } } }), players: [{ major: 'judgement', hand: ['wands'] }, {}, {}] });
    skill(j, { discard: [uid(j, P0, 'wands')] });
    expect(j.players[P0]!.hand).toHaveLength(2);
    const moon = scenario({ balance: B({ cards: { 'moon.upright': { fp: 1 } } }), players: [{ major: 'moon' }, {}, {}] });
    skill(moon);
    expect(moon.players[P0]!.fp).toBe(3);
    const t = scenario({ balance: B({ cards: { 'tower.upright': { fpLoss: 1 } } }), players: [{ major: 'tower' }, {}, {}] });
    skill(t);
    expect(t.players[P0]!.fp).toBe(1);
  });
  it('M18 The Hanged Man: forward 2, +3 FP, 1 card, shield, Slowed next turn; this turn moves normally', () => {
    const s = scenario({ balance: B({ die: [2], cards: { 'hangedMan.upright': { skipMove: 0, move: 2, fp: 3, draw: 1, slowedSelf: 1 } } }), players: [{ major: 'hangedMan', progress: 1 }, {}, {}] });
    skill(s, {}, false);
    const p = s.players[P0]!;
    expect(p.progress).toBe(3);
    expect(p.fp).toBe(5);
    expect(hasShield(p)).toBe(true);
    expect(statusOf(p, 'slowed')).toMatchObject({ from: 2, until: 2 });
    act(s, { type: 'flip', flip: false }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(5);
  });
  it('the whole proposal is a valid patch and plays out', () => {
    expect(() => applyBalancePatch(defaultBalance(), PROPOSAL)).not.toThrow();
    for (let g = 0; g < 30; g++) {
      const { state } = createGame({ laps: 3, balance: PROPOSAL, players: [
        { controller: 'ai', element: 'fire' }, { controller: 'ai', element: 'earth' }, { controller: 'ai', element: 'air' }, { controller: 'ai', element: 'water' },
      ] }, `prop-${g}`);
      playOut(state);
      expect(state.result).not.toBeNull();
    }
  });
});

describe('the defaults are rulebook v3', () => {
  it('every experimental switch is off and the new card parameters are neutral', () => {
    const b = defaultBalance();
    expect(b).toMatchObject({ rotateStart: false, reversedAhead: false, finishSafe: false, endRule: 'round', startProgressBySeat: [], startFpBySeat: [] });
    expect(b.cards['hermit.upright']).toEqual({ move: 0, fp: 2, draw: 2, shield: 1 });
    expect(b.cards['hangedMan.upright']).toEqual({ skipMove: 1, move: 0, fp: 4, draw: 2, shield: 1, slowedSelf: 0 });
    expect(b.cards['world.upright']).toEqual({ max: 11 });
    expect(b.cards['emperor.upright']).toEqual({ fp: 2, roll: 3, shield: 1 });
    expect(b.cards['wheelOfFortune.upright']).toEqual({ moveHigher: 1 });
    expect(b.cards['justice.upright']).toEqual({ min: 0, max: 5, fpIfLeading: 2, moveIfLeading: 0 });
  });
});
