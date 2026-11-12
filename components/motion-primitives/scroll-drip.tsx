'use client';
import dynamic from 'next/dynamic';
import { useReducedMotion } from 'motion/react';
import * as React from 'react';
import { scrollDripMotion } from '@/lib/motion/reduced-motion';
import { useHydrated } from './use-hydrated';

// Client-only and after first paint: the WebGL layer is its own chunk, fetched post-hydration,
// so the server HTML and the first paint carry only the static fallback (invisible at rest).
const ScrollDripCanvas = dynamic(() => import('./scroll-drip-canvas'), { ssr: false });

export type ScrollDripProps = {
  /**
   * The static fallback — today's page-coloured SVG wave on `ScrollParallax`.
   * It is the server-rendered state, everything reduced motion ever sees, and
   * where the drip lands when WebGL2 is missing or its context is lost.
   */
  children: React.ReactNode;
  /** Classes for the canvas layer; the host positions it over the hero, inside its clip. */
  canvasClassName?: string;
};

/**
 * The home hero's Coalesce scroll drip (#143): a scroll-velocity-driven WebGL2
 * liquid mask that replaces the static Scroll Overlay wave when motion is
 * allowed, per `docs/research/home-drip-coalesce-reference.md`. Routes its
 * decision through {@link scrollDripMotion}, so with `prefers-reduced-motion`
 * no canvas mounts and no loop runs — only the fallback renders, at rest.
 *
 * The fallback stays mounted until the canvas has a live context and its first
 * frame on screen (`onActive`), so the swap never leaves a gap; a failure at
 * any point (`onFail`) retires the canvas for good.
 */
export function ScrollDrip({ children, canvasClassName }: ScrollDripProps) {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { animate } = scrollDripMotion(prefersReducedMotion);
  const [failed, setFailed] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const onActive = React.useCallback(() => setActive(true), []);
  const onFail = React.useCallback(() => {
    setFailed(true);
    setActive(false);
  }, []);
  const canvas = hydrated && animate && !failed;

  return (
    <>
      {!(canvas && active) && children}
      {canvas && <ScrollDripCanvas className={canvasClassName} onActive={onActive} onFail={onFail} />}
    </>
  );
}
