import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface Props {
  children: ReactNode;
  onClose: () => void;
  label: string;
  /** 'md' dialogs, 'wide' card viewers, 'full' the rules and cards over a game. */
  size?: 'md' | 'wide' | 'full';
  className?: string;
}

/** Open dialogs, newest last: Escape closes only the top one (a card opened over the rules). */
const open: symbol[] = [];

/** A dialog over the page; Escape or the backdrop closes it. */
export function Modal({ children, onClose, label, size = 'md', className }: Props) {
  const close = useRef(onClose);
  useLayoutEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const id = Symbol('modal');
    open.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open[open.length - 1] === id) close.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      open.splice(open.indexOf(id), 1);
    };
  }, []);
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={[styles.modal, styles[size], className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
