'use client';
import { type ScrollHeroPinOptions, type ScrollHeroZoomOptions, scrollHeroPinMotion, scrollHeroZoomMotion } from '@/lib/motion/reduced-motion';
import { type MotionStyle, type MotionValue, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export type ScrollHeroPinProps = ScrollHeroPinOptions & {
  children: React.ReactNode;
  className?: string;
};

// Motion animates CSS custom properties at runtime, but MotionStyle's type doesn't declare them.
type MotionStyleWithVars = MotionStyle & { [key: `--${string}`]: MotionValue<string> | MotionValue<number> };

/**
 * The case-study hero's scroll-linked mask expansion (`docs/parity-audit.md`
 * §2.5, A2). The Reference pins its "Hero Image" to the viewport (a fixed
 * 130vh layer) and drifts it at parallax speed 140 plus a page-long −800px
 * transform, so scrolling grows the image's visible band to the full viewport
 * while the in-flow title moves away, then the content scrolls over it. This
 * wrapper paints the same pixels from *inside* the section's clip by
 * translating down `scrollY × (2 − speed/100) + pageDrift × pageProgress`
 * (see {@link scrollHeroPinMotion}), so the section's own box ends the effect
 * and nothing stays fixed behind the rest of the page.
 *
 * The value is written to the `--scroll-hero-pin` CSS variable rather than the
 * transform itself, so the block decides by breakpoint (a CSS `transform`
 * reading the variable) where the pin applies — the phone layout keeps its
 * in-flow image. Routes through the reduced-motion selector: under
 * `prefers-reduced-motion` both terms are 0 and the image is a static
 * full-bleed layer.
 */
export function ScrollHeroPin({ children, className, speed, pageDrift }: ScrollHeroPinProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { pin, pageDrift: drift } = scrollHeroPinMotion(prefersReducedMotion, { speed, pageDrift });
  const { scrollY, scrollYProgress } = useScroll();
  const pinY = useTransform([scrollY, scrollYProgress], ([s, p]: number[]) => `${s * pin + p * drift}px`);
  // `will-change` is constant across renders so the server HTML matches the
  // first client render whatever the motion preference turns out to be.
  const style: MotionStyleWithVars = { willChange: 'transform' };
  style['--scroll-hero-pin'] = pinY;

  return (
    <motion.div className={className} style={style}>
      {children}
    </motion.div>
  );
}

export type ScrollHeroZoomProps = ScrollHeroZoomOptions & {
  children: React.ReactNode;
  className?: string;
};

/**
 * The phone-width half of the hero's scroll-linked expansion: the Reference's
 * phone hero is an in-flow box with the image zoomed to 120%, so there is no
 * viewport-pinned mask to grow — instead the crop relaxes toward the full
 * image (wrapper scale 1 → 1/restZoom) as the box scrolls from the top of the
 * viewport out of it. At rest the wrapper is exactly 1, the static CSS crop,
 * so the resting render is identical with or without motion.
 *
 * Writes the scale to the `--scroll-hero-zoom` CSS variable for the same
 * breakpoint gating as {@link ScrollHeroPin}. Reduced motion → the scale is
 * constant 1 and the crop never moves.
 */
export function ScrollHeroZoom({ children, className, restZoom }: ScrollHeroZoomProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { from, to } = scrollHeroZoomMotion(prefersReducedMotion, { restZoom });
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const zoom = useTransform(scrollYProgress, [0, 1], [from, to]);
  const style: MotionStyleWithVars = { willChange: 'transform' };
  style['--scroll-hero-zoom'] = zoom;

  return (
    <motion.div ref={ref} className={className} style={style}>
      {children}
    </motion.div>
  );
}
