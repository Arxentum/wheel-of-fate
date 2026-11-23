// Core types of the Wheel of Fate engine. Everything in GameState is plain JSON.

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Suit = 'wands' | 'pentacles' | 'swords' | 'cups';
export type CourtRank = 'page' | 'knight' | 'queen' | 'king';
export type MajorId =
  | 'fool' | 'magician' | 'highPriestess' | 'empress' | 'emperor' | 'hierophant'
  | 'lovers' | 'chariot' | 'strength' | 'hermit' | 'wheelOfFortune' | 'justice'
  | 'hangedMan' | 'death' | 'temperance' | 'devil' | 'tower' | 'star' | 'moon'
  | 'sun' | 'judgement' | 'world';
export type FateCardId = Suit | CourtRank;
export type CardId = FateCardId | MajorId;
export type Orientation = 'upright' | 'reversed';
export type FaceKey = `${CardId}.${Orientation}`;

/** Seat index from the setup screen (0..3). Turn order is `GameState.order`. */
export type PlayerId = number;
/** Index into the 48-card fate deck (see data/cards.ts `cardDef`). */
export type CardUid = number;
export type Controller = 'human' | 'computer';

export type StatusKind =
  | 'slowed' | 'silenced' | 'drained' | 'stunned' | 'rooted' | 'shielded' | 'wrongTurn';
export type TrapKind = 'chain' | 'illusion';

/** What the player has to choose when using a face. */
export type Targeting =
  | 'none'        // nothing to choose
  | 'other'       // one other player
  | 'twoOthers'   // two other players (falls back to 'other' in a 2-player game)
  | 'leaderTie'   // the leading other player; a choice only when several are tied
  | 'sign'        // a sign (0..11) without a trap
  | 'discardAny'  // any cards from your hand
  | 'discardUpTo' // up to params.max cards from your hand
  | 'others'      // all other players, nothing to choose
  | 'ahead'       // every player ahead of you (balance.reversedAhead), nothing to choose
  | 'aheadOne';   // one player ahead of you (rules v5 character reversed faces)

export interface FaceDef {
  targeting: Targeting;
  /** Numbers of the effect. Balance patches override them; card text reads them too. */
  params: Record<string, number>;
  /** The effect rolls dice (the computer players average several samples). */
  random?: boolean;
}

export interface Status {
  kind: StatusKind;
  /** First own turn (PlayerState.turnNo) the status applies to. */
  from: number;
  /** Last own turn it applies to. Wrong Turn uses Infinity until consumed. */
  until: number;
  source: FaceKey | 'trap';
  /** Wrong Turn: how many spaces back the next Move step goes (rules v5, leader bonus). */
  amount?: number;
}

export interface Trap {
  sign: number;
  kind: TrapKind;
  owner: PlayerId;
  seq: number;
}

export interface PlayerState {
  id: PlayerId;
  controller: Controller;
  element: Element;
  progress: number;
  /** Highest lap that already paid the lap bonus (decision D-14). */
  lapsRewarded: number;
  fp: number;
  hand: CardUid[];
  major: MajorId;
  orientation: Orientation;
  statuses: Status[];
  /** Number of own turns started so far; the clock for statuses and the cooldown. */
  turnNo: number;
  /** Own turn number of the last skill use (decision D-02). */
  lastSkillTurn: number | null;
  /** The World's once-per-game faces. */
  onceUsed: { upright: boolean; reversed: boolean };
  /** Own turn number during which traps do not affect this player (The Moon upright). */
  trapImmuneTurn: number | null;
}

export type Step = 'draw' | 'play' | 'flip' | 'move' | 'resolve' | 'end' | 'over';

export interface Roll {
  dice: number[];
  value: number;
  mode: 'normal' | 'advantage' | 'fixed' | 'slowed';
}

export interface TurnState {
  player: PlayerId;
  step: Step;
  action: 'minor' | 'court' | 'skill' | 'meditate' | 'skipped' | null;
  rollMode: 'normal' | 'advantage' | 'fixed3';
  skipMove: boolean;
  roll: Roll | null;
  rerolled: boolean;
  boosted: boolean;
  flipped: boolean;
  /** A Move step actually happened this turn (element bonus, decision D-15). */
  moved: boolean;
}

export type Decision =
  | { kind: 'chooseAction'; player: PlayerId }
  | { kind: 'conjure'; player: PlayerId; left: number }
  | { kind: 'foresight'; player: PlayerId; cards: CardUid[] }
  | { kind: 'veil'; player: PlayerId; target: PlayerId; count: number }
  | { kind: 'wheelTarget'; player: PlayerId; card: CardUid; caster: PlayerId; queue: PlayerId[] }
  | { kind: 'flip'; player: PlayerId }
  | { kind: 'move'; player: PlayerId }
  | { kind: 'discardToLimit'; player: PlayerId; count: number };

export type DecisionKind = Decision['kind'];

export interface SkillChoice {
  target?: PlayerId;
  targets?: [PlayerId, PlayerId];
  sign?: number;
  discard?: CardUid[];
}

export interface MinorPlay {
  card: CardUid;
  orientation: Orientation;
  target?: PlayerId;
}

export type Action =
  | { type: 'playMinor'; card: CardUid; orientation: Orientation; target?: PlayerId }
  | { type: 'playCourt'; card: CardUid; fuel: [CardUid, CardUid]; orientation: Orientation; target?: PlayerId }
  | { type: 'useSkill'; choice?: SkillChoice }
  | { type: 'meditate' }
  | { type: 'conjurePlay'; play: MinorPlay | null }
  | { type: 'foresightPick'; use: CardUid | null; take: CardUid | null }
  | { type: 'veilPick'; cards: CardUid[] }
  | { type: 'chooseTarget'; target: PlayerId }
  | { type: 'flip'; flip: boolean }
  | { type: 'reroll' }
  | { type: 'boost' }
  | { type: 'confirmMove' }
  | { type: 'discard'; cards: CardUid[] };

export type ActionType = Action['type'];

/** Why an option is not available (shown on greyed-out options). */
export type Reason =
  | 'noDecision' | 'wrongDecision' | 'notInHand' | 'notMinor' | 'notCourt'
  | 'silenced' | 'drained' | 'notEnoughFp' | 'cooldown' | 'onceUsed' | 'onPisces'
  | 'noTarget' | 'invalidTarget' | 'needFuel' | 'invalidFuel' | 'trapThere' | 'invalidSign'
  | 'invalidChoice' | 'cannotReroll' | 'cannotBoost' | 'cannotFlip';

export type Check = { ok: true } | { ok: false; reason: Reason };

export interface BalanceConfig {
  startFp: number;
  startHand: number;
  drawPerTurn: number;
  drawWhenEmpty: number;
  fpCap: number;
  handLimit: number;
  rerollCost: number;
  boostCost: number;
  flipCost: number;
  skillCost: number;
  lapBonus: number;
  elementBonus: number;
  resonanceBonus: number;
  meditateDraw: number;
  meditateFp: number;
  courtDraw: number;
  die: number[];
  maxTraps: number;
  chainRootedTurns: number;
  chainFpLoss: number;
  illusionBack: number;
  /** FP returned when a shield runs out without having blocked anything (decision D-59). */
  shieldRefund: number;
  /** Rules v5 character reversed faces: one player ahead of you, positional effects (D-60). */
  majorReversedV5: boolean;
  /** Added to the main number of a v5 reversed face (and a trap) when it hits the leading player. */
  leaderBonus: number;
  /** Traps spring when another player passes over them during their own movement (D-60). */
  trapOnPass: boolean;
  /** FP the owner gains when their trap springs. */
  trapBounty: number;
  /** Leader bonus of minor and court reversed faces (their main number +N against the leader; 0 = none). */
  leaderBonusCards: number;
  /** A trap must go 1..N signs in front of a player ahead of you (0 = any free sign). */
  trapReach: number;
  /** Extra starting progress by position in the turn order (seat 1 first). Empty = none. */
  startProgressBySeat: number[];
  /** Extra starting FP by position in the turn order. Empty = none. */
  startFpBySeat: number[];
  /** Players at or past the finish are no longer affected by reversed effects or traps. */
  finishSafe: boolean;
  /** 'round': play out the round (rule §8); 'immediate': the game ends at the end of the turn the finish is reached. */
  endRule: 'round' | 'immediate';
  /** Single-target reversed faces hit every player ahead of you instead of one target player. */
  reversedAhead: boolean;
  /** The first player of each round moves one seat on (the element order stays). */
  rotateStart: boolean;
  /** Full parameter table of every face (defaults from data/cards.ts). */
  cards: Record<FaceKey, Record<string, number>>;
  /** Changes to `cards` in 2-player games (like the rulebook's "2-player game: ..." lines). */
  cards2p: Partial<Record<FaceKey, Record<string, number>>>;
}

/** A partial override of BalanceConfig; `cards` merges per face. */
export type BalancePatch = Partial<Omit<BalanceConfig, 'cards' | 'cards2p'>> & {
  cards?: Partial<Record<FaceKey, Record<string, number>>>;
  cards2p?: Partial<Record<FaceKey, Record<string, number>>>;
};

export interface PlayerSetup {
  controller: Controller;
  element: Element;
  /** Optional fixed character (tests, debugging). Random when omitted (rule §4). */
  major?: MajorId;
  orientation?: Orientation;
}

export interface GameSetup {
  players: PlayerSetup[];
  laps: number;
  balance?: BalancePatch;
}

export interface GameResult {
  /** Groups of tied players, best first. */
  ranking: PlayerId[][];
  winners: PlayerId[];
  rounds: number;
}

export interface GameState {
  schema: 1;
  seed: string;
  rng: [number, number, number, number];
  config: { laps: number; finish: number; balance: BalanceConfig };
  players: PlayerState[];
  /** Turn order by element: fire, earth, air, water. */
  order: PlayerId[];
  round: number;
  turn: TurnState;
  /** Fate deck; the top card is the LAST element. */
  deck: CardUid[];
  discard: CardUid[];
  traps: Trap[];
  trapSeq: number;
  finalRound: boolean;
  pending: Decision | null;
  result: GameResult | null;
}

/** 'move', 'wrongTurn', 'card': the player's own movement (springs traps on the way in v5); 'push', 'trap', 'swap': moved by someone else. */
export type MoveCause = 'move' | 'card' | 'wrongTurn' | 'push' | 'trap' | 'swap';
export type FpReason =
  | 'resonance' | 'element' | 'lap' | 'meditate' | 'card' | 'steal' | 'trap'
  | 'reroll' | 'boost' | 'flip' | 'skill' | 'reckoning' | 'shieldRefund' | 'trapBounty';
export type CardsReason = 'random' | 'chosen' | 'limit' | 'whole' | 'combo' | 'played';

export type GameEvent =
  | { t: 'gameStart'; order: PlayerId[]; laps: number }
  | { t: 'turnStart'; p: PlayerId; round: number; turnNo: number }
  | { t: 'draw'; p: PlayerId; n: number }
  | { t: 'reshuffle'; n: number }
  | { t: 'actionSkipped'; p: PlayerId }
  | {
      t: 'play';
      p: PlayerId;
      kind: 'minor' | 'court' | 'skill' | 'meditate' | 'conjure' | 'foresight' | 'wheel';
      face?: FaceKey;
      target?: PlayerId;
      targets?: PlayerId[];
      sign?: number;
      resonance?: boolean;
      fuel?: FateCardId[];
    }
  | { t: 'move'; p: PlayerId; from: number; to: number; cause: MoveCause }
  | { t: 'fp'; p: PlayerId; delta: number; reason: FpReason; lostToCap: number }
  | { t: 'discard'; p: PlayerId; cards: FateCardId[]; reason: CardsReason }
  | { t: 'steal'; from: PlayerId; to: PlayerId; what: 'fp' | 'card'; n: number }
  | { t: 'status'; p: PlayerId; kind: StatusKind; from: number; until: number }
  | { t: 'statusCleared'; p: PlayerId; kinds: StatusKind[] }
  | { t: 'shieldBlock'; p: PlayerId; source: FaceKey | 'trap' }
  | { t: 'shieldExpire'; p: PlayerId }
  | { t: 'finishSafe'; p: PlayerId; source: FaceKey | 'trap' }
  | { t: 'swapFailed'; targets: PlayerId[] }
  | { t: 'trapPlace'; trap: Trap }
  | { t: 'trapExpire'; trap: Trap; reason: 'replaced' }
  | { t: 'trapTrigger'; p: PlayerId; trap: Trap; blocked: boolean }
  | { t: 'trapIgnored'; p: PlayerId; trap: Trap }
  | { t: 'flip'; p: PlayerId; orientation: Orientation }
  | { t: 'roll'; p: PlayerId; dice: number[]; value: number; mode: Roll['mode']; reroll: boolean }
  | { t: 'effectRoll'; p: PlayerId; dice: number[] }
  | { t: 'boost'; p: PlayerId }
  | { t: 'moveSkipped'; p: PlayerId; reason: 'rooted' | 'hangedMan' }
  | { t: 'lap'; p: PlayerId; lap: number }
  | { t: 'finalRound'; p: PlayerId }
  | { t: 'reveal'; p: PlayerId; card: FateCardId }
  | { t: 'look'; p: PlayerId; cards: FateCardId[] }
  | { t: 'take'; p: PlayerId; card: FateCardId }
  | { t: 'gameOver'; result: GameResult };
