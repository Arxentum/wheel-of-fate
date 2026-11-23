import type { EmoteId } from '../game/emotes';
import { EMOTE_FACES } from './emoteFaces';

/** One emote face as a small inline SVG. */
export function EmoteFace({ emote, size = 28 }: { emote: EmoteId; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {EMOTE_FACES[emote].map((l, i) => (
        <path
          key={i}
          d={l.d}
          fill={l.fill === 'ink' ? 'var(--ink)' : l.fill === 'paper' ? 'var(--paper)' : (l.fill ?? 'none')}
          stroke="var(--ink)"
          strokeWidth={l.stroke ?? 6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
