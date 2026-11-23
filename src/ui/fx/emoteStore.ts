import { useSyncExternalStore } from 'react';

/** Whether computer players send emotes (saved; on by default). */

const KEY = 'wof.emotes';
const listeners = new Set<() => void>();

function load(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let botsOn: boolean | null = null;

export const emoteStore = {
  get(): boolean {
    botsOn ??= load();
    return botsOn;
  },
  set(on: boolean): void {
    botsOn = on;
    try {
      window.localStorage.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // Not saved; on again next time.
    }
    for (const fn of listeners) fn();
  },
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useBotEmotes(): boolean {
  return useSyncExternalStore(emoteStore.subscribe, emoteStore.get, () => true);
}
