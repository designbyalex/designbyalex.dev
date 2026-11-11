'use client';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { countUpMotion } from '@/lib/motion/reduced-motion';
import { useHydrated } from './use-hydrated';

export interface CountUpProps {
  /** Value the number settles on (Framer's End). Non-finite values never animate. */
  end: number;
  /** Value the count starts from (Framer's Start). Default 0. */
  start?: number;
  /** Renders a point along the count as display text (prefix/suffix/commas live here). */
  format: (value: number) => string;
}

/**
 * A number that counts up once when it scrolls into view: Framer's "Number Counter"
 * (start → end over a 1s zero-bounce spring, triggered by the layer entering the
 * viewport, no replay). Routes its motion through {@link countUpMotion}.
 *
 * The server renders the final value, so the page reads correctly without JavaScript
 * and under `prefers-reduced-motion`; only after hydration, with motion allowed, does
 * the number rest at `start` until its first scroll into view. Tabular figures are
 * applied only while the count runs, so digits don't jitter mid-count and the resting
 * value keeps the font's default (proportional) figures.
 */
export function CountUp({ end, start = 0, format }: CountUpProps) {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { animate: shouldAnimate, transition } = countUpMotion(prefersReducedMotion);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(start);
  const [counting, setCounting] = useState(false);

  const animatable = shouldAnimate && Number.isFinite(end) && Number.isFinite(start) && start !== end;

  useEffect(() => {
    if (!hydrated || !animatable || !inView) return;
    setCounting(true);
    const controls = animate(start, end, {
      ...transition,
      onUpdate: (v) => setValue(Math.round(v)),
      onComplete: () => {
        setValue(end);
        setCounting(false);
      },
    });
    return () => controls.stop();
  }, [hydrated, animatable, inView, start, end]);

  const shown = !hydrated || !animatable ? end : inView ? value : start;

  return (
    <span ref={ref} style={counting ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
      {format(shown)}
    </span>
  );
}
