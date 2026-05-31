'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { textRevealMotion, type TextRevealOptions } from '@/lib/motion/reduced-motion';

export type TextRevealProps = TextRevealOptions & {
  children: string;
  className?: string;
  /** Block element to render the text into. Default 'p'. */
  as?: ElementType;
  /** Animate per word or per character. Default 'word'. */
  per?: 'word' | 'char';
};

const splitWords = (text: string) => text.split(/(\s+)/).filter((s) => s.length > 0);

/**
 * Reveals text with a staggered, per-segment fade-up-and-deblur.
 * Routes its motion through {@link textRevealMotion}; with
 * `prefers-reduced-motion` it renders the plain string with no animation.
 * The full string is always exposed to assistive tech via an sr-only copy.
 */
export function TextReveal({ children, className, as = 'p', per = 'word', stagger, delay, duration }: TextRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { container, item, animate } = textRevealMotion(prefersReducedMotion, { stagger, delay, duration });

  const Tag = as;

  // Static fallback: plain, fully-rendered text, no per-segment markup.
  if (!animate) {
    return <Tag className={cn(className)}>{children}</Tag>;
  }

  const words = splitWords(children);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.p;

  const renderSegment = (segment: string, key: string) => {
    if (per === 'char') {
      return (
        <span key={key} className="inline-block whitespace-pre">
          {segment.split('').map((char, i) => (
            <motion.span key={`${key}-${i}`} aria-hidden="true" variants={item} className="inline-block whitespace-pre">
              {char}
            </motion.span>
          ))}
        </span>
      );
    }
    return (
      <motion.span key={key} aria-hidden="true" variants={item} className="inline-block whitespace-pre">
        {segment}
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
      {words.map((segment, i) => renderSegment(segment, `${per}-${i}`))}
    </MotionTag>
  );
}
