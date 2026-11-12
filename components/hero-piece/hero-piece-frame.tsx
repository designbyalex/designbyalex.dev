import { HERO_PIECE_NARROW, type HeroPiece } from './hero-piece-params';

/**
 * The Hero piece still, cover-fitted to the hero: the portrait render below 1024px, the wide one
 * above. Server-rendered and at rest from first paint, so it is what loads first, what shows while a
 * clip loads, and all that shows under reduced motion. A plain `<picture>` rather than `next/image`:
 * the WebP files are already sized for the hero, and the clips use the same URLs as their poster, so
 * the browser fetches each still once.
 */
export function HeroPieceFrame({ piece }: { piece: HeroPiece }) {
  return (
    <picture>
      <source media={HERO_PIECE_NARROW} srcSet={piece.stillPortrait} />
      <img
        src={piece.still}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
    </picture>
  );
}
