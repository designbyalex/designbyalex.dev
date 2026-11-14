'use client';
import { useInView } from 'motion/react';
import { type AnimationEvent, type CSSProperties, type ReactNode, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type SettleRevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds before the settle starts. Default 0.12 (the picker specimen). */
  delay?: number;
  /** Fraction of the box in view that starts it. Default 0.3, as ScrollReveal. */
  amount?: number;
};

/**
 * Case-study image entrance (#167, "zoom settle"): once the box scrolls into view, every
 * `.settle-target` inside it fades in while settling from `scale(1.12)` to 1 within its clipped box.
 * The motion is CSS (`[data-settle]` in styles.css), triggered by motion's `useInView` as ScrollReveal's
 * reveals are, and gated on `(scripting: enabled)` and `(prefers-reduced-motion: no-preference)`: without
 * JavaScript or under reduced motion the images are at rest from first paint. Mark the element that
 * should scale (usually the `<Image>`) with `settle-target`; its clipping parent keeps the zoom inside.
 */
export function SettleReveal({ children, className, delay = 0.12, amount = 0.3 }: SettleRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  // Once played, the box goes 'done' and its targets are plain again, so content swapped in later (the
  // carousel's next slide) doesn't settle a second time.
  const [done, setDone] = useState(false);
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName === 'settle-in') setDone(true);
  };
  return (
    <div
      ref={ref}
      className={cn(className)}
      data-settle={done ? 'done' : inView ? 'play' : ''}
      onAnimationEnd={onAnimationEnd}
      style={{ '--settle-delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}
