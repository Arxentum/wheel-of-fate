// npm run sim                                  → full matrix + report (docs/balance-report.md)
// npm run sim -- --players 3 --laps 2 --games 2000 [--proposal] [--seed s]   → one config, text summary
import { writeFileSync } from 'node:fs';
import { runMany } from './runGame';
import { Stats } from './stats';
import { textSummary } from './summary';
import { PROPOSAL } from './proposal';
import { buildReport } from './report';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const players = arg('players');
const seed = arg('seed') ?? 'wof';
const useProposal = process.argv.includes('--proposal');

if (players) {
  const n = Number(players);
  const laps = Number(arg('laps') ?? 2);
  const games = Number(arg('games') ?? 2000);
  const t0 = Date.now();
  const st = runMany({ players: n, laps, balance: useProposal ? PROPOSAL : undefined }, games, `${seed}-${n}-${laps}`, new Stats());
  console.log(`${n} players, ${laps} laps, ${useProposal ? 'proposal' : 'rulebook v3'} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  console.log(textSummary(st, n));
} else {
  const games = Number(arg('games') ?? 2000);
  const big = Number(arg('big') ?? 20000);
  const out = arg('out') ?? 'docs/balance-report.md';
  const report = buildReport({ games, big, seed, log: (m) => console.log(m) });
  writeFileSync(out, report, 'utf8');
  console.log(`report written to ${out}`);
}
