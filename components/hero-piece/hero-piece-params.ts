/**
 * The Hero piece on the homepage (#146): Alex's approved Cycles glass, "glass-edge" (2026-11-12),
 * rendered without the refraction-test grid ("glass-clear"), full-bleed above the fold. Ported from the #106–#108 prototype's params without its review switches:
 * there are no query params in production, only this one piece.
 *
 * Every file lives in `public/hero-piece/`, rendered by the scene script (`hero-piece/` on the
 * prototype branches) and encoded for the web:
 *
 * - **Still**: the rest pose, wide (2880×1800) and portrait (1200×2600), WebP. It is the first paint,
 *   the loading state, the poster, and all that shows under `prefers-reduced-motion`.
 * - **Clips**: the intro (plays once) and the idle (loops), each wide and portrait, H.264 MP4 and,
 *   where it came out smaller, VP9 WebM. Muted, no audio track. `null` until the renders land.
 *
 * Size budget per clip file (the heavier of MP4 and WebM): intro ≤ 800 KB wide / 500 KB portrait,
 * idle ≤ 1.5 MB wide / 1 MB portrait. A render over budget is re-encoded, not shipped.
 */

/** One clip in its encodings; `webm` only when it beat the MP4 on size. */
export type HeroPieceClip = { mp4: string; webm?: string };

export type HeroPieceClips = {
  intro: HeroPieceClip;
  idle: HeroPieceClip;
  introPortrait: HeroPieceClip;
  idlePortrait: HeroPieceClip;
};

export type HeroPiece = {
  /** The wide still, shown at 1024px and up. */
  still: string;
  /** The portrait still, shown below 1024px. */
  stillPortrait: string;
  clips: HeroPieceClips | null;
};

export const HERO_PIECE: HeroPiece = {
  // Grid-free (Alex, 2026-11-12: the grid was only there to test the refraction).
  still: '/hero-piece/glass-clear.webp',
  stillPortrait: '/hero-piece/glass-clear-portrait.webp',
  clips: null,
};

/** The hero's layout switches at Tailwind's `lg` (1024px); below it, the portrait files play. */
export const HERO_PIECE_NARROW = '(max-width: 1023px)';
