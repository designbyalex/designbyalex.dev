/**
 * Pure state for the case-study carousel (the MOS Urban UX slides): which slide shows and which arrows
 * it offers. No React imports, so it can be unit-tested in a plain Node environment.
 *
 * Framer's carousel doesn't wrap: the first slide offers only Next, the last only Back.
 */

export interface CarouselNav {
  /** The slide to show, within 0…count-1 (0 when there are no slides). */
  index: number;
  /** Whether a Back arrow shows. */
  hasPrev: boolean;
  /** Whether a Next arrow shows. */
  hasNext: boolean;
}

/** Clamp a requested slide to the carousel's range; anything non-finite goes to the first slide. */
export function clampSlide(index: number, count: number): number {
  if (count <= 0 || !Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), count - 1);
}

/** The slide to show for a requested index, and the arrows it offers. */
export function carouselNav(index: number, count: number): CarouselNav {
  const current = clampSlide(index, count);
  return { index: current, hasPrev: current > 0, hasNext: current < count - 1 };
}
