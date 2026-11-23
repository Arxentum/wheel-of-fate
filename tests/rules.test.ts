// Turn flow, statuses, shields, traps, laps, victory and the engine's guarantees.
import { describe, expect, it } from 'vitest';
import {
  DECK_SIZE, MAJORS, applyAction, canBoost, canReroll, checkAction, chooseBotAction, createGame,
  enumerateActions, hasShield, statusOf, trapAt, applyActionMut, type GameState,
} from '../src/engine';
import { act, autoUntil, cardLocations, ofType, playMinor, resume, scenario, skill, status, uid } from './helpers';
import { RULEBOOK_V4 } from '../src/sim/rulebooks';

const P0 = 0, P1 = 1, P2 = 2;
const three = [{ controller: 'computer' as const, element: 'fire' as const }, { controller: 'computer' as const, element: 'earth' as const }, { controller: 'computer' as const, element: 'air' as const }];

function playAi(s: GameState, check?: (s: GameState) => void): void {
  let n = 0;
  while (s.pending) {
    const a = chooseBotAction(s);
    expect(checkAction(s, a)).toEqual({ ok: true });
    applyActionMut(s, a);
    check?.(s);
    if (++n > 5000) throw new Error('game did not end');
  }
}

describe('setup (rule §4)', () => {
  it('pieces on Aries, 3 FP, 3 cards, distinct characters, order by element', () => {
    const { state: s } = createGame({ laps: 2, players: [
      { controller: 'human', element: 'water' }, { controller: 'computer', element: 'fire' }, { controller: 'computer', element: 'air' },
    ] }, 'seed');
    expect(s.order).toEqual([1, 2, 0]);
    expect(new Set(s.players.map((p) => p.major)).size).toBe(3);
    for (const p of s.players) {
      expect(p.progress).toBe(0);
      expect(p.fp).toBe(3);
      expect(MAJORS).toContain(p.major);
    }
    // The first player has already drawn for their turn.
    expect(s.players[1]!.hand).toHaveLength(4);
    expect(s.players[0]!.hand).toHaveLength(3);
    expect(s.pending).toEqual({ kind: 'chooseAction', player: 1 });
    expect(cardLocations(s).sort((a, b) => a - b)).toEqual(Array.from({ length: DECK_SIZE }, (_, i) => i));
  });
  it('rejects bad setups', () => {
    expect(() => createGame({ laps: 1, players: [three[0]!] }, 1)).toThrow();
    expect(() => createGame({ laps: 1, players: [three[0]!, three[0]!] }, 1)).toThrow();
    expect(() => createGame({ laps: 0, players: three }, 1)).toThrow();
  });
});

describe('draw step (rule §5 ①)', () => {
  it('draws 2 with an empty hand, otherwise 1', () => {
    const s = scenario({ players: [{}, { hand: [] }, { hand: ['cups'] }], balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.turn.player).toBe(P1);
    expect(s.players[P1]!.hand).toHaveLength(2);
  });
  it('shuffles the discard pile into a new deck when the deck runs out', () => {
    const s = scenario({ players: [{ hand: ['cups'] }, {}, {}] });
    s.discard = s.deck.splice(0, s.deck.length - 1);
    const ev = playMinor(s, 'cups', 'upright');
    expect(ofType(ev, 'reshuffle')).toHaveLength(1);
    expect(s.players[P0]!.hand).toHaveLength(2);
  });
});

describe('Play step options (rule §5 ②)', () => {
  it('Silenced: no cards, but skill and meditate are fine', () => {
    const s = scenario({ players: [{ hand: ['wands'], statuses: [status('silenced', 1, 1)] }, {}, {}] });
    expect(checkAction(s, { type: 'playMinor', card: uid(s, P0, 'wands'), orientation: 'upright' })).toEqual({ ok: false, reason: 'silenced' });
    expect(checkAction(s, { type: 'useSkill' }).ok).toBe(true);
    expect(checkAction(s, { type: 'meditate' }).ok).toBe(true);
  });
  it('Drained: no skill, but meditate gains FP (D-03)', () => {
    const s = scenario({ players: [{ statuses: [status('drained', 1, 1)] }, {}, {}] });
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'drained' });
    act(s, { type: 'meditate' });
    expect(s.players[P0]!.fp).toBe(4);
  });
  it('the skill costs 1 FP', () => {
    const s = scenario({ players: [{ fp: 0 }, {}, {}] });
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'notEnoughFp' });
  });
  it('cooldown: not on two turns in a row; a turn in between is enough (D-02)', () => {
    const s = scenario({ players: [{ turnNo: 2, lastSkillTurn: 1 }, {}, {}] });
    expect(checkAction(s, { type: 'useSkill' })).toEqual({ ok: false, reason: 'cooldown' });
    s.players[P0]!.turnNo = 3;
    expect(checkAction(s, { type: 'useSkill' }).ok).toBe(true);
  });
  it('meditate: draw 1 and +1 FP', () => {
    const s = scenario();
    act(s, { type: 'meditate' });
    expect(s.players[P0]!.hand).toHaveLength(1);
    expect(s.players[P0]!.fp).toBe(4);
  });
});

describe('Flip (rule §5 ③)', () => {
  it('costs 1 FP and turns the character; skipped when you cannot pay', () => {
    const s = scenario({ balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    expect(s.pending?.kind).toBe('flip');
    act(s, { type: 'flip', flip: true }, false);
    expect(s.players[P0]!.orientation).toBe('reversed');
    expect(s.players[P0]!.fp).toBe(3);

    const t = scenario({ players: [{ fp: 0 }, {}, {}], balance: { die: [1] } });
    act(t, { type: 'meditate' }, false); // +1 FP, can flip
    expect(t.pending?.kind).toBe('flip');
    const u = scenario({ players: [{ statuses: [status('drained', 1, 1)] }, {}, {}], balance: { die: [1] } });
    act(u, { type: 'meditate' }, false);
    expect(u.pending?.kind).not.toBe('flip');
  });
});

describe('Move (rule §5 ④, decisions D-09 – D-12)', () => {
  it('reroll (1 FP) then boost (2 FP); no reroll after a boost', () => {
    const s = scenario({ players: [{ progress: 2, fp: 5 }, {}, {}], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    act(s, { type: 'flip', flip: false }, false);
    expect(s.pending?.kind).toBe('move');
    expect(canReroll(s)).toBe(true);
    act(s, { type: 'reroll' }, false);
    expect(s.players[P0]!.fp).toBe(5);
    expect(canReroll(s)).toBe(false);
    act(s, { type: 'boost' }, false);
    expect(s.players[P0]!.progress).toBe(5);
    expect(s.players[P0]!.fp).toBe(3);
  });
  it('boost first forbids a reroll', () => {
    const s = scenario({ players: [{ progress: 1, fp: 5 }, {}, {}], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    act(s, { type: 'flip', flip: false }, false);
    act(s, { type: 'boost' }, false);
    expect(s.turn.player).toBe(P1);
    expect(s.players[P0]!.progress).toBe(4);
  });
  it('Slowed: exactly 1 space, no reroll or boost', () => {
    const s = scenario({ players: [{ progress: 1, fp: 9, statuses: [status('slowed', 1, 1)] }, {}, {}], balance: { die: [3] } });
    act(s, { type: 'meditate' }, false);
    const ev = act(s, { type: 'flip', flip: false }, false);
    expect(ofType(ev, 'roll')[0]).toMatchObject({ value: 1, mode: 'slowed' });
    expect(s.players[P0]!.progress).toBe(2);
    expect(s.turn.player).toBe(P1);
  });
  it('Rooted: no Move step, card movement still works', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['wands'], statuses: [status('rooted', 1, 1)] }, {}, {}], balance: { die: [3] } });
    playMinor(s, 'wands', 'upright', undefined, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'moveSkipped')[0]).toMatchObject({ reason: 'rooted' });
    expect(s.players[P0]!.progress).toBe(2);
  });
  it('Wrong Turn: back 1 instead of rolling; a Rooted turn does not use it up (D-16)', () => {
    const s = scenario({ players: [{ progress: 5, statuses: [{ ...status('wrongTurn', 1, 1_000_000, 'fool.reversed'), amount: 1 }, status('rooted', 1, 1)] }, {}, {}], balance: { die: [3] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(5);
    expect(statusOf(s.players[P0]!, 'wrongTurn')).toBeDefined();

    const t = scenario({ players: [{ progress: 5, fp: 9, statuses: [{ ...status('wrongTurn', 1, 1_000_000, 'fool.reversed'), amount: 1 }] }, {}, {}], balance: { die: [3] } });
    act(t, { type: 'meditate' }, false);
    const ev = autoUntil(t);
    expect(ofType(ev, 'move')[0]).toMatchObject({ from: 5, to: 4, cause: 'wrongTurn' });
    expect(statusOf(t.players[P0]!, 'wrongTurn')).toBeUndefined();
    expect(ofType(ev, 'roll')).toHaveLength(0);
  });
});

describe('Resolve (rule §5 ⑤)', () => {
  it('element bonus: +1 FP when the Move step ends on your element', () => {
    const s = scenario({ players: [{ progress: 2, fp: 0 }, {}, {}], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(s.players[P0]!.progress).toBe(4);
    expect(ofType(ev, 'fp').some((e) => e.reason === 'element' && e.p === P0)).toBe(true);
  });
  it('lap bonus +2 FP; crossing the same lap again pays nothing (D-14)', () => {
    const s = scenario({ players: [{ progress: 11, fp: 0, hand: [] }, { hand: ['swords', 'swords'] }, {}], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(13);
    expect(s.players[P0]!.fp).toBe(1 + 2);
    // P1 knocks P0 back across Aries twice, P0 crosses again.
    resume(s, P1);
    playMinor(s, 'swords', 'reversed', P0);
    resume(s, P1);
    playMinor(s, 'swords', 'reversed', P0);
    expect(s.players[P0]!.progress).toBe(11);
    s.turn = { ...s.turn, player: P0, step: 'play' };
    s.pending = { kind: 'chooseAction', player: P0 };
    const fpBefore = s.players[P0]!.fp;
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(13);
    expect(s.players[P0]!.fp).toBe(fpBefore + 1);
  });
});

describe('End (rule §5 ⑥)', () => {
  it('discard down to 5, your choice', () => {
    const s = scenario({ players: [{ progress: 1, hand: ['wands', 'wands', 'cups', 'cups', 'swords'] }, {}, {}], balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s, (x) => x.pending?.kind === 'discardToLimit');
    expect(s.pending).toMatchObject({ kind: 'discardToLimit', count: 1 });
    act(s, { type: 'discard', cards: [uid(s, P0, 'cups')] }, false);
    expect(s.players[P0]!.hand).toHaveLength(5);
  });
  it('statuses end after the turn they applied to', () => {
    const s = scenario({ players: [{ statuses: [status('slowed', 1, 1), status('drained', 1, 2)] }, {}, {}], balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.statuses.map((x) => x.kind)).toEqual(['drained']);
  });
});

describe('statuses (rule §6, D-17)', () => {
  it('a status given during the target\'s own turn starts on their next turn', () => {
    const s = scenario({ players: [{ major: 'devil' }, {}, {}] });
    skill(s);
    expect(statusOf(s.players[P0]!, 'drained')).toMatchObject({ from: 2, until: 2 });
  });
  it('the same status does not stack; the longer one stays', () => {
    const s = scenario({ players: [{ hand: ['wands'], major: 'temperance', orientation: 'reversed' }, { progress: 3 }, { progress: 5 }] });
    skill(s, { target: P1 });
    s.pending = { kind: 'chooseAction', player: P0 };
    s.players[P0]!.lastSkillTurn = null;
    playMinor(s, 'wands', 'reversed');
    expect(s.players[P1]!.statuses.filter((x) => x.kind === 'slowed')).toEqual([expect.objectContaining({ from: 2, until: 3 })]);
  });
  it('Stunned: skips Play and Flip, still draws and moves', () => {
    // v4 rotates the first player: round 2 starts with P1.
    const s = scenario({ current: P2, players: [{}, { statuses: [status('stunned', 2, 2)] }, {}], balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s, (x) => x.turn.player === P1);
    expect(s.turn.player).toBe(P1);
    const all = [...ev, ...autoUntil(s)];
    expect(all.some((e) => e.t === 'actionSkipped' && e.p === P1)).toBe(true);
    expect(s.players[P1]!.progress).toBe(1);
  });
});

describe('shield (rule §6, D-18)', () => {
  it('blocks the next reversed effect, then is gone', () => {
    const s = scenario({ players: [{ hand: ['swords', 'swords'] }, { progress: 5, statuses: [status('shielded', 1, 2, 'king.upright')] }, {}] });
    playMinor(s, 'swords', 'reversed', P1);
    expect(s.players[P1]!.progress).toBe(5);
    resume(s);
    playMinor(s, 'swords', 'reversed', P1);
    expect(s.players[P1]!.progress).toBe(4);
  });
  it('lasts until the end of your next turn; gaining it again refreshes it', () => {
    const s = scenario({ players: [{ major: 'hermit' }, {}, {}], balance: { die: [1] } });
    skill(s, {}, false);
    expect(statusOf(s.players[P0]!, 'shielded')).toMatchObject({ from: 1, until: 2 });
    autoUntil(s);
    expect(hasShield(s.players[P0]!)).toBe(true);
    // P0's next turn (2) ends: shield gone.
    s.players[P0]!.turnNo = 2;
    s.turn = { ...s.turn, player: P0, step: 'play' };
    s.pending = { kind: 'chooseAction', player: P0 };
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(hasShield(s.players[P0]!)).toBe(false);
  });
});

describe('traps (rule §7, D-23 – D-25)', () => {
  const chainAt3 = [{ sign: 3, kind: 'chain' as const, owner: P1, seq: 0 }];
  it('v4: triggers at the end of a Move step: Chain = Rooted next turn and −2 FP', () => {
    const s = scenario({ players: [{ progress: 1 }, {}, {}], traps: chainAt3, balance: { ...RULEBOOK_V4, die: [2] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapTrigger')[0]).toMatchObject({ p: P0, blocked: false });
    expect(s.players[P0]!.fp).toBe(2);
    expect(statusOf(s.players[P0]!, 'rooted')).toMatchObject({ from: 2 });
    expect(s.traps).toHaveLength(0);
  });
  it('Illusion: back 3', () => {
    const s = scenario({ players: [{ progress: 1 }, {}, {}], traps: [{ sign: 3, kind: 'illusion', owner: P1, seq: 0 }], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.players[P0]!.progress).toBe(0);
  });
  it('v4: the owner, passing by and card pushes do not trigger it', () => {
    const own = scenario({ players: [{ progress: 1 }, {}, {}], traps: [{ sign: 3, kind: 'chain', owner: P0, seq: 0 }], balance: { ...RULEBOOK_V4, die: [2] } });
    act(own, { type: 'meditate' }, false);
    autoUntil(own);
    expect(own.traps).toHaveLength(1);
    const pass = scenario({ players: [{ progress: 1 }, {}, {}], traps: chainAt3, balance: { ...RULEBOOK_V4, die: [3] } });
    act(pass, { type: 'meditate' }, false);
    autoUntil(pass);
    expect(pass.traps).toHaveLength(1);
    const push = scenario({ players: [{ hand: ['swords'] }, { progress: 4 }, {}], traps: [{ sign: 3, kind: 'chain', owner: P0, seq: 0 }] });
    playMinor(push, 'swords', 'reversed', P1);
    expect(push.players[P1]!.progress).toBe(3);
    expect(push.traps).toHaveLength(1);
  });
  it('a shield blocks it; the trap is used up', () => {
    const s = scenario({ players: [{ progress: 1, statuses: [status('shielded', 1, 1, 'king.upright')] }, {}, {}], traps: chainAt3, balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapTrigger')[0]).toMatchObject({ blocked: true });
    expect(s.traps).toHaveLength(0);
    expect(s.players[P0]!.fp).toBe(4);
  });
  it('The Moon: immune this turn, the trap and the shield stay (D-24)', () => {
    const s = scenario({ players: [{ progress: 0, major: 'moon' }, {}, {}], traps: [{ sign: 3, kind: 'chain', owner: P1, seq: 0 }], balance: { ...RULEBOOK_V4, die: [1] } });
    skill(s, {}, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'trapIgnored')).toHaveLength(1);
    expect(s.traps).toHaveLength(1);
    expect(hasShield(s.players[P0]!)).toBe(true);
  });
  it('at most 3 on the board; a 4th removes the oldest', () => {
    const traps = [0, 1, 2].map((i) => ({ sign: i + 4, kind: 'chain' as const, owner: P1, seq: i }));
    const s = scenario({ balance: RULEBOOK_V4, players: [{ major: 'moon', orientation: 'reversed' }, {}, {}], traps });
    const ev = skill(s, { sign: 9 });
    expect(ofType(ev, 'trapExpire')[0]!.trap.sign).toBe(4);
    expect(s.traps.map((t) => t.sign).sort()).toEqual([5, 6, 9]);
    expect(trapAt(s, 9)?.owner).toBe(P0);
  });
});

describe('victory (rule §8, D-37, D-38)', () => {
  it('the round is finished after someone reaches the finish, then the highest progress wins', () => {
    const s = scenario({ laps: 1, players: [{ progress: 11 }, { progress: 5 }, { progress: 2 }], balance: { die: [2] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'finalRound')).toHaveLength(1);
    expect(s.result).toBeNull();
    expect(s.turn.player).toBe(P1);
    // Play out P1 and P2.
    for (const p of [P1, P2]) {
      expect(s.turn.player).toBe(p);
      act(s, { type: 'meditate' }, false);
      autoUntil(s);
    }
    expect(s.pending).toBeNull();
    expect(s.result?.winners).toEqual([P0]);
    expect(s.turn.step).toBe('over');
  });
  it('the trigger stays even when the runner is pushed back below the finish', () => {
    const s = scenario({ laps: 1, current: P1, players: [{ progress: 12 }, { progress: 5, hand: ['swords'] }, { progress: 2 }], balance: { die: [1] } });
    s.finalRound = true;
    playMinor(s, 'swords', 'reversed', P0, false);
    autoUntil(s);
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.result).not.toBeNull();
    expect(s.result!.ranking[0]).toEqual([P0]);
  });
  it('ties: FP decide, then a shared win', () => {
    const s = scenario({ laps: 1, current: P2, players: [{ progress: 14, fp: 4 }, { progress: 14, fp: 4 }, { progress: 3, fp: 1 }], balance: { die: [1] } });
    s.finalRound = true;
    act(s, { type: 'meditate' }, false);
    autoUntil(s);
    expect(s.result!.winners.sort()).toEqual([P0, P1]);
    expect(s.result!.ranking).toEqual([[P0, P1], [P2]]);
  });
});

describe('engine guarantees', () => {
  it('applyAction is pure', () => {
    const s = scenario({ players: [{ hand: ['wands'] }, {}, {}] });
    const before = JSON.stringify(s);
    const r = applyAction(s, { type: 'playMinor', card: uid(s, P0, 'wands'), orientation: 'upright' });
    expect(JSON.stringify(s)).toBe(before);
    expect(r.state.players[P0]!.progress).toBe(1);
  });
  it('illegal actions throw', () => {
    const s = scenario();
    expect(() => applyActionMut(s, { type: 'reroll' })).toThrow(/wrongDecision/);
  });
  it('the same seed replays the same game; the state survives JSON', () => {
    const run = (seed: string) => {
      const { state } = createGame({ laps: 2, players: three }, seed);
      playAi(state);
      return state;
    };
    const a = run('replay');
    const b = run('replay');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    expect(JSON.stringify(run('other'))).not.toBe(JSON.stringify(a));
  });
  it('300 computer games of every size end without errors; cards are never lost; every listed action is legal', () => {
    const els = ['fire', 'earth', 'air', 'water'] as const;
    let games = 0;
    for (const n of [2, 3, 4]) {
      for (const laps of [1, 2, 3]) {
        for (let g = 0; g < 34; g++) {
          const { state } = createGame({ laps, players: els.slice(0, n).map((element) => ({ controller: 'computer', element })) }, `g${n}${laps}${g}`);
          playAi(state, (s) => {
            const locs = cardLocations(s);
            if (locs.length !== DECK_SIZE || new Set(locs).size !== DECK_SIZE) throw new Error('card lost or duplicated');
            for (const a of enumerateActions(s)) if (!checkAction(s, a).ok) throw new Error('enumerated an illegal action');
            for (const p of s.players) if (p.fp < 0 || p.fp > 10 || p.progress < 0) throw new Error('out of range');
          });
          expect(state.result).not.toBeNull();
          games++;
        }
      }
    }
    expect(games).toBe(306);
  }, 60_000);
  it('canBoost is false without FP', () => {
    const s = scenario({ players: [{ fp: 0 }, {}, {}] });
    act(s, { type: 'meditate' }, false);
    if (s.pending?.kind === 'flip') act(s, { type: 'flip', flip: false }, false);
    expect(s.pending?.kind).toBe('move');
    expect(canBoost(s)).toBe(false);
    expect(canReroll(s)).toBe(true);
  });
});

describe('shield refund (decision D-59)', () => {
  it('a shield that runs out unused returns 1 FP; a used one returns nothing', () => {
    const s = scenario({ players: [{ fp: 0, statuses: [status('shielded', 1, 1, 'king.upright')] }, {}, {}], balance: { die: [1] } });
    act(s, { type: 'meditate' }, false);
    const ev = autoUntil(s);
    expect(ofType(ev, 'shieldExpire')).toHaveLength(1);
    expect(ofType(ev, 'fp').some((e) => e.reason === 'shieldRefund' && e.delta === 1)).toBe(true);

    const u = scenario({ current: P1, players: [{ fp: 0, statuses: [status('shielded', 1, 1, 'king.upright')] }, { progress: 0, hand: ['swords'] }, {}], balance: { die: [1] } });
    u.players[P0]!.progress = 3;
    playMinor(u, 'swords', 'reversed', P0, false);
    autoUntil(u, (x) => x.turn.player === P0);
    expect(hasShield(u.players[P0]!)).toBe(false);
  });
});
