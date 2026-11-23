import { useEffect, useSyncExternalStore } from 'react';
import type { GameController } from '../game/controller';
import { cuesFor, stepCue, type CueName } from './cues';
import { DEFAULT_SOUND, sound, type Scene, type SoundSettings } from './engine';

/** The sound settings, live. */
export function useSoundSettings(): SoundSettings {
  return useSyncExternalStore(sound().subscribe, sound().getSettings, () => DEFAULT_SOUND);
}

/**
 * Page-wide: the first click or key press starts the audio (browsers require a gesture),
 * and buttons click. An element can ask for another sound with data-sound ("pick", or
 * "none" for silence).
 */
export function useSoundListeners(): void {
  useEffect(() => {
    const unlock = () => sound().unlock();
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('button, a, summary, [role="radio"], [data-sound]');
      if (!el || (el as HTMLButtonElement).disabled) return;
      const name = el.closest<HTMLElement>('[data-sound]')?.dataset.sound ?? 'click';
      if (name !== 'none') sound().play([{ name: name as CueName }]);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('click', onClick, true);
    };
  }, []);
}

/** The music for the current screen. */
export function useMusicScene(scene: Scene): void {
  useEffect(() => sound().setScene(scene), [scene]);
}

/** While skipping, only the sounds that tell you where you are. */
const FAST_OK = new Set<CueName>(['yourTurn', 'gong', 'win', 'lose', 'fanfare']);

/** Plays the game's sounds in step with its playback. */
export function useGameSound(c: GameController): void {
  useEffect(
    () =>
      c.onShow((item) => {
        const s = c.getView().latest;
        const ctx = { humans: s.players.filter((p) => p.controller === 'human').map((p) => p.id), elements: s.players.map((p) => p.element) };
        const cues = item.kind === 'step' ? [stepCue(item.p, item.dir, ctx)] : cuesFor(item.event, ctx);
        sound().play(item.fast ? cues.filter((q) => FAST_OK.has(q.name)) : cues);
      }),
    [c],
  );
}
