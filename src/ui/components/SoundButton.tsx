import { useEffect, useRef, useState } from 'react';
import { sound } from '../audio/engine';
import { useSoundSettings } from '../audio/useSound';
import { useLang } from '../hooks/useLang';
import styles from './SoundButton.module.css';

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M3 9h4l5-4v14l-5-4H3z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" fill="none" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" strokeWidth="2.2" fill="none" />
      )}
    </svg>
  );
}

interface RowProps {
  label: string;
  on: boolean;
  volume: number;
  onToggle: () => void;
  onVolume: (v: number) => void;
}

function Row({ label, on, volume, onToggle, onVolume }: RowProps) {
  const { t } = useLang();
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <button type="button" className={on ? `${styles.toggle} ${styles.on}` : styles.toggle} aria-pressed={on} onClick={onToggle}>
        {on ? t('sound.on') : t('sound.off')}
      </button>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        aria-label={t('sound.volume', { name: label })}
        onChange={(e) => onVolume(Number(e.target.value) / 100)}
        disabled={!on}
      />
    </div>
  );
}

/** The speaker button: music and effects on or off, and their volume. */
export function SoundButton() {
  const { t } = useLang();
  const s = useSoundSettings();
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

  const silent = !s.music && !s.effects;
  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-label={t('sound.open')}
        title={silent ? t('sound.mutedTitle') : t('sound.open')}
        onClick={() => setOpen((o) => !o)}
      >
        <SpeakerIcon muted={silent} />
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('sound.open')}>
          <Row
            label={t('sound.music')}
            on={s.music}
            volume={s.musicVolume}
            onToggle={() => sound().set({ music: !s.music })}
            onVolume={(v) => sound().set({ musicVolume: v })}
          />
          <Row
            label={t('sound.effects')}
            on={s.effects}
            volume={s.effectsVolume}
            onToggle={() => sound().set({ effects: !s.effects })}
            onVolume={(v) => {
              sound().set({ effectsVolume: v });
              sound().play([{ name: 'fpGain' }]);
            }}
          />
          <p className={styles.note}>{t('sound.note')}</p>
        </div>
      )}
    </div>
  );
}
