/**
 * Scroll-visibility reducer for the header (P8 / #55). Pure.
 *
 * The Reference header hides on scroll down and comes back on scroll up. This
 * module owns that decision so it is unit-testable: given the current state
 * (shown or hidden, plus the y the decision was last anchored at) and a new
 * scroll position, it returns the next state. No DOM, no React: the primitive
 * samples `window.scrollY` and the reduced-motion preference and passes them in.
 */

export type ScrollVisibility = 'shown' | 'hidden';

export interface ScrollVisibilityState {
  visibility: ScrollVisibility;
  /** The y the current visibility was decided at: the "previous y" of the next sample. */
  previousY: number;
}

export interface ScrollVisibilityInput {
  /** The new scroll position (px). */
  y: number;
  /** Minimum distance (px) the page must move against the current direction before the state flips. Default {@link SCROLL_THRESHOLD}. */
  threshold?: number;
  /** At or above this y the header may hide; below it the header always shows. Default {@link NEAR_TOP}. */
  nearTop?: number;
  /** The user's `prefers-reduced-motion` preference. Reduced motion → always shown. */
  prefersReducedMotion: boolean;
}

/** Small scroll jitters (trackpad inertia, rubber-banding) don't flip the header. */
export const SCROLL_THRESHOLD = 8;
/** The header's own height at ≥1024: it never hides while it still overlaps the top of the page. */
export const NEAR_TOP = 96;

export const INITIAL_SCROLL_VISIBILITY: ScrollVisibilityState = { visibility: 'shown', previousY: 0 };

/**
 * Next header state for a scroll sample.
 *
 * - Reduced motion → shown, whatever the scroll did.
 * - Near the top (`y <= nearTop`) → shown.
 * - Moving further in the current direction keeps the state and advances the
 *   anchor, so a reversal is measured from the furthest point reached.
 * - A reversal smaller than `threshold` keeps the state; at or past it, the
 *   header hides on the way down and shows on the way up.
 */
export function reduceScrollVisibility(
  state: ScrollVisibilityState,
  { y, threshold = SCROLL_THRESHOLD, nearTop = NEAR_TOP, prefersReducedMotion }: ScrollVisibilityInput
): ScrollVisibilityState {
  if (prefersReducedMotion || y <= nearTop) {
    return state.visibility === 'shown' && state.previousY === y ? state : { visibility: 'shown', previousY: y };
  }

  const delta = y - state.previousY;
  if (delta === 0) return state;

  const scrollingDown = delta > 0;
  const continuing = scrollingDown ? state.visibility === 'hidden' : state.visibility === 'shown';
  if (continuing) return { visibility: state.visibility, previousY: y };

  if (Math.abs(delta) < threshold) return state;
  return { visibility: scrollingDown ? 'hidden' : 'shown', previousY: y };
}
