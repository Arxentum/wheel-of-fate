import type { Speed } from './controller';

/** The playback speed the player picked last (1× until then). */

const KEY = 'wof.speed';

export function loadSpeed(): Speed {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return v === 2 || v === 4 ? v : 1;
  } catch {
    return 1;
  }
}

export function saveSpeed(speed: Speed): void {
  try {
    window.localStorage.setItem(KEY, String(speed));
  } catch {
    // Not saved; 1× next time.
  }
}
