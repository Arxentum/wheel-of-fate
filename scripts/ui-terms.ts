/**
 * Writes docs/m4/ui-terms.md: every interface string in English and Traditional Chinese
 * for review (decision D-47). The words the rulebook does not define come first.
 * Run: npm run terms
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../src/i18n/en.json' with { type: 'json' };
import zh from '../src/i18n/zh-Hant.json' with { type: 'json' };

type Key = keyof typeof en;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'docs/m4/ui-terms.md');

/** Words I made up because the rulebook (§13 and the card texts) has none; notes in Chinese. */
const COINED: [Key[], string][] = [
  [['status.trapImmune'], '月亮正位「夜行」给的状态，规则书只写效果没起名'],
  [['game.finalRound'], '有人到终点后进入的最后一轮'],
  [['game.finished'], '棋子到达终点后的标签'],
  [['game.skillReady', 'game.skillCooldown', 'game.skillUsed'], '玩家面板上角色技能的状态（世界用过后显示「已用」）'],
  [['game.currentSide'], '角色卡目前朝上的一面'],
  [['step.short.end'], '六步指示里「结束回合」的缩写'],
  [['decide.keep', 'decide.flipTo'], '翻转步骤的两个按钮'],
  [['decide.foresightUse', 'decide.foresightTake'], '女祭司正位「预知」：发动哪张、收下哪张'],
  [['decide.conjureDone'], '魔术师正位「变出」打完额外的牌'],
  [['fpReason.lap', 'fpReason.trapBounty', 'fpReason.card', 'fpReason.steal'], '日志里命运点变化的原因'],
  [['setup.off', 'setup.advanced', 'setup.seed'], '开始画面'],
  [['game.speed', 'game.skip'], '电脑回合的回放控制'],
  [['handoff.title', 'handoff.ready'], '热座交接画面'],
  [['game.log', 'game.turnCard'], '游戏画面'],
  [['nav.rules', 'nav.cards', 'game.paused'], 'M4：页面名称；游戏中打开规则时的提示'],
  [['rules.quick.title'], 'M4：玩法说明的第一节'],
  [['rules.status.good', 'rules.status.bad'], 'M4：状态的分类标签'],
  [['gallery.character', 'gallery.differs2p'], 'M4：卡牌图鉴里卡下方的标签'],
];

/** Groups of the full list (card texts, card and sign names come from the rulebook and are left out). */
const GROUPS: [string, RegExp][] = [
  ['页面与导航', /^(app|nav|lang|small|sound)\./],
  ['开始画面', /^setup\./],
  ['游戏画面', /^(game|tag|step|side|sideLabel|player|board|piece|trap|list|float|banner|played|emote|fx|tip)\./],
  ['状态', /^status\./],
  ['决定面板', /^decide\./],
  ['置灰原因', /^reason\./],
  ['命运点变化原因（日志）', /^fpReason\./],
  ['事件日志', /^log\./],
  ['热座与结算', /^(handoff|over)\./],
  ['玩法说明页', /^rules\./],
  ['卡牌图鉴页', /^gallery\./],
];

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const keys = Object.keys(en) as Key[];
const lines: string[] = [
  '# 界面用词对照（EN / 繁中）',
  '',
  '> 由 `npm run terms` 从 `src/i18n/*.json` 生成，不要手改；改字典后重新生成。',
  '> 卡牌效果、卡名、星座名、元素名来自规则书 v5，不在这里列出。`{n|单数|复数}` 是英文的单复数写法。',
  '',
  '## 1. 规则书里没有、自拟的界面词（D-47）',
  '',
  '| 键 | EN | 繁中 | 用在哪里 |',
  '|---|---|---|---|',
];
for (const [group, note] of COINED) {
  group.forEach((k, i) => {
    lines.push(`| \`${k}\` | ${cell(en[k])} | ${cell(zh[k])} | ${i === 0 ? note : '〃'} |`);
  });
}

lines.push('', '## 2. 全部界面文字', '');
let n = 0;
for (const [title, re] of GROUPS) {
  const ks = keys.filter((k) => re.test(k) && !k.startsWith('preview.'));
  if (!ks.length) continue;
  lines.push(`### ${title}（${ks.length}）`, '', '| 键 | EN | 繁中 |', '|---|---|---|');
  for (const k of ks) lines.push(`| \`${k}\` | ${cell(en[k])} | ${cell(zh[k])} |`);
  lines.push('');
  n += ks.length;
}
const missed = keys.filter((k) => !GROUPS.some(([, re]) => re.test(k)) && !/^(face|card|sign|element|preview)\./.test(k));
if (missed.length) throw new Error(`Keys in no group: ${missed.join(', ')}`);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'));
console.log(`docs/m4/ui-terms.md: ${COINED.reduce((s, [g]) => s + g.length, 0)} coined terms, ${n} strings`);
