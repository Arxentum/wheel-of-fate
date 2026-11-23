// Diagnostic (user request after M1): is a character's reversed skill really weak, or does the computer player
// undervalue it? One player holds the character and always uses its reversed skill when it can;
// the other players are default computer players. Compared with the same character played by the default computer player.
import {
  MAJORS, applyActionMut, canSpend, chooseBotAction, chooseAmong, createGame, enumerateActions,
  type Action, type BalancePatch, type Element, type GameState, type MajorId, type PlayerId,
} from '../engine';
import { nextInt, seedFromString, shuffle } from '../engine/core/rng';

function reversedPolicy(s: GameState, hero: PlayerId): Action | null {
  const d = s.pending!;
  if (d.player !== hero) return null;
  const p = s.players[hero]!;
  if (d.kind === 'flip') {
    const toReversed = p.orientation === 'upright' && canSpend(p, s.config.balance.flipCost);
    return { type: 'flip', flip: toReversed };
  }
  if (d.kind === 'chooseAction' && p.orientation === 'reversed') {
    const skills = enumerateActions(s).filter((a) => a.type === 'useSkill');
    if (skills.length > 0) return chooseAmong(s, skills);
  }
  return null;
}

export interface DiagnoseRow {
  major: MajorId;
  games: number;
  defaultWin: number;
  reversedWin: number;
  reversedUses: number;
}

export function diagnoseReversed(games: number, seed: string, balance: BalancePatch = {}, players = 3, laps = 3): DiagnoseRow[] {
  const rows: DiagnoseRow[] = [];
  for (const major of MAJORS) {
    const arm = (forceReversed: boolean) => {
      let wins = 0, uses = 0;
      for (let g = 0; g < games; g++) {
        const r = seedFromString(`${seed}-${major}-${g}`);
        const els = shuffle(r, ['fire', 'earth', 'air', 'water'] as Element[]).slice(0, players);
        const hero = nextInt(r, players);
        const { state } = createGame({
          laps, balance,
          players: els.map((element, i) => ({
            controller: 'computer', element,
            ...(i === hero ? { major, ...(forceReversed ? { orientation: 'reversed' as const } : {}) } : {}),
          })),
        }, `${seed}-${major}-game-${g}`);
        while (state.pending) {
          const forced = forceReversed ? reversedPolicy(state, hero) : null;
          const ev = applyActionMut(state, forced ?? chooseBotAction(state));
          for (const e of ev) if (e.t === 'play' && e.kind === 'skill' && e.p === hero && e.face?.endsWith('.reversed')) uses++;
        }
        const w = state.result!.winners;
        if (w.includes(hero)) wins += 1 / w.length;
      }
      return { win: wins / games, uses: uses / games };
    };
    const def = arm(false);
    const rev = arm(true);
    rows.push({ major, games, defaultWin: def.win, reversedWin: rev.win, reversedUses: rev.uses });
  }
  return rows;
}
