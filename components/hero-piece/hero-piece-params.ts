/**
 * The Hero piece on the homepage (#146): Alex's approved Cycles glass, "glass-edge" (2026-11-12),
 * rendered without the refraction-test grid ("glass-clear"), full-bleed above the fold. Ported from the #106–#108 prototype's params without its review switches:
 * there are no query params in production, only this one piece.
 *
 * Every file lives in `public/hero-piece/`, rendered by the scene script (`hero-piece/` on the
 * prototype branches) and encoded for the web:
 *
 * - **Still**: the rest pose, wide (2880×1800) and portrait (1200×2600), WebP. All that shows under
 *   `prefers-reduced-motion` or without JavaScript, and the fallback if a clip can't play.
 * - **Opening**: the intro's first frame, the first paint and poster wherever the clips play.
 * - **Clips**: the intro (plays once) and the idle (loops), each wide and portrait, H.264 MP4 and,
 *   where it came out smaller, VP9 WebM. Muted, no audio track.
 *
 * Size budget per clip file (the heavier of MP4 and WebM): intro ≤ 800 KB wide / 500 KB portrait,
 * idle ≤ 1.5 MB wide / 1 MB portrait. A render over budget is re-encoded, not shipped.
 */

/** One clip in its encodings; `webm` only when it beat the MP4 on size. */
export type HeroPieceClip = { mp4: string; webm?: string };

export type HeroPieceClips = {
  intro: HeroPieceClip;
  idle: HeroPieceClip;
  /** The narrow-screen pair. Without it, narrow screens keep the portrait still rather than crop the wide clips. */
  portrait: { intro: HeroPieceClip; idle: HeroPieceClip } | null;
};

export type HeroPiece = {
  /** The wide still (the formed A), shown at 1024px and up under reduced motion, without JavaScript, or if a clip fails. */
  still: string;
  /** The portrait still, the same below 1024px. */
  stillPortrait: string;
  /**
   * The intro's own first frame (wide and portrait): the first paint and poster wherever the clips will
   * play, so the intro takes over from it with no cut (Alex, 2026-11-13: "start immediately on load - no
   * weird jump cuts"). `null` paints the still first.
   */
  opening: { wide: string; portrait: string } | null;
  clips: HeroPieceClips | null;
};

export const HERO_PIECE: HeroPiece = {
  // Grid-free (Alex, 2026-11-12: the grid was only there to test the refraction).
  still: '/hero-piece/glass-clear.webp',
  stillPortrait: '/hero-piece/glass-clear-portrait.webp',
  // Frame 0 of each intro, WebP (9 KB wide, 5 KB portrait): the empty gradient the blob grows out of.
  opening: { wide: '/hero-piece/glass-clear-opening.webp', portrait: '/hero-piece/glass-clear-opening-portrait.webp' },
  // 30 fps, H.264 CRF 20 from the Cycles frames. Wide 1440×900: intro 2.1s / 242 KB, idle 7s / 553 KB.
  // Portrait 600×1300: intro 131 KB, idle 306 KB. VP9 came out larger than H.264 at matching quality,
  // so there's no WebM.
  clips: {
    intro: { mp4: '/hero-piece/glass-clear-intro.mp4' },
    idle: { mp4: '/hero-piece/glass-clear-idle.mp4' },
    portrait: {
      intro: { mp4: '/hero-piece/glass-clear-intro-portrait.mp4' },
      idle: { mp4: '/hero-piece/glass-clear-idle-portrait.mp4' },
    },
  },
};

/** The hero's layout switches at Tailwind's `lg` (1024px); below it, the portrait files play. */
export const HERO_PIECE_NARROW = '(max-width: 1023px)';

/**
 * Where the clips play: JavaScript on and motion allowed. The first paint (CSS) and the player (JS) both
 * test this one query, so they always agree; a browser without the `scripting` feature gets the still.
 */
export const HERO_PIECE_PLAYS = '(scripting: enabled) and (prefers-reduced-motion: no-preference)';
