'use client';
import { useReducedMotion } from 'motion/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { DECODE_GLYPHS, decodeScrambleMotion } from '@/lib/motion/reduced-motion';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

type DecodeTextProps = {
  /** The real text. Rendered plain by the server; also the `aria-label` while the scramble runs. */
  children: string;
  /** Element to render. Default 'h1' (the 404 headline). */
  as?: React.ElementType;
  className?: string;
  /** Classes a still-scrambling character wears (e.g. the mono decode-glyph look). */
  scrambleClassName?: string;
  /** Classes a character returns to once it settles. */
  settledClassName?: string;
};

type Frame = { char: string; settled: boolean }[];

/**
 * Decode scramble (#93): the server renders the text plain; when motion is
 * allowed, a layout effect splits it into per-character inline-block spans
 * before the first client paint. Each non-space character cycles random
 * glyphs from {@link DECODE_GLYPHS} and settles left to right into the real
 * text on the timings from {@link decodeScrambleMotion}; spaces stay spaces.
 * Once every character has settled the element returns to plain text. The
 * element carries `aria-label` while scrambling, so screen readers never read
 * the glyphs. Reduced motion (or no JavaScript) → the plain text stands.
 */
export function DecodeText({ children: text, as: Tag = 'h1', className, scrambleClassName, settledClassName }: DecodeTextProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { animate, interval, delay, step } = decodeScrambleMotion(prefersReducedMotion);
  const [frame, setFrame] = React.useState<Frame | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!animate) {
      // Reduced motion can flip on mid-scramble: rest on the plain text, never a frozen frame.
      setFrame(null);
      return;
    }
    const start = performance.now();
    /** Re-roll every unsettled glyph; true once the whole text has settled back to plain. */
    const roll = (): boolean => {
      const elapsed = performance.now() - start;
      let done = true;
      const next = Array.from(text, (char, i) => {
        if (char === ' ' || elapsed >= delay + i * step) return { char, settled: true };
        done = false;
        return { char: DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)], settled: false };
      });
      setFrame(done ? null : next);
      return done;
    };
    if (roll()) return;
    const timer = window.setInterval(() => {
      if (roll()) window.clearInterval(timer);
    }, interval);
    return () => window.clearInterval(timer);
  }, [animate, interval, delay, step, text]);

  if (!frame) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} aria-label={text}>
      {frame.map((c, i) =>
        c.char === ' ' ? (
          ' '
        ) : (
          // Position is the identity here: the slot keeps its place while its glyph re-rolls.
          <span key={`${text}-${i}`} aria-hidden className={cn('inline-block', c.settled ? settledClassName : scrambleClassName)}>
            {c.char}
          </span>
        )
      )}
    </Tag>
  );
}
