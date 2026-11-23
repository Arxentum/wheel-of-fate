import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  max: number;
  min: number;
  className?: string;
}

/**
 * Text that shrinks (down to `min` px) until it fits its box. Card texts differ a lot in
 * length between faces and languages; this keeps every one inside the frame.
 */
export function FitText({ children, max, min, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (size > min && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div ref={ref} className={className} style={{ fontSize: max, overflow: 'hidden' }}>
      {children}
    </div>
  );
}
