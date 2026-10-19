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
} as const;

export type MotionCategory = 'scroll-reveal' | 'text-reveal' | 'hover' | 'route-transition' | 'autoplay';

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
 */
export function scrollRevealMotion(
  prefersReducedMotion: boolean,
  options: ScrollRevealOptions = {}
): ScrollRevealMotion {
  const { y = 24, duration = DURATION.entrance, delay = 0, once = true, amount = 0.3, scale = 1 } = options;
  const viewport = { once, amount };

  if (prefersReducedMotion) {
    return {
      initial: false,
      whileInView: { opacity: 1, y: 0 },
      transition: INSTANT,
      viewport,
    };
  }

  const scaled = scale !== 1;
  return {
    initial: { opacity: 0, y, ...(scaled ? { scale } : {}) },
    whileInView: { opacity: 1, y: 0, ...(scaled ? { scale: 1 } : {}) },
    transition: { duration, delay, ease: EASE_ENTRANCE },
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
export function textRevealMotion(
  prefersReducedMotion: boolean,
  options: TextRevealOptions = {}
): TextRevealMotion {
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
