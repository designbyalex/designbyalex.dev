import { describe, expect, it } from 'vitest';
import {
  INITIAL_SCROLL_VISIBILITY,
  NEAR_TOP,
  reduceScrollVisibility,
  SCROLL_THRESHOLD,
  type ScrollVisibilityState,
} from './scroll-visibility';

const shownAt = (previousY: number): ScrollVisibilityState => ({ visibility: 'shown', previousY });
const hiddenAt = (previousY: number): ScrollVisibilityState => ({ visibility: 'hidden', previousY });
const motion = { prefersReducedMotion: false };

describe('reduceScrollVisibility', () => {
  describe('direction', () => {
    it('hides on scroll down past the threshold', () => {
      expect(reduceScrollVisibility(shownAt(400), { y: 400 + SCROLL_THRESHOLD, ...motion })).toEqual(hiddenAt(408));
    });

    it('shows again on scroll up past the threshold', () => {
      expect(reduceScrollVisibility(hiddenAt(900), { y: 900 - SCROLL_THRESHOLD, ...motion })).toEqual(shownAt(892));
    });

    it('keeps hiding while the page keeps moving down, anchoring at the furthest point', () => {
      const s1 = reduceScrollVisibility(hiddenAt(500), { y: 1500, ...motion });
      expect(s1).toEqual(hiddenAt(1500));
      // A small reversal is measured from 1500, not 500: still hidden.
      expect(reduceScrollVisibility(s1, { y: 1496, ...motion })).toBe(s1);
      // Past the threshold it shows.
      expect(reduceScrollVisibility(s1, { y: 1490, ...motion })).toEqual(shownAt(1490));
    });

    it('keeps showing while the page keeps moving up, anchoring at the furthest point', () => {
      const s1 = reduceScrollVisibility(shownAt(2000), { y: 1200, ...motion });
      expect(s1).toEqual(shownAt(1200));
      expect(reduceScrollVisibility(s1, { y: 1205, ...motion })).toBe(s1);
      expect(reduceScrollVisibility(s1, { y: 1220, ...motion })).toEqual(hiddenAt(1220));
    });

    it('returns the same state object when nothing moved', () => {
      const s = hiddenAt(700);
      expect(reduceScrollVisibility(s, { y: 700, ...motion })).toBe(s);
    });
  });

  describe('threshold', () => {
    it('ignores a reversal smaller than the threshold', () => {
      const s = shownAt(400);
      expect(reduceScrollVisibility(s, { y: 400 + SCROLL_THRESHOLD - 1, ...motion })).toBe(s);
    });

    it('flips exactly at the threshold', () => {
      expect(reduceScrollVisibility(shownAt(400), { y: 400 + SCROLL_THRESHOLD, ...motion }).visibility).toBe('hidden');
    });

    it('honours a custom threshold', () => {
      const s = shownAt(400);
      expect(reduceScrollVisibility(s, { y: 430, threshold: 40, ...motion })).toBe(s);
      expect(reduceScrollVisibility(s, { y: 440, threshold: 40, ...motion }).visibility).toBe('hidden');
    });
  });

  describe('near the top', () => {
    it('starts shown at the top of the page', () => {
      expect(INITIAL_SCROLL_VISIBILITY).toEqual(shownAt(0));
    });

    it('never hides within the near-top band, however fast the scroll down', () => {
      expect(reduceScrollVisibility(shownAt(0), { y: NEAR_TOP, ...motion })).toEqual(shownAt(NEAR_TOP));
      expect(reduceScrollVisibility(shownAt(0), { y: NEAR_TOP + 1, ...motion })).toEqual(hiddenAt(NEAR_TOP + 1));
    });

    it('shows a hidden header as soon as the page is back near the top', () => {
      expect(reduceScrollVisibility(hiddenAt(1000), { y: 40, ...motion })).toEqual(shownAt(40));
      expect(reduceScrollVisibility(hiddenAt(1000), { y: 0, ...motion })).toEqual(shownAt(0));
    });

    it('honours a custom near-top distance', () => {
      expect(reduceScrollVisibility(shownAt(0), { y: 150, nearTop: 200, ...motion })).toEqual(shownAt(150));
      expect(reduceScrollVisibility(shownAt(0), { y: 250, nearTop: 200, ...motion })).toEqual(hiddenAt(250));
    });
  });

  describe('reduced motion', () => {
    const reduced = { prefersReducedMotion: true };

    it('stays shown on a long scroll down', () => {
      expect(reduceScrollVisibility(shownAt(0), { y: 3000, ...reduced })).toEqual(shownAt(3000));
    });

    it('shows a header that was hidden before the preference changed', () => {
      expect(reduceScrollVisibility(hiddenAt(900), { y: 950, ...reduced })).toEqual(shownAt(950));
    });

    it('returns the same state object when already shown at that y', () => {
      const s = shownAt(500);
      expect(reduceScrollVisibility(s, { y: 500, ...reduced })).toBe(s);
    });
  });
});
