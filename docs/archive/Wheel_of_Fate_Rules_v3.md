# Wheel of Fate 命运之轮 · 数字版规则书 v3

> **本版取代 v2。** 用途：网页版游戏的规则依据。
> - 规则说明用简体中文。
> - 游戏内文字提供 **英文** 和 **繁體中文** 两套，界面可以切换（为申请香港院校准备）。英文用 `代码格式`，繁中用「」。
> - 所有数值都是手工平衡的初值，做出来后请按第 11 节用模拟对局验证再微调。

---

## 0. 核心设计：正位加速，逆位使绊

这是这款游戏最重要的创新，所有卡牌都遵守这条规则：

| 朝向 | 作用 | 类比赛车游戏 |
|---|---|---|
| **正位 Upright** | 只给自己增益：前进、命运点、抽牌、护盾、更好的掷骰 | 加速道具 |
| **逆位 Reversed** | 只给别人使绊子：后退、扣命运点、弃牌、负面状态、陷阱 | 香蕉皮、龟壳 |

每回合的关键抉择就是：**这张牌是用来冲自己，还是用来拦别人？** 打牌时自己决定朝向；角色卡（大阿卡纳）的朝向则要花命运点提前翻好，需要规划。

作品集可用的一句话：
- EN: *Upright to boost yourself. Reversed to trip your rivals.*
- 繁中：「正位助己，逆位絆人。」

---

## 1. 资料来源与取舍

| 来源 | 用法 |
|---|---|
| `GC7 塔罗奥德赛策划案.docx` | 整体框架：2–4 人、星盘、元素行动顺序、命运点用途 |
| `技能.docx` | 早期技能，仅作参考 |
| `卡牌成品/*.png` 卡面文字 | 第一版效果；v3 按「正位助己、逆位绊人」全部重写，部分保留原意 |
| `卡牌成品/打印/` 文件夹 | 牌堆数量：小阿卡纳每种 10 张、宫廷牌每种 2 张、大阿卡纳各 1 张 |
| 旧作品集 Game Rules / Sample Test 页 | 回合流程、命运点规则、试玩问题与解决方向 |
| Figma 作品集（最终版） | Turn Flow 六步命名 |

统一命名：卡面上混用了 Destiny Points / Fate Points，统一为 **Fate Points（命运点，FP）**。

---

## 2. 概览

- 2–4 人，每个座位可设为人类或电脑（电脑只有一种难度）。
- 在 12 星座组成的环形星盘上赛跑，先跑完约定圈数。
- 命运点是资源，用来重掷、加速、翻转角色、发动角色技能。**命运点不直接决定胜负**（只在平手时比较）。
- **默认圈数用模拟决定**（见第 11 节）：目标是 3 人局平均 8–12 轮、数字版约 10–15 分钟。设置里保留 1 / 2 / 3 圈选项。

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

> 作品集里的星盘把水瓶座（风象）涂成了蓝色，游戏里按元素改成绿色。

### 3.2 进度

每位玩家记录一个**进度值**（从 0 开始，不封顶）。
- 所在星座 = 进度 mod 12（0 = 白羊）
- 已完成圈数 = floor(进度 / 12)

### 3.3 卡牌

- **命运牌堆（抽牌堆）48 张：** 小阿卡纳 40 张（权杖、星币、宝剑、圣杯各 10 张）+ 宫廷牌 8 张（侍从、骑士、王后、国王各 2 张）。
- **大阿卡纳 22 张：** 角色卡，不进抽牌堆。
- 抽牌堆抽空时，把弃牌堆洗混成新的抽牌堆。

### 3.4 命运骰

结果为 1、2、3 之一（等概率）。实体版用六面骰：1–2 走 1，3–4 走 2，5–6 走 3。

### 3.5 棋子、元素与行动顺序

| 棋子 | 繁中 | 元素 | 行动顺序 |
|---|---|---|---|
| Wands | 權杖 | Fire 火 | 1 |
| Pentacles | 星幣 | Earth 土 | 2 |
| Swords | 寶劍 | Air 風 | 3 |
| Cups | 聖杯 | Water 水 | 4 |

不满 4 人时跳过空位，顺序不变（和星座顺序火→土→风→水一致）。

---

## 4. 开局

1. 每位玩家选一个元素棋子（电脑随机），放在白羊座，进度 0。
2. 每人随机抽 1 张大阿卡纳作为角色（不重复），**正位或逆位随机决定**，公开放置。
3. 每人 3 FP，手牌 3 张。
4. 选择圈数（默认值由模拟决定）。

---

## 5. 回合流程（对应作品集 Turn Flow 六步）

| 步骤 | EN | 繁中 |
|---|---|---|
| ① | Draw | 抽牌 |
| ② | Play | 行動 |
| ③ | Flip | 翻轉 |
| ④ | Move | 移動 |
| ⑤ | Resolve | 結算 |
| ⑥ | End Turn | 結束回合 |

**① Draw 抽牌**
抽 1 张；如果此时手牌为空，改抽 2 张。

**② Play 行动** —— 四选一：

| 选项 | 说明 |
|---|---|
| A 打出小阿卡纳 | 打出 1 张，**自己选正位或逆位**。在同元素星座上打出时额外 +1 FP（共鸣，见 9.0）。 |
| B 宫廷牌组合 | 宫廷牌 + 2 张符合元素要求的小阿卡纳一起打出（见 9.2），结算后抽 1 张。 |
| C 发动角色技能 | 按大阿卡纳**当前朝向**结算，花 1 FP。**不能连续两个回合发动。** |
| D 冥想 Meditate | 抽 1 张，获得 1 FP。 |

**③ Flip 翻转（可选）**
花 1 FP 把自己的大阿卡纳翻面（正 ↔ 逆），每回合最多 1 次。翻转发生在行动之后，所以影响的是之后的回合：现在翻到逆位，就是在为下回合拦人做准备。

**④ Move 移动**
掷命运骰，前进 1–3 格。
- 可花 **1 FP 重掷**一次，以新结果为准。
- 可花 **2 FP 额外 +1 格**，每回合一次。
- 结束在有陷阱的格子上会触发陷阱（见 7）。

**⑤ Resolve 结算**
- **元素加成：** 移动步结束时停在自己元素的星座，+1 FP。
- **完成一圈：** 每次向前越过白羊座（任何方式的移动都算），+2 FP。
- 检查是否有人达到终点（见第 8 节）。

**⑥ End 结束**
手牌超过 5 张就弃到 5 张；清除本回合已生效完的状态；轮到下一位。

---

## 6. 状态

| 状态 | EN | 繁中 | 效果 |
|---|---|---|---|
| 迟缓 | `Slowed` | 遲緩 | 移动步最多走 1 格，重掷和加速无效 |
| 封印 | `Silenced` | 封印 | 不能出牌（不能选 A、B） |
| 枯竭 | `Drained` | 枯竭 | 不能花命运点：不能重掷、加速、翻转，也不能发动角色技能 |
| 失神 | `Stunned` | 失神 | 跳过 ② 行动和 ③ 翻转，只抽牌和移动 |
| 定身 | `Rooted` | 定身 | 跳过 ④ 移动步（卡牌效果造成的位移照常） |
| 护盾 | `Shielded` | 護盾 | **增益状态。** 挡下下一个会影响你的逆位效果或陷阱（包括全体效果中针对你的部分），然后消失；没用到的话，在你下一个回合结束时消失 |

- 负面状态作用于受影响玩家的**下一个回合**，回合结束时清除。写着「next 2 turns」的持续 2 个回合。
- 自己给自己加的负面状态（如 `You are Drained next turn`）作用于自己的下一个回合。
- 同种状态不叠加（时长取较长的）；不同状态可以同时存在。

---

## 7. 陷阱（逆位专属的「香蕉皮」）

由恶魔、月亮的逆位技能放置。

- 放在任意一个星座格上，一格最多一个陷阱；全场最多 3 个，放第 4 个时最早的那个消失。
- **其他玩家**在移动步结束时停在这一格就会触发，触发后陷阱消失。放置者自己不会触发。
- 被卡牌效果推到这一格、或只是路过，都不会触发。
- 护盾可以挡下陷阱（陷阱照样消失）。

| 陷阱 | EN | 繁中 | 效果 |
|---|---|---|---|
| 枷锁 | `Chain Trap` | 枷鎖陷阱 | 触发者下回合定身，并失去 2 FP |
| 幻象 | `Illusion Trap` | 幻象陷阱 | 触发者后退 3 格 |

---

## 8. 胜利

- 任何玩家的进度 ≥ 12 × 圈数时，**打完当前这一轮**（直到最后一个座位的玩家结束）再结算，保证每人回合数相同，消除先手优势。
- 进度最高者获胜，超过终点的部分也算。
- 平手比 FP；再平手则共同获胜。

---

## 9. 卡牌

**通用规则**
- 「target player / 目標玩家」= 任意一名其他玩家，由出牌者选择。
- 「leading player / 領先者」= 进度最高的玩家。
- **前进到下一个 X 星座**：沿前进方向找最近的 X 元素格，不含当前格，距离 1–4 格。
- **后退到上一个 X 星座**：沿后退方向找最近的 X 元素格，不含当前格，距离 1–4 格，最低到进度 0。
- 后退最低到进度 0（第一圈不会退到起点之前）。
- 没有合法目标时效果落空；界面上应把这种选项置灰。
- FP 上限 10，超出作废；扣到 0 以下按 0 算。

### 9.0 共鸣 Resonance 共鳴

打出小阿卡纳时，如果你所在星座的元素与这张牌的花色元素相同，额外 +1 FP。让玩家有理由攒牌、等到合适的格子再打。

### 9.1 小阿卡纳（每种 10 张，同花色效果相同）

四种花色正好对应四种资源：权杖管**移动**，星币管**命运点**，宝剑管**掷骰和位置**，圣杯管**手牌**。正位给自己加这种资源，逆位削弱别人的这种资源。

**Wands 權杖（火）**
- 正位 Ignite 點燃
  - `Move forward 1 space.`
  - 「前進 1 格。」
- 逆位 Smoke 煙幕
  - `Target player is Slowed next turn.`
  - 「目標玩家下回合遲緩。」
- 原卡面：正位前进 1；逆位前进 2 但下回合不能出牌（不是使绊）。

**Pentacles 星幣（土）**
- 正位 Harvest 豐收
  - `Gain 2 Fate Points.`
  - 「獲得 2 命運點。」
- 逆位 Tax 苛稅
  - `Steal 1 Fate Point from a target player.`
  - 「從目標玩家身上偷取 1 命運點。」
- 原卡面：正位 +1；逆位让目标 −1。

**Swords 寶劍（風）**
- 正位 Tailwind 順風
  - `This turn, roll the Fate Die twice and keep the higher result. Gain 1 Fate Point.`
  - 「本回合擲命運骰兩次，取較高點數。獲得 1 命運點。」
- 逆位 Cut 斬擊
  - `Target player moves back 1 space.`
  - 「目標玩家後退 1 格。」
- 原卡面：正位就是让目标后退 1（属于使绊，改到逆位）；逆位让目标不能翻转。

**Cups 聖杯（水）**
- 正位 Overflow 滿溢
  - `Draw 2 cards.`
  - 「抽 2 張牌。」
- 逆位 Heartache 心碎
  - `Target player discards 2 random cards.`
  - 「目標玩家隨機棄 2 張牌。」
- 原卡面：正位移到下一个水格但下回合不能前进；逆位把目标移到水格并让其不能行动。

### 9.2 宫廷牌组合（每种 2 张）

- 宫廷牌**不能单独打出**，必须和 2 张小阿卡纳组合，每张都要属于列出的两种元素之一。
- 打出时选择正位或逆位，两面的元素要求不同（沿用卡面印的要求）。
- 三张牌一起进弃牌堆，结算后**抽 1 张**。
- 组合是「大招」：消耗 3 张牌，效果约等于 3–4 格。

**Page 侍從**
- 正位 Swift Message 疾信 —— 需要 Air / Water 風／水
  - `Move forward to the next Air sign and draw 2 cards.`
  - 「前進到下一個風象星座，抽 2 張牌。」
- 逆位 Rumour 流言 —— 需要 Earth / Fire 土／火
  - `Target player moves back 1 space, discards 2 random cards and is Silenced next turn.`
  - 「目標玩家後退 1 格、隨機棄 2 張牌，並在下回合被封印。」

**Knight 騎士**
- 正位 Charge 衝鋒 —— 需要 Fire / Water 火／水
  - `Move forward to the next Fire sign, then 1 more space.`
  - 「前進到下一個火象星座，再前進 1 格。」
- 逆位 Joust 擊落 —— 需要 Earth / Air 土／風
  - `Target player moves back to the previous Earth sign and is Stunned next turn.`
  - 「目標玩家後退到上一個土象星座，並在下回合失神。」

**Queen 王后**
- 正位 Grace 恩典 —— 需要 Water / Earth 水／土
  - `Move forward 2 spaces, gain 2 Fate Points and become Shielded.`
  - 「前進 2 格、獲得 2 命運點，並獲得護盾。」
- 逆位 Scorn 冷眼 —— 需要 Fire / Air 火／風
  - `Target player moves back to the previous Fire sign and loses 3 Fate Points.`
  - 「目標玩家後退到上一個火象星座，並失去 3 命運點。」

**King 國王**
- 正位 Dominion 統御 —— 需要 Earth / Fire 土／火
  - `Move forward 3 spaces and become Shielded.`
  - 「前進 3 格，並獲得護盾。」
- 逆位 Tyranny 暴政 —— 需要 Water / Air 水／風
  - `Target player moves back 2 spaces and is Silenced next turn. All other players are Drained next turn.`
  - 「目標玩家後退 2 格並在下回合被封印；所有其他玩家下回合枯竭。」

### 9.3 大阿卡纳（角色卡，22 张）

- 发动技能 = 回合 ② 的行动（选项 C）：花 1 FP，按**当前朝向**结算；不能连续两个回合发动。
- 翻转朝向：回合 ③，花 1 FP。
- 每个角色的正逆位都围绕它的塔罗含义设计，技能名可以直接显示在界面上。

---

**0 · The Fool 愚者** —— 冒险与未知
- 正位 Leap of Faith 縱身一躍
  - `Roll the Fate Die and move forward that many spaces + 1.`
  - 「擲命運骰，前進點數 + 1 格。」
- 逆位 Wrong Turn 走錯路
  - `On the target player's next Move step, they move back 1 space instead of rolling.`
  - 「目標玩家下一次移動時不擲骰，改為後退 1 格。」

**1 · The Magician 魔術師** —— 手法与创造
- 正位 Conjure 變出
  - `Draw 2 cards. You may immediately play 1 Minor card without using your action.`
  - 「抽 2 張牌，並可立即額外打出 1 張小阿爾克那（不佔用行動）。」
- 逆位 Sleight of Hand 妙手
  - `Steal a random card from a target player. They are Silenced next turn.`
  - 「隨機偷取目標玩家 1 張手牌；對方下回合被封印。」

**2 · The High Priestess 女祭司** —— 直觉与隐秘
- 正位 Foresight 預知
  - `Look at the top 3 cards. Use the upright effect of one Minor card among them, add another to your hand, and gain 1 Fate Point.`
  - 「查看牌堆頂 3 張：發動其中 1 張小阿爾克那的正位效果，另取 1 張加入手牌，並獲得 1 命運點。」
  - 剩下那张放到牌堆底。
- 逆位 Veil 帷幕
  - `Look at a target player's hand and discard 2 cards of your choice from it. They are Drained next turn.`
  - 「查看目標玩家的手牌，選 2 張棄掉；對方下回合枯竭。」

**3 · The Empress 皇后** —— 丰饶与滋养
- 正位 Abundance 豐饒
  - `Gain 3 Fate Points and draw 2 cards.`
  - 「獲得 3 命運點，抽 2 張牌。」
- 逆位 Overgrowth 藤蔓纏身
  - `Target player is Rooted next turn and loses 1 Fate Point.`
  - 「目標玩家下回合定身，並失去 1 命運點。」

**4 · The Emperor 皇帝** —— 权威与秩序
- 正位 Command 號令
  - `Gain 2 Fate Points and become Shielded. Your Move roll this turn counts as 3.`
  - 「獲得 2 命運點與護盾；本回合移動點數視為 3。」
- 逆位 Decree 敕令
  - `All other players are Silenced next turn. The leading player among them is also Drained.`
  - 「所有其他玩家下回合被封印，其中的領先者同時枯竭。」

**5 · The Hierophant 教皇** —— 传统与庇护
- 正位 Blessing 祝福
  - `Remove all your statuses, gain 2 Fate Points, draw 1 card and become Shielded.`
  - 「清除自己身上所有狀態，獲得 2 命運點、抽 1 張牌，並獲得護盾。」
- 逆位 Penance 懺悔
  - `Target player moves back to the previous Earth sign.`
  - 「目標玩家後退到上一個土象星座。」

**6 · The Lovers 戀人** —— 结合与选择
- 正位 Slipstream 比翼
  - `Move to the space of the nearest player ahead of you (up to 5 spaces away), then 1 more space. If no one is that close, move forward 2 spaces.`
  - 「前進到前方 5 格內最近一名玩家所在的格子，再前進 1 格；若 5 格內沒有玩家，則前進 2 格。」
  - 设计来源：赛车游戏的尾流加速。
- 逆位 Heartbreak 拆散
  - `Choose two other players and swap their positions.`
  - 「選擇兩名其他玩家，交換他們的位置。」
  - 两人局改为：`Target player moves back 2 spaces.` / 「目標玩家後退 2 格。」

**7 · The Chariot 戰車** —— 意志与速度
- 正位 Full Speed 全速
  - `Move forward 3 spaces.`
  - 「前進 3 格。」
- 逆位 Ram 衝撞
  - `Target player moves back 2 spaces and is Slowed next turn.`
  - 「目標玩家後退 2 格，並在下回合遲緩。」

**8 · Strength 力量** —— 勇气与坚韧
- 正位 Courage 勇氣
  - `Move forward to the next Fire sign and become Shielded.`
  - 「前進到下一個火象星座，並獲得護盾。」
- 逆位 Intimidate 威嚇
  - `Target player is Stunned next turn and loses 1 Fate Point.`
  - 「目標玩家下回合失神，並失去 1 命運點。」

**9 · The Hermit 隱士** —— 独处与内省
- 正位 Retreat 獨修
  - `Gain 2 Fate Points, draw 2 cards and become Shielded.`
  - 「獲得 2 命運點、抽 2 張牌，並獲得護盾。」
- 逆位 Isolation 孤立
  - `Target player is Drained for their next 2 turns.`
  - 「目標玩家接下來 2 個回合枯竭。」

**10 · Wheel of Fortune 命運之輪** —— 运气与循环
- 正位 Fortune 好運
  - `Roll the Fate Die twice. Move forward the higher result and gain Fate Points equal to the lower result.`
  - 「擲命運骰兩次：按較高點數前進，並獲得等同較低點數的命運點。」
- 逆位 The Wheel Turns 天道輪轉（保留原版混乱玩法）
  - `Starting with you, every player reveals the top card of the deck and uses its reversed effect. Court cards are discarded.`
  - 「由你開始，每位玩家翻開牌堆頂 1 張牌並發動其逆位效果；宮廷牌直接棄掉。」
  - 每位玩家各自选目标（电脑自动选），所以场面会很乱，这正是这张牌的乐趣。

**11 · Justice 正義** —— 公平与裁决
- 正位 Equity 公平
  - `If you are not leading, move forward half the distance to the leading player (round up, max 5). If you are leading, gain 2 Fate Points.`
  - 「若你不是領先者，前進與領先者距離的一半（無條件進位，最多 5 格）；若你領先，獲得 2 命運點。」
  - 设计来源：赛车游戏的落后追赶机制。
- 逆位 Verdict 裁決
  - `The leading player other than you moves back 2 spaces and loses 1 Fate Point.`
  - 「除你以外的領先者後退 2 格，並失去 1 命運點。」
  - 设计来源：专打第一名的龟壳。

**12 · The Hanged Man 倒吊人** —— 牺牲与等待
- 正位 Sacrifice 犧牲
  - `Skip your Move step this turn. Gain 4 Fate Points, draw 2 cards and become Shielded.`
  - 「本回合不移動；獲得 4 命運點、抽 2 張牌，並獲得護盾。」
- 逆位 Suspend 倒懸
  - `Target player is Rooted and Drained next turn.`
  - 「目標玩家下回合定身並枯竭。」

**13 · Death 死神** —— 终结与新生
- 正位 Rebirth 重生
  - `Discard any number of cards, then draw until you have 5. Remove all your statuses and gain 1 Fate Point.`
  - 「棄掉任意張手牌，再抽到 5 張；清除自己身上所有狀態，並獲得 1 命運點。」
- 逆位 Reap 收割
  - `Target player loses 3 Fate Points and discards 1 random card.`
  - 「目標玩家失去 3 命運點，並隨機棄 1 張牌。」

**14 · Temperance 節制** —— 调和与节奏
- 正位 Flow 調和
  - `Move forward to the next Water sign and draw 1 card.`
  - 「前進到下一個水象星座，抽 1 張牌。」
- 逆位 Restraint 克制
  - `Target player is Slowed for their next 2 turns.`
  - 「目標玩家接下來 2 個回合遲緩。」

**15 · The Devil 惡魔** —— 诱惑与束缚
- 正位 Pact 契約
  - `Gain 5 Fate Points and move forward 1 space. You are Drained next turn.`
  - 「獲得 5 命運點並前進 1 格；你下回合枯竭。」
- 逆位 Chains 枷鎖
  - `Place a Chain Trap on any sign. The next other player who ends their Move step there is Rooted next turn and loses 2 Fate Points.`
  - 「在任意星座放置枷鎖陷阱：下一位在該格結束移動的其他玩家，下回合定身並失去 2 命運點。」

**16 · The Tower 高塔** —— 崩塌与突破
- 正位 Lightning Dash 雷霆突進
  - `Move forward 4 spaces, then discard your whole hand.`
  - 「前進 4 格，然後棄掉全部手牌。」
- 逆位 Collapse 崩塌
  - `Every player ahead of you moves back 2 spaces.`
  - 「所有領先於你的玩家後退 2 格。」
  - 落后时最强，领先时没用。

**17 · The Star 星星** —— 希望与复原
- 正位 Hope 希望
  - `Move forward to the next Water sign. If you have fewer than 3 Fate Points, restore them to 3.`
  - 「前進到下一個水象星座；若你的命運點少於 3，補回到 3。」
- 逆位 Falling Star 隕落
  - `Steal 2 Fate Points from a target player.`
  - 「從目標玩家身上偷取 2 命運點。」

**18 · The Moon 月亮** —— 幻象与夜路
- 正位 Night Walk 夜行
  - `Move forward 2 spaces and become Shielded. Traps do not affect you until your next turn.`
  - 「前進 2 格並獲得護盾；直到你下回合前，陷阱對你無效。」
- 逆位 Illusion 幻象
  - `Place an Illusion Trap on any sign. The next other player who ends their Move step there moves back 3 spaces.`
  - 「在任意星座放置幻象陷阱：下一位在該格結束移動的其他玩家後退 3 格。」

**19 · The Sun 太陽** —— 光明与活力
- 正位 Radiance 光輝
  - `Move forward 2 spaces and gain 2 Fate Points.`
  - 「前進 2 格，並獲得 2 命運點。」
- 逆位 Scorch 灼燒
  - `Target player loses 2 Fate Points and is Slowed next turn.`
  - 「目標玩家失去 2 命運點，並在下回合遲緩。」

**20 · Judgement 審判** —— 召唤与清算
- 正位 Calling 召喚
  - `Discard up to 4 cards. Move forward 1 space for each card discarded, then draw 1 card.`
  - 「棄掉最多 4 張手牌，每棄 1 張前進 1 格，然後抽 1 張牌。」
- 逆位 Reckoning 清算
  - `Pool all players' Fate Points and split them evenly; any remainder goes to you.`
  - 「把所有玩家的命運點合起來平分，餘數歸你。」

**21 · The World 世界** —— 圆满与终局
- 正位 Completion 圓滿
  - `Once per game: move forward to Pisces, the last sign before Aries.`
  - 「每局限一次：前進到雙魚座（白羊座前的最後一格）。」
  - 在最后一圈使用时，效果等于原卡面的「直接到终点再退 1 格」。
- 逆位 Standstill 靜止
  - `Once per game: all other players are Rooted next turn.`
  - 「每局限一次：所有其他玩家下回合定身。」
- 正位和逆位各算一次。

---

## 10. 平衡思路

**换算基准：1 格 ≈ 2 FP**（因为 2 FP 可以买 1 格）；1 张手牌 ≈ 0.5 格。

| 行动 | 目标强度 |
|---|---|
| 打 1 张小阿卡纳 | ≈ 1 格 |
| 宫廷牌组合（消耗 3 张牌） | ≈ 3–4 格，外加抽 1 张 |
| 发动角色技能（1 FP + 占用行动 + 冷却） | ≈ 2.5–3.5 格 |
| 冥想 | ≈ 1 格（保证每回合都有事可做） |

状态的估值：定身 ≈ 2 格，失神 ≈ 1.5 格，迟缓 / 封印 / 枯竭 / 护盾 ≈ 1 格。

**v1 → v3 的主要改动**（可以直接用在作品集「迭代」页）：

1. **确立「正位助己、逆位绊人」**：原卡面有很多正位其实是打别人（例如宝剑、魔术师、恶魔、月亮），逆位反而是给自己加命运点。现在每张牌的两面分工明确。
2. **一张牌定胜负的效果改掉了**：世界正位改为每局一次、只到本圈末尾；命运之轮正位改为自己掷两次骰；高塔改为「突进 / 崩塌」。
3. **加入赛车游戏式的机制**：尾流（恋人）、追赶（正义正位）、专打第一名（正义逆位、高塔逆位）、陷阱（恶魔、月亮）、护盾。
4. **命运点用途增加**：重掷、加速；上限 10（对应旧作品集「Fate Point Adjustments」）。
5. **随机性降低**：骰子只有 1–3、可以花命运点重掷；女祭司三选一（对应「Controlled Card Draws」「Strategic Buffs」）。
6. **先手优势消除**：有人到终点后打完这一轮再结算。
7. **方向不明的规则写清楚**：自己是前进，对手是后退。
8. **小阿卡纳四种花色对应四种资源**（移动、命运点、掷骰、手牌），规则更好记，也回应了试玩时「规则太复杂」的反馈。

---

## 11. 平衡验证与默认圈数

1. 写一个不带界面的模拟器，电脑对电脑，2 人、3 人、4 人局各跑 2000 局，分别测 1 / 2 / 3 圈。
2. **默认圈数：** 选 3 人局平均轮数最接近 8–12 轮的那个圈数。如果 1 圈太短、2 圈太长，可以调终点或命运骰，但要在报告里说明。
3. 检查以下指标：
   - 每张大阿卡纳的胜率：偏离平均值（1/人数）超过 ±7 个百分点就调整；
   - 各座位的胜率：应该接近平均；
   - **正位和逆位的使用比例**：两者都应该常用，任何一边超过 75% 都说明另一边太弱；
   - FP 撞到上限的频率：太高说明 FP 来得太容易；
   - 每张牌被打出的比例：太低说明太弱；
   - 陷阱的触发率：太低说明陷阱没用。
4. 调整顺序：先调大阿卡纳，再调宫廷牌，最后才动小阿卡纳。
5. 把模拟结果写成一份中文报告。如果改了数值，也同步改这份规则书。

---

## 12. 电脑对手（单一难度）

- 每回合枚举所有合法行动（每张牌的正位和逆位、能组成的宫廷组合、角色技能、冥想），按估值打分：
  - 自己前进 1 格 = 2 分；
  - 让对手后退 1 格 = 1.5 分（两人局 = 2 分），**优先针对领先者**；
  - 1 FP = 0.5 分，1 张牌 = 0.5 分；
  - 状态按第 10 节的估值换算（1 格 = 2 分）；
  - 自己领先时更看重正位和护盾，落后时更看重逆位。
- 翻转：下回合预计想用另一面技能、且 FP ≥ 3 时翻转。
- 陷阱：放在领先者前方 2 格（最可能停下的位置）。
- 移动阶段：骰到 1 且 FP ≥ 3 时重掷；离终点只差 1 格且 FP ≥ 2 时加速。

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
| Target player | 目標玩家 |
| Leading player | 領先者 |
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

- 卡图在 `D:\Tarot Game\卡牌成品\`，827 × 1417 像素（300 dpi）。卡背是 `背面.png`。
- **卡面上印的是旧效果文字，而且只有英文。** 界面要裁掉上下两条文字区（大约 y < 150 和 y > 1270），新效果按当前语言用文字叠加：下方是正位，上方倒置显示逆位，保持原来的卡面设计。卡名条（图中的 THE FOOL 等）也是印上去的英文，切到繁中时在旁边或下方加繁中卡名。
- 星盘配色按元素：火红、土黄、风绿、水蓝（水瓶座用绿色）。
- 语言切换要覆盖所有界面文字、卡牌效果、状态名、日志；默认英文。
