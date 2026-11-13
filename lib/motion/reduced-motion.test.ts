import { describe, expect, it } from 'vitest';
import {
  DURATION,
  EASE_APPEAR,
  EASE_ENTRANCE,
  EASE_MICRO,
  autoplayMotion,
  countUpMotion,
  decodeScrambleMotion,
  hideOnScrollMotion,
  hoverMotion,
  lineRevealMotion,
  routeTransitionMotion,
  scrollDripMotion,
  scrollHeroPinMotion,
  scrollHeroZoomMotion,
  scrollParallaxMotion,
  scrollRevealMotion,
  slideAppearMotion,
  textRevealMotion,
} from './reduced-motion';

describe('scrollRevealMotion', () => {
  describe('motion allowed', () => {
    const m = scrollRevealMotion(false);

    it('starts hidden and below its final position', () => {
      expect(m.initial).toEqual({ opacity: 0, y: 24 });
    });

    it('animates to the visible, settled state', () => {
      expect(m.whileInView).toEqual({ opacity: 1, y: 0 });
    });

    it('uses the entrance easing over a non-zero duration', () => {
      expect(m.transition.duration).toBe(DURATION.entrance);
      expect(m.transition.ease).toBe(EASE_ENTRANCE);
    });

    it('honours overrides for distance, duration, delay and easing', () => {
      const o = scrollRevealMotion(false, { y: 80, duration: 1, delay: 0.2, ease: EASE_APPEAR });
      expect(o.initial).toEqual({ opacity: 0, y: 80 });
      expect(o.transition.duration).toBe(1);
      expect(o.transition.delay).toBe(0.2);
      expect(o.transition.ease).toBe(EASE_APPEAR);
    });

    it('adds a settle-from scale only when one is requested', () => {
      expect('scale' in (m.initial as object)).toBe(false);
      const o = scrollRevealMotion(false, { scale: 1.08, y: 0 });
      expect(o.initial).toEqual({ opacity: 0, y: 0, scale: 1.08 });
      expect(o.whileInView).toEqual({ opacity: 1, y: 0, scale: 1 });
    });

    it('passes viewport options through with defaults', () => {
      expect(m.viewport).toEqual({ once: true, amount: 0.3 });
      const o = scrollRevealMotion(false, { once: false, amount: 0.6 });
      expect(o.viewport).toEqual({ once: false, amount: 0.6 });
    });
  });

  describe('reduced motion', () => {
    const m = scrollRevealMotion(true);

    it('disables the initial animation', () => {
      expect(m.initial).toBe(false);
    });

    it('renders at the final state with no movement', () => {
      expect(m.whileInView).toEqual({ opacity: 1, y: 0 });
    });

    it('snaps instantly with no easing', () => {
      expect(m.transition.duration).toBe(0);
      expect(m.transition.ease).toBeUndefined();
    });

    it('ignores motion overrides but keeps viewport options, settling a scaled element at scale 1', () => {
      const o = scrollRevealMotion(true, { y: 80, duration: 1, once: false, scale: 1.2 });
      expect(o.initial).toBe(false);
      expect(o.whileInView).toEqual({ opacity: 1, y: 0, scale: 1 });
      expect(o.transition.duration).toBe(0);
      expect(o.viewport.once).toBe(false);
    });
  });
});

describe('textRevealMotion', () => {
  describe('motion allowed', () => {
    const m = textRevealMotion(false);

    it('flags the reveal as animating', () => {
      expect(m.animate).toBe(true);
    });

    it('staggers its children', () => {
      const transition = (m.container.visible as { transition: { staggerChildren: number } }).transition;
      expect(transition.staggerChildren).toBeGreaterThan(0);
    });

    it('reveals each segment from blurred and offset to crisp and settled', () => {
      expect(m.item.hidden).toEqual({ opacity: 0, y: '0.4em', filter: 'blur(6px)' });
      expect(m.item.visible).toMatchObject({ opacity: 1, y: 0, filter: 'blur(0px)' });
    });

    it('honours stagger, delay and duration overrides', () => {
      const o = textRevealMotion(false, { stagger: 0.2, delay: 0.5, duration: 1 });
      const transition = (o.container.visible as { transition: { staggerChildren: number; delayChildren: number } }).transition;
      expect(transition.staggerChildren).toBe(0.2);
      expect(transition.delayChildren).toBe(0.5);
      expect((o.item.visible as { transition: { duration: number } }).transition.duration).toBe(1);
    });
  });

  describe('reduced motion', () => {
    const m = textRevealMotion(true);

    it('flags the reveal as not animating', () => {
      expect(m.animate).toBe(false);
    });

    it('removes the stagger', () => {
      const transition = (m.container.visible as { transition: { staggerChildren: number } }).transition;
      expect(transition.staggerChildren).toBe(0);
    });

    it('keeps hidden and visible states identical and fully shown', () => {
      expect(m.item.hidden).toEqual(m.item.visible);
      expect(m.item.visible).toMatchObject({ opacity: 1, y: 0, filter: 'blur(0px)' });
    });

    it('ignores stagger overrides', () => {
      const o = textRevealMotion(true, { stagger: 0.2, delay: 0.5 });
      const transition = (o.container.visible as { transition: { staggerChildren: number } }).transition;
      expect(transition.staggerChildren).toBe(0);
    });
  });
});

describe('lineRevealMotion', () => {
  type VisibleFn = (line?: number) => { opacity: number; y: number; transition: { duration: number; delay: number; ease: unknown } };

  describe('motion allowed', () => {
    const m = lineRevealMotion(false);

    it('flags the reveal as animating', () => {
      expect(m.animate).toBe(true);
    });

    it("hides each word 60px below its place (the Reference's appear distance)", () => {
      expect(m.item.hidden).toEqual({ opacity: 0, y: 60 });
    });

    it('delays each line by its index on the appear curve over 1s', () => {
      const visible = m.item.visible as VisibleFn;
      expect(visible(0)).toEqual({ opacity: 1, y: 0, transition: { duration: 1, delay: 0, ease: EASE_APPEAR } });
      expect(visible(3).transition.delay).toBeCloseTo(0.75);
    });

    it('honours stagger, delay, duration and distance overrides', () => {
      const o = lineRevealMotion(false, { stagger: 0.5, delay: 0.3, duration: 2, y: 40 });
      expect(o.item.hidden).toEqual({ opacity: 0, y: 40 });
      const visible = o.item.visible as VisibleFn;
      expect(visible(2).transition).toEqual({ duration: 2, delay: 1.3, ease: EASE_APPEAR });
    });
  });

  describe('reduced motion', () => {
    const m = lineRevealMotion(true);

    it('flags the reveal as not animating', () => {
      expect(m.animate).toBe(false);
    });

    it('keeps hidden and visible states identical, fully shown and instant', () => {
      expect(m.item.hidden).toEqual(m.item.visible);
      expect(m.item.visible).toMatchObject({ opacity: 1, y: 0, transition: { duration: 0 } });
    });
  });
});

describe('hoverMotion', () => {
  describe('motion allowed', () => {
    const m = hoverMotion(false);

    it('lifts and scales on hover', () => {
      expect(m.whileHover).toEqual({ y: -2, scale: 1.02 });
    });

    it('presses in on tap', () => {
      expect(m.whileTap).toEqual({ scale: 0.98 });
    });

    it('uses the micro-interaction easing and duration', () => {
      expect(m.transition.duration).toBe(DURATION.micro);
      expect(m.transition.ease).toBe(EASE_MICRO);
    });

    it('honours lift, scale and tapScale overrides', () => {
      const o = hoverMotion(false, { lift: 6, scale: 1.1, tapScale: 0.9 });
      expect(o.whileHover).toEqual({ y: -6, scale: 1.1 });
      expect(o.whileTap).toEqual({ scale: 0.9 });
    });
  });

  describe('reduced motion', () => {
    const m = hoverMotion(true);

    it('has no hover transform', () => {
      expect(m.whileHover).toEqual({});
    });

    it('has no tap transform', () => {
      expect(m.whileTap).toEqual({});
    });

    it('snaps instantly with no easing', () => {
      expect(m.transition.duration).toBe(0);
      expect(m.transition.ease).toBeUndefined();
    });

    it('ignores hover overrides', () => {
      const o = hoverMotion(true, { lift: 6, scale: 1.1 });
      expect(o.whileHover).toEqual({});
    });
  });
});

describe('routeTransitionMotion', () => {
  describe('motion allowed', () => {
    const m = routeTransitionMotion(false);

    it('runs the navigation through a view transition', () => {
      expect(m.animate).toBe(true);
    });

    it('fades the old page out quickly and settles the new page in over longer', () => {
      expect(m.durationOut).toBe(DURATION.routeOut);
      expect(m.durationIn).toBe(DURATION.routeIn);
      expect(m.durationOut).toBeGreaterThan(0);
      expect(m.durationIn).toBeGreaterThan(m.durationOut);
    });

    it('uses the micro curve out and the entrance curve in', () => {
      expect(m.easeOut).toBe(EASE_MICRO);
      expect(m.easeIn).toBe(EASE_ENTRANCE);
    });
  });

  describe('reduced motion', () => {
    const m = routeTransitionMotion(true);

    it('does not start a view transition at all', () => {
      expect(m.animate).toBe(false);
    });

    it('has zero-length timings', () => {
      expect(m.durationOut).toBe(0);
      expect(m.durationIn).toBe(0);
    });
  });
});

describe('autoplayMotion', () => {
  describe('motion allowed', () => {
    it('plays when the block asks for autoplay', () => {
      expect(autoplayMotion(false, true)).toBe(true);
    });

    it('waits for a click when autoplay is off or unset', () => {
      expect(autoplayMotion(false, false)).toBe(false);
      expect(autoplayMotion(false, null)).toBe(false);
      expect(autoplayMotion(false, undefined)).toBe(false);
    });
  });

  describe('reduced motion', () => {
    it('never autoplays, whatever the block says', () => {
      expect(autoplayMotion(true, true)).toBe(false);
      expect(autoplayMotion(true, false)).toBe(false);
    });
  });
});

describe('hideOnScrollMotion', () => {
  it('slides the header fully out of view and back, on the micro curve', () => {
    const m = hideOnScrollMotion(false);
    expect(m.variants).toEqual({ shown: { y: 0 }, hidden: { y: '-100%' } });
    expect(m.transition.duration).toBe(DURATION.hideOnScroll);
    expect(m.transition.ease).toBe(EASE_MICRO);
  });

  it('reduced motion: both variants rest at y 0 with an instant transition', () => {
    const m = hideOnScrollMotion(true);
    expect(m.variants).toEqual({ shown: { y: 0 }, hidden: { y: 0 } });
    expect(m.transition.duration).toBe(0);
  });
});

describe('countUpMotion', () => {
  it('counts over Framer’s 1s zero-bounce spring with no delay', () => {
    const m = countUpMotion(false);
    expect(m.animate).toBe(true);
    expect(m.transition).toEqual({ type: 'spring', duration: DURATION.countUp, bounce: 0, delay: 0 });
  });

  it('reduced motion: never counts, instant transition', () => {
    const m = countUpMotion(true);
    expect(m.animate).toBe(false);
    expect(m.transition.duration).toBe(0);
  });
});

describe('slideAppearMotion', () => {
  it('fades and rises the new slide from 60px below over the entrance easing', () => {
    const m = slideAppearMotion(false);
    expect(m.initial).toEqual({ opacity: 0, y: 60 });
    expect(m.animate).toEqual({ opacity: 1, y: 0 });
    expect(m.transition.duration).toBe(DURATION.slideAppear);
    expect(m.transition.ease).toBe(EASE_ENTRANCE);
  });

  it('swaps instantly under reduced motion', () => {
    const m = slideAppearMotion(true);
    expect(m.initial).toBe(false);
    expect(m.animate).toEqual({ opacity: 1, y: 0 });
    expect(m.transition.duration).toBe(0);
  });
});

describe('decodeScrambleMotion', () => {
  it('scrambles on the 404 timings: 45ms re-rolls, character i settles at 250 + i × 38 ms', () => {
    expect(decodeScrambleMotion(false)).toEqual({ animate: true, interval: 45, delay: 250, step: 38 });
  });

  it('reduced motion: never scrambles — the server-rendered plain text stands', () => {
    const m = decodeScrambleMotion(true);
    expect(m.animate).toBe(false);
  });
});

describe('scrollHeroPinMotion', () => {
  it("pins the hero image inside its clip at Framer's speed: y = scrollY × (2 − speed/100), plus the page drift", () => {
    // The Reference's "Hero Image" is a fixed 130vh layer at speed 140 with a
    // page-long 0 → −800 transform; in-section that is +0.6 × scrollY − 800 × progress.
    const m = scrollHeroPinMotion(false);
    expect(m.pin).toBeCloseTo(0.6);
    expect(m.pageDrift).toBe(-800);
  });

  it('a layer at speed 200 would leave with the page: pin 0', () => {
    expect(scrollHeroPinMotion(false, { speed: 200 }).pin).toBe(0);
  });

  it('reduced motion: both terms 0 — a static full-bleed image', () => {
    const m = scrollHeroPinMotion(true);
    expect(m).toEqual({ pin: 0, pageDrift: 0 });
  });
});

describe('scrollHeroZoomMotion', () => {
  it('relaxes the resting 120% crop to the full image as the box scrolls out', () => {
    const m = scrollHeroZoomMotion(false);
    expect(m.from).toBe(1);
    expect(m.to).toBeCloseTo(1 / 1.2);
  });

  it('reduced motion: the wrapper never leaves 1, so only the static CSS crop renders', () => {
    expect(scrollHeroZoomMotion(true)).toEqual({ from: 1, to: 1 });
  });
});

describe('scrollParallaxMotion', () => {
  it("maps Framer's speed percentage to an extra translate per scrolled pixel", () => {
    // The Reference's Scroll Overlay rides the "Mid" layer at speed 150: y = -scrollY × 0.5.
    expect(scrollParallaxMotion(false, { speed: 150 }).factor).toBe(0.5);
    expect(scrollParallaxMotion(false, { speed: 50 }).factor).toBe(-0.5);
  });

  it('defaults to speed 100 — scrolling with the page, no extra motion', () => {
    expect(scrollParallaxMotion(false).factor).toBe(0);
  });

  it('reduced motion: the layer rests in its layout position at any speed', () => {
    expect(scrollParallaxMotion(true, { speed: 150 }).factor).toBe(0);
  });
});

describe('scrollDripMotion', () => {
  it('lets the drip canvas mount and run when motion is allowed', () => {
    expect(scrollDripMotion(false)).toEqual({ animate: true });
  });

  it('reduced motion: no canvas mounts and no loop runs — the static fallback only', () => {
    expect(scrollDripMotion(true)).toEqual({ animate: false });
  });
});
