import { playersAhead, type GameState } from '../../engine';

/**
 * First-game tips: a short note the first time each situation comes up for a person at the
 * table. Seen tips are remembered on this device; tips can be turned off and shown again.
 */

export type TipId = 'choose' | 'reversed' | 'flip' | 'move';

const KEY = 'wof.tips';

/** The browser's storage when there is one (tests run without it). */
function storage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | undefined {
  return (globalThis as { localStorage?: { getItem(k: string): string | null; setItem(k: string, v: string): void } }).localStorage;
}

interface Saved {
  seen: TipId[];
  off: boolean;
}

function load(): Saved {
  try {
    const raw = storage()?.getItem(KEY) ?? null;
    if (!raw) return { seen: [], off: false };
    const v = JSON.parse(raw) as Partial<Saved>;
    return { seen: Array.isArray(v.seen) ? v.seen : [], off: !!v.off };
  } catch {
    return { seen: [], off: false };
  }
}

function save(v: Saved): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(v));
  } catch {
    // Not saved; the tip may come again.
  }
}

export const tips = {
  seen(id: TipId): boolean {
    const v = load();
    return v.off || v.seen.includes(id);
  },
  done(id: TipId): void {
    const v = load();
    if (!v.seen.includes(id)) save({ ...v, seen: [...v.seen, id] });
  },
  turnOff(): void {
    save({ ...load(), off: true });
  },
  reset(): void {
    save({ seen: [], off: false });
  },
};

/** The tip for the decision a person has in front of them now, if it has not been seen. */
export function tipFor(s: GameState, seen: (id: TipId) => boolean): TipId | null {
  const d = s.pending;
  if (!d) return null;
  if (d.kind === 'chooseAction') {
    if (!seen('choose')) return 'choose';
    if (playersAhead(s, d.player).length > 0 && !seen('reversed')) return 'reversed';
    return null;
  }
  if (d.kind === 'flip') return seen('flip') ? null : 'flip';
  if (d.kind === 'move') return seen('move') ? null : 'move';
  return null;
}
