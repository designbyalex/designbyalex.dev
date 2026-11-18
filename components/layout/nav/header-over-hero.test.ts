// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER_PRE_HYDRATION_STOP, isOverHero, trackHeaderOverHeroScript } from './header-over-hero';

describe('isOverHero', () => {
  it("hands over as the drip's sheet crosses the middle of the header", () => {
    expect(isOverHero(0, 96, 900, false)).toBe(true);
    expect(isOverHero(594, 96, 900, false)).toBe(true);
    expect(isOverHero(595, 96, 900, false)).toBe(false);
    expect(isOverHero(2000, 96, 900, false)).toBe(false);
  });

  it("waits for the hero's bottom edge under reduced motion, where no sheet rises", () => {
    expect(isOverHero(0, 96, 900, true)).toBe(true);
    expect(isOverHero(803, 96, 900, true)).toBe(true);
    expect(isOverHero(804, 96, 900, true)).toBe(false);
    expect(isOverHero(2000, 96, 900, true)).toBe(false);
  });
});

describe('trackHeaderOverHeroScript', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  function setUp(heroBottom: number, reducedMotion = false) {
    window.matchMedia = (() => ({ matches: reducedMotion })) as unknown as typeof window.matchMedia;
    document.body.innerHTML = '<header data-over-hero="true"></header><script></script><div data-section="hero"></div>';
    const header = document.querySelector('header')!;
    const script = document.querySelector('script')!;
    const hero = document.querySelector('[data-section="hero"]')!;
    Object.defineProperty(header, 'offsetHeight', { configurable: true, value: 96 });
    hero.getBoundingClientRect = () => ({ bottom: heroBottom }) as DOMRect;
    Object.defineProperty(document, 'currentScript', { configurable: true, get: () => script });
    new Function(trackHeaderOverHeroScript)();
    return { header, hero };
  }

  it('drops to the theme styling when a reload restores a mid-page scroll position', () => {
    const { header } = setUp(-1200);
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('false');
  });

  it('stays over the hero at the top of the page', () => {
    const { header } = setUp(900);
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(header.getAttribute('data-over-hero')).toBe('true');
  });

  it('follows the same rule as isOverHero while the sheet rises', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 594 });
    const { header, hero } = setUp(900 - 594);
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('true');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 595 });
    hero.getBoundingClientRect = () => ({ bottom: 900 - 595 }) as DOMRect;
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('false');
  });

  it("keeps the hero's bottom edge under reduced motion", () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 700 });
    const { header } = setUp(900 - 700, true);
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('true');
  });

  it('stops listening when the hydrated header takes over', () => {
    const { header, hero } = setUp(900);
    (window as unknown as Record<string, () => void>)[HEADER_PRE_HYDRATION_STOP]();
    hero.getBoundingClientRect = () => ({ bottom: -1200 }) as DOMRect;
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('true');
  });
});
