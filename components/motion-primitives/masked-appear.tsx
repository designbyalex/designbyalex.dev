'use client';
import {
  type MaskedRiseOptions,
  heroImageAppearMotion,
  heroMaskRevealMotion,
  maskedRiseMotion,
} from '@/lib/motion/reduced-motion';
import { cn } from '@/lib/utils';
import { type TargetAndTransition, motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';

/**
 * The case-study entrance (#68, `docs/parity-audit.md` §2.5): on load and on
 * every navigation to a case study, the headline elements rise out of clipped
 * wrappers at constant opacity and the hero image opens from the horizontal
 * line under the title into its band. These are Framer's appear animations —
 * they play inside the route transition's incoming page (the View Transitions
 * new snapshot is live), so the page goes black, the title rises out of its
 * mask and the image band opens, with the header persisting. All three route
 * through the reduced-motion selectors, so with `prefers-reduced-motion` the
 * page renders at rest and the navigation is an instant swap.
 */

export type MaskedAppearProps = MaskedRiseOptions & {
  children: React.ReactNode;
  className?: string;
  /** Element to render. Default 'div'. */
  as?: ElementType;
};

/**
 * Rises its children into place at constant opacity on mount (Framer's
 * case-study appear: y 60/80 → 0, 1s, the appear curve). The parent supplies
 * the mask: an `overflow-clip` wrapper whose box doesn't move, so the content
 * emerges out of it. Routes through {@link maskedRiseMotion} — reduced motion
 * renders at rest.
 */
export function MaskedAppear({ children, className, as = 'div', y, duration, delay }: MaskedAppearProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { initial, animate, transition } = maskedRiseMotion(prefersReducedMotion, { y, duration, delay });
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag className={cn(className)} initial={initial} animate={animate} transition={transition} style={{ willChange: 'transform' }}>
      {children}
    </MotionTag>
  );
}

/**
 * The page-coloured layer over the desktop hero band that slides down off the
 * image on mount (Framer's "Hero Image Mask" Load → Out: 0.25s delay, 0.75s,
 * the hero-mask curve), opening the image from the horizontal line under the
 * title. The block positions it over the band inside the hero's clipping box
 * and hides it under the desktop breakpoint, where the Reference has no mask.
 * Routes through {@link heroMaskRevealMotion} — reduced motion rests it fully
 * slid off, so the image is simply there.
 */
export function HeroMaskReveal({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { initial, animate, transition } = heroMaskRevealMotion(prefersReducedMotion);

  return <motion.div aria-hidden className={cn(className)} initial={initial} animate={animate} transition={transition} style={{ willChange: 'transform' }} />;
}

// Motion animates CSS custom properties at runtime, but TargetAndTransition's type doesn't declare them.
type TargetWithVars = TargetAndTransition & { [key: `--${string}`]: string | number };

/**
 * The phone-width hero image's entrance: a fade-and-rise (Framer's "Hero Image
 * (Mobile)" appear: opacity 0 → 1, y 60 → 0, 1s, the appear curve). As with
 * the scroll-hero primitives, the values go to the `--hero-appear-y` and
 * `--hero-appear-opacity` CSS variables rather than the style itself, so the
 * block applies them under the desktop breakpoint only — the desktop image
 * stays still behind its sliding mask. Both variables rest at identity, and
 * reduced motion pins them there.
 */
export function HeroImageAppear({ children, className }: { children: React.ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { from, to, transition } = heroImageAppearMotion(prefersReducedMotion);
  const initial: TargetWithVars = { '--hero-appear-y': `${from.y}px`, '--hero-appear-opacity': from.opacity };
  const animate: TargetWithVars = { '--hero-appear-y': `${to.y}px`, '--hero-appear-opacity': to.opacity };

  return (
    <motion.div className={cn(className)} initial={prefersReducedMotion ? false : initial} animate={animate} transition={transition}>
      {children}
    </motion.div>
  );
}
