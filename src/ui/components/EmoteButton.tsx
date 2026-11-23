import { useEffect, useRef, useState } from 'react';
import { EMOTES, type EmoteId } from '../game/emotes';
import { EmoteFace } from '../fx/EmoteFace';
import { emoteStore, useBotEmotes } from '../fx/emoteStore';
import { useLang } from '../hooks/useLang';
import styles from './SoundButton.module.css';

/** The face button: send an emote, and let computer players send theirs (or not). */
export function EmoteButton({ onSend, disabled }: { onSend: (emote: EmoteId) => void; disabled: boolean }) {
  const { t } = useLang();
  const bots = useBotEmotes();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button type="button" className={styles.button} aria-expanded={open} aria-label={t('emote.open')} title={t('emote.open')} onClick={() => setOpen((o) => !o)}>
        <EmoteFace emote="laugh" size={22} />
      </button>
      {open && (
        <div className={`${styles.panel} ${styles.emotePanel}`} role="dialog" aria-label={t('emote.open')}>
          <div className={styles.emoteGrid}>
            {EMOTES.map((e) => (
              <button
                key={e}
                type="button"
                className={styles.emote}
                disabled={disabled}
                data-sound="none"
                onClick={() => {
                  onSend(e);
                  setOpen(false);
                }}
              >
                <EmoteFace emote={e} size={30} />
                <span>{t(`emote.${e}`)}</span>
              </button>
            ))}
          </div>
          {disabled && <p className={styles.note}>{t('emote.wait')}</p>}
          <label className={styles.check}>
            <input type="checkbox" checked={bots} onChange={(e) => emoteStore.set(e.target.checked)} />
            {t('emote.bots')}
          </label>
        </div>
      )}
    </div>
  );
}
