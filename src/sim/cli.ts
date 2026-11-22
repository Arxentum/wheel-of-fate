// npm run sim                                  → full matrix + report (docs/balance-report.md)
// npm run sim -- --players 3 --laps 2 --games 2000 [--proposal] [--seed s]   → one config, text summary
import { writeFileSync } from 'node:fs';
import { runMany } from './runGame';
import { Stats } from './stats';
import { textSummary } from './summary';
import { PROPOSAL } from './proposal';
import { buildReport } from './report';
import { RULEBOOK_V3 } from './rulebooks';
import { diagnoseReversed } from './diagnose';
import { MAJOR_ZH } from './report';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const players = arg('players');
const seed = arg('seed') ?? 'wof';
const useProposal = process.argv.includes('--proposal');
const useV3 = process.argv.includes('--v3');

if (process.argv.includes('--diagnose-reversed')) {
  const games = Number(arg('games') ?? 500);
  const t0 = Date.now();
  const rows = diagnoseReversed(games, seed, useV3 ? RULEBOOK_V3 : useProposal ? PROPOSAL : {});
  const pct = (x: number) => (x * 100).toFixed(1) + '%';
  console.log('| 角色 | 默认电脑胜率 | 一律逆位胜率 | 差 | 一律逆位时每局用逆位 |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const r of rows) console.log(`| ${MAJOR_ZH[r.major]} | ${pct(r.defaultWin)} | ${pct(r.reversedWin)} | ${((r.reversedWin - r.defaultWin) * 100).toFixed(1)} | ${r.reversedUses.toFixed(2)} |`);
  const avg = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0) / rows.length;
  console.log(`| 平均 | ${pct(avg((r) => r.defaultWin))} | ${pct(avg((r) => r.reversedWin))} | ${((avg((r) => r.reversedWin) - avg((r) => r.defaultWin)) * 100).toFixed(1)} | ${avg((r) => r.reversedUses).toFixed(2)} |`);
  console.log(`(${games} games per arm, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
} else if (players) {
  const n = Number(players);
  const laps = Number(arg('laps') ?? 2);
  const games = Number(arg('games') ?? 2000);
  const t0 = Date.now();
  const st = runMany({ players: n, laps, balance: useV3 ? RULEBOOK_V3 : useProposal ? PROPOSAL : undefined }, games, `${seed}-${n}-${laps}`, new Stats());
  console.log(`${n} players, ${laps} laps, ${useV3 ? 'rulebook v3' : useProposal ? 'proposal' : 'current rules (v5)'} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(textSummary(st, n));
} else {
  const games = Number(arg('games') ?? 2000);
  const big = Number(arg('big') ?? 20000);
  const out = arg('out') ?? 'docs/balance-report.md';
  const report = buildReport({ games, big, seed, log: (m) => console.log(m) });
  writeFileSync(out, report, 'utf8');
  console.log(`report written to ${out}`);
}
