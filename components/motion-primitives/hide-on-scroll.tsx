'use client';
import { motion, useReducedMotion } from 'motion/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { hideOnScrollMotion } from '@/lib/motion/reduced-motion';
import {
  INITIAL_SCROLL_VISIBILITY,
  reduceScrollVisibility,
  type ScrollVisibilityState,
} from '@/lib/motion/scroll-visibility';

export type HideOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  /** Minimum reversal (px) before the state flips. See `reduceScrollVisibility`. */
  threshold?: number;
  /** Below this y (px) the content always shows. See `reduceScrollVisibility`. */
  nearTop?: number;
};

/**
 * Fixed chrome (the header) that slides out of view on scroll down and back in
 * on scroll up, as the Reference site does. The decision is the pure
 * {@link reduceScrollVisibility}; the motion is {@link hideOnScrollMotion}, so
 * with `prefers-reduced-motion` the content stays put. Keyboard focus moving
 * into the content brings it back, so hidden links are never focused offscreen.
 */
export function HideOnScroll({ children, className, threshold, nearTop }: HideOnScrollProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [state, setState] = React.useState<ScrollVisibilityState>(INITIAL_SCROLL_VISIBILITY);

  React.useEffect(() => {
    if (prefersReducedMotion) return;

    let frame = 0;
    const sample = () => {
      frame = 0;
      const y = window.scrollY;
      setState((s) => reduceScrollVisibility(s, { y, threshold, nearTop, prefersReducedMotion }));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(sample);
    };

    // Anchor at wherever the page is now (scroll restoration can start mid-page).
    setState((s) => ({ ...s, previousY: window.scrollY }));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion, threshold, nearTop]);

  const visibility = prefersReducedMotion ? 'shown' : state.visibility;
  const { variants, transition } = hideOnScrollMotion(prefersReducedMotion);

  return (
    <motion.div
      className={cn(className)}
      data-visibility={visibility}
      variants={variants}
      initial={false}
      animate={visibility}
      transition={transition}
      onFocusCapture={() => setState((s) => (s.visibility === 'shown' ? s : { ...s, visibility: 'shown' }))}
    >
      {children}
    </motion.div>
  );
}
