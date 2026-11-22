import type { Element } from '../../engine/types';
import { ELEMENT_COLOR, ELEMENT_ON_COLOR } from '../art/colors';
import { ElementGlyph } from './ElementIcon';

interface TokenProps {
  element: Element;
  x: number;
  y: number;
  /** Radius of the coloured disc. */
  r: number;
  active?: boolean;
}

/**
 * A player's piece inside an SVG: element colour plus the element's triangle, so the
 * pieces can be told apart without colour. A cream halo keeps it readable on a
 * segment of the same colour.
 */
export function PieceToken({ element, x, y, r, active = false }: TokenProps) {
  return (
    <g className={active ? 'piece piece--active' : 'piece'}>
      {active && <circle cx={x} cy={y} r={r * 1.42} fill="none" stroke="var(--ink)" strokeWidth={r * 0.14} strokeDasharray={`${r * 0.32} ${r * 0.22}`} />}
      <circle cx={x} cy={y} r={r * 1.18} fill="var(--bg)" />
      <circle cx={x} cy={y} r={r} fill={ELEMENT_COLOR[element]} stroke="var(--ink)" strokeWidth={r * 0.16} />
      <ElementGlyph element={element} x={x} y={y + (element === 'fire' || element === 'air' ? r * 0.04 : -r * 0.04)} size={r * 1.12} color={ELEMENT_ON_COLOR[element]} weight={11} />
    </g>
  );
}

interface PieceProps {
  element: Element;
  size?: number;
  active?: boolean;
  title?: string;
  className?: string;
}

/** A stand-alone piece (player panels, setup screen). */
export function Piece({ element, size = 32, active = false, title, className }: PieceProps) {
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <PieceToken element={element} x={0} y={0} r={active ? 30 : 38} active={active} />
    </svg>
  );
}
