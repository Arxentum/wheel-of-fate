import { describe, expect, it } from 'vitest';
import { applyActionMut, cardDef, chooseBotAction, createGame, enumerateActions, type GameSetup } from '../src/engine';
import { cardSideOption, skillOption } from '../src/ui/game/options';

describe('UI options agree with the engine', () => {
  it('offers exactly the plays the engine allows', () => {
    let checked = 0;
    for (const [n, seed] of [[2, 'opt-a'], [3, 'opt-b'], [4, 'opt-c']] as const) {
      const elements = ['fire', 'earth', 'air', 'water'] as const;
      const setup: GameSetup = { players: elements.slice(0, n).map((element) => ({ controller: 'computer', element })), laps: 2 };
      const { state } = createGame(setup, seed);
      while (state.pending) {
        const d = state.pending;
        if (d.kind === 'chooseAction' || d.kind === 'conjure') {
          const legal = enumerateActions(state);
          const hand = state.players[d.player]!.hand;
          for (const card of hand) {
            for (const o of ['upright', 'reversed'] as const) {
              const opt = cardSideOption(state, card, o);
              // Same answer as the engine's list for this card's suit and side.
              const engineHas = legal.some((a) =>
                (a.type === 'playMinor' || a.type === 'playCourt') ? a.orientation === o && state.players[d.player]!.hand.includes(a.card) && sameDef(a.card, card)
                : a.type === 'conjurePlay' && a.play ? a.play.orientation === o && sameDef(a.play.card, card) : false);
              expect(opt.ok, `${card} ${o} ${opt.reason}`).toBe(engineHas);
              // A side that needs no target or fuel choice is one action (no pointless target buttons).
              if (opt.ok && cardDef(card) !== 'page' && cardDef(card) !== 'knight' && cardDef(card) !== 'queen' && cardDef(card) !== 'king') {
                expect(opt.actions).toHaveLength(1);
              }
              checked++;
            }
          }
          if (d.kind === 'chooseAction') {
            expect(skillOption(state, d.player).ok).toBe(legal.some((a) => a.type === 'useSkill'));
          }
        }
        applyActionMut(state, chooseBotAction(state));
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

function sameDef(a: number, b: number): boolean {
  return cardDef(a) === cardDef(b);
}

describe('reasonText', () => {
  it('fills in the game costs and trap reach', async () => {
    const { reasonText } = await import('../src/ui/screens/game/shared');
    const { createGame } = await import('../src/engine');
    const { translate } = await import('../src/i18n');
    const { state } = createGame({ players: [{ controller: 'human', element: 'fire' }, { controller: 'computer', element: 'air' }], laps: 1 }, 'reason');
    const en = (k: Parameters<typeof translate>[1], p?: Parameters<typeof translate>[2]) => translate('en', k, p);
    expect(reasonText(en, state, 'cannotBoost')).toBe('No boost: one per turn, and it costs 2 Fate Points.');
    expect(reasonText(en, state, 'cannotFlip')).toBe('Flipping costs 1 Fate Point.');
    expect(reasonText(en, state, 'invalidSign')).toContain('1–3 signs');
    expect(reasonText(en, state, undefined)).toBeUndefined();
  });
});
