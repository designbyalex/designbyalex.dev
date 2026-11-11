// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { HEADER_PRE_HYDRATION_STOP, isOverHero, trackHeaderOverHeroScript } from './header-over-hero';

describe('isOverHero', () => {
  it("is true while the hero's bottom edge is below the header's", () => {
    expect(isOverHero(0, 96, 900)).toBe(true);
    expect(isOverHero(803, 96, 900)).toBe(true);
    expect(isOverHero(804, 96, 900)).toBe(false);
    expect(isOverHero(2000, 96, 900)).toBe(false);
  });
});

describe('trackHeaderOverHeroScript', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function setUp(heroBottom: number) {
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

  it('stops listening when the hydrated header takes over', () => {
    const { header, hero } = setUp(900);
    (window as unknown as Record<string, () => void>)[HEADER_PRE_HYDRATION_STOP]();
    hero.getBoundingClientRect = () => ({ bottom: -1200 }) as DOMRect;
    window.dispatchEvent(new Event('scroll'));
    expect(header.getAttribute('data-over-hero')).toBe('true');
  });
});
