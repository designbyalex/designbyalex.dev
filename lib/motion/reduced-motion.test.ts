import { describe, expect, it } from 'vitest';
import {
  DURATION,
  EASE_ENTRANCE,
  EASE_MICRO,
  hoverMotion,
  scrollRevealMotion,
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

    it('honours overrides for distance, duration and delay', () => {
      const o = scrollRevealMotion(false, { y: 80, duration: 1, delay: 0.2 });
      expect(o.initial).toEqual({ opacity: 0, y: 80 });
      expect(o.transition.duration).toBe(1);
      expect(o.transition.delay).toBe(0.2);
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

    it('ignores motion overrides but keeps viewport options', () => {
      const o = scrollRevealMotion(true, { y: 80, duration: 1, once: false });
      expect(o.initial).toBe(false);
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
