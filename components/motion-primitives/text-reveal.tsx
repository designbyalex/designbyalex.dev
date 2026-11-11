'use client';
import { motion, useReducedMotion } from 'motion/react';
import { type ElementType, Fragment, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { lineRevealMotion, textRevealMotion, type TextRevealOptions } from '@/lib/motion/reduced-motion';
import { useHydrated } from './use-hydrated';

export type TextRevealProps = TextRevealOptions & {
  children: string;
  className?: string;
  /** Block element to render the text into. Default 'p'. */
  as?: ElementType;
  /** Animate per word, per character, or per rendered line. Default 'word'. */
  per?: 'word' | 'char' | 'line';
};

const splitWords = (text: string) => text.split(/\s+/).filter((s) => s.length > 0);

/**
 * Reveals text with a staggered, per-segment entrance: a fade-up-and-deblur per
 * word or character, or — `per="line"` — the Reference's appear effect per
 * rendered line (fade + 60px rise, no blur, lines in order). Routes its motion
 * through {@link textRevealMotion} / {@link lineRevealMotion}; with
 * `prefers-reduced-motion` it renders the plain string with no animation.
 *
 * The server renders the plain string too, so the text is visible at first
 * paint and without JavaScript; the per-segment markup (and its hidden initial
 * state) only replaces it once the client has hydrated. Words are the only
 * inline-block segments: the spaces between them are ordinary text nodes, so a
 * wrapped line never starts with a space-wide block.
 *
 * Line mode keeps that word markup and measures each word's `offsetTop` after
 * hydration to group words into the lines the wrap actually produced at the
 * current width; every word on a line then animates with that line's delay, so
 * the line moves as one. Until measured, it renders the words in plain spans —
 * pixel-identical to the server text, so nothing shifts.
 *
 * The full string is always exposed to assistive tech via an sr-only copy.
 */
export function TextReveal({ children, className, as = 'p', per = 'word', stagger, delay, duration }: TextRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const hydrated = useHydrated();
  const isLine = per === 'line';
  const { container, item, animate } = isLine
    ? { container: undefined, ...lineRevealMotion(prefersReducedMotion, { stagger, delay, duration }) }
    : textRevealMotion(prefersReducedMotion, { stagger, delay, duration });

  const words = splitWords(children);
  const wordRefs = useRef<(HTMLElement | null)[]>([]);
  // lines[i] = the rendered line index of word i, measured post-hydration; null until measured.
  const [lines, setLines] = useState<number[] | null>(null);

  useEffect(() => {
    if (!isLine || !hydrated || !animate || lines) return;
    let lastTop: number | null = null;
    let lineIndex = -1;
    const measured = words.map((_, i) => {
      const top = wordRefs.current[i]?.offsetTop ?? lastTop ?? 0;
      if (lastTop === null || Math.abs(top - lastTop) > 1) {
        lineIndex += 1;
        lastTop = top;
      }
      return lineIndex;
    });
    setLines(measured);
  }, [isLine, hydrated, animate, lines, words]);

  const Tag = as;

  // Static: plain, fully-rendered text, no per-segment markup.
  if (!hydrated || !animate) {
    return <Tag className={cn(className)}>{children}</Tag>;
  }

  // Line mode's measurement pass: pixel-identical to the server text, so it can
  // paint; the effect above measures it, then the animated pass replaces it.
  if (isLine && !lines) {
    return (
      <Tag className={cn(className)}>
        {words.map((word, i) => (
          <Fragment key={`line-${i}`}>
            {i > 0 ? ' ' : null}
            <span
              ref={(el: HTMLElement | null) => {
                wordRefs.current[i] = el;
              }}
              className="inline-block"
            >
              {word}
            </span>
          </Fragment>
        ))}
      </Tag>
    );
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.p;

  const renderWord = (word: string, key: string, index: number) => {
    if (per === 'char') {
      return (
        <span key={key} className="inline-block">
          {word.split('').map((char, i) => (
            <motion.span key={`${key}-${i}`} aria-hidden="true" variants={item} className="inline-block">
              {char}
            </motion.span>
          ))}
        </span>
      );
    }
    return (
      <motion.span
        key={key}
        aria-hidden="true"
        variants={item}
        custom={isLine ? (lines?.[index] ?? 0) : undefined}
        className="inline-block"
      >
        {word}
      </motion.span>
    );
  };

  return (
    <MotionTag
      className={cn(className)}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      <span className="sr-only">{children}</span>
      {words.map((word, i) => (
        <Fragment key={`${per}-${i}`}>
          {i > 0 ? ' ' : null}
          {renderWord(word, `${per}-${i}`, i)}
        </Fragment>
      ))}
    </MotionTag>
  );
}
