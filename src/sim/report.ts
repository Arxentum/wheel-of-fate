// Builds docs/balance-report.md (in Chinese, as the project's documents are): rules v3, v4 and v5.
import { COURTS, MAJORS, SUITS, RULEBOOK_BOT_WEIGHTS, BOT_WEIGHTS, type BalancePatch, type FateCardId, type MajorId } from '../engine';
import { diagnoseReversed } from './diagnose';
import { RULEBOOK_V3, RULEBOOK_V4 } from './rulebooks';
import { runMany } from './runGame';
import { Stats } from './stats';
import { tournament } from './tournament';

export interface ReportOptions {
  games: number;
  big: number;
  seed: string;
  log: (m: string) => void;
}

export const MAJOR_ZH: Record<MajorId, string> = {
  fool: '0 愚者', magician: '1 魔术师', highPriestess: '2 女祭司', empress: '3 皇后', emperor: '4 皇帝',
  hierophant: '5 教皇', lovers: '6 恋人', chariot: '7 战车', strength: '8 力量', hermit: '9 隐士',
  wheelOfFortune: '10 命运之轮', justice: '11 正义', hangedMan: '12 倒吊人', death: '13 死神',
  temperance: '14 节制', devil: '15 恶魔', tower: '16 高塔', star: '17 星星', moon: '18 月亮',
  sun: '19 太阳', judgement: '20 审判', world: '21 世界',
};
const CARD_ZH: Record<FateCardId, string> = {
  wands: '权杖', pentacles: '星币', swords: '宝剑', cups: '圣杯', page: '侍从', knight: '骑士', queen: '王后', king: '国王',
};

type V = 'v3' | 'v4' | 'v5';
const VERSIONS: { key: V; label: string; patch: BalancePatch }[] = [
  { key: 'v3', label: 'v3', patch: RULEBOOK_V3 },
  { key: 'v4', label: 'v4', patch: RULEBOOK_V4 },
  { key: 'v5', label: 'v5（现行）', patch: {} },
];
const COUNTS = [2, 3, 4];
const LAPS = [1, 2, 3];
/** Balance targets (decision of 2026-11-22): 3 players ±5, 2 and 4 players ±8 percentage points. */
const TOL: Record<number, number> = { 2: 0.08, 3: 0.05, 4: 0.08 };

const pct = (x: number, d = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : '—');
const pp = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}`;
const num = (x: number, d = 2) => x.toFixed(d);

function table(head: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

const winRate = (st: Stats, m: MajorId) => { const c = st.byMajor.get(m)!; return c.wins / c.games; };
const devs = (st: Stats, n: number) => MAJORS.map((m) => winRate(st, m) - 1 / n);
const outOfRange = (st: Stats, n: number) => MAJORS.filter((m) => Math.abs(winRate(st, m) - 1 / n) > TOL[n]!);
const seats = (st: Stats, n: number) => st.bySeat.slice(0, n).map((c) => pct(c.wins / c.games, 0)).join(' / ');
const flag = (d: number, n: number) => (Math.abs(d) > TOL[n]! ? ' ⚠' : '');
const trapsPerGame = (st: Stats) => st.traps.triggered / st.games;
const revShare = (st: Stats) => 1 - st.share(st.orient.skill);

/** The v5 changes over v4 (decisions D-59 – D-63), for §6 of the report. */
const V5_RULES: { id: string; what: string; text: string }[] = [
  { id: 'R1', what: '角色逆位只能指定一名领先于你的玩家', text: '没有人领先于你时，逆位不能用（置灰）。高塔、世界的逆位作用于所有领先于你的玩家；恶魔、月亮放陷阱，见 T1–T4。' },
  { id: 'R2', what: '打领先者 +2', text: '目标是领先者（进度最高，并列也算）时，主效果 +2（每张卡写明加在哪个数字上）。**两人局没有这个加成**：两人局里领先于你的人永远就是领先者，加成失去区分作用。' },
  { id: 'R3', what: '每个角色逆位都有位置后果', text: '后退、定身（跳过下次移动）、迟缓、走错路；扣 FP、弃牌、封印、枯竭、失神只作附加。' },
  { id: 'T1', what: '陷阱经过即触发', text: '其他玩家自己移动（移动步、自己出的牌和技能）时经过或停在陷阱星座就触发；被别人推动、交换位置不触发。一次移动经过多个陷阱依次触发。' },
  { id: 'T2', what: '放置者 +1 FP', text: '陷阱触发时放置者 +1 FP（被护盾挡下也算触发，陷阱照样消失）。' },
  { id: 'T3', what: '陷阱放在领先于你的玩家前方 1–3 格', text: '和 R1 一致：你领先时不能放。没有这一条时，2 人局的月亮能每隔一回合在对手面前放陷阱，对手必然踩中。' },
  { id: 'T4', what: '陷阱数值', text: '枷锁：下回合定身、失去 3 FP（对领先者失去 5 FP）。幻象：后退 4 格（对领先者 6 格），这次移动结束。' },
  { id: 'SH', what: '护盾返还', text: '护盾到期时如果没挡到任何东西，返还 1 FP（D-59）。' },
];
const V5_REVERSED: { major: MajorId; text: string }[] = [
  { major: 'fool', text: '目标下一次移动不掷骰，改为后退 2 格（领先者 4 格）' },
  { major: 'magician', text: '目标后退 3 格（领先者 5 格），你随机偷其 1 张手牌' },
  { major: 'highPriestess', text: '目标后退 1 格（领先者 3 格）并下回合迟缓；你看其手牌并弃掉 1 张' },
  { major: 'empress', text: '目标下回合定身、失去 1 FP、后退 1 格（领先者 3 格）' },
  { major: 'emperor', text: '目标后退 3 格（领先者 5 格）并下回合封印' },
  { major: 'hierophant', text: '目标后退到上一个土象星座（领先者再退 2 格）' },
  { major: 'lovers', text: '目标后退到其身后最近一名玩家的格子（最多 4 格，否则 2 格），再后退 1 格（领先者共再退 3 格）' },
  { major: 'chariot', text: '目标后退 2 格（领先者 4 格）并下回合迟缓' },
  { major: 'strength', text: '目标后退 1 格（领先者 3 格）、下回合失神、失去 1 FP' },
  { major: 'hermit', text: '目标后退 2 格（领先者 4 格）并下回合枯竭' },
  { major: 'wheelOfFortune', text: '目标掷命运骰，后退点数格（领先者 +2）' },
  { major: 'justice', text: '目标后退 3 格（领先者 5 格）并失去 1 FP' },
  { major: 'hangedMan', text: '目标下回合定身并枯竭（领先者再后退 2 格）' },
  { major: 'death', text: '目标后退 3 格（领先者 5 格）并失去 2 FP' },
  { major: 'temperance', text: '目标后退 1 格并接下来 2 回合迟缓（领先者 4 回合）' },
  { major: 'devil', text: '放枷锁陷阱（见 T1–T4）' },
  { major: 'tower', text: '所有领先于你的玩家后退 2 格，其中领先者后退 4 格' },
  { major: 'star', text: '目标后退 2 格（领先者 4 格），你偷其 1 FP' },
  { major: 'moon', text: '放幻象陷阱（见 T1–T4）' },
  { major: 'sun', text: '目标后退 2 格（领先者 4 格）、下回合迟缓、失去 1 FP' },
  { major: 'judgement', text: '目标后退你们距离的一半（进位，最多 4 格；领先者 +2）' },
  { major: 'world', text: '每局一次：所有领先于你的玩家下回合定身，其中领先者再后退 2 格' },
];
const V5_UPRIGHT: { id: string; what: string; v4: string; v5: string }[] = [
  { id: 'U1', what: '18 月亮 正位', v4: '前进 2 格、+1 FP、护盾；陷阱无效', v5: '前进 2 格；陷阱无效（去掉护盾和 FP，价值移到逆位的陷阱）' },
  { id: 'U2', what: '5 教皇 正位', v4: '前进 1 格、清除状态、+2 FP、抽 1、护盾', v5: '……+1 FP（两人局仍 +2 FP）' },
  { id: 'U3', what: '21 世界 正位', v4: '每局一次：前进到双鱼座，最多 8 格', v5: '……最多 9 格' },
  { id: 'U4', what: '16 高塔 正位', v4: '前进 4 格，然后弃掉全部手牌', v5: '前进 4 格（**你领先时只前进 3 格**），然后弃掉全部手牌（只加条件，不调费用）' },
  { id: 'U5', what: '12 倒吊人 正位', v4: '前进 2 格、+3 FP、抽 1、护盾；你下回合迟缓', v5: '……+1 FP……（两人局：前进 3 格）' },
  { id: 'U6', what: '11 正义 正位', v4: '领先时：前进 1 格并 +2 FP', v5: '领先时：前进 1 格并 +3 FP' },
  { id: 'U7', what: '6 恋人 正位', v4: '5 格内没人时前进 2 格', v5: '5 格内没人时前进 3 格（两人局仍 2 格）' },
  { id: 'U8', what: '9 隐士 正位（两人局）', v4: '抽 1 张', v5: '两人局：抽 2 张' },
];

export function buildReport(o: ReportOptions): string {
  const t0 = Date.now();
  const matrix = new Map<string, Stats>();
  for (const v of VERSIONS) {
    for (const n of COUNTS) for (const laps of LAPS) {
      o.log(`matrix ${v.key} ${n}p ${laps} laps`);
      matrix.set(`${v.key}-${n}-${laps}`, runMany({ players: n, laps, balance: v.patch }, o.games, `${o.seed}-m-${n}-${laps}`, new Stats()));
    }
  }
  const M = (v: V, n: number, l: number) => matrix.get(`${v}-${n}-${l}`)!;
  const defaultLaps = 3;
  const big = new Map<string, Stats>();
  for (const v of VERSIONS) for (const n of COUNTS) {
    o.log(`big ${v.key} ${n}p (${o.big})`);
    big.set(`${v.key}-${n}`, runMany({ players: n, laps: defaultLaps, balance: v.patch }, o.big, `${o.seed}-big-${n}`, new Stats()));
  }
  const B = (v: V, n: number) => big.get(`${v}-${n}`)!;

  o.log('seat alternatives');
  const seatAlt: { label: string; patch: BalancePatch }[] = [
    { label: 'v3：固定顺序，打完这一轮', patch: RULEBOOK_V3 },
    { label: '有人到终点就立刻结束', patch: { ...RULEBOOK_V3, endRule: 'immediate' } },
    { label: '开局按顺序补进度（前面的人每位多 1 格）', patch: { ...RULEBOOK_V3, startProgressBySeat: [3, 2, 1, 0] } },
    { label: '开局按顺序补 FP（前面的人每位多 1 点）', patch: { ...RULEBOOK_V3, startFpBySeat: [3, 2, 1, 0] } },
    { label: '到终点的人不再受逆位和陷阱影响', patch: { ...RULEBOOK_V3, finishSafe: true } },
    { label: '**S1 每轮轮换先手**', patch: { ...RULEBOOK_V3, rotateStart: true } },
  ];
  const seatRows = seatAlt.map(({ label, patch }) => {
    const cells: string[] = [label];
    for (const n of COUNTS) {
      const p: BalancePatch = {
        ...patch,
        ...(patch.startProgressBySeat ? { startProgressBySeat: patch.startProgressBySeat.slice(4 - n) } : {}),
        ...(patch.startFpBySeat ? { startFpBySeat: patch.startFpBySeat.slice(4 - n) } : {}),
      };
      cells.push(seats(runMany({ players: n, laps: defaultLaps, balance: p }, o.games * 2, `${o.seed}-seat-${n}`, new Stats()), n));
    }
    return cells;
  });

  o.log('reversed diagnostic');
  const diagGames = Math.max(200, Math.round(o.games / 4));
  const diag4 = diagnoseReversed(diagGames, `${o.seed}-diag`, RULEBOOK_V4);
  const diag5 = diagnoseReversed(diagGames, `${o.seed}-diag`, {});

  o.log('Computer player calibration');
  const tg = Math.max(2000, Math.round(o.games * 2));
  const tour = [
    { label: '1 个调整后 vs 2 个 §12 原权重（3 人局）', r: tournament(3, tg, BOT_WEIGHTS, RULEBOOK_BOT_WEIGHTS, {}, `${o.seed}-t1`) },
    { label: '1 个 §12 原权重 vs 2 个调整后（3 人局）', r: tournament(3, tg, RULEBOOK_BOT_WEIGHTS, BOT_WEIGHTS, {}, `${o.seed}-t2`) },
    { label: '1 个调整后 vs 3 个 §12 原权重（4 人局）', r: tournament(4, tg, BOT_WEIGHTS, RULEBOOK_BOT_WEIGHTS, {}, `${o.seed}-t3`) },
    { label: '1 个调整后 vs 1 个 §12 原权重（2 人局）', r: tournament(2, tg, BOT_WEIGHTS, RULEBOOK_BOT_WEIGHTS, {}, `${o.seed}-t4`) },
  ];
  const seconds = ((Date.now() - t0) / 1000).toFixed(0);
  const total = VERSIONS.length * COUNTS.length * LAPS.length * o.games + VERSIONS.length * COUNTS.length * o.big
    + seatAlt.length * COUNTS.length * o.games * 2 + 2 * 22 * 2 * diagGames + tour.length * tg;

  const out: string[] = [];
  const P = (s = '') => out.push(s);
  const v3 = B('v3', 3), v4 = B('v4', 3), v5 = B('v5', 3);
  const samples = Math.round((o.big * 3) / 22);
  const err = 196 * Math.sqrt(((1 / 3) * (2 / 3)) / samples);
  const avg = (rows: { reversedWin: number }[]) => rows.reduce((a, r) => a + r.reversedWin, 0) / rows.length;

  // ---------- Header ----------
  P('# 平衡报告');
  P();
  P(`> 由 \`npm run sim\` 生成：共 ${total.toLocaleString('en-US')} 局电脑对局，用时 ${seconds} 秒，总种子 \`${o.seed}\`（同一种子可完整复现）。`);
  P('> - **v3**：规则书 v3 原样。');
  P('> - **v4**：M1 采纳的建议版（轮换先手、单体逆位打所有领先者、18 处角色数值，D-58）。');
  P('> - **v5（现行，引擎默认值）**：v4 + 护盾返还（D-59）+ 角色逆位重设计和新陷阱规则（D-60 – D-63）。');
  P(`> 角色胜率以各人数 ${defaultLaps} 圈 ${o.big.toLocaleString('en-US')} 局为准（3 人局每个角色约 ${samples} 个样本，95% 误差约 ±${err.toFixed(1)} 个百分点）。平衡目标：3 人局每个角色在公平值 ±5 个百分点内，2 / 4 人局 ±8 内。`);
  P();

  // ---------- Conclusions ----------
  P('## 结论');
  P();
  P(`**3 人 ${defaultLaps} 圈（默认）三版对比**`);
  P();
  const row = (label: string, f: (st: Stats) => string, target: string) => [label, f(v3), f(v4), f(v5), target];
  P(table(['指标', 'v3', 'v4', 'v5（现行）', '目标'], [
    row('按行动顺序的胜率', (st) => seats(st, 3), '各约 33%'),
    row('角色胜率最大偏离', (st) => pp(Math.max(...devs(st, 3).map(Math.abs))).replace('+', '±'), '±5 以内'),
    row('超出 ±5 的角色数', (st) => String(outOfRange(st, 3).length), '0'),
    row('角色技能用逆位的比例', (st) => pct(revShare(st), 0), '25%–40%'),
    row('正位占比：小阿卡纳 / 宫廷', (st) => `${pct(st.share(st.orient.minor), 0)} / ${pct(st.share(st.orient.court), 0)}`, '25%–75%'),
    row('每局陷阱触发', (st) => num(trapsPerGame(st)), '≥ 0.3'),
    row('平均轮数', (st) => num(st.meanRounds(), 1), '8–12；比 v4 多约 1.5 轮以内可接受'),
  ]));
  P();
  const o3 = outOfRange(v5, 3), o2 = outOfRange(B('v5', 2), 2), o4 = outOfRange(B('v5', 4), 4);
  P(`1. **默认 ${defaultLaps} 圈。** v5 的 3 人局平均 ${num(v5.meanRounds(), 1)} 轮，比 v4 多 ${num(v5.meanRounds() - v4.meanRounds(), 1)} 轮（已接受多约 1.5 轮）。原因：要让电脑愿意用逆位，逆位让对手后退的格数大约要是正位自己前进的两倍，每多用一次逆位，全场的总进度就少几格（§4.3）。`);
  P(`2. **角色平衡**：3 人局超出 ±5 的角色 ${o3.length} 个${o3.length ? `（${o3.map((m) => `${MAJOR_ZH[m]} ${pp(winRate(v5, m) - 1 / 3)}`).join('、')}）` : ''}；2 人局超出 ±8 的 ${o2.length} 个${o2.length ? `（${o2.map((m) => `${MAJOR_ZH[m]} ${pp(winRate(B('v5', 2), m) - 1 / 2)}`).join('、')}）` : ''}；4 人局 ${o4.length} 个${o4.length ? `（${o4.map((m) => `${MAJOR_ZH[m]} ${pp(winRate(B('v5', 4), m) - 1 / 4)}`).join('、')}）` : ''}。`);
  P(`3. **逆位真正有用了**：3 人局角色技能用逆位 ${pct(revShare(v5), 0)}（v4 ${pct(revShare(v4), 0)}）；「一律用逆位」的电脑平均胜率从 v4 的 ${pct(avg(diag4))} 升到 ${pct(avg(diag5))}（§4.4）。`);
  P(`4. **陷阱回来了**：每局触发 ${num(trapsPerGame(v5))} 次（v4 ${num(trapsPerGame(v4))}）。`);
  P(`5. **仍未解决**：3 人局小阿卡纳正位 ${pct(v5.share(v5.orient.minor), 0)}，略超 75%（2、4 人局在范围内）。试过把「打领先者 +1」也用到小牌和宫廷牌上，3 人局降到约 52%，但一局变成约 12 轮、4 人局约 15.6 轮，代价太大，没有采用（§7）。`);
  P();

  // ---------- Method ----------
  P('## 1. 方法');
  P();
  P('- 模拟器 `npm run sim` 与网页共用 `src/engine/`；每局随机分配元素和角色（角色朝向随机），所有座位都是同一种电脑。共同获胜每人记 1/k 胜；「座位」指行动顺序（D-39 – D-42）。');
  P('- 电脑按 §12 枚举所有合法行动，在隐藏信息的副本上执行后打分；权重经「电脑互打」校准（D-53、D-54，已确认）：');
  P();
  P(table(['对局', '局数', '主角胜率', '公平值', '95% 区间'], tour.map(({ label, r }) => [label, r.games, pct(r.rate), pct(r.fair), `±${(r.ci95 * 100).toFixed(1)}`])));
  P();
  P('- v5 里电脑对陷阱和「走错路」的估值随数值变化（陷阱按它对领先者的伤害 + 放置者奖励，走错路按后退格数）。');
  P();

  // ---------- Length ----------
  P('## 2. 对局长度');
  P();
  P(table(['人数', '圈数', 'v3 平均轮数', 'v4 平均轮数', 'v5 平均轮数', 'v5 P10–P90'], COUNTS.flatMap((n) => LAPS.map((l) => [
    n, l, num(M('v3', n, l).meanRounds()), num(M('v4', n, l).meanRounds()), num(M('v5', n, l).meanRounds()), `${M('v5', n, l).percentile(0.1)}–${M('v5', n, l).percentile(0.9)}`,
  ]))));
  P();
  const minutes = (human: number, computer: number, lo: boolean) => (v5.meanRounds() * (human * (lo ? 15 : 20) + computer * (lo ? 3 : 5))) / 60;
  P(`「轮」= 每人各行动一次。时长按真人每回合 15–20 秒、电脑 3–5 秒估算：3 名真人约 ${Math.round(minutes(3, 0, true))}–${Math.round(minutes(3, 0, false))} 分钟，1 名真人 + 2 名电脑约 ${Math.round(minutes(1, 2, true))}–${Math.round(minutes(1, 2, false))} 分钟，接近 §2 的「约 10–15 分钟」。`);
  P();

  // ---------- Seats ----------
  P('## 3. 座位');
  P();
  P(table(['人数', 'v3', 'v4', 'v5'], COUNTS.map((n) => [n, seats(B('v3', n), n), seats(B('v4', n), n), seats(B('v5', n), n)])));
  P();
  P(`**v3 座位问题的各种修法**（只改这一条，其余为 v3；${defaultLaps} 圈，各 ${(o.games * 2).toLocaleString('en-US')} 局）：`);
  P();
  P(table(['做法', '2 人', '3 人', '4 人'], seatRows));
  P();
  P('「立刻结束」重新带来先手优势；开局补偿和终点保护只能缓解；轮换先手在三种人数下都接近均等，并保留「每人回合数相同」和元素顺序。2 人局轮换先手会让同一人连续行动两次（0,1,1,0,0,1……），这是均等化的代价。');
  P();

  // ---------- Characters ----------
  P('## 4. 角色');
  P();
  P(`### 4.1 3 人 ${defaultLaps} 圈（${o.big.toLocaleString('en-US')} 局）`);
  P();
  const rows3 = MAJORS.map((m) => {
    const u = v5.skillByMajor.get(m)!;
    const uses = (u.upright + u.reversed) / v5.majorGames.get(m)!;
    return { w: winRate(v5, m), row: [MAJOR_ZH[m], pp(winRate(v3, m) - 1 / 3) + flag(winRate(v3, m) - 1 / 3, 3), pp(winRate(v4, m) - 1 / 3) + flag(winRate(v4, m) - 1 / 3, 3), pct(winRate(v5, m)), pp(winRate(v5, m) - 1 / 3) + flag(winRate(v5, m) - 1 / 3, 3), num(uses, 1), pct(1 - v5.share(u), 0)] };
  }).sort((a, b) => b.w - a.w);
  P('偏离 = 胜率 − 公平值 33.3%，单位为百分点；超出 ±5 标 ⚠。');
  P();
  P(table(['角色', 'v3 偏离', 'v4 偏离', 'v5 胜率', 'v5 偏离', 'v5 每局用技能', 'v5 用逆位'], rows3.map((r) => r.row)));
  P();
  P(`### 4.2 2 人和 4 人局（${defaultLaps} 圈，各 ${o.big.toLocaleString('en-US')} 局；超出 ±8 标 ⚠）`);
  P();
  P(table(['角色', '2 人 v4', '2 人 v5', '4 人 v4', '4 人 v5'], MAJORS.map((m) => {
    const f = (st: Stats, n: number) => { const d = winRate(st, m) - 1 / n; return pp(d) + flag(d, n); };
    return [MAJOR_ZH[m], f(B('v4', 2), 2), f(B('v5', 2), 2), f(B('v4', 4), 4), f(B('v5', 4), 4)];
  })));
  P();
  P('v5 用 4 条「两人局：……」（倒吊人前进 3 格、隐士抽 2 张、教皇 +2 FP、恋人保底 2 格）修正 2 人局：两人局只有一个对手，护盾常常没挡到东西就过期，「下回合迟缓」这类代价又特别重。');
  P();
  P('### 4.3 为什么逆位多了，局就会变长');
  P();
  P(`3 人局里，让一个对手退 1 格，第三个人同样得利，所以它大约只值「自己前进半格」。电脑（以及会算账的玩家）只有在逆位的格数约为正位两倍时才会选逆位。调优过程中，逆位使用率每提高约 10 个百分点，3 人局就多约 1 轮。v5 选在逆位 ${pct(revShare(v5), 0)}、比 v4 多约 ${num(v5.meanRounds() - v4.meanRounds(), 1)} 轮的位置。`);
  P();
  P('### 4.4 诊断：一律用逆位');
  P();
  P(`每个角色两组各 ${diagGames} 局（3 人 ${defaultLaps} 圈）：同一个角色由默认电脑操作，或「一律用逆位」（开局逆位、不翻回、能用就用）；对手都是默认电脑。`);
  P();
  P(table(['角色', 'v4 默认', 'v4 一律逆位', 'v5 默认', 'v5 一律逆位'], MAJORS.map((m, i) => [MAJOR_ZH[m], pct(diag4[i]!.defaultWin), pct(diag4[i]!.reversedWin), pct(diag5[i]!.defaultWin), pct(diag5[i]!.reversedWin)])));
  P();

  // ---------- Usage ----------
  P(`## 5. 正逆位、FP、卡牌与陷阱（${defaultLaps} 圈，各 ${o.big.toLocaleString('en-US')} 局）`);
  P();
  P(table(['人数', '版本', '小阿卡纳正位', '宫廷正位', '技能正位', '每局陷阱触发', '终局平均 FP', 'FP 撞上限的回合'], COUNTS.flatMap((n) => VERSIONS.map((v) => {
    const st = B(v.key, n);
    const f = (x: number) => `${pct(x)}${x > 0.75 || x < 0.25 ? ' ⚠' : ''}`;
    return [n, v.label, f(st.share(st.orient.minor)), f(st.share(st.orient.court)), f(st.share(st.orient.skill)), num(trapsPerGame(st)), num(st.finalFpSum / st.playerGames), pct(st.turnsWithCap / st.turns)];
  }))));
  P();
  P(table(['牌', '3 人 v5 打出率', '每局直接打出', '每局当组合材料'], [...SUITS, ...COURTS].map((d) => {
    const x = v5.playable.get(d)!;
    const fuel = (SUITS as readonly string[]).includes(d) ? num(v5.fuelUse.get(d)! / v5.games) : '—';
    return [CARD_ZH[d], pct(x.played / x.avail), num(x.played / v5.games), fuel];
  })));
  P();
  P('星币、圣杯很少直接打出，主要作为宫廷组合的材料（王后正位要水 / 土，国王逆位要水 / 风……），这是合理的分工。FP 撞上限的回合很少，上限 10 可以保持。');
  P();

  // ---------- Changes ----------
  P('## 6. 规则改动明细');
  P();
  P('### 6.1 v3 → v4（M1，已采纳）');
  P();
  P('S1 每轮轮换先手；S2 单体逆位改为作用于所有领先于你的玩家；M1–M18 角色数值（力量去护盾、命运之轮按较低点数前进、恋人不多走 1 格、星星补到 2、节制不抽牌、世界最多 8 格；隐士 / 皇后 / 教皇 / 女祭司 / 死神 / 恶魔加前进；皇帝点数视为 4；魔术师额外打出最多 2 张；正义至少 2 格、领先时前进 1 格；审判抽 2 张；月亮 +1 FP；倒吊人改为「先走、下回合迟缓」）。详见 decisions.md D-58。');
  P();
  P('### 6.2 v4 → v5：统一规则');
  P();
  for (const r of V5_RULES) P(`- **${r.id} ${r.what}**：${r.text}`);
  P();
  P('### 6.3 v4 → v5：角色逆位（目标：一名领先于你的玩家）');
  P();
  P(table(['角色', 'v5 逆位'], V5_REVERSED.map((r) => [MAJOR_ZH[r.major], r.text])));
  P();
  P('### 6.4 v4 → v5：正位微调（只改数字或加条件）');
  P();
  P(table(['#', '角色', 'v4', 'v5'], V5_UPRIGHT.map((u) => [u.id, u.what, u.v4, u.v5])));
  P();

  // ---------- Open issues ----------
  P('## 7. 未解决的问题');
  P();
  const fool = winRate(v5, 'fool') - 1 / 3;
  P(`1. **3 人局小阿卡纳正位 ${pct(v5.share(v5.orient.minor), 0)}**（目标 ≤ 75%）。原因同 §4.3：小牌逆位只让领先者退 1 格（或迟缓、偷 1 FP），在 3 人局不划算。把「打领先者 +1」用到小牌和宫廷牌后能降到约 52%，但一局要多约 1.5 轮（4 人局多约 3 轮），所以没采用。可选：接受现状（2、4 人局都在范围内），或只给宝剑逆位加这一条。`);
  P(`2. **愚者** 3 人局 ${pp(fool)}${Math.abs(fool) > TOL[3]! ? '，略超 ±5' : '，在 ±5 以内但接近边缘'}：它几乎只用正位（「掷骰 +1」），调整步长最小也要 ±1 格，会跳到另一头。如需处理，可加条件「若你领先，不 +1」（未测）。`);
  P('3. 2 人局轮换先手会出现同一人连续行动两次（0,1,1,0……）。座位胜率因此均等，但手感上需要在界面上提示「你连续行动」。');
  P();

  // ---------- Appendix ----------
  P(`## 附录：全部组合（各 ${o.games.toLocaleString('en-US')} 局）`);
  P();
  P(table(['人数', '圈数', '版本', '平均轮数', '座位胜率', '角色最大偏离', '技能逆位', '每局陷阱'], COUNTS.flatMap((n) => LAPS.flatMap((l) => VERSIONS.map((v) => {
    const st = M(v.key, n, l);
    return [n, l, v.label, num(st.meanRounds(), 1), seats(st, n), pp(Math.max(...devs(st, n).map(Math.abs))).replace('+', '±'), pct(revShare(st), 0), num(trapsPerGame(st))];
  })))));
  P();
  P(`各组合 ${o.games.toLocaleString('en-US')} 局时角色样本少（误差约 ±5 个百分点），本表只看整体；角色结论以 §4 为准。`);
  P();
  return out.join('\n');
}
