# Wheel of Fate 命运之轮 · 数字版规则书 v5（草稿，待确认）

> **本版取代 v3。**（v4 是 M1 平衡时的中间版本，只存在于网页版的模拟器里。）用途：网页版游戏的规则依据。
> - 规则说明用简体中文。
> - 游戏内文字提供 **英文** 和 **繁體中文** 两套，界面可以切换。英文用 `代码格式`，繁中用「」。
> - 数值经过网页版模拟器验证：`web/docs/balance-report.md`。规则细节的逐条决定见 `web/docs/decisions.md`（D-01 – D-63）。

---

## v3 → v5 改动一览

| # | 位置 | 改动 | 依据 |
|---|---|---|---|
| 1 | §2 | 默认 **3 圈**（3 人局平均约 10.6 轮） | 模拟；D-56 |
| 2 | §3.5、§8 | **每轮轮换先手**（元素顺序不变）；仍然打完一轮再结算 | v3 后手胜率 41% vs 先手 26%；S1 |
| 3 | §9 | 小阿卡纳、宫廷牌的逆位作用于**所有领先于你的玩家** | 多人局只打一人不划算；S2 |
| 4 | §9 | 角色逆位**只能指定一名领先于你的玩家**；目标是领先者时 **+2**（两人局无此加成）；每个角色逆位都会让对手后退或少走 | D-60、D-62 |
| 5 | §9.3 | 22 个角色的逆位全部重写（见各卡） | D-60 |
| 6 | §9.3 | 正位调整：力量、命运之轮、恋人、星星、节制、世界、隐士、皇后、教皇、女祭司、死神、恶魔、皇帝、魔术师、正义、审判、月亮、倒吊人、高塔 | M1–M18、D-63 |
| 7 | §9.3 | 4 条「两人局」写法：倒吊人、隐士、教皇、恋人 | D-63 |
| 8 | §7 | 陷阱**经过即触发**；放置者 +1 FP；只能放在领先于你的玩家前方 1–3 格；数值改为枷锁 −3 FP、幻象后退 4 格 | D-60、D-61 |
| 9 | §6 | 护盾到期**没挡到东西返还 1 FP**；新增「走错路」状态 | D-59、D-16 |
| 10 | §5 | 过圈奖励「每到达新的一圈 +2 FP」（被推回再过不重复给） | D-14 |
| 11 | §12 | 电脑估值按「电脑互打」校准 | D-53、D-54 |

---

## 0. 核心设计：正位加速，逆位使绊

| 朝向 | 作用 | 类比赛车游戏 |
|---|---|---|
| **正位 Upright** | 只给自己增益：前进、命运点、抽牌、护盾、更好的掷骰 | 加速道具 |
| **逆位 Reversed** | 只对**领先于你的玩家**使绊子：后退、少走、扣命运点、负面状态、陷阱 | 香蕉皮、龟壳 |

每回合的关键抉择：**这张牌是用来冲自己，还是用来拦前面的人？** 领先时只能冲，落后时才能拦。角色卡（大阿卡纳）的朝向要花命运点提前翻好，需要规划。

作品集可用的一句话：
- EN: *Upright to boost yourself. Reversed to trip the players ahead.*
- 繁中：「正位助己，逆位絆住前方。」

---

## 1. 资料来源

| 来源 | 用法 |
|---|---|
| `GC7 塔罗奥德赛策划案.docx` | 整体框架：2–4 人、星盘、元素行动顺序、命运点用途 |
| `卡牌成品/*.png` | 卡面插画；效果文字以本规则书为准 |
| 旧作品集、Figma 作品集 | Turn Flow 六步命名、视觉风格 |
| 网页版模拟器 | 默认圈数、全部数值（`web/docs/balance-report.md`） |

统一命名：卡面上的 Destiny Points / Fate Points 统一为 **Fate Points（命运点，FP）**。

---

## 2. 概览

- 2–4 人，每个座位可设为人类或电脑（电脑只有一种难度）。
- 在 12 星座组成的环形星盘上赛跑，先跑完约定圈数。
- 命运点是资源，用来重掷、加速、翻转角色、发动角色技能。**命运点不直接决定胜负**（只在平手时比较）。
- **默认 3 圈**，可选 1 / 2 / 3 圈。3 人局平均约 10.6 轮（每人各行动一次为一轮）。

---

## 3. 配件

### 3.1 星盘

12 格，顺时针为「前进」，从白羊座开始。同元素的星座每隔 4 格出现一次。

| 序号 | EN | 繁中 | 元素 | 颜色 |
|---|---|---|---|---|
| 1 | Aries | 白羊座 | Fire 火象 | 红 |
| 2 | Taurus | 金牛座 | Earth 土象 | 黄 |
| 3 | Gemini | 雙子座 | Air 風象 | 绿 |
| 4 | Cancer | 巨蟹座 | Water 水象 | 蓝 |
| 5 | Leo | 獅子座 | Fire 火象 | 红 |
| 6 | Virgo | 處女座 | Earth 土象 | 黄 |
| 7 | Libra | 天秤座 | Air 風象 | 绿 |
| 8 | Scorpio | 天蠍座 | Water 水象 | 蓝 |
| 9 | Sagittarius | 射手座 | Fire 火象 | 红 |
| 10 | Capricorn | 摩羯座 | Earth 土象 | 黄 |
| 11 | Aquarius | 水瓶座 | Air 風象 | 绿 |
| 12 | Pisces | 雙魚座 | Water 水象 | 蓝 |

### 3.2 进度

每位玩家记录一个**进度值**（从 0 开始，不封顶）。所在星座 = 进度 mod 12（0 = 白羊）；已完成圈数 = floor(进度 / 12)。

- 「**领先于你的玩家**」= 进度比你高的玩家（被你套圈的人不算）。
- 「**领先者**」= 进度最高的玩家（并列都算）。

### 3.3 卡牌

- **命运牌堆 48 张：** 小阿卡纳 40 张（权杖、星币、宝剑、圣杯各 10 张）+ 宫廷牌 8 张（侍从、骑士、王后、国王各 2 张）。
- **大阿卡纳 22 张：** 角色卡，不进抽牌堆。
- 抽牌堆抽空时，把弃牌堆洗混成新的抽牌堆。

### 3.4 命运骰

结果为 1、2、3 之一（等概率）。实体版用六面骰：1–2 走 1，3–4 走 2，5–6 走 3。

### 3.5 棋子、元素与行动顺序

| 棋子 | 繁中 | 元素 | 顺序 |
|---|---|---|---|
| Wands | 權杖 | Fire 火 | 1 |
| Pentacles | 星幣 | Earth 土 | 2 |
| Swords | 寶劍 | Air 風 | 3 |
| Cups | 聖杯 | Water 水 | 4 |

- 不满 4 人时跳过空位，顺序不变。
- **每轮轮换先手**：第一轮由顺序第一位先行动；之后每一轮，先手标记交给下一位（例如 3 人局：火→土→风，土→风→火，风→火→土……）。这样每个人轮流当「最后行动」的人。两人局会出现同一人连续行动两次（前一轮最后、下一轮最先），这是正常的。

---

## 4. 开局

1. 每位玩家选一个元素棋子（电脑随机），放在白羊座，进度 0。
2. 每人随机抽 1 张大阿卡纳作为角色（不重复），**正位或逆位随机决定**，公开放置。
3. 每人 3 FP，手牌 3 张。
4. 选择圈数（默认 3 圈）。先手标记给顺序第一位。

---

## 5. 回合流程（Turn Flow 六步）

| 步骤 | EN | 繁中 |
|---|---|---|
| ① | Draw | 抽牌 |
| ② | Play | 行動 |
| ③ | Flip | 翻轉 |
| ④ | Move | 移動 |
| ⑤ | Resolve | 結算 |
| ⑥ | End Turn | 結束回合 |

**① Draw 抽牌**：抽 1 张；手牌为空时改抽 2 张。

**② Play 行动** —— 四选一，不能空过：

| 选项 | 说明 |
|---|---|
| A 打出小阿卡纳 | 打出 1 张，**自己选正位或逆位**。打出时所在星座与牌的元素相同，额外 +1 FP（共鸣）。 |
| B 宫廷牌组合 | 宫廷牌 + 2 张符合元素要求的小阿卡纳一起打出（见 9.2），结算后抽 1 张。不触发共鸣。 |
| C 发动角色技能 | 按大阿卡纳**当前朝向**结算，花 1 FP。上一个自己的回合用过就不能用。 |
| D 冥想 Meditate | 抽 1 张，获得 1 FP。 |

**③ Flip 翻转（可选）**：花 1 FP 把自己的大阿卡纳翻面，每回合最多 1 次，影响之后的回合。

**④ Move 移动**
- 掷命运骰，前进 1–3 格。
- 可花 **1 FP 重掷**一次（看到新结果后，还可以加速）；可花 **2 FP 额外 +1 格**，每回合一次。加速后不能再重掷。
- 移动中**经过或停在**有陷阱的星座会触发陷阱（见 7）。

**⑤ Resolve 结算**
- **元素加成**：这回合真的移动过（没被定身），结算时停在自己元素的星座，+1 FP。
- **过圈**：每到达新的一圈 +2 FP（被推回再过同一圈不重复给）。
- 有人进度达到终点时，进入最后一轮（见 8）。

**⑥ End 结束**：手牌超过 5 张就弃到 5 张（自己选）；清除已生效完的状态；轮到下一位。

---

## 6. 状态

| 状态 | EN | 繁中 | 效果 |
|---|---|---|---|
| 迟缓 | `Slowed` | 遲緩 | 移动步只走 1 格，不掷骰，不能重掷和加速 |
| 封印 | `Silenced` | 封印 | 不能出牌（不能选 A、B） |
| 枯竭 | `Drained` | 枯竭 | 不能花命运点（重掷、加速、翻转、技能）；获得照常 |
| 失神 | `Stunned` | 失神 | 跳过 ② 行动和 ③ 翻转，只抽牌和移动 |
| 定身 | `Rooted` | 定身 | 跳过 ④ 移动步（卡牌效果造成的位移照常） |
| 走错路 | `Wrong Turn` | 走錯路 | 下一次移动步不掷骰，改为后退卡上写的格数；被定身的回合不消耗 |
| 护盾 | `Shielded` | 護盾 | **增益。** 挡下下一个会影响你的逆位效果或陷阱（整张牌对你的全部效果），然后消失；没用到的话，在你下一个回合结束时消失并**返还 1 FP** |

- 负面状态作用于受影响玩家的**下一个自己的回合**（在自己回合里被加上的，也是下一个回合），回合结束时清除。写着「接下来 N 个回合」的持续 N 个回合。
- 同种状态不叠加（取较长的）；不同状态可以同时存在。
- 「清除所有负面状态」不清除护盾。

---

## 7. 陷阱

由恶魔、月亮的逆位放置。

- **放在一名领先于你的玩家前方 1–3 格的星座上**；你领先时不能放。一格最多一个陷阱；全场最多 3 个，放第 4 个时最早的那个消失。
- **经过即触发**：其他玩家**自己移动**时（移动步、自己出的牌和技能）经过或停在陷阱星座就会触发，触发后陷阱消失。被别人的效果推动、交换位置都不触发。放置者自己不触发。一次移动经过多个陷阱时依次触发。
- **触发时放置者 +1 FP**（被护盾挡下也算触发，陷阱照样消失）。
- 触发者是领先者时效果更强（两人局除外）。

| 陷阱 | EN | 繁中 | 效果 |
|---|---|---|---|
| 枷锁 | `Chain Trap` | 枷鎖陷阱 | 触发者下回合定身，失去 3 FP（领先者 5 FP），继续走完这次移动 |
| 幻象 | `Illusion Trap` | 幻象陷阱 | 触发者后退 4 格（领先者 6 格），这次移动结束 |

---

## 8. 胜利

- 任何玩家的进度 ≥ 12 × 圈数时，**打完当前这一轮**（直到这一轮最后行动的玩家结束）再结算。即使他之后被推回终点以下，也照样打完这一轮。
- 进度最高者获胜，超过终点的部分也算。平手比 FP；再平手共同获胜。

---

## 9. 卡牌

**通用规则**
- **小阿卡纳、宫廷牌的逆位**：作用于**所有领先于你的玩家**，不用选目标。没有人领先于你时不能打逆位。
- **角色逆位**：选择**一名领先于你的玩家**（高塔、世界作用于所有领先于你的玩家；恶魔、月亮放陷阱）。没有人领先于你时不能用。**目标是领先者时效果更强**（卡上括号里写「领先者 X」），**两人局没有这个加成**，一律按普通数值。
- **前进到下一个 X 星座**：沿前进方向找最近的 X 元素格，不含当前格（1–4 格）。**后退到上一个 X 星座**同理。后退最低到进度 0。
- FP 上限 10，超出作废；扣到 0 为止。偷取时对方有多少偷多少。

### 9.0 共鸣 Resonance 共鳴

打出小阿卡纳时，所在星座的元素与牌的元素相同，额外 +1 FP。

### 9.1 小阿卡纳（每种 10 张）

四种花色对应四种资源：权杖管**移动**，星币管**命运点**，宝剑管**掷骰和位置**，圣杯管**手牌**。

**Wands 權杖（火）**
- 正位 Ignite 點燃：`Move forward 1 space.`「前進 1 格。」
- 逆位 Smoke 煙幕：`Every player ahead of you is Slowed next turn.`「所有領先於你的玩家下回合遲緩。」

**Pentacles 星幣（土）**
- 正位 Harvest 豐收：`Gain 2 Fate Points.`「獲得 2 命運點。」
- 逆位 Tax 苛稅：`Steal 1 Fate Point from every player ahead of you.`「從每位領先於你的玩家身上偷取 1 命運點。」

**Swords 寶劍（風）**
- 正位 Tailwind 順風：`This turn, roll the Fate Die twice and keep the higher result. Gain 1 Fate Point.`「本回合擲命運骰兩次，取較高點數。獲得 1 命運點。」
- 逆位 Cut 斬擊：`Every player ahead of you moves back 1 space.`「所有領先於你的玩家後退 1 格。」

**Cups 聖杯（水）**
- 正位 Overflow 滿溢：`Draw 2 cards.`「抽 2 張牌。」
- 逆位 Heartache 心碎：`Every player ahead of you discards 2 random cards.`「所有領先於你的玩家隨機棄 2 張牌。」

### 9.2 宫廷牌组合（每种 2 张）

宫廷牌不能单独打出，必须和 2 张小阿卡纳组合（每张属于所列两种元素之一，可以同花色），三张一起进弃牌堆，结算后抽 1 张。

**Page 侍從**
- 正位 Swift Message 疾信（風／水）：`Move forward to the next Air sign and draw 2 cards.`「前進到下一個風象星座，抽 2 張牌。」
- 逆位 Rumour 流言（土／火）：`Every player ahead of you moves back 1 space, discards 2 random cards and is Silenced next turn.`「所有領先於你的玩家後退 1 格、隨機棄 2 張牌，並在下回合被封印。」

**Knight 騎士**
- 正位 Charge 衝鋒（火／水）：`Move forward to the next Fire sign, then 1 more space.`「前進到下一個火象星座，再前進 1 格。」
- 逆位 Joust 擊落（土／風）：`Every player ahead of you moves back to the previous Earth sign and is Stunned next turn.`「所有領先於你的玩家後退到上一個土象星座，並在下回合失神。」

**Queen 王后**
- 正位 Grace 恩典（水／土）：`Move forward 2 spaces, gain 2 Fate Points and become Shielded.`「前進 2 格、獲得 2 命運點，並獲得護盾。」
- 逆位 Scorn 冷眼（火／風）：`Every player ahead of you moves back to the previous Fire sign and loses 3 Fate Points.`「所有領先於你的玩家後退到上一個火象星座，並失去 3 命運點。」

**King 國王**
- 正位 Dominion 統御（土／火）：`Move forward 3 spaces and become Shielded.`「前進 3 格，並獲得護盾。」
- 逆位 Tyranny 暴政（水／風）：`Every player ahead of you moves back 2 spaces and is Silenced next turn. All other players are Drained next turn.`「所有領先於你的玩家後退 2 格並在下回合被封印；所有其他玩家下回合枯竭。」

### 9.3 大阿卡纳（角色卡，22 张）

发动技能：回合 ② 的选项 C，花 1 FP，按当前朝向结算；上一个自己的回合用过就不能用。翻转：回合 ③，花 1 FP。

**0 · The Fool 愚者**
- 正位 Leap of Faith 縱身一躍：`Roll the Fate Die and move forward that many spaces + 1.`「擲命運骰，前進點數 + 1 格。」
- 逆位 Wrong Turn 走錯路：`Choose a player ahead of you. On their next Move step, they move back 2 spaces instead of rolling (the leader: 4).`「選擇一名領先於你的玩家：他下一次移動時不擲骰，改為後退 2 格（領先者 4 格）。」

**1 · The Magician 魔術師**
- 正位 Conjure 變出：`Draw 2 cards. You may immediately play up to 2 Minor cards without using your action.`「抽 2 張牌，並可立即額外打出最多 2 張小阿爾克那（不佔用行動）。」
- 逆位 Sleight of Hand 妙手：`A player ahead of you moves back 3 spaces (the leader: 5). Steal a random card from them.`「一名領先於你的玩家後退 3 格（領先者 5 格），你隨機偷取他 1 張手牌。」

**2 · The High Priestess 女祭司**
- 正位 Foresight 預知：`Move forward 1 space. Look at the top 3 cards: use the upright effect of one Minor card among them and add another to your hand.`「前進 1 格。查看牌堆頂 3 張：發動其中 1 張小阿爾克那的正位效果，另取 1 張加入手牌。」剩下那张放到牌堆底。
- 逆位 Veil 帷幕：`A player ahead of you moves back 1 space (the leader: 3) and is Slowed next turn. Look at their hand and discard 1 card of your choice.`「一名領先於你的玩家後退 1 格（領先者 3 格），並在下回合遲緩；查看他的手牌，選 1 張棄掉。」

**3 · The Empress 皇后**
- 正位 Abundance 豐饒：`Move forward 1 space, gain 3 Fate Points and draw 1 card.`「前進 1 格、獲得 3 命運點，抽 1 張牌。」
- 逆位 Overgrowth 藤蔓纏身：`A player ahead of you is Rooted next turn, loses 1 Fate Point and moves back 1 space (the leader: 3).`「一名領先於你的玩家下回合定身、失去 1 命運點，並後退 1 格（領先者 3 格）。」

**4 · The Emperor 皇帝**
- 正位 Command 號令：`Gain 1 Fate Point and become Shielded. Your Move roll this turn counts as 4.`「獲得 1 命運點與護盾；本回合移動點數視為 4。」
- 逆位 Decree 敕令：`A player ahead of you moves back 3 spaces (the leader: 5) and is Silenced next turn.`「一名領先於你的玩家後退 3 格（領先者 5 格），並在下回合被封印。」

**5 · The Hierophant 教皇**
- 正位 Blessing 祝福：`Move forward 1 space. Remove all your negative statuses, gain 1 Fate Point, draw 1 card and become Shielded.`「前進 1 格；清除自己身上所有負面狀態，獲得 1 命運點、抽 1 張牌，並獲得護盾。」
  - 两人局：`Gain 2 Fate Points instead.`「兩人局：改為獲得 2 命運點。」
- 逆位 Penance 懺悔：`A player ahead of you moves back to the previous Earth sign (the leader: 2 more spaces).`「一名領先於你的玩家後退到上一個土象星座（領先者再後退 2 格）。」

**6 · The Lovers 戀人**
- 正位 Slipstream 比翼：`Move to the space of the nearest player ahead of you (up to 5 spaces away). If no one is that close, move forward 3 spaces.`「前進到前方 5 格內最近一名玩家所在的格子；若 5 格內沒有玩家，則前進 3 格。」
  - 两人局：`If no one is that close, move forward 2 spaces.`「兩人局：5 格內沒有玩家時前進 2 格。」
- 逆位 Heartbreak 拆散：`A player ahead of you moves back to the space of the nearest player behind them (at most 4 spaces; otherwise 2), then 1 more space (the leader: 3 more).`「一名領先於你的玩家後退到他身後最近一名玩家所在的格子（最多 4 格；4 格內沒人則後退 2 格），再後退 1 格（領先者再後退 3 格）。」

**7 · The Chariot 戰車**
- 正位 Full Speed 全速：`Move forward 3 spaces.`「前進 3 格。」
- 逆位 Ram 衝撞：`A player ahead of you moves back 2 spaces (the leader: 4) and is Slowed next turn.`「一名領先於你的玩家後退 2 格（領先者 4 格），並在下回合遲緩。」

**8 · Strength 力量**
- 正位 Courage 勇氣：`Move forward to the next Fire sign.`「前進到下一個火象星座。」
- 逆位 Intimidate 威嚇：`A player ahead of you moves back 1 space (the leader: 3), is Stunned next turn and loses 1 Fate Point.`「一名領先於你的玩家後退 1 格（領先者 3 格）、下回合失神，並失去 1 命運點。」

**9 · The Hermit 隱士**
- 正位 Retreat 獨修：`Move forward 1 space, gain 2 Fate Points, draw 1 card and become Shielded.`「前進 1 格、獲得 2 命運點、抽 1 張牌，並獲得護盾。」
  - 两人局：`Draw 2 cards instead.`「兩人局：改為抽 2 張牌。」
- 逆位 Isolation 孤立：`A player ahead of you moves back 2 spaces (the leader: 4) and is Drained next turn.`「一名領先於你的玩家後退 2 格（領先者 4 格），並在下回合枯竭。」

**10 · Wheel of Fortune 命運之輪**
- 正位 Fortune 好運：`Roll the Fate Die twice. Move forward the lower result and gain Fate Points equal to the higher result.`「擲命運骰兩次：按較低點數前進，並獲得等同較高點數的命運點。」
- 逆位 The Wheel Turns 天道輪轉：`A player ahead of you rolls the Fate Die and moves back that many spaces (the leader: 2 more).`「一名領先於你的玩家擲命運骰，後退點數格（領先者再後退 2 格）。」

**11 · Justice 正義**
- 正位 Equity 公平：`If you are not leading, move forward half the distance to the leading player (round up, at least 2, at most 5). If you are leading, move forward 1 space and gain 3 Fate Points.`「若你不是領先者，前進與領先者距離的一半（無條件進位，至少 2 格、最多 5 格）；若你領先，前進 1 格並獲得 3 命運點。」
- 逆位 Verdict 裁決：`A player ahead of you moves back 3 spaces (the leader: 5) and loses 1 Fate Point.`「一名領先於你的玩家後退 3 格（領先者 5 格），並失去 1 命運點。」

**12 · The Hanged Man 倒吊人**
- 正位 Sacrifice 犧牲：`Move forward 2 spaces, gain 1 Fate Point, draw 1 card and become Shielded. You are Slowed next turn.`「前進 2 格、獲得 1 命運點、抽 1 張牌，並獲得護盾；你下回合遲緩。」
  - 两人局：`Move forward 3 spaces instead.`「兩人局：改為前進 3 格。」
- 逆位 Suspend 倒懸：`A player ahead of you is Rooted and Drained next turn (the leader also moves back 2 spaces).`「一名領先於你的玩家下回合定身並枯竭（領先者另外後退 2 格）。」

**13 · Death 死神**
- 正位 Rebirth 重生：`Move forward 2 spaces. Discard any number of cards, then draw until you have 5. Remove all your negative statuses and gain 1 Fate Point.`「前進 2 格。棄掉任意張手牌，再抽到 5 張；清除自己身上所有負面狀態，並獲得 1 命運點。」
- 逆位 Reap 收割：`A player ahead of you moves back 3 spaces (the leader: 5) and loses 2 Fate Points.`「一名領先於你的玩家後退 3 格（領先者 5 格），並失去 2 命運點。」

**14 · Temperance 節制**
- 正位 Flow 調和：`Move forward to the next Water sign.`「前進到下一個水象星座。」
- 逆位 Restraint 克制：`A player ahead of you moves back 1 space and is Slowed for their next 2 turns (the leader: 4 turns).`「一名領先於你的玩家後退 1 格，並在接下來 2 個回合遲緩（領先者 4 個回合）。」

**15 · The Devil 惡魔**
- 正位 Pact 契約：`Gain 5 Fate Points and move forward 2 spaces. You are Drained next turn.`「獲得 5 命運點並前進 2 格；你下回合枯竭。」
- 逆位 Chains 枷鎖：`Place a Chain Trap 1–3 signs in front of a player ahead of you.`「在一名領先於你的玩家前方 1–3 格放置枷鎖陷阱。」（效果见 §7）

**16 · The Tower 高塔**
- 正位 Lightning Dash 雷霆突進：`Move forward 4 spaces (3 if you are leading), then discard your whole hand.`「前進 4 格（若你領先則 3 格），然後棄掉全部手牌。」
- 逆位 Collapse 崩塌：`Every player ahead of you moves back 2 spaces; the leader moves back 4.`「所有領先於你的玩家後退 2 格，其中領先者後退 4 格。」

**17 · The Star 星星**
- 正位 Hope 希望：`Move forward to the next Water sign. If you have fewer than 2 Fate Points, restore them to 2.`「前進到下一個水象星座；若你的命運點少於 2，補回到 2。」
- 逆位 Falling Star 隕落：`A player ahead of you moves back 2 spaces (the leader: 4). Steal 1 Fate Point from them.`「一名領先於你的玩家後退 2 格（領先者 4 格），你從他身上偷取 1 命運點。」

**18 · The Moon 月亮**
- 正位 Night Walk 夜行：`Move forward 2 spaces. Traps do not affect you until your next turn.`「前進 2 格；直到你下回合前，陷阱對你無效。」
- 逆位 Illusion 幻象：`Place an Illusion Trap 1–3 signs in front of a player ahead of you.`「在一名領先於你的玩家前方 1–3 格放置幻象陷阱。」（效果见 §7）

**19 · The Sun 太陽**
- 正位 Radiance 光輝：`Move forward 2 spaces and gain 2 Fate Points.`「前進 2 格，並獲得 2 命運點。」
- 逆位 Scorch 灼燒：`A player ahead of you moves back 2 spaces (the leader: 4), is Slowed next turn and loses 1 Fate Point.`「一名領先於你的玩家後退 2 格（領先者 4 格）、下回合遲緩，並失去 1 命運點。」

**20 · Judgement 審判**
- 正位 Calling 召喚：`Discard up to 4 cards. Move forward 1 space for each card discarded, then draw 2 cards.`「棄掉最多 4 張手牌，每棄 1 張前進 1 格，然後抽 2 張牌。」
- 逆位 Reckoning 清算：`A player ahead of you moves back half the distance between you (round up, at most 4; the leader: 2 more).`「一名領先於你的玩家後退你們之間距離的一半（無條件進位，最多 4 格；領先者再後退 2 格）。」

**21 · The World 世界**（正位和逆位各算一次）
- 正位 Completion 圓滿：`Once per game: move forward to Pisces, the last sign before Aries (at most 9 spaces).`「每局限一次：前進到雙魚座（白羊座前的最後一格），最多前進 9 格。」已在雙魚座時不能用。
- 逆位 Standstill 靜止：`Once per game: every player ahead of you is Rooted next turn; the leader also moves back 2 spaces.`「每局限一次：所有領先於你的玩家下回合定身，其中領先者另外後退 2 格。」

---

## 10. 平衡思路

**换算基准**：1 格 ≈ 2 FP（2 FP 可以加速 1 格）。手牌的边际价值较低，因为每回合只能做一个行动。

**多人局的逆位**：3 人局里让一个对手后退 1 格，第三个人同样得利，所以它只值「自己前进约半格」。v5 的做法：
1. 逆位只能打领先于你的人（落后时拦、领先时冲）；
2. 小牌和宫廷牌的逆位作用于所有领先者，强度随人数增长；
3. 角色逆位的后退格数约为正位前进格数的两倍，打领先者再 +2。

代价：逆位多了，全场总进度变少，3 人局平均比 v4 多约 1.7 轮。

**v1 → v5 的主要改动**（可用在作品集「迭代」页）：
1. 确立「正位助己、逆位绊人」，再进一步：**逆位只绊前面的人**。
2. 一张牌定胜负的效果改掉：世界限每局一次、最多 9 格；高塔领先时只冲 3 格。
3. 赛车游戏式机制：尾流（恋人）、追赶（正义）、专打第一名（所有逆位对领先者 +2）、香蕉皮（经过即触发的陷阱）、护盾。
4. **消除先后手优势**：v3 的「打完这一轮」反而让最后行动的人占优（41% vs 26%），改为每轮轮换先手后各座位约 33%。
5. 资源型角色（只给 FP、手牌）普遍太弱，改为都带一点前进。
6. 用模拟器和「电脑互打」把每个角色的胜率调到公平值 ±5 个百分点（3 人局）。

---

## 11. 平衡验证

- 命令：`npm run sim`（生成 `web/docs/balance-report.md`）；单独一组：`npm run sim -- --players 3 --laps 3 --games 10000`；逆位诊断：`npm run sim -- --diagnose-reversed`。
- 目标：3 人局每个角色胜率在公平值 ±5 个百分点内，2 / 4 人局 ±8；角色逆位使用率 25–40%；每局陷阱触发 ≥ 0.3；3 人局 8–12 轮。
- v5 结果见平衡报告；未完全达标的项目（3 人局小阿卡纳正位约 78%）在报告 §7 说明。

---

## 12. 电脑对手（单一难度）

- 每回合枚举所有合法行动（每张牌的两面、能组成的宫廷组合、角色技能的每种选择、冥想），在**隐藏信息的副本**上执行后打分（牌堆重新洗过，看不到真实牌序和别人的手牌内容）：
  - 自己前进 1 格 = 2 分；让领先的对手后退 1 格 = 1 分（其他对手 0.75 分；两人局 2 分）；
  - 1 FP = 0.5 分，1 张牌 = 0.5 分（手牌超过 5 张的部分不计）；
  - 状态按 §10 换算，对手身上的状态按一半计；陷阱按它对领先者的伤害 + 放置者奖励估值；
  - 自己领先时更看重正位和护盾，落后时更看重逆位。
- 翻转：把两面技能分别当成下回合使用来估值，另一面高出 1 分以上且 FP ≥ 3 时翻转。
- 陷阱：放在领先者前方 1 格。
- 移动：骰到 1 且 FP ≥ 3 时重掷；离终点只差 1 格、加速后仍有 ≥ 3 FP、或在最后一轮时加速。
- 这组权重经过「电脑互打」校准：比 §12 旧权重的电脑胜率高约 6 个百分点（3 人局）。

---

## 13. 界面文字对照（EN / 繁中）

| EN | 繁中 |
|---|---|
| Fate Points | 命運點 |
| Fate Die | 命運骰 |
| Upright | 正位 |
| Reversed | 逆位 |
| Major Arcana | 大阿爾克那 |
| Minor Arcana | 小阿爾克那 |
| Court Cards | 宮廷牌 |
| Draw / Play / Flip / Move / Resolve / End Turn | 抽牌／行動／翻轉／移動／結算／結束回合 |
| Meditate | 冥想 |
| Reroll | 重擲 |
| Boost (+1 space) | 加速（+1 格） |
| Resonance | 共鳴 |
| Element Bonus | 元素加成 |
| Lap | 圈 |
| Laps to win | 勝利圈數 |
| Trap | 陷阱 |
| Player ahead of you / Players ahead of you | 領先於你的玩家 |
| Leading player | 領先者 |
| First player (this round) | 本輪先手 |
| Wrong Turn | 走錯路 |
| Shield refund | 護盾返還 |
| Fire / Earth / Air / Water | 火象／土象／風象／水象 |
| Wands / Pentacles / Swords / Cups | 權杖／星幣／寶劍／聖杯 |
| Page / Knight / Queen / King | 侍從／騎士／王后／國王 |
| Human / Computer | 玩家／電腦 |
| Your turn | 輪到你了 |
| You win! / {name} wins! | 你贏了！／{name} 獲勝！ |
| Rules | 規則 |
| New game | 新遊戲 |
| Language | 語言 |

大阿卡纳中英文名：The Fool 愚者、The Magician 魔術師、The High Priestess 女祭司、The Empress 皇后、The Emperor 皇帝、The Hierophant 教皇、The Lovers 戀人、The Chariot 戰車、Strength 力量、The Hermit 隱士、Wheel of Fortune 命運之輪、Justice 正義、The Hanged Man 倒吊人、Death 死神、Temperance 節制、The Devil 惡魔、The Tower 高塔、The Star 星星、The Moon 月亮、The Sun 太陽、Judgement 審判、The World 世界。

---

## 14. 素材备注

- 卡图在 `D:\Tarot Game\卡牌成品\`，827 × 1417 像素。卡背是 `背面.png`。
- 卡面上印的是旧效果文字（只有英文）：网页版只保留中间插画（约 y 150–1160），用代码重画卡框：下方正位、上方倒置逆位，按当前语言显示；卡名条也按当前语言。
- 星盘配色按元素：火红、土黄、风绿、水蓝（水瓶座用绿色）。
- 语言切换覆盖所有界面文字、卡牌效果、状态名、日志；默认英文。
