import { describe, expect, it } from 'vitest';
import { FACES, createGame, type FaceKey, type GameState } from '../src/engine';
import { LANGS } from '../src/i18n';
import { renderFace } from '../src/ui/game/cardText';

function game(players: number): GameState {
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  return createGame({ players: elements.slice(0, players).map((element) => ({ controller: 'ai', element })), laps: 3 }, 'text').state;
}

const KEYS = Object.keys(FACES) as FaceKey[];

describe('card texts', () => {
  it.each([2, 3, 4])('every face has a complete text in both languages (%i players)', (n) => {
    const s = game(n);
    for (const lang of LANGS) {
      for (const key of KEYS) {
        const { name, text } = renderFace(lang, s.config.balance, n, key);
        expect(name, key).not.toMatch(/face\.|\{|\}/);
        expect(text, key).not.toMatch(/face\.|\{|\}|undefined|NaN/);
      }
    }
  });

  it('shows the leader numbers in 3–4 player games only', () => {
    const three = renderFace('en', game(3).config.balance, 3, 'fool.reversed').text;
    const two = renderFace('en', game(2).config.balance, 2, 'fool.reversed').text;
    expect(three).toBe('Choose a player ahead of you. On their next Move step, they move back 2 spaces instead of rolling (the leader: 4).');
    expect(two).toBe('Choose a player ahead of you. On their next Move step, they move back 2 spaces instead of rolling.');
    expect(renderFace('zh-Hant', game(3).config.balance, 3, 'tower.reversed').text).toBe('所有領先於你的玩家後退 2 格，其中領先者後退 4 格。');
    expect(renderFace('en', game(3).config.balance, 3, 'temperance.reversed').text).toBe(
      'A player ahead of you moves back 1 space and is Slowed for their next 2 turns (the leader: 4 turns).',
    );
  });

  it('uses the 2-player numbers of the rulebook', () => {
    expect(renderFace('en', game(2).config.balance, 2, 'hangedMan.upright').text).toMatch(/^Move forward 3 spaces,/);
    expect(renderFace('en', game(3).config.balance, 3, 'hangedMan.upright').text).toMatch(/^Move forward 2 spaces,/);
    expect(renderFace('zh-Hant', game(2).config.balance, 2, 'hierophant.upright').text).toContain('獲得 2 命運點');
  });

  it('matches the rulebook wording for traps', () => {
    expect(renderFace('en', game(3).config.balance, 3, 'devil.reversed').text).toBe(
      'Place a Chain Trap 1–3 signs in front of a player ahead of you. Whoever passes it is Rooted next turn and loses 3 Fate Points (the leader: 5).',
    );
    expect(renderFace('zh-Hant', game(4).config.balance, 4, 'moon.reversed').text).toBe(
      '在一名領先於你的玩家前方 1–3 格放置幻象陷阱。經過的人後退 4 格（領先者 6 格），並停止移動。',
    );
  });
});
