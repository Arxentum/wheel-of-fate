// Plain-text summary of one Stats (for `npm run sim -- --players … --laps …`).
import { MAJORS, SUITS, COURTS } from '../engine';
import type { Stats } from './stats';

const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : '—');

export function textSummary(st: Stats, players: number): string {
  const lines: string[] = [];
  const fair = 1 / players;
  lines.push(`games ${st.games}  rounds avg ${st.meanRounds().toFixed(2)}  p10 ${st.percentile(0.1)}  p90 ${st.percentile(0.9)}`);
  lines.push(`seats ${st.bySeat.slice(0, players).map((c) => pct(c.wins / c.games)).join(' ')}`);
  lines.push(`elements ${[...st.byElement].filter(([, c]) => c.games).map(([e, c]) => `${e} ${pct(c.wins / c.games)}`).join('  ')}`);
  lines.push(`upright share: minor ${pct(st.share(st.orient.minor))} court ${pct(st.share(st.orient.court))} skill ${pct(st.share(st.orient.skill))}`);
  const a = st.actions;
  const tot = a.minor + a.court + a.skill + a.meditate + a.skipped;
  lines.push(`actions: minor ${pct(a.minor / tot)} court ${pct(a.court / tot)} skill ${pct(a.skill / tot)} meditate ${pct(a.meditate / tot)} skipped ${pct(a.skipped / tot)}`);
  lines.push(`fp cap: events/player-game ${(st.fpCapEvents / st.playerGames).toFixed(2)}  turns with loss ${pct(st.turnsWithCap / st.turns)}  avg final fp ${(st.finalFpSum / st.playerGames).toFixed(2)}`);
  const t = st.traps;
  lines.push(`traps: placed ${t.placed} triggered ${pct(t.triggered / t.placed)} (blocked ${t.blocked}) ignored ${t.ignored} replaced ${pct(t.replaced / t.placed)} left ${pct(t.leftAtEnd / t.placed)}`);
  lines.push(`play rate: ${[...SUITS, ...COURTS].map((d) => { const c = st.playable.get(d)!; return `${d} ${pct(c.played / c.avail)}`; }).join('  ')}`);
  lines.push(`flips/player-game ${(st.flips / st.playerGames).toFixed(2)}  shield blocks/game ${(st.shieldBlocks / st.games).toFixed(2)}  margin ${(st.marginSum / st.games).toFixed(2)}`);
  lines.push('majors (win, dev, uses/game, upright share):');
  const rows = MAJORS.map((m) => {
    const c = st.byMajor.get(m)!;
    const w = c.wins / c.games;
    const u = st.skillByMajor.get(m)!;
    const g = st.majorGames.get(m)!;
    return { m, w, dev: w - fair, uses: (u.upright + u.reversed) / g, up: st.share(u) };
  }).sort((x, y) => y.w - x.w);
  for (const r of rows) {
    const flag = Math.abs(r.dev) > 0.07 ? ' <<' : '';
    lines.push(`  ${r.m.padEnd(15)} ${pct(r.w).padStart(6)} ${(r.dev >= 0 ? '+' : '') + (r.dev * 100).toFixed(1).padStart(5)}  ${r.uses.toFixed(2)}  ${pct(r.up)}${flag}`);
  }
  return lines.join('\n');
}
