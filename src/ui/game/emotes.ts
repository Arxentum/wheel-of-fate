import { isLeading, type GameEvent, type GameState, type PlayerId } from '../../engine';
import type { FxPlan } from '../fx/faceFx';

/**
 * Emotes: short taunts and reactions shown in a bubble over a player's piece. People pick
 * them from a palette; computer players send them on their own when something happens to
 * them (this file decides what they would like to say; the screen adds chance and pauses).
 */

export const EMOTES = ['taunt', 'laugh', 'cool', 'shock', 'cry', 'angry', 'nice', 'gg'] as const;
export type EmoteId = (typeof EMOTES)[number];

export interface EmoteWish {
  p: PlayerId;
  /** One of these, picked at random. */
  emotes: EmoteId[];
  /** Chance that the player actually says it (0..1). */
  chance: number;
  /** Wait before saying it, ms at 1× (after the card effect has landed). */
  delay: number;
}

/**
 * What players would say about an event. `s` is the table before the action (so "the
 * leader" means who was leading when the card was played); `plan` is the card's effect.
 */
export function emoteWishes(e: GameEvent, s: GameState, plan: FxPlan | null): EmoteWish[] {
  switch (e.t) {
    case 'play': {
      if (!plan || plan.side !== 'reversed' || plan.sign !== undefined) return [];
      const hit = plan.targets.filter((t) => t !== plan.actor);
      if (hit.length === 0) return [];
      const out: EmoteWish[] = [];
      if (hit.some((t) => isLeading(s, t))) out.push({ p: plan.actor, emotes: ['taunt', 'laugh'], chance: 0.55, delay: 900 });
      for (const t of hit) out.push({ p: t, emotes: ['angry', 'cry', 'shock'], chance: 0.35, delay: 1400 });
      return out;
    }
    case 'trapTrigger': {
      const out: EmoteWish[] = [{ p: e.p, emotes: e.blocked ? ['cool'] : ['shock', 'cry'], chance: 0.8, delay: 500 }];
      if (e.trap.owner !== e.p) out.push({ p: e.trap.owner, emotes: ['laugh', 'taunt'], chance: 0.7, delay: 1100 });
      return out;
    }
    case 'shieldBlock':
      return [{ p: e.p, emotes: ['cool'], chance: 0.6, delay: 400 }];
    case 'lap':
      return [{ p: e.p, emotes: ['cool', 'nice'], chance: 0.3, delay: 300 }];
    case 'finalRound':
      return [{ p: e.p, emotes: ['laugh', 'cool'], chance: 0.7, delay: 300 }];
    case 'gameOver':
      return s.players.map((p) =>
        e.result.winners.includes(p.id)
          ? { p: p.id, emotes: ['cool', 'laugh'], chance: 0.85, delay: 600 }
          : { p: p.id, emotes: ['gg', 'cry'], chance: 0.5, delay: 1200 + p.id * 300 },
      );
    default:
      return [];
  }
}

/** A computer's answer when a person taunts the table. */
export function replyTo(emote: EmoteId): EmoteId[] | null {
  if (emote === 'taunt' || emote === 'laugh') return ['angry', 'laugh'];
  if (emote === 'gg' || emote === 'nice') return ['gg', 'nice'];
  if (emote === 'cry') return ['laugh'];
  return null;
}

/** Each emote sounds a little different (semitones). */
export const EMOTE_PITCH: Record<EmoteId, number> = { taunt: 3, laugh: 5, cool: -2, shock: 7, cry: -5, angry: -7, nice: 4, gg: 0 };
