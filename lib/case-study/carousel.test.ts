import { describe, expect, it } from 'vitest';
import { carouselNav, clampSlide } from './carousel';

describe('clampSlide', () => {
  it('keeps an index inside the range', () => {
    expect(clampSlide(2, 5)).toBe(2);
  });

  it('clamps below the first and past the last slide', () => {
    expect(clampSlide(-1, 5)).toBe(0);
    expect(clampSlide(5, 5)).toBe(4);
    expect(clampSlide(99, 5)).toBe(4);
  });

  it('truncates fractions and sends non-finite indexes to the first slide', () => {
    expect(clampSlide(2.7, 5)).toBe(2);
    expect(clampSlide(Number.NaN, 5)).toBe(0);
    expect(clampSlide(Number.POSITIVE_INFINITY, 5)).toBe(0);
  });

  it('is 0 when there are no slides', () => {
    expect(clampSlide(3, 0)).toBe(0);
  });
});

describe('carouselNav', () => {
  it('offers only Next on the first slide', () => {
    expect(carouselNav(0, 5)).toEqual({ index: 0, hasPrev: false, hasNext: true });
  });

  it('offers both arrows on the slides between', () => {
    for (const index of [1, 2, 3]) {
      expect(carouselNav(index, 5)).toEqual({ index, hasPrev: true, hasNext: true });
    }
  });

  it('offers only Back on the last slide', () => {
    expect(carouselNav(4, 5)).toEqual({ index: 4, hasPrev: true, hasNext: false });
  });

  it('clamps the requested index before deciding the arrows', () => {
    expect(carouselNav(7, 5)).toEqual({ index: 4, hasPrev: true, hasNext: false });
    expect(carouselNav(-2, 5)).toEqual({ index: 0, hasPrev: false, hasNext: true });
  });

  it('offers no arrows for a single slide or none', () => {
    expect(carouselNav(0, 1)).toEqual({ index: 0, hasPrev: false, hasNext: false });
    expect(carouselNav(0, 0)).toEqual({ index: 0, hasPrev: false, hasNext: false });
  });
});
