'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { hoverMotion, type HoverOptions } from '@/lib/motion/reduced-motion';

export type HoverLiftProps = HoverOptions & {
  children: React.ReactNode;
  className?: string;
  /** Element to render. Default 'div'. */
  as?: ElementType;
};

/**
 * Wraps content in a micro-interaction that lifts and scales on hover and
 * presses in on tap. Routes its motion through {@link hoverMotion}; with
 * `prefers-reduced-motion` the element stays put.
 */
export function HoverLift({ children, className, as = 'div', lift, scale, tapScale }: HoverLiftProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { whileHover, whileTap, transition } = hoverMotion(prefersReducedMotion, { lift, scale, tapScale });

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag className={cn(className)} whileHover={whileHover} whileTap={whileTap} transition={transition}>
      {children}
    </MotionTag>
  );
}
