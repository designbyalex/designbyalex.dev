import { HERO_PIECE_NARROW, HERO_PIECE_PLAYS as PLAYS, type HeroPiece } from './hero-piece-params';

/**
 * The Hero piece's first paint, cover-fitted to the hero, chosen in CSS so the server HTML is already
 * right before hydration:
 *
 * - Where the clips will play: the intro's own first frame, so the intro takes over with no cut.
 * - Under reduced motion, without JavaScript (or in a browser without the `scripting` media feature),
 *   or once `settled` (a clip couldn't play): the still, the formed A.
 *
 * Portrait files below 1024px. A plain `<picture>` rather than `next/image`: the WebP files are already
 * sized for the hero, and the clips use the same URLs as their poster, so each is fetched once.
 */
export function HeroPieceFrame({ piece, settled = false }: { piece: HeroPiece; settled?: boolean }) {
  // The opening only where both intros exist, so it is never left showing with nothing to play.
  const opening = settled || !piece.clips?.portrait ? null : piece.opening;
  return (
    <picture>
      {opening && <source media={`${PLAYS} and ${HERO_PIECE_NARROW}`} srcSet={opening.portrait} />}
      {opening && <source media={PLAYS} srcSet={opening.wide} />}
      <source media={HERO_PIECE_NARROW} srcSet={piece.stillPortrait} />
      <img src={piece.still} alt="" decoding="async" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}
