import type { GameState } from '../../../engine';
import { ELEMENT_COLOR } from '../../art/colors';
import { Piece } from '../../components/Piece';
import type { GameStats } from '../../game/stats';
import { useLang } from '../../hooks/useLang';
import styles from './Game.module.css';

const W = 420;
const H = 190;
const PAD = { l: 52, r: 12, t: 12, b: 22 };

/** Each player's progress after every round: one line per player, the finish dashed. */
export function ProgressChart({ s, stats }: { s: GameState; stats: GameStats }) {
  const { t } = useLang();
  const finish = s.config.finish;
  const rounds = Math.max(1, (stats.progress[0]?.length ?? 1) - 1);
  const top = Math.max(finish, ...stats.progress.flat()) * 1.04;
  const x = (i: number) => PAD.l + (i / rounds) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
  const laps = Array.from({ length: s.config.laps }, (_, i) => (i + 1) * 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} role="img" aria-label={t('over.chart')}>
      {laps.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={v === finish ? 'var(--ink)' : 'var(--mute)'} strokeWidth={v === finish ? 2.5 : 1} strokeDasharray={v === finish ? '7 5' : '2 4'} />
          <text x={PAD.l - 6} y={y(v)} textAnchor="end" dominantBaseline="central" className={styles.chartLabel}>
            {v === finish ? t('over.finish') : t('over.lapLine', { n: v / 12 })}
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth={2} />
      {Array.from({ length: rounds + 1 }, (_, i) => i)
        .filter((i) => i === rounds || i % Math.ceil(rounds / 8) === 0)
        .map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className={styles.chartLabel}>
            {i}
          </text>
        ))}
      {stats.progress.map((series, p) => {
        const color = ELEMENT_COLOR[s.players[p]!.element];
        const pts = series.map((v, i) => `${x(i)},${y(v)}`).join(' ');
        const last = series.length - 1;
        return (
          <g key={p}>
            <polyline points={pts} fill="none" stroke="var(--ink)" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(last)} cy={y(series[last]!)} r={5.5} fill={color} stroke="var(--ink)" strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
}

const COLUMNS = ['played', 'hits', 'lost', 'gained', 'traps'] as const;

/** A small table: what each player did; the best of each column in bold. */
export function StatsTable({ s, stats }: { s: GameState; stats: GameStats }) {
  const { t } = useLang();
  const best = Object.fromEntries(COLUMNS.map((c) => [c, Math.max(...stats.players.map((p) => p[c]))])) as Record<(typeof COLUMNS)[number], number>;
  return (
    <table className={styles.statsTable}>
      <thead>
        <tr>
          <th />
          {COLUMNS.map((c) => (
            <th key={c} scope="col">
              {t(`over.stat.${c}`)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.order.map((id) => (
          <tr key={id}>
            <th scope="row">
              <Piece element={s.players[id]!.element} size={22} title={t(`player.${s.players[id]!.element}`)} />
            </th>
            {COLUMNS.map((c) => {
              const v = stats.players[id]![c];
              // "Spaces lost" is the one column where less is better: no highlight.
              const top = c !== 'lost' && v > 0 && v === best[c];
              return (
                <td key={c} className={top ? styles.statBest : undefined}>
                  {v}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
