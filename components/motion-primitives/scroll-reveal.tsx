'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { scrollRevealMotion, type ScrollRevealOptions } from '@/lib/motion/reduced-motion';
import { useHydrated } from './use-hydrated';

export type ScrollRevealProps = ScrollRevealOptions & {
  children: React.ReactNode;
  className?: string;
  /** Element to render. Default 'div'. */
  as?: ElementType;
  /** Stable Section id, rendered as `data-section`. */
  sectionId?: string;
  /**
   * Render the children at rest (no hidden initial state) until the client has
   * hydrated, so they are visible at first paint and without JavaScript — for
   * content that must not depend on JS, like the hero tagline. The reveal then
   * runs from the first post-hydration render.
   */
  staticUntilHydrated?: boolean;
};

/**
 * Reveals its children as they scroll into view: a soft fade-and-rise.
 * Routes its motion through {@link scrollRevealMotion}, so with
 * `prefers-reduced-motion` it renders statically at its final position.
 */
export function ScrollReveal({
  children,
  className,
  as = 'div',
  y,
  duration,
  delay,
  once,
  amount,
  scale,
  ease,
  sectionId,
  staticUntilHydrated,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const hydrated = useHydrated();
  const { initial, whileInView, transition, viewport } = scrollRevealMotion(prefersReducedMotion, {
    y,
    duration,
    delay,
    once,
    amount,
    scale,
    ease,
  });

  const Tag = as;
  if (staticUntilHydrated && !hydrated) {
    return (
      <Tag className={cn(className)} data-section={sectionId}>
        {children}
      </Tag>
    );
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag className={cn(className)} data-section={sectionId} initial={initial} whileInView={whileInView} viewport={viewport} transition={transition}>
      {children}
    </MotionTag>
  );
}
