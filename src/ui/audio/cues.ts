import type { Element, GameEvent, PlayerId } from '../../engine';

/**
 * Which sound goes with which game event. Plain data: the sounds themselves are made in
 * synth.ts. Upright cards sound bright and reversed ones dark, like the core rule.
 */

export const CUE_NAMES = [
  'click', 'pick', 'start', 'yourTurn', 'turn', 'draw', 'shuffle', 'denied',
  'cardUp', 'cardDown', 'resonance', 'skill', 'skillDark', 'meditate',
  'step', 'stepBack', 'land', 'fpGain', 'fpLoss', 'spend', 'discard', 'steal',
  'shield', 'curse', 'cleanse', 'block', 'shieldFade', 'trapSet', 'trapFade', 'trap',
  'flip', 'dice', 'boost', 'lap', 'gong', 'peek', 'win', 'lose', 'fanfare',
  // Card effects (src/ui/fx) and emotes.
  'slash', 'coins', 'flame', 'wind', 'water', 'heartbreak', 'magic', 'shine', 'freeze', 'quake',
  'thud', 'bell', 'roar', 'zap', 'chain', 'trumpet', 'gallop', 'boing', 'snatch', 'whisper', 'bloom',
  'emote',
] as const;

export type CueName = (typeof CUE_NAMES)[number];

export interface Cue {
  name: CueName;
  /** Pitch shift in semitones. */
  pitch?: number;
  /** Stereo position, -1 (left) to 1 (right). */
  pan?: number;
  /** Seconds after the event. */
  delay?: number;
}

export interface CueContext {
  /** Players at this table played by people. */
  humans: readonly PlayerId[];
  /** Each player's element, by id (it places their sounds left or right). */
  elements: readonly Element[];
}

/** Fire on the left … Water on the right, gently. */
const PAN: Record<Element, number> = { fire: -0.4, earth: -0.14, air: 0.14, water: 0.4 };

/** Stereo position of a player's sounds. */
export function panFor(el: Element): number {
  return PAN[el];
}

const SPENDING = new Set(['reroll', 'boost', 'flip', 'skill']);

function side(face: string | undefined): 'upright' | 'reversed' {
  return face?.endsWith('.reversed') ? 'reversed' : 'upright';
}

/** The sounds for one event as it is shown (an empty list: silence). */
export function cuesFor(e: GameEvent, ctx: CueContext): Cue[] {
  const pan = (p: PlayerId) => PAN[ctx.elements[p] ?? 'air'];
  switch (e.t) {
    case 'gameStart':
      return [{ name: 'start' }];
    case 'turnStart':
      return [{ name: ctx.humans.includes(e.p) ? 'yourTurn' : 'turn', pan: pan(e.p) }];
    case 'draw':
      return e.n > 0 ? [{ name: 'draw', pan: pan(e.p) }] : [];
    case 'reshuffle':
      return [{ name: 'shuffle' }];
    case 'actionSkipped':
    case 'moveSkipped':
      return [{ name: 'denied', pan: pan(e.p) }];
    case 'swapFailed':
      return [{ name: 'denied' }];
    case 'play': {
      const dark = side(e.face) === 'reversed';
      const out: Cue[] = [];
      if (e.kind === 'meditate') out.push({ name: 'meditate', pan: pan(e.p) });
      else if (e.kind === 'skill') out.push({ name: dark ? 'skillDark' : 'skill', pan: pan(e.p) });
      else out.push({ name: dark ? 'cardDown' : 'cardUp', pan: pan(e.p) });
      if (e.resonance) out.push({ name: 'resonance', pan: pan(e.p), delay: 0.18 });
      return out;
    }
    case 'move':
      return e.from === e.to ? [] : [{ name: 'land', pan: pan(e.p) }];
    case 'fp': {
      if (e.delta === 0) return [];
      if (e.delta < 0 && SPENDING.has(e.reason)) return [{ name: 'spend', pan: pan(e.p) }];
      if (e.delta > 0) return [{ name: 'fpGain', pan: pan(e.p), pitch: Math.min(e.delta, 5) - 1 }];
      return [{ name: 'fpLoss', pan: pan(e.p) }];
    }
    case 'discard':
      // Cards that were just played already made their sound.
      return e.reason === 'played' || e.reason === 'combo' ? [] : [{ name: 'discard', pan: pan(e.p) }];
    case 'steal':
      return [{ name: 'steal', pan: pan(e.to) }];
    case 'status':
      return [{ name: e.kind === 'shielded' ? 'shield' : 'curse', pan: pan(e.p) }];
    case 'statusCleared':
      return [{ name: 'cleanse', pan: pan(e.p) }];
    case 'shieldBlock':
    case 'finishSafe':
    case 'trapIgnored':
      return [{ name: 'block', pan: pan(e.p) }];
    case 'shieldExpire':
      return [{ name: 'shieldFade', pan: pan(e.p) }];
    case 'trapPlace':
      return [{ name: 'trapSet', pan: pan(e.trap.owner) }];
    case 'trapExpire':
      return [{ name: 'trapFade' }];
    case 'trapTrigger':
      return e.blocked ? [{ name: 'trap', pan: pan(e.p) }, { name: 'block', pan: pan(e.p), delay: 0.25 }] : [{ name: 'trap', pan: pan(e.p) }];
    case 'flip':
      return [{ name: 'flip', pan: pan(e.p), pitch: e.orientation === 'reversed' ? -3 : 0 }];
    case 'roll':
    case 'effectRoll':
      return [{ name: 'dice', pan: pan(e.p) }];
    case 'boost':
      return [{ name: 'boost', pan: pan(e.p) }];
    case 'lap':
      return [{ name: 'lap', pan: pan(e.p) }];
    case 'finalRound':
      return [{ name: 'gong' }];
    case 'reveal':
    case 'look':
    case 'take':
      return [{ name: 'peek', pan: pan(e.p) }];
    case 'gameOver': {
      if (ctx.humans.length === 0) return [{ name: 'fanfare' }];
      return [{ name: e.result.winners.some((w) => ctx.humans.includes(w)) ? 'win' : 'lose' }];
    }
    default:
      return [];
  }
}

/** One space walked: higher going forward, lower when pushed back. */
export function stepCue(p: PlayerId, dir: number, ctx: CueContext): Cue {
  return { name: dir > 0 ? 'step' : 'stepBack', pan: PAN[ctx.elements[p] ?? 'air'] };
}
