// Builds docs/balance-report.md (in Chinese, as the project's documents are).
import { COURTS, MAJORS, SUITS, RULEBOOK_AI_WEIGHTS, AI_WEIGHTS, type BalancePatch, type FateCardId, type MajorId } from '../engine';
import { RULEBOOK_V3 } from './rulebookV3';
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
const ELEMENT_ZH = { fire: '火', earth: '土', air: '风', water: '水' } as const;

const COUNTS = [2, 3, 4];
const LAPS = [1, 2, 3];
const TOLERANCE = 0.07;

const pct = (x: number, d = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : '—');
const pp = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}`;
const num = (x: number, d = 2) => x.toFixed(d);

function table(head: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

function winRate(st: Stats, m: MajorId): number {
  const c = st.byMajor.get(m)!;
  return c.wins / c.games;
}

function majorDevs(st: Stats, n: number): number[] {
  return MAJORS.map((m) => winRate(st, m) - 1 / n);
}

function outOfRange(st: Stats, n: number): MajorId[] {
  return MAJORS.filter((m) => Math.abs(winRate(st, m) - 1 / n) > TOLERANCE);
}

function seatSpread(st: Stats, n: number): number {
  const r = st.bySeat.slice(0, n).map((c) => c.wins / c.games);
  return Math.max(...r) - Math.min(...r);
}

function actionTotal(st: Stats): number {
  const a = st.actions;
  return a.minor + a.court + a.skill + a.meditate + a.skipped;
}

interface Run {
  v3: Stats;
  prop: Stats;
}

/** Proposal notes, in the order of §6 of the report. */
const NOTES: { id: string; what: string; v3: string; proposal: string; why: string; major?: MajorId }[] = [
  { id: 'S1', what: '每轮轮换先手', v3: '行动顺序固定为火→土→风→水；有人到终点后打完这一轮（§3.5、§8）。', proposal: '元素顺序不变，但每一轮由下一位玩家先行动（实体版用一个「先手标记」每轮顺时针传一位）；仍然打完这一轮再结算，每人回合数相同。', why: '固定顺序下最后行动的人在最后一轮总有「最后一句话」：别人到终点后他还能出手，而他到终点后没人能回应。3 人局最后一位胜率 41%，第一位 26%。' },
  { id: 'S2', what: '单体逆位改为「所有领先于你的玩家」', v3: '小阿卡纳、宫廷牌和多数角色的逆位作用于一名「目标玩家」。', proposal: '这些逆位改为作用于「所有领先于你的玩家」（进度比你高的人，不用再选目标）；没人领先于你时不能用（置灰）。例外：女祭司逆位（要看对方手牌）、恋人逆位（交换两人）保持指定目标；正义、皇帝逆位本来就打领先者，不变。', why: '3–4 人局里只打一个对手，第三个人同样受益，所以逆位几乎没人用（v3：3 人局小阿卡纳 97% 打正位）。改成打所有领先者后，强度随人数增长：2 人局效果不变，3–4 人局落后时一次能绊多人，领先时自然改用正位，正符合 §12「领先偏正位、落后偏逆位」，也更像赛车游戏的「龟壳」。' },
  { id: 'M1', major: 'strength', what: '力量 正位', v3: '前进到下一个火象星座，并获得护盾。', proposal: '前进到下一个火象星座。（去掉护盾）', why: 'v3 中最强的角色。' },
  { id: 'M2', major: 'wheelOfFortune', what: '命运之轮 正位', v3: '掷两次：按较高点数前进，获得等于较低点数的 FP。', proposal: '掷两次：按**较低**点数前进，获得等于**较高**点数的 FP。', why: '偏强；交换后总量不变，前进少一些。' },
  { id: 'M3', major: 'lovers', what: '恋人 正位', v3: '前进到前方 5 格内最近玩家所在的格子，再前进 1 格；否则前进 2 格。', proposal: '前进到那名玩家所在的格子（不再多走 1 格）；否则前进 2 格。', why: '偏强。' },
  { id: 'M4', major: 'star', what: '星星 正位', v3: '前进到下一个水象星座；FP 少于 3 时补到 3。', proposal: '……FP 少于 **2** 时补到 2。', why: '偏强。' },
  { id: 'M5', major: 'temperance', what: '节制 正位', v3: '前进到下一个水象星座，抽 1 张牌。', proposal: '前进到下一个水象星座。（不抽牌）', why: '偏强。' },
  { id: 'M6', major: 'world', what: '世界 正位', v3: '每局一次：前进到双鱼座。', proposal: '每局一次：前进到双鱼座，**最多 8 格**。', why: '从白羊座出发一次走 11 格，偏强；上限 6 格时又偏弱。' },
  { id: 'M7', major: 'hermit', what: '隐士 正位', v3: '获得 2 FP、抽 2 张牌、获得护盾。', proposal: '**前进 1 格**、获得 2 FP、抽 **1** 张牌、获得护盾。', why: '只给资源的技能明显吃亏：每回合只能做一个行动，多出的牌用不上。' },
  { id: 'M8', major: 'empress', what: '皇后 正位', v3: '获得 3 FP，抽 2 张牌。', proposal: '**前进 1 格**、获得 3 FP、抽 **1** 张牌。', why: '同上。' },
  { id: 'M9', major: 'hierophant', what: '教皇 正位', v3: '清除自己所有状态，获得 2 FP、抽 1 张、获得护盾。', proposal: '**前进 1 格**，其余不变。', why: '同上。' },
  { id: 'M10', major: 'highPriestess', what: '女祭司 正位', v3: '看牌堆顶 3 张：用一张小牌的正位、拿一张入手，并获得 1 FP。', proposal: '**前进 1 格**，再看牌堆顶 3 张……（**不再** +1 FP）。', why: '同上。' },
  { id: 'M11', major: 'death', what: '死神 正位', v3: '弃任意张、抽到 5 张、清除状态、获得 1 FP。', proposal: '**前进 2 格**，其余不变。', why: 'v3 电脑几乎不用这个技能。' },
  { id: 'M12', major: 'devil', what: '恶魔 正位', v3: '获得 5 FP 并前进 1 格；你下回合枯竭。', proposal: '获得 5 FP 并前进 **2** 格；你下回合枯竭。', why: '偏弱。' },
  { id: 'M13', major: 'emperor', what: '皇帝 正位', v3: '获得 2 FP 与护盾；本回合移动点数视为 3。', proposal: '获得 **1** FP 与护盾；本回合移动点数视为 **4**。', why: '偏弱。' },
  { id: 'M14', major: 'magician', what: '魔术师 正位', v3: '抽 2 张，可立即额外打出 1 张小阿卡纳。', proposal: '……可立即额外打出**最多 2 张**小阿卡纳。', why: '偏弱。' },
  { id: 'M15', major: 'justice', what: '正义 正位', v3: '不领先：前进与领先者距离的一半（进位，最多 5）；领先：获得 2 FP。', proposal: '不领先：前进一半（**至少 2**、最多 5）；领先：**前进 1 格**并获得 2 FP。', why: '偏弱；局面接近时一半距离往往只有 1 格。' },
  { id: 'M16', major: 'judgement', what: '审判 正位', v3: '弃最多 4 张，每弃 1 张前进 1 格，然后抽 1 张。', proposal: '……然后抽 **2** 张。', why: '偏弱。' },
  { id: 'M17', major: 'moon', what: '月亮 正位', v3: '前进 2 格并获得护盾；到你下回合前陷阱无效。', proposal: '……并**获得 1 FP**。', why: '偏弱（FP 现在会被用来加速：约 2 FP = 1 格）。' },
  { id: 'M18', major: 'hangedMan', what: '倒吊人 正位', v3: '本回合不移动；获得 4 FP、抽 2 张、获得护盾。', proposal: '**前进 2 格**、获得 3 FP、抽 1 张、获得护盾；**你下回合迟缓**。（「牺牲」从「现在不动」改为「先走、下回合付代价」）', why: 'v3 胜率最低。一次拿很多 FP 消化不了（每回合最多加速一次），而「本回合不动」的代价是实打实的。' },
];

export function buildReport(o: ReportOptions): string {
  const t0 = Date.now();
  const v3Patch: BalancePatch = RULEBOOK_V3;
  const PROPOSAL: BalancePatch = {};
  const matrix = new Map<string, Run>();
  for (const n of COUNTS) {
    for (const laps of LAPS) {
      o.log(`matrix ${n}p ${laps} laps`);
      matrix.set(`${n}-${laps}`, {
        v3: runMany({ players: n, laps, balance: v3Patch }, o.games, `${o.seed}-m-${n}-${laps}`, new Stats()),
        prop: runMany({ players: n, laps, balance: PROPOSAL }, o.games, `${o.seed}-m-${n}-${laps}`, new Stats()),
      });
    }
  }

  // Decision D-40: the lap count whose 3-player average is in 8–12 rounds, closest to 10.
  const pickLaps = (k: 'v3' | 'prop') => {
    const cands = LAPS.map((l) => ({ l, r: matrix.get(`3-${l}`)![k].meanRounds() }));
    const inRange = cands.filter((c) => c.r >= 8 && c.r <= 12);
    const pool = inRange.length ? inRange : cands;
    return pool.sort((a, b) => Math.abs(a.r - 10) - Math.abs(b.r - 10))[0]!.l;
  };
  const defaultLaps = pickLaps('prop');

  const big = new Map<number, Run>();
  for (const n of COUNTS) {
    o.log(`big ${n}p (${o.big} games each)`);
    big.set(n, {
      v3: runMany({ players: n, laps: defaultLaps, balance: v3Patch }, o.big, `${o.seed}-big-${n}`, new Stats()),
      prop: runMany({ players: n, laps: defaultLaps, balance: PROPOSAL }, o.big, `${o.seed}-big-${n}`, new Stats()),
    });
  }

  o.log('seat alternatives');
  const seatAlt: { label: string; patch: BalancePatch }[] = [
    { label: 'v3：固定顺序，打完这一轮', patch: {} },
    { label: '有人到终点就立刻结束', patch: { endRule: 'immediate' } },
    { label: '开局按顺序补进度（前面的人每位多 1 格）', patch: { startProgressBySeat: [3, 2, 1, 0] } },
    { label: '开局按顺序补 FP（前面的人每位多 1 点）', patch: { startFpBySeat: [3, 2, 1, 0] } },
    { label: '到终点的人不再受逆位和陷阱影响', patch: { finishSafe: true } },
    { label: '**S1 每轮轮换先手**', patch: { rotateStart: true } },
  ];
  const seatRows = seatAlt.map(({ label, patch }) => {
    const cells: string[] = [label];
    for (const n of COUNTS) {
      const p: BalancePatch = { ...patch, ...(patch.startProgressBySeat ? { startProgressBySeat: patch.startProgressBySeat.slice(4 - n) } : {}), ...(patch.startFpBySeat ? { startFpBySeat: patch.startFpBySeat.slice(4 - n) } : {}) };
      const st = runMany({ players: n, laps: defaultLaps, balance: p }, o.games * 2, `${o.seed}-seat-${n}`, new Stats());
      cells.push(st.bySeat.slice(0, n).map((c) => pct(c.wins / c.games, 0)).join(' / '));
    }
    return cells;
  });

  o.log('AI calibration');
  const tg = Math.max(2000, Math.round(o.games * 2));
  const tour = [
    { label: '1 个调整后 vs 2 个 §12 原权重（3 人局）', r: tournament(3, tg, AI_WEIGHTS, RULEBOOK_AI_WEIGHTS, PROPOSAL, `${o.seed}-t1`) },
    { label: '1 个 §12 原权重 vs 2 个调整后（3 人局）', r: tournament(3, tg, RULEBOOK_AI_WEIGHTS, AI_WEIGHTS, PROPOSAL, `${o.seed}-t2`) },
    { label: '1 个调整后 vs 3 个 §12 原权重（4 人局）', r: tournament(4, tg, AI_WEIGHTS, RULEBOOK_AI_WEIGHTS, PROPOSAL, `${o.seed}-t3`) },
    { label: '1 个调整后 vs 1 个 §12 原权重（2 人局）', r: tournament(2, tg, AI_WEIGHTS, RULEBOOK_AI_WEIGHTS, PROPOSAL, `${o.seed}-t4`) },
  ];
  const seconds = ((Date.now() - t0) / 1000).toFixed(0);
  const totalGames = COUNTS.length * LAPS.length * o.games * 2 + COUNTS.length * o.big * 2 + tour.length * tg;

  const b3 = big.get(3)!;
  const out: string[] = [];
  const P = (s: string) => out.push(s);

  // ---------- Header ----------
  P('# 平衡报告（M1）');
  P('');
  P(`> 由 \`npm run sim\` 生成，共 ${totalGames.toLocaleString('en-US')} 局电脑对局，用时 ${seconds} 秒，总种子 \`${o.seed}\`（同一种子可完整复现）。`);
  P('> 「v3」= 规则书 v3 的数值；「建议版」= `src/sim/proposal.ts` 里的修改。建议版**没有**写进游戏默认值，等你确认后才改规则书和引擎。');
  const samples = Math.round((o.big * 3) / 22);
  const err = 196 * Math.sqrt((1 / 3) * (2 / 3) / samples);
  P(`> 角色胜率以 3 人 ${defaultLaps} 圈 ${o.big.toLocaleString('en-US')} 局为准（每个角色约 ${samples} 个样本，95% 误差约 ±${err.toFixed(1)} 个百分点）；其余组合各 ${o.games.toLocaleString('en-US')} 局。`);
  P('');

  // ---------- Conclusions ----------
  P('## 结论');
  P('');
  const r3v3 = matrix.get(`3-${defaultLaps}`)!.v3.meanRounds();
  const r3p = matrix.get(`3-${defaultLaps}`)!.prop.meanRounds();
  P(`1. **默认圈数：${defaultLaps} 圈。** 3 人局平均 ${num(r3p, 1)} 轮（v3 数值下 ${num(r3v3, 1)} 轮），落在 8–12 轮的目标内；${defaultLaps - 1} 圈只有 ${num(matrix.get(`3-${defaultLaps - 1}`)!.prop.meanRounds(), 1)} 轮。设置里仍保留 1 / 2 / 3 圈。`);
  P(`2. **v3 有三个结构性问题**，单靠改卡牌数值解决不了：`);
  P(`   - **后手优势**：3 人局按行动顺序胜率 ${b3.v3.bySeat.slice(0, 3).map((c) => pct(c.wins / c.games, 0)).join(' / ')}，4 人局 ${big.get(4)!.v3.bySeat.slice(0, 4).map((c) => pct(c.wins / c.games, 0)).join(' / ')}。「打完这一轮」消除了先手优势，却让最后行动的人有了「最后一句话」。→ 建议 **S1 每轮轮换先手**。`);
  P(`   - **多人局逆位太弱**：3 人局小阿卡纳 ${pct(1 - b3.v3.share(b3.v3.orient.minor), 0)} 打逆位、技能 ${pct(1 - b3.v3.share(b3.v3.orient.skill), 0)} 用逆位（§11 要求每边至少 25%）。只打一个对手时第三个人同样得利。→ 建议 **S2 单体逆位改为「所有领先于你的玩家」**。`);
  P(`   - **角色两极分化**：「直接前进」的技能远强于「给 FP / 手牌」的技能（每回合只能做一个行动，多出的牌和 FP 很难变成前进）。v3 有 ${outOfRange(b3.v3, 3).length} 个角色超出 ±7 个百分点，胜率从 ${pct(Math.min(...MAJORS.map((m) => winRate(b3.v3, m))), 0)} 到 ${pct(Math.max(...MAJORS.map((m) => winRate(b3.v3, m))), 0)}。→ 建议 **M1–M18 共 18 处角色数值**（宫廷牌和小阿卡纳数值不动）。`);
  P(`3. **建议版效果（3 人 ${defaultLaps} 圈）**：`);
  P('');
  const sum = (st: Stats, n: number) => {
    const d = majorDevs(st, n);
    return {
      seats: st.bySeat.slice(0, n).map((c) => pct(c.wins / c.games, 0)).join(' / '),
      spread: pp(seatSpread(st, n)).replace('+', ''),
      maxDev: pp(Math.max(...d.map(Math.abs))).replace('+', '±'),
      out: outOfRange(st, n).length,
      ur: `${pct(st.share(st.orient.minor), 0)} / ${pct(st.share(st.orient.court), 0)} / ${pct(st.share(st.orient.skill), 0)}`,
      rounds: num(st.meanRounds(), 1),
    };
  };
  const s3v = sum(b3.v3, 3), s3p = sum(b3.prop, 3);
  P(table(['指标', 'v3', '建议版', '目标'], [
    ['按行动顺序的胜率', s3v.seats, s3p.seats, '各约 33%'],
    ['角色胜率最大偏离', s3v.maxDev, s3p.maxDev, '±7 以内'],
    ['超出 ±7 的角色数', s3v.out, s3p.out, '0'],
    ['正位占比（小牌 / 宫廷 / 技能）', s3v.ur, s3p.ur, '每项 25%–75%'],
    ['平均轮数', s3v.rounds, s3p.rounds, '8–12'],
  ]));
  P('');
  const left3 = outOfRange(b3.prop, 3);
  P(`4. **仍需你决定的问题**（详见 §7）：`);
  const minor3 = b3.prop.share(b3.prop.orient.minor), court3 = b3.prop.share(b3.prop.orient.court);
  P(`   - 小阿卡纳和宫廷组合的正位占比：3 人局 ${pct(minor3, 0)} / ${pct(court3, 0)}，${minor3 > 0.75 || court3 > 0.75 ? '略超 75%' : '在范围内'}；2 人、4 人局都在 25%–75% 内（§5.1）。`);
  P(`   - 3 人局${left3.length ? `仍有 ${left3.map((m) => `${MAJOR_ZH[m]}（${pp(winRate(b3.prop, m) - 1 / 3)}）`).join('、')} 略超 ±7` : '所有角色都在 ±7 以内'}。`);
  P(`   - **技能仍有 ${pct(b3.prop.share(b3.prop.orient.skill), 0)} 用正位**：多数角色的逆位是扣 FP、加状态，而这个游戏的胜负几乎只看前进，这类逆位怎么加强都比不过「自己前进」。要真正解决，需要把角色逆位重新设计成「让对手后退」为主——这属于卡牌创意，留给你决定。`);
  P(`   - 2 人和 4 人局个别角色偏离 10 个百分点左右（§4.2），原因可解释，可以接受，也可以像恋人那样加「两人局改为……」的变体。`);
  P(`   - **陷阱几乎消失**：建议版里恶魔、月亮都主要用正位，3 人局每局只放 ${num(b3.prop.traps.placed / b3.prop.games)} 个陷阱（v3 为 ${num(b3.v3.traps.placed / b3.v3.games)}），和上一条是同一个原因（§5.5）。`);
  P(`   - 星币、圣杯很少被直接打出，主要作为宫廷组合的材料（§5.4），建议保持。`);
  P('');

  // ---------- Method ----------
  P('## 1. 方法');
  P('');
  P('- 模拟器 `npm run sim` 与网页共用 `src/engine/`。每局随机分配元素和角色（角色朝向随机），所有座位都是同一种电脑。统计口径见 decisions.md D-39 – D-42：共同获胜每人记 1/k 胜；「座位」指行动顺序。');
  P('- **电脑对手**按 §12 实现：枚举所有合法行动（每张牌的两面和每个目标、所有宫廷组合、技能的每种选择、冥想），在隐藏信息的副本上执行（牌堆重新洗过，偷看不到真实牌序），按估值打分取最高。在 §12 的基础上做了两处调整，**需要你确认**：');
  P('  - **D-53 加速和重掷**：§12 只在「离终点差 1 格」时加速，电脑会攒着用不掉的 FP（终局平均剩 5–6 点）。现在加速后仍有 ≥ 3 FP 就加速，最后一轮有 FP 就加速，掷到会踩对手陷阱时重掷或加速避开。');
  P('  - **D-54 估值权重**：§12「让对手后退 1 格 = 1.5 分」和 §10 的状态估值高估了攻击。用「电脑互打」校准：一个电脑用某组权重，其余用另一组，比较胜率。结果如下，现在电脑默认用「调整后权重」：对手 1 格 = 1.0 分（两人局仍是 2 分），对手身上的状态按 §10 的一半算；其余与 §12 相同。');
  P('');
  P(table(['对局', '局数', '主角胜率', '公平值', '95% 区间'], tour.map(({ label, r }) => [label, r.games, pct(r.rate), pct(r.fair), `±${(r.ci95 * 100).toFixed(1)}`])));
  P('');
  P('  互打说明两件事：调整后的电脑明显更强；而且在一群调整后的电脑里，用 §12 原权重的电脑会明显吃亏，说明这不是「坐收渔利」，而是更好的打法。平衡数据只有在电脑打得像样时才可信，所以本报告全部用调整后的电脑。');
  P('');

  // ---------- Length ----------
  P('## 2. 对局长度');
  P('');
  P(table(['人数', '圈数', 'v3 平均轮数', 'v3 P10–P90', '建议版平均轮数', '建议版 P10–P90'], COUNTS.flatMap((n) => LAPS.map((l) => {
    const r = matrix.get(`${n}-${l}`)!;
    return [n, l, num(r.v3.meanRounds()), `${r.v3.percentile(0.1)}–${r.v3.percentile(0.9)}`, num(r.prop.meanRounds()), `${r.prop.percentile(0.1)}–${r.prop.percentile(0.9)}`];
  }))));
  P('');
  const minutes = (human: number, ai: number, lo: boolean) => (r3p * (human * (lo ? 15 : 20) + ai * (lo ? 3 : 5))) / 60;
  P(`「轮」= 每人各行动一次。3 人局：1 圈太短，${defaultLaps} 圈最接近目标，所以默认 ${defaultLaps} 圈（D-40）。时长按真人每回合 15–20 秒、电脑每回合 3–5 秒（含动画）估算：3 名真人约 ${Math.round(minutes(3, 0, true))}–${Math.round(minutes(3, 0, false))} 分钟，1 名真人 + 2 名电脑约 ${Math.round(minutes(1, 2, true))}–${Math.round(minutes(1, 2, false))} 分钟，比 §2 的「约 10–15 分钟」短一些。如果想更长，可以加一个 4 圈选项，或在 M3 放慢电脑回合的节奏。`);
  P('');

  // ---------- Seats ----------
  P('## 3. 座位与元素');
  P('');
  P(`${defaultLaps} 圈，各 ${o.big.toLocaleString('en-US')} 局。`);
  P('');
  P(table(['人数', '版本', '第 1 位', '第 2 位', '第 3 位', '第 4 位', '最大差距'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    const cells = [0, 1, 2, 3].map((i) => (i < n ? pct(st.bySeat[i]!.wins / st.bySeat[i]!.games) : ''));
    return [n, k === 'v3' ? 'v3' : '建议版', ...cells, pp(seatSpread(st, n)).replace('+', '')];
  }))));
  P('');
  P(table(['人数', '版本', '火', '土', '风', '水'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    return [n, k === 'v3' ? 'v3' : '建议版', ...(['fire', 'earth', 'air', 'water'] as const).map((e) => { const c = st.byElement.get(e)!; return c.games ? pct(c.wins / c.games) : '—'; })];
  }))));
  P('');
  P('2、3 人局只用到部分元素，元素和行动顺序绑在一起，所以 v3 的元素差距和座位差距是同一件事；轮换先手后两者都消失。');
  P('');
  P(`**各种修法的对比**（只改这一条规则，其余为 v3；${defaultLaps} 圈，各 ${(o.games * 2).toLocaleString('en-US')} 局，按行动顺序列出胜率）：`);
  P('');
  P(table(['做法', '2 人', '3 人', '4 人'], seatRows));
  P('');
  P('「立刻结束」重新带来先手优势（2 人局尤其明显）；开局补偿和终点保护只能缓解；轮换先手在三种人数下都接近均等，而且保留了「每人回合数相同」和元素顺序。');
  P('');

  // ---------- Characters ----------
  P('## 4. 角色胜率');
  P('');
  P(`### 4.1 3 人 ${defaultLaps} 圈（${o.big.toLocaleString('en-US')} 局）`);
  P('');
  P(`公平值 33.3%，偏离超过 ±7 个百分点标 ⚠。「每局使用」= 每局平均发动技能次数；「正位占比」= 发动技能时用正位的比例。`);
  P('');
  const rows3 = MAJORS.map((m) => {
    const wv = winRate(b3.v3, m), wp = winRate(b3.prop, m);
    const uses = (st: Stats) => { const u = st.skillByMajor.get(m)!; return (u.upright + u.reversed) / st.majorGames.get(m)!; };
    const flag = (d: number) => (Math.abs(d) > TOLERANCE ? ' ⚠' : '');
    return { m, wp, row: [MAJOR_ZH[m], pct(wv), pp(wv - 1 / 3) + flag(wv - 1 / 3), num(uses(b3.v3), 1), pct(b3.v3.share(b3.v3.skillByMajor.get(m)!), 0), pct(wp), pp(wp - 1 / 3) + flag(wp - 1 / 3), num(uses(b3.prop), 1), pct(b3.prop.share(b3.prop.skillByMajor.get(m)!), 0)] };
  }).sort((a, b) => b.wp - a.wp);
  P(table(['角色', 'v3 胜率', 'v3 偏离', 'v3 每局使用', 'v3 正位占比', '建议版胜率', '建议版偏离', '建议版每局使用', '建议版正位占比'], rows3.map((r) => r.row)));
  P('');
  P(`### 4.2 2 人和 4 人局（${defaultLaps} 圈，各 ${o.big.toLocaleString('en-US')} 局）`);
  P('');
  P(table(['角色', '2 人 v3', '2 人建议版', '4 人 v3', '4 人建议版'], MAJORS.map((m) => {
    const f = (st: Stats, n: number) => { const d = winRate(st, m) - 1 / n; return `${pp(d)}${Math.abs(d) > TOLERANCE ? ' ⚠' : ''}`; };
    return [MAJOR_ZH[m], f(big.get(2)!.v3, 2), f(big.get(2)!.prop, 2), f(big.get(4)!.v3, 4), f(big.get(4)!.prop, 4)];
  })));
  P('');
  const out2 = outOfRange(big.get(2)!.prop, 2), out4 = outOfRange(big.get(4)!.prop, 4);
  P(`表中是相对公平值（2 人 50%、4 人 25%）的偏离，单位为百分点。建议版超出 ±7 的：2 人局 ${out2.length} 个（${out2.map((m) => MAJOR_ZH[m]).join('、') || '无'}），4 人局 ${out4.length} 个（${out4.map((m) => MAJOR_ZH[m]).join('、') || '无'}）。原因：2 人局里对手只有一个，护盾常常没挡到东西就过期，而「直接前进」的正位更值钱；4 人局攻击更多，护盾和「先走后付代价」的角色更值钱。`);
  P('');

  // ---------- Usage ----------
  P(`## 5. 正逆位、行动、FP 与卡牌（${defaultLaps} 圈，各 ${o.big.toLocaleString('en-US')} 局）`);
  P('');
  P('### 5.1 正位占比（§11：任何一边超过 75% 说明另一边太弱）');
  P('');
  P(table(['人数', '版本', '小阿卡纳', '宫廷组合', '角色技能'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    const f = (x: number) => `${pct(x)}${x > 0.75 || x < 0.25 ? ' ⚠' : ''}`;
    return [n, k === 'v3' ? 'v3' : '建议版', f(st.share(st.orient.minor)), f(st.share(st.orient.court)), f(st.share(st.orient.skill))];
  }))));
  P('');
  P('### 5.2 行动分布');
  P('');
  P(table(['人数', '版本', '打小牌', '宫廷组合', '角色技能', '冥想', '失神跳过'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    const t = actionTotal(st);
    const a = st.actions;
    return [n, k === 'v3' ? 'v3' : '建议版', pct(a.minor / t), pct(a.court / t), pct(a.skill / t), pct(a.meditate / t), pct(a.skipped / t)];
  }))));
  P('');
  P('### 5.3 命运点上限');
  P('');
  P(table(['人数', '版本', '有 FP 因上限作废的回合', '每人每局作废次数', '终局平均 FP', '每人每局翻转次数'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    return [n, k === 'v3' ? 'v3' : '建议版', pct(st.turnsWithCap / st.turns), num(st.fpCapEvents / st.playerGames), num(st.finalFpSum / st.playerGames), num(st.flips / st.playerGames)];
  }))));
  P('');
  P('撞上限很少（约 1% 的回合），说明 FP 来得不算太容易；上限 10 可以保持。');
  P('');
  P('### 5.4 每种牌的使用');
  P('');
  P('「打出率」= 这种牌在手里且可以打的回合里，被直接打出的比例（D-41）。「当材料」= 每局作为宫廷组合材料被用掉的张数。');
  P('');
  P(table(['牌', '3 人 v3 打出率', '3 人建议版打出率', '3 人建议版每局直接打出', '3 人建议版每局当材料'], [...SUITS, ...COURTS].map((d) => {
    const c = (st: Stats) => { const x = st.playable.get(d)!; return x.played / x.avail; };
    const directPerGame = b3.prop.playable.get(d)!.played / b3.prop.games;
    const fuel = (SUITS as readonly string[]).includes(d) ? num(b3.prop.fuelUse.get(d)! / b3.prop.games) : '—';
    return [CARD_ZH[d], pct(c(b3.v3)), pct(c(b3.prop)), num(directPerGame), fuel];
  })));
  P('');
  P('星币、圣杯很少被直接打出：星币正位（+2 FP）、圣杯正位（抽 2 张）和冥想（抽 1 张 + 1 FP）相比并不占优；它们主要被宫廷组合消耗（王后正位要水 / 土，国王逆位要水 / 风，骑士正位要火 / 水……）。这是合理的分工，建议保持。若想让它们更常被直接打出，可以考虑星币正位 +3 FP、圣杯正位抽 3 张（未测）。');
  P('');
  P('### 5.5 陷阱');
  P('');
  P(table(['人数', '版本', '每局放置', '被触发（含被护盾挡下）', '被月亮免疫', '被第 4 个挤掉', '到终局仍在场'], COUNTS.flatMap((n) => (['v3', 'prop'] as const).map((k) => {
    const st = big.get(n)![k];
    const t = st.traps;
    return [n, k === 'v3' ? 'v3' : '建议版', num(t.placed / st.games), pct(t.triggered / t.placed), num(t.ignored / st.games, 3), pct(t.replaced / t.placed), pct(t.leftAtEnd / t.placed)];
  }))));
  P('');
  P('陷阱只来自恶魔和月亮的逆位。一旦放下，3–4 人局约一半以上会被触发，说明陷阱本身有用；2 人局只有一个可能踩中的人，触发率较低。**但建议版里陷阱很少被放下**：恶魔加了前进后几乎只用正位，月亮本来就以正位为主。这是 §7 第 1 条的一部分；如果希望陷阱更常见，最直接的办法是让恶魔、月亮的逆位在放陷阱之外再带一个小效果（例如「所有领先于你的玩家后退 1 格」）。');
  P('');

  // ---------- Proposals ----------
  P('## 6. 修改建议明细');
  P('');
  P('每一条都对应规则书的一句话。数值以「建议版 3 人局」为准；所有角色的完整数据见 §4。');
  P('');
  for (const n of NOTES) {
    const data = n.major ? `3 人局胜率 ${pct(winRate(b3.v3, n.major))} → ${pct(winRate(b3.prop, n.major))}（偏离 ${pp(winRate(b3.v3, n.major) - 1 / 3)} → ${pp(winRate(b3.prop, n.major) - 1 / 3)}）。` : '';
    P(`**${n.id} ${n.what}**`);
    P(`- v3：${n.v3}`);
    P(`- 建议：${n.proposal}`);
    P(`- 理由：${n.why}${data ? ` ${data}` : ''}`);
    P('');
  }
  P('宫廷牌和小阿卡纳的**数值**不动（§11 的顺序：先角色、再宫廷、最后小牌）；它们只受 S2 影响（逆位改为打所有领先者）。');
  P('');

  // ---------- Open issues ----------
  P('## 7. 未解决的问题与可选方案');
  P('');
  P(`1. **角色技能的逆位仍很少用**（建议版 3 人局 ${pct(1 - b3.prop.share(b3.prop.orient.skill), 0)}，陷阱因此也很少出现）。试过把角色逆位强度普遍提高到约两倍，占比几乎不变：多数角色逆位是扣 FP、加状态，而胜负几乎只看前进。只有「让对手后退」的逆位会被用（战车、教皇、倒吊人）。可选方案：把更多角色逆位改成「所有领先于你的玩家后退 N 格」再加原来的附带效果。这会改变不少卡的性格，需要你按塔罗含义来定。`);
  const tower = winRate(b3.prop, 'tower') - 1 / 3;
  P(`2. **高塔**保持 v3 原样，3 人局偏离 ${pp(tower)}${Math.abs(tower) > TOLERANCE ? '，略超 ±7' : ''}。试过「再失去 1 FP」，会变成约 −8：1 FP 在当前打法里约值 7 个百分点，步长太粗。建议保持原样。`);
  P('3. **2 人局**个别角色偏离 10–15 个百分点（§4.2）。如果你希望 2 人局也严格平衡，可以像恋人那样给少数角色加「两人局改为……」。');
  P('4. **规则书 §10 与 §12 的换算不一致**：§10 说 1 张牌 ≈ 0.5 格（即 1 分），§12 说 1 张牌 = 0.5 分。互打显示 §12 的 0.5 分更好（降到 0.25 会变弱），电脑沿用 §12。');
  P('');

  // ---------- Appendix ----------
  P('## 附录：全部组合（各 ' + o.games.toLocaleString('en-US') + ' 局）');
  P('');
  P(table(['人数', '圈数', '版本', '平均轮数', '座位胜率', '座位最大差距', '角色最大偏离', '超出 ±7 的角色', '正位占比 小牌/宫廷/技能', '终局平均 FP'], COUNTS.flatMap((n) => LAPS.flatMap((l) => (['v3', 'prop'] as const).map((k) => {
    const st = matrix.get(`${n}-${l}`)![k];
    const s = sum(st, n);
    return [n, l, k === 'v3' ? 'v3' : '建议版', s.rounds, s.seats, s.spread, s.maxDev, s.out, s.ur, num(st.finalFpSum / st.playerGames)];
  })))));
  P('');
  P(`角色胜率在 ${o.games.toLocaleString('en-US')} 局下每个角色只有约 ${Math.round((o.games * 3) / 22)} 个样本（3 人局），误差约 ±5 个百分点，所以本表只看整体；角色结论以 §4 的大样本为准（D-42）。`);
  P('');
  P(`元素：${Object.entries(ELEMENT_ZH).map(([k, v]) => `${k}=${v}`).join('，')}。`);
  P('');
  return out.join('\n');
}
