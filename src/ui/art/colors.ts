import type { Element } from '../../engine/types';

/** CSS variables from styles/tokens.css. */
export const ELEMENT_COLOR: Record<Element, string> = {
  fire: 'var(--fire)',
  earth: 'var(--earth)',
  air: 'var(--air)',
  water: 'var(--water)',
};

/** White reads on every element colour except earth's yellow, which takes ink. */
export const ELEMENT_ON_COLOR: Record<Element, string> = {
  fire: 'var(--paper)',
  earth: 'var(--ink)',
  air: 'var(--paper)',
  water: 'var(--paper)',
};
