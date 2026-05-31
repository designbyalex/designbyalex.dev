'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { scrollRevealMotion, type ScrollRevealOptions } from '@/lib/motion/reduced-motion';

export type ScrollRevealProps = ScrollRevealOptions & {
  children: React.ReactNode;
  className?: string;
  /** Element to render. Default 'div'. */
  as?: ElementType;
};

/**
 * Reveals its children as they scroll into view: a soft fade-and-rise.
 * Routes its motion through {@link scrollRevealMotion}, so with
 * `prefers-reduced-motion` it renders statically at its final position.
 */
export function ScrollReveal({ children, className, as = 'div', y, duration, delay, once, amount }: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { initial, whileInView, transition, viewport } = scrollRevealMotion(prefersReducedMotion, {
    y,
    duration,
    delay,
    once,
    amount,
  });

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag className={cn(className)} initial={initial} whileInView={whileInView} viewport={viewport} transition={transition}>
      {children}
    </MotionTag>
  );
}
