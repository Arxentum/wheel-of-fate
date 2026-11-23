import { playersAhead, splitFace, type FaceKey, type GameEvent, type GameState, type PlayerId } from '../../engine';
import type { IconName } from './icons';

/**
 * What every card side looks like when it is played: a way of moving (a sword slashing the
 * players ahead, coins raining on you), an icon, a colour and a sound. Upright sides play
 * on the player; reversed sides hit their targets.
 */

export type Primitive =
  /** A ring of light and the icon rising from the player. */
  | 'aura'
  /** Icons falling onto the player. */
  | 'rain'
  /** The icon pops up big with rays. */
  | 'burst'
  /** Speed streaks behind the player. */
  | 'dash'
  /** The icon jumps in an arc over the player. */
  | 'leap'
  /** The icon flies from the player to each target and strikes. */
  | 'shot'
  /** Icons fly from each target back to the player (stealing). */
  | 'drain'
  /** The icon swings down on each target. */
  | 'slash'
  /** The icon slams down on each target with a shock ring. */
  | 'stamp'
  /** Puffs that settle over each target. */
  | 'cloud'
  /** Icons closing in round each target. */
  | 'wrap'
  /** Lightning from above. */
  | 'bolt'
  /** A shock wave from the player rolling over the targets. */
  | 'wave'
  /** A beam from the player to each target. */
  | 'beam'
  /** Falls from the sky onto each target. */
  | 'meteor'
  /** Thrown onto a sign: a trap. */
  | 'trap';

export type FxSound =
  | 'slash' | 'coins' | 'flame' | 'wind' | 'water' | 'heartbreak' | 'magic' | 'shine' | 'freeze'
  | 'quake' | 'thud' | 'bell' | 'roar' | 'zap' | 'chain' | 'trumpet' | 'gallop' | 'boing'
  | 'snatch' | 'whisper' | 'bloom';

export interface FaceFx {
  fx: Primitive;
  icon: IconName;
  /** Accent colour of the icon and its light. */
  color: string;
  sound: FxSound;
}

const FIRE = '#D14135';
const EARTH = '#EAA936';
const AIR = '#3B672B';
const WATER = '#1D4C7C';
const INK = '#111111';

export const FACE_FX: Record<FaceKey, FaceFx> = {
  // Minor Arcana
  'wands.upright': { fx: 'dash', icon: 'flame', color: FIRE, sound: 'flame' },
  'wands.reversed': { fx: 'cloud', icon: 'smoke', color: '#8A8178', sound: 'whisper' },
  'pentacles.upright': { fx: 'rain', icon: 'coin', color: EARTH, sound: 'coins' },
  'pentacles.reversed': { fx: 'drain', icon: 'coin', color: EARTH, sound: 'coins' },
  'swords.upright': { fx: 'dash', icon: 'wind', color: AIR, sound: 'wind' },
  'swords.reversed': { fx: 'slash', icon: 'sword', color: AIR, sound: 'slash' },
  'cups.upright': { fx: 'rain', icon: 'drop', color: WATER, sound: 'water' },
  'cups.reversed': { fx: 'shot', icon: 'heartBroken', color: FIRE, sound: 'heartbreak' },
  // Court cards
  'page.upright': { fx: 'dash', icon: 'letter', color: AIR, sound: 'wind' },
  'page.reversed': { fx: 'cloud', icon: 'bubble', color: '#8A8178', sound: 'whisper' },
  'knight.upright': { fx: 'dash', icon: 'horseshoe', color: FIRE, sound: 'gallop' },
  'knight.reversed': { fx: 'slash', icon: 'lance', color: EARTH, sound: 'slash' },
  'queen.upright': { fx: 'aura', icon: 'rose', color: WATER, sound: 'shine' },
  'queen.reversed': { fx: 'beam', icon: 'eye', color: WATER, sound: 'freeze' },
  'king.upright': { fx: 'burst', icon: 'crown', color: EARTH, sound: 'shine' },
  'king.reversed': { fx: 'wave', icon: 'crown', color: WATER, sound: 'quake' },
  // Major Arcana (characters)
  'fool.upright': { fx: 'leap', icon: 'feather', color: EARTH, sound: 'boing' },
  'fool.reversed': { fx: 'shot', icon: 'signpost', color: FIRE, sound: 'boing' },
  'magician.upright': { fx: 'burst', icon: 'hat', color: FIRE, sound: 'magic' },
  'magician.reversed': { fx: 'drain', icon: 'hand', color: FIRE, sound: 'snatch' },
  'highPriestess.upright': { fx: 'aura', icon: 'eye', color: WATER, sound: 'magic' },
  'highPriestess.reversed': { fx: 'cloud', icon: 'eye', color: WATER, sound: 'whisper' },
  'empress.upright': { fx: 'rain', icon: 'rose', color: FIRE, sound: 'bloom' },
  'empress.reversed': { fx: 'wrap', icon: 'leaf', color: AIR, sound: 'bloom' },
  'emperor.upright': { fx: 'burst', icon: 'crown', color: FIRE, sound: 'shine' },
  'emperor.reversed': { fx: 'stamp', icon: 'scroll', color: FIRE, sound: 'thud' },
  'hierophant.upright': { fx: 'aura', icon: 'key', color: EARTH, sound: 'bell' },
  'hierophant.reversed': { fx: 'stamp', icon: 'bell', color: EARTH, sound: 'bell' },
  'lovers.upright': { fx: 'dash', icon: 'heart', color: FIRE, sound: 'shine' },
  'lovers.reversed': { fx: 'shot', icon: 'heartBroken', color: FIRE, sound: 'heartbreak' },
  'chariot.upright': { fx: 'dash', icon: 'wheel', color: WATER, sound: 'gallop' },
  'chariot.reversed': { fx: 'shot', icon: 'wheel', color: WATER, sound: 'thud' },
  'strength.upright': { fx: 'burst', icon: 'lion', color: FIRE, sound: 'roar' },
  'strength.reversed': { fx: 'wave', icon: 'lion', color: FIRE, sound: 'roar' },
  'hermit.upright': { fx: 'aura', icon: 'lantern', color: EARTH, sound: 'shine' },
  'hermit.reversed': { fx: 'cloud', icon: 'lantern', color: INK, sound: 'whisper' },
  'wheelOfFortune.upright': { fx: 'burst', icon: 'wheel', color: EARTH, sound: 'magic' },
  'wheelOfFortune.reversed': { fx: 'shot', icon: 'wheel', color: EARTH, sound: 'thud' },
  'justice.upright': { fx: 'aura', icon: 'scales', color: EARTH, sound: 'bell' },
  'justice.reversed': { fx: 'stamp', icon: 'gavel', color: FIRE, sound: 'thud' },
  'hangedMan.upright': { fx: 'aura', icon: 'shield', color: WATER, sound: 'shine' },
  'hangedMan.reversed': { fx: 'wrap', icon: 'rope', color: EARTH, sound: 'chain' },
  'death.upright': { fx: 'burst', icon: 'skull', color: INK, sound: 'magic' },
  'death.reversed': { fx: 'slash', icon: 'scythe', color: INK, sound: 'slash' },
  'temperance.upright': { fx: 'dash', icon: 'drop', color: WATER, sound: 'water' },
  'temperance.reversed': { fx: 'stamp', icon: 'hourglass', color: WATER, sound: 'freeze' },
  'devil.upright': { fx: 'burst', icon: 'horns', color: FIRE, sound: 'flame' },
  'devil.reversed': { fx: 'trap', icon: 'chain', color: FIRE, sound: 'chain' },
  'tower.upright': { fx: 'bolt', icon: 'bolt', color: EARTH, sound: 'zap' },
  'tower.reversed': { fx: 'meteor', icon: 'brick', color: FIRE, sound: 'quake' },
  'star.upright': { fx: 'rain', icon: 'star', color: EARTH, sound: 'magic' },
  'star.reversed': { fx: 'meteor', icon: 'star', color: EARTH, sound: 'zap' },
  'moon.upright': { fx: 'aura', icon: 'moon', color: WATER, sound: 'magic' },
  'moon.reversed': { fx: 'trap', icon: 'moon', color: WATER, sound: 'whisper' },
  'sun.upright': { fx: 'burst', icon: 'sun', color: FIRE, sound: 'shine' },
  'sun.reversed': { fx: 'beam', icon: 'sun', color: FIRE, sound: 'flame' },
  'judgement.upright': { fx: 'burst', icon: 'trumpet', color: EARTH, sound: 'trumpet' },
  'judgement.reversed': { fx: 'wave', icon: 'trumpet', color: EARTH, sound: 'trumpet' },
  'world.upright': { fx: 'aura', icon: 'globe', color: WATER, sound: 'shine' },
  'world.reversed': { fx: 'wrap', icon: 'snowflake', color: WATER, sound: 'freeze' },
};

/** Meditating has no card: a calm light. */
export const MEDITATE_FX: FaceFx = { fx: 'aura', icon: 'lantern', color: EARTH, sound: 'shine' };

export interface FxPlan extends FaceFx {
  actor: PlayerId;
  /** Players hit (the actor for upright sides). */
  targets: PlayerId[];
  /** The sign a trap goes on. */
  sign?: number;
  side: 'upright' | 'reversed';
}

/**
 * The effect for a played card. `s` is the table as it was when the card was played, which
 * tells who was ahead of the player (the reversed sides that hit every player ahead).
 */
export function fxFor(play: Extract<GameEvent, { t: 'play' }>, s: GameState): FxPlan | null {
  if (play.kind === 'meditate') return { ...MEDITATE_FX, actor: play.p, targets: [play.p], side: 'upright' };
  if (!play.face) return null;
  const fx = FACE_FX[play.face];
  const side = splitFace(play.face)[1];
  if (side === 'upright') return { ...fx, actor: play.p, targets: [play.p], side };
  if (play.sign !== undefined) return { ...fx, actor: play.p, targets: [], sign: play.sign, side };
  const targets = play.targets ?? (play.target !== undefined ? [play.target] : playersAhead(s, play.p));
  return { ...fx, actor: play.p, targets: targets.length ? [...targets] : [play.p], side };
}
