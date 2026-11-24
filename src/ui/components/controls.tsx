import type { ReactNode } from 'react';
import styles from './controls.module.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Shown under a disabled button: why it cannot be used. */
  reason?: string;
  title?: string;
  className?: string;
  type?: 'button' | 'submit';
  autoFocus?: boolean;
  /** Keyboard shortcut ('m', 'space', 'up' …): pressed by the game's key handler, shown on the button. */
  shortcut?: string;
}

const KEY_LABEL: Record<string, string> = { space: '␣', up: '↑', down: '↓' };

/** A thick-bordered button; a disabled one says why under it. */
export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  reason,
  title,
  className,
  type = 'button',
  autoFocus,
  shortcut,
}: ButtonProps) {
  const button = (
    <button
      type={type}
      className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={title ?? (disabled ? reason : undefined)}
      autoFocus={autoFocus}
      data-key={shortcut}
    >
      {children}
      {shortcut && (
        <kbd className={styles.kbd} aria-hidden="true">
          {KEY_LABEL[shortcut] ?? shortcut.toUpperCase()}
        </kbd>
      )}
    </button>
  );
  if (!disabled || !reason) return button;
  return (
    <span className={styles.withReason}>
      {button}
      <span className={styles.reason}>{reason}</span>
    </span>
  );
}

interface SegmentedProps<T extends string | number> {
  value: T;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** A row of mutually exclusive choices. */
export function Segmented<T extends string | number>({ value, options, onChange, label, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className={`${styles.segmented} ${styles[`seg_${size}`]}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={o.disabled}
          className={o.value === value ? `${styles.segment} ${styles.segmentOn}` : styles.segment}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Black number box used for section headings (01, 02 …). */
export function NumberBox({ n }: { n: string | number }) {
  return <span className={styles.numberBox}>{n}</span>;
}
