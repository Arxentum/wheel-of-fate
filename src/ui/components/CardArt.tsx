import type { CardId } from '../../engine/types';

export type CardArtId = CardId | 'back';

/** Size of the cropped illustrations (scripts/build-cards.ts, public/cards/manifest.json). */
export const CARD_ART = { width: 390, height: 503 } as const;
export const BACK_ART = { width: 390, height: 391 } as const;

const BASE = import.meta.env.BASE_URL;

export function cardArtUrl(id: CardArtId, density: 1 | 2 = 1): string {
  return `${BASE}cards/${density}x/${id}.webp`;
}

interface Props {
  id: CardArtId;
  alt: string;
  className?: string;
  /** Lazy by default; set for cards visible on first paint. */
  eager?: boolean;
}

/** The card's illustration only (WebP 1x / 2x). The frame and texts are drawn around it. */
export function CardArt({ id, alt, className, eager = false }: Props) {
  const size = id === 'back' ? BACK_ART : CARD_ART;
  return (
    <img
      src={cardArtUrl(id, 1)}
      srcSet={`${cardArtUrl(id, 1)} 1x, ${cardArtUrl(id, 2)} 2x`}
      width={size.width}
      height={size.height}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}
