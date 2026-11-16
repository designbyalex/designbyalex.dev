import type { TargetAndTransition, Transition, Variants } from 'motion/react';

/**
 * Reduced-motion selector (S2 / #6).
 *
 * A pure, framework-agnostic module: given a motion category and the user's
 * `prefers-reduced-motion` preference, it returns the `motion/react` props for
 * that category. When reduced motion is preferred, every category collapses to
 * a static, non-animated fallback (final state, zero-duration transition, no
 * hover transform) so the primitives degrade gracefully everywhere.
 *
 * This module never touches the DOM or React — the preference boolean is read
 * by the primitives (via `useReducedMotion`) and passed in. That keeps the
 * decision logic unit-testable in a node environment.
 */

type CubicBezier = [number, number, number, number];

/** Fast decelerate/ease-out for micro-interactions — from the S0 design audit. */
export const EASE_MICRO: CubicBezier = [0.2, 0, 0, 1];
/** Expressive ease-out for entrance choreography (scroll + text reveals). */
export const EASE_ENTRANCE: CubicBezier = [0.16, 1, 0.3, 1];
/** The Reference's appear curve (Framer's rise-into-place entrances on the home hero). */
export const EASE_APPEAR: CubicBezier = [0.2, 0.8, 0.2, 0.8];

/** Default durations, in seconds. */
export const DURATION = {
  /** hover / pressed state changes (audit: ~100–150ms) */
  micro: 0.15,
  /** scroll-reveal entrance */
  entrance: 0.6,
  /** per-segment text reveal */
  segment: 0.5,
  /** route transition: outgoing page fade (mirrored in styles.css) */
  routeOut: 0.18,
  /** route transition: incoming page fade-and-rise (mirrored in styles.css) */
  routeIn: 0.42,
  /** header sliding out of / back into view on scroll */
  hideOnScroll: 0.3,
  /** a carousel slide's content appearing in place */
  slideAppear: 0.6,
  /** a metric card's number counting up (Framer's Number Counter: a 1s spring) */
  countUp: 1,
} as const;

export type MotionCategory =
  | 'scroll-reveal'
  | 'text-reveal'
  | 'hover'
  | 'route-transition'
  | 'autoplay'
  | 'hide-on-scroll'
  | 'slide-appear'
  | 'count-up'
  | 'scroll-parallax'
  | 'scroll-drip'
  | 'scroll-hero'
  | 'decode-scramble'
  | 'smooth-scroll';

/** Shared transition used by every category's static fallback. */
const INSTANT: Transition = { duration: 0 };

// ─── scroll-reveal ──────────────────────────────────────────────────────────

export interface ScrollRevealOptions {
  /** Vertical offset (px) the element rises from. Default 24. */
  y?: number;
  /** Entrance duration in seconds. Default {@link DURATION.entrance}. */
  duration?: number;
  /** Delay before the reveal, in seconds. Default 0. */
  delay?: number;
  /** Reveal only the first time it enters the viewport. Default true. */
  once?: boolean;
  /** Fraction of the element that must be visible to trigger. Default 0.3. */
  amount?: number;
  /**
   * Scale the element settles from (e.g. 1.08 for a slow zoom-out on a hero
   * image). Default 1, which leaves scale untouched.
   */
  scale?: number;
  /** Entrance easing. Default {@link EASE_ENTRANCE}. */
  ease?: CubicBezier;
}

export interface ScrollRevealMotion {
  initial: TargetAndTransition | false;
  whileInView: TargetAndTransition;
  transition: Transition;
  viewport: { once: boolean; amount: number };
}

/**
 * Props for an element that fades/rises into view on scroll.
 * Reduced motion → starts at its final state (`initial: false`) and snaps in.
 * The reduced `whileInView` still names every property the hidden state sets
 * (scale included), so an element that mounted hidden (server HTML, before
 * hydration) settles fully at rest rather than keeping its starting scale.
 */
export function scrollRevealMotion(prefersReducedMotion: boolean, options: ScrollRevealOptions = {}): ScrollRevealMotion {
  const { y = 24, duration = DURATION.entrance, delay = 0, once = true, amount = 0.3, scale = 1, ease = EASE_ENTRANCE } = options;
  const viewport = { once, amount };
  const scaled = scale !== 1;

  if (prefersReducedMotion) {
    return {
      initial: false,
      whileInView: { opacity: 1, y: 0, ...(scaled ? { scale: 1 } : {}) },
      transition: INSTANT,
      viewport,
    };
  }

  return {
    initial: { opacity: 0, y, ...(scaled ? { scale } : {}) },
    whileInView: { opacity: 1, y: 0, ...(scaled ? { scale: 1 } : {}) },
    transition: { duration, delay, ease },
    viewport,
  };
}

// ─── text-reveal ──────────────────────────────────────────────────────────────

export interface TextRevealOptions {
  /** Seconds between each segment. Default 0.05. */
  stagger?: number;
  /** Delay before the first segment, in seconds. Default 0. */
  delay?: number;
  /** Per-segment animation duration in seconds. Default {@link DURATION.segment}. */
  duration?: number;
}

export interface TextRevealMotion {
  container: Variants;
  item: Variants;
  /** True when the text actually animates; false under reduced motion. */
  animate: boolean;
}

/**
 * Container + item variants for a staggered, per-segment text reveal.
 * Reduced motion → no stagger and identical hidden/visible states, so the text
 * renders fully visible and still.
 */
export function textRevealMotion(prefersReducedMotion: boolean, options: TextRevealOptions = {}): TextRevealMotion {
  const { stagger = 0.05, delay = 0, duration = DURATION.segment } = options;

  if (prefersReducedMotion) {
    const shown: TargetAndTransition = { opacity: 1, y: 0, filter: 'blur(0px)', transition: INSTANT };
    return {
      container: {
        hidden: {},
        visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
      },
      item: { hidden: shown, visible: shown },
      animate: false,
    };
  }

  return {
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
    },
    item: {
      hidden: { opacity: 0, y: '0.4em', filter: 'blur(6px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration, ease: EASE_ENTRANCE } },
    },
    animate: true,
  };
}

// ─── hover ────────────────────────────────────────────────────────────────────

export interface HoverOptions {
  /** Pixels the element rises on hover. Default 2. */
  lift?: number;
  /** Scale factor on hover. Default 1.02. */
  scale?: number;
  /** Scale factor while pressed. Default 0.98. */
  tapScale?: number;
}

export interface HoverMotion {
  whileHover: TargetAndTransition;
  whileTap: TargetAndTransition;
  transition: Transition;
}

/**
 * Props for an interactive element that lifts/scales on hover and presses on tap.
 * Reduced motion → empty hover/tap targets and a zero-duration transition, so
 * the element never moves.
 */
export function hoverMotion(prefersReducedMotion: boolean, options: HoverOptions = {}): HoverMotion {
  const { lift = 2, scale = 1.02, tapScale = 0.98 } = options;

  if (prefersReducedMotion) {
    return { whileHover: {}, whileTap: {}, transition: INSTANT };
  }

  return {
    whileHover: { y: -lift, scale },
    whileTap: { scale: tapScale },
    transition: { duration: DURATION.micro, ease: EASE_MICRO },
  };
}

// ─── route-transition ─────────────────────────────────────────────────────────

export interface RouteTransitionMotion {
  /**
   * Whether a client-side navigation should run through the View Transitions
   * API (`document.startViewTransition`) at all. False under reduced motion,
   * so the link falls back to a plain `next/link` navigation: instant, with no
   * snapshot freeze.
   */
  animate: boolean;
  /** Seconds the outgoing page takes to fade out. 0 under reduced motion. */
  durationOut: number;
  /** Seconds the incoming page takes to fade and rise in. 0 under reduced motion. */
  durationIn: number;
  /** Easing for the outgoing fade (micro curve). */
  easeOut: CubicBezier;
  /** Easing for the incoming rise (entrance curve). */
  easeIn: CubicBezier;
}

/**
 * Decision for an animated route change (home ⇄ case study).
 *
 * The animation itself is CSS on the `::view-transition-old/new(root)`
 * pseudo-elements in `styles.css`; this selector owns the *decision* and the
 * canonical timings so the behaviour is unit-testable. Reduced motion → no
 * view transition is started and every duration is zero.
 */
export function routeTransitionMotion(prefersReducedMotion: boolean): RouteTransitionMotion {
  if (prefersReducedMotion) {
    return { animate: false, durationOut: 0, durationIn: 0, easeOut: EASE_MICRO, easeIn: EASE_ENTRANCE };
  }

  return {
    animate: true,
    durationOut: DURATION.routeOut,
    durationIn: DURATION.routeIn,
    easeOut: EASE_MICRO,
    easeIn: EASE_ENTRANCE,
  };
}

// ─── autoplay ─────────────────────────────────────────────────────────────────

/**
 * Whether embedded media (the `video` block) may start playing on its own.
 * Autoplay is motion the visitor didn't ask for, so reduced motion → never,
 * whatever the block's Auto Play setting says; otherwise the setting decides.
 */
export function autoplayMotion(prefersReducedMotion: boolean, autoPlay: boolean | null | undefined): boolean {
  if (prefersReducedMotion) return false;
  return Boolean(autoPlay);
}

// ─── slide-appear ─────────────────────────────────────────────────────────────

export interface SlideAppearMotion {
  initial: TargetAndTransition | false;
  animate: TargetAndTransition;
  transition: Transition;
}

/**
 * Props for a carousel slide's content appearing in place when the visitor changes slide: Framer's
 * appear effect, a fade-and-rise from 60px below. Reduced motion → no initial state, so the new slide
 * is simply there.
 */
export function slideAppearMotion(prefersReducedMotion: boolean): SlideAppearMotion {
  if (prefersReducedMotion) {
    return { initial: false, animate: { opacity: 1, y: 0 }, transition: INSTANT };
  }

  return {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION.slideAppear, ease: EASE_ENTRANCE },
  };
}

// ─── count-up ─────────────────────────────────────────────────────────────────

export interface CountUpMotion {
  /** Whether the number ticks up at all; false → it rests on the final value. */
  animate: boolean;
  /** Framer's Number Counter transition: a 1s zero-bounce spring, no delay. */
  transition: Transition;
}

/**
 * Decision for a metric card's number counting up when it scrolls into view
 * (Framer's "Number Counter": start → end on `layerInView`, once, over a
 * `{ type: 'spring', duration: 1, bounce: 0, delay: 0 }` transition).
 * Reduced motion → no count; the number shows its final value from first paint.
 */
export function countUpMotion(prefersReducedMotion: boolean): CountUpMotion {
  if (prefersReducedMotion) {
    return { animate: false, transition: INSTANT };
  }

  return {
    animate: true,
    transition: { type: 'spring', duration: DURATION.countUp, bounce: 0, delay: 0 },
  };
}

// ─── decode-scramble ──────────────────────────────────────────────────────────

/** Glyph pool a still-decoding character cycles through (the 404 headline, #93). */
export const DECODE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/_*<>';

export interface DecodeScrambleMotion {
  /** Whether the text scrambles at all; false → it rests as plain text. */
  animate: boolean;
  /** ms between glyph re-rolls. */
  interval: number;
  /** ms before the first character settles. */
  delay: number;
  /** ms between one character settling and the next. */
  step: number;
}

/**
 * Decision for a decode scramble: each character shows random glyphs that
 * settle left to right into the real text (character i settles at
 * `delay + i × step` ms). Reduced motion → no scramble, so the text stays
 * exactly as the server rendered it.
 */
export function decodeScrambleMotion(prefersReducedMotion: boolean): DecodeScrambleMotion {
  if (prefersReducedMotion) {
    return { animate: false, interval: 0, delay: 0, step: 0 };
  }

  return { animate: true, interval: 45, delay: 250, step: 38 };
}

// ─── scroll-parallax ──────────────────────────────────────────────────────────

export interface ScrollParallaxOptions {
  /**
   * Scroll speed as a percentage of the page's, Framer's parallax unit: 100
   * scrolls with the page (no extra motion), 150 moves 1.5× as fast, 50 lags
   * at half speed. Default 100.
   */
  speed?: number;
}

export interface ScrollParallaxMotion {
  /**
   * The element's extra translateY per scrolled pixel: `y = -scrollY × factor`
   * (Framer's page-effect transform for `adjustPosition: false`, `offset: 0`).
   * 0 → the element rests in its layout position.
   */
  factor: number;
}

/**
 * Decision for a layer that scrolls at its own speed (Framer's parallax page
 * effect — on the Reference, the home hero's page-coloured "Scroll Overlay"
 * wave rides it at speed 150, melting the hero into the projects).
 * Reduced motion → factor 0, so the layer sits still in its layout position.
 */
export function scrollParallaxMotion(prefersReducedMotion: boolean, options: ScrollParallaxOptions = {}): ScrollParallaxMotion {
  const { speed = 100 } = options;

  if (prefersReducedMotion) {
    return { factor: 0 };
  }

  return { factor: speed / 100 - 1 };
}

// ─── scroll-drip ──────────────────────────────────────────────────────────────

export interface ScrollDripMotion {
  /**
   * Whether the drip's WebGL canvas may mount and its render loop may run at
   * all. False → only the static fallback renders (today's page-coloured wave
   * on `ScrollParallax`, itself at rest under reduced motion), so the hero
   * rests exactly as before from first paint: no canvas, no loop.
   */
  animate: boolean;
}

/**
 * Decision for the home hero's Coalesce scroll drip (#143): a scroll-velocity-
 * driven liquid mask that replaces the static Scroll Overlay wave when motion
 * is allowed. The drip is pure motion with no informational content, so under
 * reduced motion nothing of it may exist — not even a resting canvas.
 */
export function scrollDripMotion(prefersReducedMotion: boolean): ScrollDripMotion {
  return { animate: !prefersReducedMotion };
}

// ─── scroll-hero ──────────────────────────────────────────────────────────────

export interface ScrollHeroPinOptions {
  /**
   * Scroll speed of the pinned hero image as a percentage of the page's,
   * Framer's parallax unit (the Reference's case-study "Hero Image" rides at
   * 140). Default 140.
   */
  speed?: number;
  /**
   * Extra translateY (px) the image accrues across the page's *full* scroll
   * (the Reference's page-long scroll transform: y 0 → −800 from page top to
   * page bottom). Default −800.
   */
  pageDrift?: number;
}

export interface ScrollHeroPinMotion {
  /**
   * Multiplier on `scrollY` for the image inside its clipping section:
   * `y = scrollY × pin + pageDrift × pageProgress`. The Reference renders the
   * image as a viewport-fixed 130vh layer drifting at
   * `-scrollY × (speed/100 − 1)` under the in-flow headline; translating the
   * in-section layer by `scrollY × (2 − speed/100)` instead paints the same
   * pixels while the section's own clip ends the effect. 0 → the image rests
   * in its layout position.
   */
  pin: number;
  /** px of extra drift across the page's full scroll progress. 0 → none. */
  pageDrift: number;
}

/**
 * Decision for the case-study hero image that stays pinned to the viewport
 * while the title scrolls away, so its visible band grows to fill the viewport
 * before the content scrolls over it (`docs/parity-audit.md` §2.5, A2).
 * Reduced motion → both terms 0: a static full-bleed image.
 */
export function scrollHeroPinMotion(prefersReducedMotion: boolean, options: ScrollHeroPinOptions = {}): ScrollHeroPinMotion {
  const { speed = 140, pageDrift = -800 } = options;

  if (prefersReducedMotion) {
    return { pin: 0, pageDrift: 0 };
  }

  return { pin: 2 - speed / 100, pageDrift };
}

export interface ScrollHeroZoomOptions {
  /**
   * Zoom the image rests at inside its clipped box (the phone hero's 120%
   * crop, applied by CSS). Default 1.2.
   */
  restZoom?: number;
}

export interface ScrollHeroZoomMotion {
  /** Wrapper scale while the box is below the top of the viewport: 1, the CSS crop alone. */
  from: number;
  /**
   * Wrapper scale by the time the box leaves the viewport: `1 / restZoom`
   * relaxes the crop to the full image; 1 under reduced motion, so the crop
   * never moves.
   */
  to: number;
}

/**
 * Decision for the phone-width hero image un-zooming as it scrolls out: the
 * 120% resting crop relaxes toward the full image, so the visible image grows
 * with scroll where the viewport-pinned expansion has no room. Reduced motion
 * → the wrapper stays at 1 and only the static CSS crop renders.
 */
export function scrollHeroZoomMotion(prefersReducedMotion: boolean, options: ScrollHeroZoomOptions = {}): ScrollHeroZoomMotion {
  const { restZoom = 1.2 } = options;

  if (prefersReducedMotion) {
    return { from: 1, to: 1 };
  }

  return { from: 1, to: 1 / restZoom };
}

// ─── smooth-scroll ────────────────────────────────────────────────────────────

/**
 * Lenis' own expo-out curve, the easing of Alex's Cinematic pick (#161,
 * `docs/research/smooth-scroll.md`): fast off the mark, a long soft landing.
 */
export const easeExpoOut = (t: number): number => Math.min(1, 1.001 - 2 ** (-10 * t));

/** Seconds every wheel glide and the hero's `#works` glide take (Cinematic). */
export const SMOOTH_SCROLL_DURATION = 1.2;

/**
 * The Lenis options Alex picked (Cinematic, wheel 1.2×), written out here so
 * this module stays free of the library. Each wheel or trackpad event starts a
 * fresh 1.2 s expo-out glide; touch keeps the device's own momentum; in-page
 * anchors (the skip link) stay native; the frame loop drives Lenis, not its
 * own `requestAnimationFrame`.
 */
export interface SmoothScrollOptions {
  duration: number;
  easing: (t: number) => number;
  wheelMultiplier: number;
  smoothWheel: boolean;
  syncTouch: boolean;
  anchors: boolean;
  autoRaf: boolean;
  stopInertiaOnNavigate: boolean;
}

export type SmoothScrollMotion =
  | {
      /** Lenis is created and drives the page's scroll. */
      enabled: true;
      options: SmoothScrollOptions;
    }
  | { enabled: false };

/**
 * Decision for sitewide smooth scrolling (#161). Reduced motion → no Lenis at
 * all, so the wheel, the trackpad and every jump are the browser's own. Lenis'
 * `respectReducedMotion` alone is not enough: it still routes the wheel
 * through a short glide.
 */
export function smoothScrollMotion(prefersReducedMotion: boolean): SmoothScrollMotion {
  if (prefersReducedMotion) {
    return { enabled: false };
  }

  return {
    enabled: true,
    options: {
      duration: SMOOTH_SCROLL_DURATION,
      easing: easeExpoOut,
      wheelMultiplier: 1.2,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
      autoRaf: false,
      stopInertiaOnNavigate: true,
    },
  };
}

// ─── hide-on-scroll ───────────────────────────────────────────────────────────

export interface HideOnScrollMotion {
  /** `shown` / `hidden` variants for the fixed header. */
  variants: Variants;
  transition: Transition;
}

/**
 * Props for the header that slides up out of view on scroll down and back on
 * scroll up (the decision itself is `lib/motion/scroll-visibility.ts`).
 * Reduced motion → both variants are the resting position, so the header never
 * moves even if a `hidden` state were ever requested.
 */
export function hideOnScrollMotion(prefersReducedMotion: boolean): HideOnScrollMotion {
  if (prefersReducedMotion) {
    return { variants: { shown: { y: 0 }, hidden: { y: 0 } }, transition: INSTANT };
  }

  return {
    variants: { shown: { y: 0 }, hidden: { y: '-100%' } },
    transition: { duration: DURATION.hideOnScroll, ease: EASE_MICRO },
  };
}
