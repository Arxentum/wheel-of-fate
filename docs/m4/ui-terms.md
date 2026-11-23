# 界面用词对照（EN / 繁中）

> 由 `npm run terms` 从 `src/i18n/*.json` 生成，不要手改；改字典后重新生成。
> 卡牌效果、卡名、星座名、元素名来自规则书 v5，不在这里列出。`{n|单数|复数}` 是英文的单复数写法。

## 1. 规则书里没有、自拟的界面词（D-47）

| 键 | EN | 繁中 | 用在哪里 |
|---|---|---|---|
| `status.trapImmune` | Trap Immune | 陷阱免疫 | 月亮正位「夜行」给的状态，规则书只写效果没起名 |
| `game.finalRound` | Final round | 最後一輪 | 有人到终点后进入的最后一轮 |
| `game.finished` | Finished | 已到終點 | 棋子到达终点后的标签 |
| `game.skillReady` | Ready | 可用 | 玩家面板上角色技能的状态（世界用过后显示「已用」） |
| `game.skillCooldown` | Cooldown | 冷卻中 | 〃 |
| `game.skillUsed` | Used | 已用 | 〃 |
| `game.currentSide` | In play | 目前朝向 | 角色卡目前朝上的一面 |
| `step.short.end` | End | 結束 | 六步指示里「结束回合」的缩写 |
| `decide.keep` | Keep {side} | 保持{side} | 翻转步骤的两个按钮 |
| `decide.flipTo` | Flip to {side} · {n} FP | 翻到{side} · {n} 命運點 | 〃 |
| `decide.foresightUse` | Use | 發動 | 女祭司正位「预知」：发动哪张、收下哪张 |
| `decide.foresightTake` | Take | 收下 | 〃 |
| `decide.conjureDone` | Finish | 結束 | 魔术师正位「变出」打完额外的牌 |
| `fpReason.lap` | lap bonus | 過圈獎勵 | 日志里命运点变化的原因 |
| `fpReason.trapBounty` | trap sprung | 陷阱觸發 | 〃 |
| `fpReason.card` | card effect | 卡牌效果 | 〃 |
| `fpReason.steal` | stolen | 偷取 | 〃 |
| `setup.off` | Off | 不玩 | 开始画面 |
| `setup.advanced` | Advanced | 進階 | 〃 |
| `setup.seed` | Seed | 種子 | 〃 |
| `game.speed` | Speed | 速度 | 电脑回合的回放控制 |
| `game.skip` | Skip ▸▸ | 跳過 ▸▸ | 〃 |
| `handoff.title` | Pass to {player} | 請交給{player} | 热座交接画面 |
| `handoff.ready` | I'm {player}: show my hand | 我是{player}，顯示我的手牌 | 〃 |
| `game.log` | Log | 記錄 | 游戏画面 |
| `game.turnCard` | Turn the card over | 把卡轉過來看 | 〃 |
| `nav.rules` | How to Play | 玩法說明 | M4：页面名称；游戏中打开规则时的提示 |
| `nav.cards` | Cards | 卡牌圖鑑 | 〃 |
| `game.paused` | Game paused | 遊戲暫停中 | 〃 |
| `rules.quick.title` | The game in 30 seconds | 三十秒看懂 | M4：玩法说明的第一节 |
| `rules.status.good` | Good | 增益 | M4：状态的分类标签 |
| `rules.status.bad` | Negative | 負面 | 〃 |
| `gallery.character` | Character | 角色卡 | M4：卡牌图鉴里卡下方的标签 |
| `gallery.differs2p` | Changes with 2 players | 兩人局寫法不同 | 〃 |

## 2. 全部界面文字

### 页面与导航（12）

| 键 | EN | 繁中 |
|---|---|---|
| `app.title` | Wheel of Fate | 命運之輪 |
| `app.tagline` | Upright to boost yourself. Reversed to trip the players ahead. | 正位助己，逆位絆住前方。 |
| `lang.label` | Language | 語言 |
| `lang.en` | English | English |
| `lang.zh-Hant` | 繁體中文 | 繁體中文 |
| `nav.label` | Main menu | 主選單 |
| `nav.play` | Play | 遊戲 |
| `nav.rules` | How to Play | 玩法說明 |
| `nav.cards` | Cards | 卡牌圖鑑 |
| `small.title` | Best on a bigger screen | 建議使用較大的螢幕 |
| `small.text` | Wheel of Fate is made for laptops and for tablets held sideways. Turn your tablet, or open the game on a computer. | 命運之輪是為筆電和橫放的平板設計的。請把平板轉成橫向，或用電腦開啟。 |
| `small.continue` | Continue anyway | 仍要繼續 |

### 开始画面（18）

| 键 | EN | 繁中 |
|---|---|---|
| `setup.fact.players` | 2–4 players, any mix of people and computer players on one screen. | 2–4 人，真人和電腦可以任意搭配，在同一個螢幕上輪流玩。 |
| `setup.fact.time` | About 10 rounds with 3 players and 3 laps. | 3 人 3 圈大約 10 輪。 |
| `setup.fact.characters` | Everyone gets a random character card, upright or reversed. | 每人隨機獲得一張角色卡，正位或逆位隨機。 |
| `setup.players` | Players | 玩家 |
| `setup.playersHint` | Choose who sits at each element. Turn order is Fire, Earth, Air, Water. | 選擇每個元素由誰來玩。行動順序是火、土、風、水。 |
| `setup.human` | Player | 玩家 |
| `setup.computer` | Computer | 電腦 |
| `setup.off` | Off | 不玩 |
| `setup.needPlayers` | A game needs 2 to 4 players. | 一局需要 2 到 4 名玩家。 |
| `setup.laps` | Laps to win | 勝利圈數 |
| `setup.lapCount` | {n\|lap\|laps} | {n} 圈 |
| `setup.lapsHint` | 3 laps is the standard game. | 標準是 3 圈。 |
| `setup.advanced` | Advanced | 進階 |
| `setup.seed` | Seed | 種子 |
| `setup.seedPlaceholder` | random | 隨機 |
| `setup.seedHint` | The same seed and players give the same shuffle and rolls. | 相同的種子和玩家設定，會得到相同的洗牌和骰子結果。 |
| `setup.start` | Start game | 開始遊戲 |
| `setup.orderHint` | The first player moves on by one seat every round. | 每一輪的先手會輪到下一位。 |

### 游戏画面（70）

| 键 | EN | 繁中 |
|---|---|---|
| `trap.chain` | Chain Trap | 枷鎖陷阱 |
| `trap.illusion` | Illusion Trap | 幻象陷阱 |
| `board.label` | Zodiac board | 星盤 |
| `board.start` | Start | 起點 |
| `board.signLabel` | {sign}, {element} | {sign}，{element} |
| `piece.label` | {element} piece | {element}棋子 |
| `trap.label` | {trap} on {sign} | {sign}：{trap} |
| `step.draw` | Draw | 抽牌 |
| `step.play` | Play | 行動 |
| `step.flip` | Flip | 翻轉 |
| `step.move` | Move | 移動 |
| `step.resolve` | Resolve | 結算 |
| `step.end` | End Turn | 結束回合 |
| `list.sep` | ,  | 、 |
| `side.upright` | upright | 正位 |
| `side.reversed` | reversed | 逆位 |
| `player.fire` | Fire | 火象 |
| `player.earth` | Earth | 土象 |
| `player.air` | Air | 風象 |
| `player.water` | Water | 水象 |
| `tag.you` | You | 你 |
| `tag.human` | Player | 玩家 |
| `tag.computer` | Computer | 電腦 |
| `game.round` | Round {n} | 第 {n} 輪 |
| `game.goal` | {laps\|lap\|laps} to win | 跑完 {laps} 圈獲勝 |
| `game.finalRound` | Final round | 最後一輪 |
| `game.speed` | Speed | 速度 |
| `game.skip` | Skip ▸▸ | 跳過 ▸▸ |
| `game.skipTitle` | Skip the animations and the computer turns until your next decision. | 跳過動畫和電腦的回合，直到你下一次要做決定。 |
| `game.newGame` | New game | 新遊戲 |
| `game.confirmLeave` | Leave this game? | 離開這一局？ |
| `game.firstPlayer` | First player this round | 本輪先手 |
| `game.firstShort` | First | 先手 |
| `game.chooseThis` | Target | 選擇 |
| `game.finished` | Finished | 已到終點 |
| `game.lap` | Lap {lap}/{laps} | 第 {lap}/{laps} 圈 |
| `game.fp` | FP | 命運點 |
| `game.fpTitle` | Fate Points (at most 10) | 命運點（最多 10） |
| `game.cards` | {n\|card\|cards} | {n} 張 |
| `game.handTitle` | Cards in hand | 手牌數 |
| `game.viewCard` | View card | 查看卡牌 |
| `game.skillReady` | Ready | 可用 |
| `game.skillCooldown` | Cooldown | 冷卻中 |
| `game.skillUsed` | Used | 已用 |
| `game.statusNext` | next turn | 下回合 |
| `game.steps` | Turn steps | 回合步驟 |
| `game.turnOf` | {player}'s turn | {player}的回合 |
| `game.decision` | Your decision | 你的決定 |
| `game.overShort` | The game is over. | 遊戲結束。 |
| `game.waitingFor` | Waiting for {player}… | 等待{player}… |
| `game.computerPlaying` | {player} is playing… | {player}正在行動… |
| `game.playing` | Playing… | 進行中… |
| `game.log` | Log | 記錄 |
| `game.hand` | Hand | 手牌 |
| `game.yourHand` | Hand · {player} | 手牌 · {player} |
| `game.handHidden` | Hand hidden | 手牌已隱藏 |
| `game.handHiddenHint` | Hands stay hidden until the next player takes the device. | 下一位玩家接手前，手牌保持隱藏。 |
| `game.noCards` | No cards in hand. | 沒有手牌。 |
| `game.deck` | Deck | 牌堆 |
| `game.discard` | Discard ({n}) | 棄牌（{n}） |
| `game.dice` | Fate Die | 命運骰 |
| `game.characterOf` | {player}'s character | {player}的角色 |
| `game.currentSide` | In play | 目前朝向 |
| `game.turnCard` | Turn the card over | 把卡轉過來看 |
| `step.short.end` | End | 結束 |
| `sideLabel.upright` | Upright | 正位 |
| `sideLabel.reversed` | Reversed | 逆位 |
| `game.rules` | Rules | 規則 |
| `game.rulesTitle` | How to play and all the cards. The game waits while this is open. | 玩法說明和全部卡牌。打開時遊戲會暫停。 |
| `game.paused` | Game paused | 遊戲暫停中 |

### 状态（16）

| 键 | EN | 繁中 |
|---|---|---|
| `status.slowed` | Slowed | 遲緩 |
| `status.slowed.desc` | Your Move step goes exactly 1 space: no roll, reroll or boost. | 移動步只走 1 格：不擲骰，不能重擲和加速。 |
| `status.silenced` | Silenced | 封印 |
| `status.silenced.desc` | You cannot play cards (no Minor card, no court combo). | 不能出牌（不能打小阿爾克那和宮廷牌）。 |
| `status.drained` | Drained | 枯竭 |
| `status.drained.desc` | You cannot spend Fate Points; you still gain them. | 不能花命運點；獲得照常。 |
| `status.stunned` | Stunned | 失神 |
| `status.stunned.desc` | You skip Play and Flip: you only draw and move. | 跳過行動和翻轉，只抽牌和移動。 |
| `status.rooted` | Rooted | 定身 |
| `status.rooted.desc` | You skip your Move step. Card effects still move you. | 跳過移動步；卡牌效果造成的位移照常。 |
| `status.wrongTurn` | Wrong Turn | 走錯路 |
| `status.wrongTurn.desc` | Your next Move step goes back {n\|space\|spaces} instead of rolling. | 下一次移動步不擲骰，改為後退 {n} 格。 |
| `status.shielded` | Shielded | 護盾 |
| `status.shielded.desc` | Blocks the next reversed effect or trap. If it blocks nothing, it ends after your next turn and gives back 1 Fate Point. | 擋下下一個逆位效果或陷阱；沒用到的話，在你下一個回合結束時消失並返還 1 命運點。 |
| `status.trapImmune` | Trap Immune | 陷阱免疫 |
| `status.trapImmune.desc` | Traps do not affect you until your next turn. | 直到你下回合前，陷阱對你無效。 |

### 决定面板（38）

| 键 | EN | 繁中 |
|---|---|---|
| `decide.chooseAction` | Your turn: choose one action. | 輪到你了：選擇一個行動。 |
| `decide.playCard` | Play a card | 打出卡牌 |
| `decide.playCardHint` | Click a card in your hand to see both sides and play it. | 點手牌查看正逆兩面，再打出。 |
| `decide.skill` | Skill: {face} | 技能：{face} |
| `decide.cost` | {n} FP | {n} 命運點 |
| `decide.useSkill` | Use skill | 發動技能 |
| `decide.meditate` | Meditate | 冥想 |
| `decide.meditateText` | Draw {draw\|card\|cards} and gain {fp\|Fate Point\|Fate Points}. | 抽 {draw} 張牌，獲得 {fp} 命運點。 |
| `decide.conjure` | Conjure: you may play {n\|more Minor card\|more Minor cards}. | 變出：你還可以額外打出 {n} 張小阿爾克那。 |
| `decide.conjureHint` | Click a Minor card in your hand, or finish. | 點選手上的小阿爾克那，或結束。 |
| `decide.conjureDone` | Finish | 結束 |
| `decide.foresight` | Foresight: use the upright effect of one Minor card, and take another card. | 預知：發動其中 1 張小阿爾克那的正位效果，另取 1 張加入手牌。 |
| `decide.foresightUse` | Use | 發動 |
| `decide.foresightTake` | Take | 收下 |
| `decide.veil` | Veil: look at {player}'s hand and choose {n\|card\|cards} to discard. | 帷幕：查看{player}的手牌，選 {n} 張棄掉。 |
| `decide.flip` | Flip {card} for the next turns? | 要翻轉{card}嗎？會影響之後的回合。 |
| `decide.keep` | Keep {side} | 保持{side} |
| `decide.flipTo` | Flip to {side} · {n} FP | 翻到{side} · {n} 命運點 |
| `decide.rolled` | You rolled {value}. | 你擲出 {value}。 |
| `decide.boosted` | Boost: +1. | 加速：+1。 |
| `decide.move` | Move {n\|space\|spaces} | 前進 {n} 格 |
| `decide.reroll` | Reroll · {n} FP | 重擲 · {n} 命運點 |
| `decide.boost` | Boost +1 · {n} FP | 加速 +1 · {n} 命運點 |
| `decide.discardToLimit` | Too many cards: discard {n} down to {limit}. | 手牌太多：棄掉 {n} 張，回到 {limit} 張。 |
| `decide.selectInHand` | Selected {n} of {total} in your hand. | 已在手牌中選了 {n}/{total} 張。 |
| `decide.selectExactly` | Select exactly {n\|card\|cards}. | 請剛好選 {n} 張。 |
| `decide.discard` | Discard | 棄掉 |
| `decide.target` | Choose the target: | 選擇目標： |
| `decide.pickSign` | Choose a sign on the board (dashed outline). | 在星盤上選擇一個星座（虛線框）。 |
| `decide.selectDiscard` | Select the cards to discard in your hand: {n} selected. | 在手牌中選要棄掉的牌：已選 {n} 張。 |
| `decide.useWithDiscard` | Use skill · discard {n} | 發動技能 · 棄 {n} 張 |
| `decide.cancel` | Cancel | 取消 |
| `decide.close` | Close | 關閉 |
| `decide.confirm` | Confirm | 確認 |
| `decide.playSide` | Play {side} | 打出{side} |
| `decide.pickFuel` | Play with: | 搭配： |
| `decide.resonance` | Resonance: +{n} FP on this sign | 共鳴：在這個星座打出 +{n} 命運點 |
| `decide.handDiscardHint` | Click cards to select them. | 點選要棄掉的牌。 |

### 置灰原因（21）

| 键 | EN | 繁中 |
|---|---|---|
| `reason.noDecision` | Not your decision now. | 現在不是你的決定。 |
| `reason.wrongDecision` | Not possible now. | 現在不能這樣做。 |
| `reason.notInHand` | That card is not in your hand. | 這張牌不在你手上。 |
| `reason.notMinor` | Only Minor cards can be played this way. | 只能這樣打出小阿爾克那。 |
| `reason.notCourt` | Not a court card. | 這不是宮廷牌。 |
| `reason.silenced` | You are Silenced: no cards this turn. | 你被封印了：這回合不能出牌。 |
| `reason.drained` | You are Drained: you cannot spend Fate Points. | 你枯竭了：不能花命運點。 |
| `reason.notEnoughFp` | Not enough Fate Points. | 命運點不夠。 |
| `reason.cooldown` | You used your skill last turn. It is ready next turn. | 你上個回合用過技能，下回合才能再用。 |
| `reason.onceUsed` | This face is once per game and already used. | 這一面每局限一次，已經用過。 |
| `reason.onPisces` | You are already on Pisces. | 你已經在雙魚座。 |
| `reason.noTarget` | No player is ahead of you. | 沒有人領先於你。 |
| `reason.invalidTarget` | You cannot target that player. | 不能選這名玩家。 |
| `reason.needFuel` | Needs two Minor cards of the elements shown. | 需要 2 張所示元素的小阿爾克那。 |
| `reason.invalidFuel` | Needs two other Minor cards from your hand. | 需要手上另外 2 張小阿爾克那。 |
| `reason.trapThere` | There is already a trap on that sign. | 這個星座已經有陷阱。 |
| `reason.invalidSign` | A trap must go 1–{reach} signs in front of a player ahead of you. | 陷阱要放在領先於你的玩家前方 1–{reach} 格。 |
| `reason.invalidChoice` | Not a valid choice. | 這個選擇無效。 |
| `reason.cannotReroll` | No reroll: one per turn, not after a boost, and it costs {n\|Fate Point\|Fate Points}. | 不能重擲：每回合一次、加速後不能重擲，且要 {n} 命運點。 |
| `reason.cannotBoost` | No boost: one per turn, and it costs {n\|Fate Point\|Fate Points}. | 不能加速：每回合一次，且要 {n} 命運點。 |
| `reason.cannotFlip` | Flipping costs {n\|Fate Point\|Fate Points}. | 翻轉要花 {n} 命運點。 |

### 命运点变化原因（日志）（14）

| 键 | EN | 繁中 |
|---|---|---|
| `fpReason.resonance` | Resonance | 共鳴 |
| `fpReason.element` | Element Bonus | 元素加成 |
| `fpReason.lap` | lap bonus | 過圈獎勵 |
| `fpReason.meditate` | Meditate | 冥想 |
| `fpReason.card` | card effect | 卡牌效果 |
| `fpReason.steal` | stolen | 偷取 |
| `fpReason.trap` | trap | 陷阱 |
| `fpReason.reroll` | reroll | 重擲 |
| `fpReason.boost` | boost | 加速 |
| `fpReason.flip` | flip | 翻轉 |
| `fpReason.skill` | skill | 技能 |
| `fpReason.reckoning` | Reckoning | 清算 |
| `fpReason.shieldRefund` | Shield refund | 護盾返還 |
| `fpReason.trapBounty` | trap sprung | 陷阱觸發 |

### 事件日志（56）

| 键 | EN | 繁中 |
|---|---|---|
| `log.gameStart` | New game: {laps\|lap\|laps} to win. Turn order: {order}. | 新遊戲：跑完 {laps} 圈獲勝。行動順序：{order}。 |
| `log.turnHeading` | Round {round} · {player} | 第 {round} 輪 · {player} |
| `log.draw` | {player} draws {n\|card\|cards}. | {player}抽 {n} 張牌。 |
| `log.reshuffle` | The discard pile becomes the new deck ({n} cards). | 棄牌堆洗成新的牌堆（{n} 張）。 |
| `log.actionSkipped` | {player} is Stunned and skips Play and Flip. | {player}失神，跳過行動和翻轉。 |
| `log.play.minor` | {player} plays {card} {side}: {face}. | {player}打出{card}{side}：{face}。 |
| `log.play.court` | {player} plays {card} {side} with {fuel}: {face}. | {player}用{fuel}打出{card}{side}：{face}。 |
| `log.play.skill` | {player} uses {card} {side}: {face}. | {player}發動{card}{side}：{face}。 |
| `log.play.skillTarget` | {player} uses {card} {side} on {target}: {face}. | {player}對{target}發動{card}{side}：{face}。 |
| `log.play.meditate` | {player} meditates. | {player}冥想。 |
| `log.play.conjure` | {player} plays an extra {card} {side}: {face}. | {player}額外打出{card}{side}：{face}。 |
| `log.play.foresight` | {player} uses {card} {side} from the top of the deck: {face}. | {player}發動牌堆頂的{card}{side}：{face}。 |
| `log.play.wheel` | {player} reveals {card} {side}: {face}. | {player}翻開{card}{side}：{face}。 |
| `log.move.forward` | {player} moves forward {n\|space\|spaces}: {from} → {to}. | {player}前進 {n} 格：{from} → {to}。 |
| `log.move.back` | {player} moves back {n\|space\|spaces}: {from} → {to}. | {player}後退 {n} 格：{from} → {to}。 |
| `log.move.wrongTurn` | {player} takes a wrong turn and moves back {n\|space\|spaces}: {from} → {to}. | {player}走錯路，後退 {n} 格：{from} → {to}。 |
| `log.move.swap` | {player} swaps places: {from} → {to}. | {player}交換位置：{from} → {to}。 |
| `log.fp.gain` | {player} +{n} FP ({reason}). | {player} +{n} 命運點（{reason}）。 |
| `log.fp.gainCapped` | {player} +{n} FP ({reason}); {lost} over the limit of 10 is lost. | {player} +{n} 命運點（{reason}），超過上限 10 的 {lost} 點作廢。 |
| `log.fp.lose` | {player} −{n} FP ({reason}). | {player} −{n} 命運點（{reason}）。 |
| `log.discard.random` | {player} discards {cards} at random. | {player}隨機棄掉{cards}。 |
| `log.discard.chosen` | {player} discards {cards}. | {player}棄掉{cards}。 |
| `log.discard.limit` | {player} discards {cards} down to the hand limit. | {player}棄掉{cards}，回到手牌上限。 |
| `log.discard.whole` | {player} discards the whole hand: {cards}. | {player}棄掉全部手牌：{cards}。 |
| `log.steal.fp` | {to} steals {n\|Fate Point\|Fate Points} from {from}. | {to}從{from}身上偷取 {n} 命運點。 |
| `log.steal.card` | {to} steals {n\|card\|cards} from {from}. | {to}從{from}手上偷走 {n} 張牌。 |
| `log.status.next` | {player} will be {status} next turn. | {player}下回合{status}。 |
| `log.status.turns` | {player} will be {status} for {n} turns. | {player}接下來 {n} 個回合{status}。 |
| `log.status.shield` | {player} is Shielded. | {player}獲得護盾。 |
| `log.status.wrongTurn` | {player} will take a Wrong Turn on their next move. | {player}下一次移動會走錯路。 |
| `log.statusCleared` | {player}'s negative statuses are removed. | {player}的負面狀態被清除。 |
| `log.shieldBlock` | {player}'s shield blocks the effect. | {player}的護盾擋下了效果。 |
| `log.shieldExpire` | {player}'s shield runs out. | {player}的護盾消失了。 |
| `log.finishSafe` | {player} is past the finish and is not affected. | {player}已過終點，不受影響。 |
| `log.swapFailed` | The swap does not happen. | 交換沒有發生。 |
| `log.trapPlace` | {player} places a trap on {sign}: {trap}. | {player}在{sign}放置{trap}。 |
| `log.trapExpire` | The oldest trap disappears ({trap} on {sign}). | 最早的陷阱消失了（{sign}的{trap}）。 |
| `log.trapTrigger` | {player} springs the {trap} on {sign}! | {player}觸發了{sign}的{trap}！ |
| `log.trapBlocked` | {player} springs the {trap} on {sign}, but the shield blocks it. | {player}觸發了{sign}的{trap}，但被護盾擋下。 |
| `log.trapIgnored` | {player} passes the {trap} on {sign} safely. | {player}安全經過{sign}的{trap}。 |
| `log.flip` | {player} flips {card} to {side}. | {player}把{card}翻到{side}。 |
| `log.roll.normal` | {player} rolls {value}. | {player}擲出 {value}。 |
| `log.roll.reroll` | {player} rerolls: {value}. | {player}重擲：{value}。 |
| `log.roll.advantage` | {player} rolls {dice} and keeps {value}. | {player}擲出 {dice}，取 {value}。 |
| `log.roll.fixed` | {player}'s roll counts as {value}. | {player}的移動點數視為 {value}。 |
| `log.roll.slowed` | {player} is Slowed and moves 1 space. | {player}遲緩，只走 1 格。 |
| `log.effectRoll` | {player} rolls {dice}. | {player}擲出 {dice}。 |
| `log.boost` | {player} boosts: +1 space. | {player}加速：+1 格。 |
| `log.moveSkipped.rooted` | {player} is Rooted and does not move. | {player}定身，不移動。 |
| `log.moveSkipped.hangedMan` | {player} does not move this turn. | {player}本回合不移動。 |
| `log.lap` | {player} completes lap {lap}. | {player}跑完第 {lap} 圈。 |
| `log.finalRound` | {player} reached the finish. This is the final round! | {player}到達終點，這是最後一輪！ |
| `log.reveal` | {player} reveals {card}. | {player}翻開{card}。 |
| `log.look` | {player} looks at {n\|card\|cards}. | {player}查看 {n} 張牌。 |
| `log.take` | {player} adds a card to their hand. | {player}把 1 張牌加入手牌。 |
| `log.gameOver` | Game over. Winner: {winners}. | 遊戲結束。勝者：{winners}。 |

### 热座与结算（14）

| 键 | EN | 繁中 |
|---|---|---|
| `handoff.title` | Pass to {player} | 請交給{player} |
| `handoff.text` | Hands stay hidden until the next player is ready. | 在下一位玩家準備好之前，手牌會保持隱藏。 |
| `handoff.ready` | I'm {player}: show my hand | 我是{player}，顯示我的手牌 |
| `over.title` | Game over | 遊戲結束 |
| `over.winner` | {player} wins! | {player}獲勝！ |
| `over.winners` | Shared win: {players} | 共同獲勝：{players} |
| `over.progress` | {n}/{finish} spaces | {n}/{finish} 格 |
| `over.fp` | {n} FP | {n} 命運點 |
| `over.meta` | {rounds\|round\|rounds} · seed {seed} | {rounds} 輪 · 種子 {seed} |
| `over.again` | Play again | 再玩一局 |
| `over.new` | New game | 新遊戲 |
| `over.board` | See the board | 查看星盤 |
| `over.show` | Results | 結果 |
| `handoff.leave` | Leave this game | 離開這一局 |

### 玩法说明页（112）

| 键 | EN | 繁中 |
|---|---|---|
| `rules.title` | How to Play | 玩法說明 |
| `rules.intro` | A race round the zodiac for 2–4 players. Everything you need for your first game is on this page. | 2–4 人沿著星盤賽跑。第一次玩需要知道的，都在這一頁。 |
| `rules.toc` | On this page | 本頁內容 |
| `rules.quick.title` | The game in 30 seconds | 三十秒看懂 |
| `rules.quick.race.title` | Race round the wheel | 繞著星盤賽跑 |
| `rules.quick.race.text` | Everyone starts on Aries and runs clockwise round the 12 signs. Once someone completes {laps\|lap\|laps}, the round is played out and whoever has gone furthest wins. | 所有人從白羊座出發，沿順時針繞 12 個星座。有人跑完 {laps} 圈後打完這一輪，跑得最遠的人獲勝。 |
| `rules.quick.turn.title` | One action a turn | 每回合一個行動 |
| `rules.quick.turn.text` | Draw a card, then play a card, use your character or meditate. Then roll the Fate Die and move 1–3 spaces. | 抽一張牌，然後出牌、發動角色技能或冥想，再擲命運骰前進 1–3 格。 |
| `rules.quick.sides.title` | Upright or reversed | 正位還是逆位 |
| `rules.quick.sides.text` | Upright effects boost you. Reversed effects trip the players ahead of you, so whoever falls behind can strike back. | 正位效果幫自己，逆位效果絆住領先於你的玩家：落後的人也有辦法反擊。 |
| `rules.board.title` | The board | 星盤 |
| `rules.board.p1` | The board is a ring of 12 zodiac signs. Clockwise is forward, starting from Aries. The four elements take turns, so each element comes back every 4 signs. | 星盤是 12 個星座圍成的環，順時針是前進方向，從白羊座開始。四種元素輪流出現，每隔 4 格回到同一種元素。 |
| `rules.board.p2` | Your piece’s element sets your place in the turn order. After moving, end your turn on a sign of your element to gain {n\|Fate Point\|Fate Points} (Element Bonus). | 棋子的元素決定你的行動順序。移動後停在與你同元素的星座，獲得 {n} 命運點（元素加成）。 |
| `rules.board.signs` | {element} signs | {element}星座 |
| `rules.board.aheadTitle` | Who is ahead? | 誰領先？ |
| `rules.board.ahead` | Players ahead of you: everyone who has gone further than you, laps included. A player you have lapped is behind you. | 領先於你的玩家：跑得比你遠的玩家，圈數也算。被你套圈的人在你後面。 |
| `rules.board.leader` | The leading player: whoever has gone furthest. Tied players all count as leading. | 領先者：跑得最遠的玩家；並列時都算領先者。 |
| `rules.setup.title` | Setting up | 開局 |
| `rules.setup.pieces` | Every piece starts on Aries. | 所有棋子放在白羊座。 |
| `rules.setup.character` | Each player gets a random character (a Major Arcana card), upright or reversed at random, face up for everyone to see. | 每人隨機得到一張角色卡（大阿爾克那），正位或逆位隨機決定，公開放置。 |
| `rules.setup.start` | Everyone starts with {fp\|Fate Point\|Fate Points} and {cards\|card\|cards} in hand. | 每人起始 {fp} 命運點、{cards} 張手牌。 |
| `rules.setup.laps` | Choose 1, 2 or 3 laps. The standard game is 3. | 選擇 1、2 或 3 圈，標準是 3 圈。 |
| `rules.order.title` | Turn order | 行動順序 |
| `rules.order.p1` | Players act in element order: Fire, Earth, Air, Water. Empty seats are skipped. | 按元素順序行動：火、土、風、水；空位跳過。 |
| `rules.order.p2` | The first player moves on one seat every round, so everyone takes turns acting last. In a 2-player game the same player sometimes acts twice in a row (last in one round, first in the next). That is normal. | 每一輪先手往下傳一位，讓每個人輪流當最後行動的人。兩人局有時同一人會連續行動兩次（上一輪最後、下一輪最先），這是正常的。 |
| `rules.turn.title` | Your turn | 你的回合 |
| `rules.turn.intro` | Every turn has six steps. | 每個回合有六個步驟。 |
| `rules.turn.draw` | Draw {n\|card\|cards} ({empty} if your hand is empty). | 抽 {n} 張牌；手牌為空時改抽 {empty} 張。 |
| `rules.turn.play` | Choose one of four actions. You cannot pass. | 四選一，不能空過。 |
| `rules.turn.play.a.title` | Play a Minor card | 打出小阿爾克那 |
| `rules.turn.play.a` | Play one card, upright or reversed as you choose. If its element matches the sign you are on, gain {n\|more Fate Point\|more Fate Points} (Resonance). | 打出 1 張，自己選正位或逆位。牌的元素和你所在的星座相同時，額外獲得 {n} 命運點（共鳴）。 |
| `rules.turn.play.b.title` | Court combo | 宮廷牌組合 |
| `rules.turn.play.b` | Play a court card with 2 Minor cards of the elements it asks for. Draw {n\|card\|cards} afterwards. No Resonance. | 宮廷牌加 2 張符合元素要求的小阿爾克那一起打出，結算後抽 {n} 張。不觸發共鳴。 |
| `rules.turn.play.c.title` | Character skill | 發動角色技能 |
| `rules.turn.play.c` | Use the side of your character that is face up, for {n\|Fate Point\|Fate Points}. Not if you used it on your previous turn. | 按角色卡目前朝上的一面結算，花 {n} 命運點。上一個自己的回合用過就不能用。 |
| `rules.turn.play.d.title` | Meditate | 冥想 |
| `rules.turn.play.d` | Draw {cards\|card\|cards} and gain {fp\|Fate Point\|Fate Points}. | 抽 {cards} 張牌，獲得 {fp} 命運點。 |
| `rules.turn.optional` | Optional | 可選 |
| `rules.turn.flip` | Pay {n\|Fate Point\|Fate Points} to turn your character over, at most once a turn. You can use the new side from your next turn. | 花 {n} 命運點把角色卡翻面，每回合最多一次。翻過來的那一面從下個回合起可以使用。 |
| `rules.turn.move` | Roll the Fate Die and move forward 1, 2 or 3 spaces. You may reroll once for {reroll\|Fate Point\|Fate Points} and boost +1 space once for {boost\|Fate Point\|Fate Points}; after a boost you cannot reroll. Passing or stopping on a trap springs it. | 擲命運骰前進 1、2 或 3 格。可以花 {reroll} 命運點重擲一次，也可以花 {boost} 命運點加速 +1 格（每回合一次）；加速後不能再重擲。經過或停在陷阱上會觸發陷阱。 |
| `rules.turn.resolve` | Element Bonus: if you moved this turn and stopped on a sign of your element, gain {eb\|Fate Point\|Fate Points}. Each new lap you reach gives {lap\|Fate Point\|Fate Points}, only once per lap even if you are pushed back and pass it again. | 元素加成：這回合有移動並停在自己元素的星座，獲得 {eb} 命運點。每到達新的一圈獲得 {lap} 命運點；被推回再過同一圈不重複給。 |
| `rules.turn.end` | If you hold more than {n} cards, discard down to {n} (your choice). Statuses that have run their course end, and the next player goes. | 手牌超過 {n} 張就棄到 {n} 張（自己選）；清除已生效完的狀態，輪到下一位。 |
| `rules.sides.title` | Upright and reversed | 正位與逆位 |
| `rules.sides.intro` | Every card has two sides, and choosing one is the key decision of each turn: boost yourself, or hold back the players in front? | 每張牌都有兩面，選哪一面是每回合的關鍵抉擇：用來衝自己，還是用來攔前面的人？ |
| `rules.sides.up.title` | Upright: boost yourself | 正位：幫自己 |
| `rules.sides.up` | Only helps you: move forward, Fate Points, cards, shields, better rolls. | 只給自己增益：前進、命運點、抽牌、護盾、更好的擲骰。 |
| `rules.sides.down.title` | Reversed: trip the players ahead | 逆位：絆住前方 |
| `rules.sides.down` | Only hits players ahead of you: they move back, move less, lose Fate Points, get negative statuses or run into traps. | 只對領先於你的玩家使絆子：後退、少走、扣命運點、負面狀態、陷阱。 |
| `rules.sides.r1` | Minor and court cards played reversed hit every player ahead of you. There is no target to choose. | 小阿爾克那和宮廷牌的逆位作用於所有領先於你的玩家，不用選目標。 |
| `rules.sides.r2` | A character’s reversed skill hits one player ahead of you, chosen by you. The Tower and the World hit every player ahead of you; the Devil and the Moon place a trap. | 角色逆位由你選擇一名領先於你的玩家。高塔、世界作用於所有領先於你的玩家；惡魔、月亮放置陷阱。 |
| `rules.sides.r3` | If no one is ahead of you, you cannot use a reversed side: while you lead, you can only race. | 沒有人領先於你時不能用逆位：領先時只能衝。 |
| `rules.sides.r4` | Most character reversed skills are stronger against the leading player. The card says “(the leader: …)”, usually {n} more. Not in 2-player games. | 大部分角色逆位打領先者時更強：卡上寫著「（領先者 …）」，通常多 {n}。兩人局沒有這個加成。 |
| `rules.sides.example` | One card, both sides | 一張牌的兩面 |
| `rules.sides.exampleHint` | The upright effect is printed at the bottom. Turn the card round to read the reversed one. | 正位效果印在下方，把牌倒過來就能讀逆位效果。 |
| `rules.sides.turn` | Turn it round | 倒過來看 |
| `rules.cards.title` | The cards | 卡牌 |
| `rules.cards.deck` | The fate deck has {deck} cards: {minor} Minor cards (10 of each suit) and {court} court cards (2 of each rank). The 22 Major Arcana are the characters and are not in the deck. When the deck runs out, the discard pile is shuffled into a new one. | 命運牌堆共 {deck} 張：小阿爾克那 {minor} 張（每種花色 10 張）和宮廷牌 {court} 張（每種 2 張）。22 張大阿爾克那是角色卡，不在牌堆裡。牌堆抽空時，把棄牌堆洗成新的牌堆。 |
| `rules.cards.minor.title` | Minor Arcana | 小阿爾克那 |
| `rules.cards.minor.intro` | Each suit looks after one thing. | 每種花色管一種資源。 |
| `rules.cards.suit.wands` | Movement | 移動 |
| `rules.cards.suit.pentacles` | Fate Points | 命運點 |
| `rules.cards.suit.swords` | Rolls and position | 擲骰和位置 |
| `rules.cards.suit.cups` | Cards | 手牌 |
| `rules.cards.court.title` | Court cards | 宮廷牌 |
| `rules.cards.court.intro` | A court card cannot be played alone. Add 2 Minor cards, each of one of the two elements shown for the side you play (the same suit twice is fine). All three go to the discard pile; then draw {n\|card\|cards}. | 宮廷牌不能單獨打出。加上 2 張小阿爾克那，每張屬於你要打的那一面所列兩種元素之一（可以同花色）。三張一起進棄牌堆，然後抽 {n} 張。 |
| `rules.cards.major.title` | Characters (Major Arcana) | 角色（大阿爾克那） |
| `rules.cards.major.p` | Your character’s skill is action C: pay {skill\|Fate Point\|Fate Points} to use the side that is face up, but not two turns running. Turn it over in the Flip step for {flip\|Fate Point\|Fate Points}. | 角色技能就是行動 C：花 {skill} 命運點使用朝上的那一面，不能連續兩個回合使用。在翻轉步驟花 {flip} 命運點翻面。 |
| `rules.cards.gallery` | See all 30 cards | 查看全部 30 張卡 |
| `rules.cards.terms.title` | Card wording | 卡上的用語 |
| `rules.cards.terms.next` | “Move forward to the next Fire sign”: go to the nearest Fire sign ahead, not counting the one you are on (1–4 spaces). “Move back to the previous …” works the same way backwards. | 「前進到下一個火象星座」：沿前進方向找最近的火象星座，不含目前這格（1–4 格）。「後退到上一個……」同理。 |
| `rules.cards.terms.start` | Nobody moves back past the start (Aries on the first lap). | 後退最多退回起點（第一圈的白羊座）。 |
| `rules.cards.terms.nextTurn` | “Next turn”: the affected player’s next own turn, even if the effect came during their own turn. | 「下回合」：受影響玩家的下一個自己的回合，就算效果是在他自己的回合裡發生的也一樣。 |
| `rules.cards.terms.cap` | Fate Points are capped at {cap}; anything above is lost. Losing or having them stolen stops at 0. | 命運點上限 {cap}，超出作廢；失去或被偷時扣到 0 為止。 |
| `rules.fp.title` | Fate Points | 命運點 |
| `rules.fp.intro` | Fate Points bend your luck. They do not win the game; they only break ties. | 命運點是用來左右運氣的資源。它不直接決定勝負，只在平手時比較。 |
| `rules.fp.earn` | Gain | 獲得 |
| `rules.fp.spend` | Spend | 花費 |
| `rules.fp.e.resonance` | Resonance: play a Minor card on a sign of its element | 共鳴：在同元素的星座打出小阿爾克那 |
| `rules.fp.e.element` | Element Bonus: end your move on a sign of your element | 元素加成：移動後停在自己元素的星座 |
| `rules.fp.e.lap` | Reach a new lap | 到達新的一圈 |
| `rules.fp.e.meditate` | Meditate | 冥想 |
| `rules.fp.e.trap` | Someone springs your trap | 有人觸發你的陷阱 |
| `rules.fp.e.shield` | Shield refund: your shield runs out without blocking anything | 護盾返還：護盾到期時沒擋到東西 |
| `rules.fp.e.cards` | Pentacles and many other cards | 星幣和許多其他卡牌 |
| `rules.fp.s.reroll` | Reroll the Fate Die | 重擲命運骰 |
| `rules.fp.s.boost` | Boost (+1 space) | 加速（+1 格） |
| `rules.fp.s.flip` | Flip your character | 翻轉角色卡 |
| `rules.fp.s.skill` | Use your character’s skill | 發動角色技能 |
| `rules.fp.cap` | You can hold at most {cap\|Fate Point\|Fate Points}; anything above is lost. While Drained you cannot spend them. | 最多持有 {cap} 命運點，超出作廢。枯竭時不能花費。 |
| `rules.status.title` | Statuses | 狀態 |
| `rules.status.p1` | A negative status affects the player’s next own turn and ends when that turn ends. “For the next N turns” lasts N turns. | 負面狀態作用於受影響玩家的下一個自己的回合，回合結束時清除。寫著「接下來 N 個回合」的持續 N 個回合。 |
| `rules.status.p2` | The same status does not stack (the longer one stays); different statuses can be combined. “Remove all your negative statuses” keeps your shield. | 同種狀態不疊加（取較長的）；不同狀態可以同時存在。「清除所有負面狀態」不清除護盾。 |
| `rules.status.good` | Good | 增益 |
| `rules.status.bad` | Negative | 負面 |
| `rules.trap.title` | Traps | 陷阱 |
| `rules.trap.p1` | The Devil and the Moon place traps with their reversed side. A trap goes on a sign 1–{reach} spaces in front of a player ahead of you, so you cannot place one while you lead. One trap per sign, at most {max} on the board: a new one removes the oldest. | 惡魔、月亮的逆位放置陷阱。陷阱放在一名領先於你的玩家前方 1–{reach} 格的星座上，所以你領先時不能放。一格最多一個陷阱，全場最多 {max} 個，放新的時最早的那個消失。 |
| `rules.trap.p2` | A trap springs when another player passes or stops on its sign while moving themselves (their Move step, their own cards and skills), and is then removed. Being pushed by someone else or swapping places does not spring it, and its owner never does. Several traps on one move spring in order. | 其他玩家自己移動時（移動步驟、自己出的牌和技能）經過或停在陷阱的星座就會觸發，觸發後陷阱消失。被別人推動或交換位置不會觸發；放置者自己不會觸發。一次移動經過多個陷阱時依次觸發。 |
| `rules.trap.p3` | When a trap springs, its owner gains {n\|Fate Point\|Fate Points}, even if a shield blocks it. Traps are stronger on the leading player (not in 2-player games). | 陷阱觸發時放置者獲得 {n} 命運點，被護盾擋下也算。觸發者是領先者時效果更強（兩人局除外）。 |
| `rules.trap.chain` | Rooted next turn and loses {fp\|Fate Point\|Fate Points} (the leader: {lead}); the move goes on. | 觸發者下回合定身，失去 {fp} 命運點（領先者 {lead}），繼續走完這次移動。 |
| `rules.trap.illusion` | Moves back {back\|space\|spaces} (the leader: {lead}); the move ends. | 觸發者後退 {back} 格（領先者 {lead} 格），這次移動結束。 |
| `rules.win.title` | Winning | 勝利 |
| `rules.win.p1` | When any player reaches the finish ({laps\|lap\|laps}), the final round begins: play goes on until the last player of this round has had their turn, even if the player at the finish is pushed back below it. | 任何玩家跑完 {laps} 圈時進入最後一輪：打完這一輪（直到這一輪最後行動的玩家結束）再結算；就算到達終點的人之後被推回終點以下，也照樣打完。 |
| `rules.win.p2` | The player who has gone furthest wins; going past the finish counts. If tied, more Fate Points wins; if still tied, they share the win. | 跑得最遠的玩家獲勝，超過終點的部分也算。平手比命運點；再平手則共同獲勝。 |
| `rules.screen.title` | Playing on this site | 在網頁上玩 |
| `rules.screen.cards` | Click a card in your hand to open it. Point at a side to turn the card that way up, then play that side. | 點手牌打開大卡；指到哪一面，整張卡就轉到那一面，再按那一面的按鈕打出。 |
| `rules.screen.grey` | Choices you cannot make right now are greyed out, with the reason under them. | 現在不能選的選項會變灰，下面寫著原因。 |
| `rules.screen.hotseat` | Several people on one device: hands are covered between turns. Pass the device; the next player confirms before their hand appears. | 多人共用一台裝置時，換人之間手牌會被遮住。把裝置交給下一位，他確認後才顯示手牌。 |
| `rules.screen.computer` | Computer turns play back step by step. Change the speed (1×, 2×, 4×) or press Skip to jump to your next decision. | 電腦的回合會一步一步回放。可以切換速度（1×、2×、4×），或按「跳過」直接到你下一次要做決定的時候。 |
| `rules.screen.lang` | Switch the language at any time, even in the middle of a game. | 隨時可以切換語言，遊戲進行中也可以。 |
| `rules.screen.log` | The log lists everything that happens. It never shows cards a player looks at or takes in secret. | 記錄會列出所有發生的事，但不會透露別人私下查看或拿走的是哪張牌。 |
| `rules.screen.rules` | In a game, the Rules button opens this page and the cards. The game waits until you close it. | 遊戲中按「規則」可以打開這一頁和卡牌圖鑑；關閉之前遊戲會暫停。 |
| `rules.cards.resonance` | Resonance: play a Minor card on a sign of its own element to gain {n\|more Fate Point\|more Fate Points}. | 共鳴：在與牌同元素的星座打出小阿爾克那，額外獲得 {n} 命運點。 |

### 卡牌图鉴页（25）

| 键 | EN | 繁中 |
|---|---|---|
| `gallery.title` | Cards | 卡牌圖鑑 |
| `gallery.intro` | All 30 cards: the 22 characters and the 8 kinds of card in the fate deck. Every card has an upright side (bottom) and a reversed side (top). Click a card to read both sides. | 全部 30 種卡：22 張角色卡和命運牌堆裡的 8 種牌。每張牌都有正位（下方）和逆位（上方）兩面。點一張牌可以讀兩面的效果。 |
| `gallery.filter` | Show | 顯示 |
| `gallery.all` | All | 全部 |
| `gallery.majors` | Characters | 角色 |
| `gallery.minors` | Minor Arcana | 小阿爾克那 |
| `gallery.courts` | Court cards | 宮廷牌 |
| `gallery.players` | Card text for | 卡牌文字 |
| `gallery.playersMany` | 3–4 players | 3–4 人局 |
| `gallery.playersTwo` | 2 players | 兩人局 |
| `gallery.playersHint` | Some cards read differently with 2 players: no leader bonus, and four skills change. | 部分卡牌在兩人局的寫法不同：沒有領先者加成，另有四個技能改變。 |
| `gallery.sideUp` | Side up | 朝上的一面 |
| `gallery.majorsTitle` | Major Arcana · characters | 大阿爾克那 · 角色卡 |
| `gallery.majorsNote` | Not in the deck: each player gets one at random. Its skill is action C. | 不在牌堆裡：每位玩家隨機得到一張。技能是行動 C。 |
| `gallery.minorsTitle` | Minor Arcana | 小阿爾克那 |
| `gallery.minorsNote` | 10 of each suit in the deck. Played on their own (action A). | 牌堆裡每種花色 10 張，單獨打出（行動 A）。 |
| `gallery.courtsTitle` | Court cards | 宮廷牌 |
| `gallery.courtsNote` | 2 of each rank in the deck. Played with 2 Minor cards of the elements shown (action B). | 牌堆裡每種 2 張，和 2 張符合元素的小阿爾克那一起打出（行動 B）。 |
| `gallery.copies` | {n} in the deck | 牌堆中 {n} 張 |
| `gallery.character` | Character | 角色卡 |
| `gallery.needs` | Needs {a} or {b} | 需要{a}或{b} |
| `gallery.prev` | Previous | 上一張 |
| `gallery.next` | Next | 下一張 |
| `gallery.keys` | ← → previous and next card | ← → 切換上一張、下一張 |
| `gallery.differs2p` | Changes with 2 players | 兩人局寫法不同 |
