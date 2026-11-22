import type { Element } from '../../engine/types';
import { ELEMENT_PATHS } from '../art/glyphs';

interface GlyphProps {
  element: Element;
  /** Centre and size in the parent SVG's units. */
  x: number;
  y: number;
  size: number;
  color: string;
  /** Stroke width in the glyph's own 100-unit box. */
  weight?: number;
}

/** An element triangle placed inside another SVG. */
export function ElementGlyph({ element, x, y, size, color, weight = 10 }: GlyphProps) {
  const s = size / 100;
  return (
    <path
      d={ELEMENT_PATHS[element]}
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
      fill="none"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

interface IconProps {
  element: Element;
  size?: number;
  color?: string;
  weight?: number;
  /** Accessible name; without it the icon is decorative. */
  title?: string;
  className?: string;
}

/** A stand-alone element icon (alchemical triangle). */
export function ElementIcon({ element, size = 24, color = 'currentColor', weight = 10, title, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <ElementGlyph element={element} x={50} y={50} size={100} color={color} weight={weight} />
    </svg>
  );
}
