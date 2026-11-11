// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HERO_READY_ATTRIBUTE, HERO_READY_CAP_MS, armHeroEntrance, armHeroEntranceScript } from './hero-entrance';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function hero(decode?: () => Promise<void>) {
  const root = document.createElement('div');
  const image = document.createElement('img');
  if (decode) image.decode = decode;
  root.append(image);
  return root;
}

describe('armHeroEntrance', () => {
  afterEach(() => vi.useRealTimers());

  it('marks the hero ready once its image has decoded, not before', async () => {
    let resolve!: () => void;
    const root = hero(() => new Promise<void>((r) => (resolve = r)));
    armHeroEntrance(root);
    await flush();
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(false);
    resolve();
    await flush();
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(true);
  });

  it('opens anyway when the image fails to load or decode', async () => {
    const root = hero(() => Promise.reject(new Error('EncodingError')));
    armHeroEntrance(root);
    await flush();
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(true);
  });

  it('opens after the cap when the image is slow', () => {
    vi.useFakeTimers();
    const root = hero(() => new Promise<void>(() => {}));
    armHeroEntrance(root);
    vi.advanceTimersByTime(HERO_READY_CAP_MS - 1);
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(true);
  });

  it('is ready at once when the hero has no image', () => {
    const root = document.createElement('div');
    armHeroEntrance(root);
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(true);
  });

  it('does nothing for a missing root or a hero already armed by the inline script', () => {
    expect(() => armHeroEntrance(null)).not.toThrow();
    const decode = vi.fn(() => Promise.resolve());
    const root = hero(decode);
    root.setAttribute(HERO_READY_ATTRIBUTE, '');
    armHeroEntrance(root);
    expect(decode).not.toHaveBeenCalled();
  });
});

describe('armHeroEntranceScript', () => {
  it('is self-contained: the inline script arms the element it sits in', async () => {
    const root = hero(() => Promise.resolve());
    const script = document.createElement('script');
    root.append(script);
    document.body.append(root);
    // jsdom doesn't run inline scripts; evaluate it with currentScript pointing at the element.
    Object.defineProperty(document, 'currentScript', { configurable: true, get: () => script });
    new Function(armHeroEntranceScript)();
    await flush();
    expect(root.hasAttribute(HERO_READY_ATTRIBUTE)).toBe(true);
    root.remove();
  });
});
