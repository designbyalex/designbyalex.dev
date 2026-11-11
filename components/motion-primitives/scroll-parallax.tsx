'use client';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { scrollParallaxMotion, type ScrollParallaxOptions } from '@/lib/motion/reduced-motion';

export type ScrollParallaxProps = ScrollParallaxOptions & {
  children: React.ReactNode;
  className?: string;
};

/**
 * Scrolls its children at their own speed relative to the page: Framer's
 * parallax page effect (`__framer__speed`, a percentage of the scroll speed).
 * The extra offset is a pure translateY off the page's `scrollY` — a transform
 * the compositor can apply, with no per-frame layout. Routes its decision
 * through {@link scrollParallaxMotion}, so with `prefers-reduced-motion` the
 * layer rests in its layout position.
 */
export function ScrollParallax({ children, className, speed }: ScrollParallaxProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { factor } = scrollParallaxMotion(prefersReducedMotion, { speed });
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => -v * factor);

  return (
    // `will-change` is constant across renders (and the Reference's own markup carries it), so the
    // server HTML matches the first client render whatever the motion preference turns out to be.
    <motion.div className={className} style={{ y, willChange: 'transform' }}>
      {children}
    </motion.div>
  );
}
