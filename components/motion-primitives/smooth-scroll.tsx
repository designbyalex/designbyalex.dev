'use client';
import type Lenis from 'lenis';
import { type LenisRef, ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { SMOOTH_SCROLL_DURATION, type SmoothScrollOptions, easeExpoOut, smoothScrollMotion } from '@/lib/motion/reduced-motion';
import { cancelFrame, frame } from 'motion/react';
import { usePathname } from 'next/navigation';
import { type MouseEvent, useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useHydrated } from './use-hydrated';

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeReducedMotion = (onChange: () => void) => {
  const mql = window.matchMedia(REDUCE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};

/**
 * The OS setting, live. Motion's `useReducedMotion` reads it once per mount, but
 * Lenis must tear down (or come back) the moment the setting changes.
 */
const usePrefersReducedMotionLive = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );

/** Keys the browser scrolls the page with. Lenis has no keyboard handler, so these stay native. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/**
 * Ends a glide in progress where it is. While Lenis glides it ignores native
 * `scroll` events and keeps writing its own position, so a native scroll that
 * starts mid-glide (a key, the scrollbar, the skip link, back/forward) would be
 * overwritten until the glide ended. Halting first lets the native scroll win,
 * and Lenis re-syncs to it from the next `scroll` event.
 */
const halt = (lenis: Lenis | undefined) => {
  if (!lenis?.isSmooth) return;
  lenis.stop();
  lenis.start();
};

/**
 * Sitewide smooth scrolling (#161): Alex's Cinematic pick, Lenis 1.3.27 on the
 * root scroller. Mounted once in the root layout, beside the page rather than
 * around it, so turning it on or off never remounts the tree. The decision is
 * {@link smoothScrollMotion}: under `prefers-reduced-motion` no Lenis exists,
 * from first paint (the server and the hydration render create none either,
 * via {@link useHydrated}) and live when the setting changes.
 *
 * Lenis keeps native scrolling, writing `window.scrollTo` each frame, so
 * `scrollY`, `scroll` events, sticky, fixed and Motion's `useScroll` all report
 * the smoothed position unchanged.
 */
export function SmoothScroll() {
  const hydrated = useHydrated();
  const prefersReducedMotion = usePrefersReducedMotionLive();
  const decision = smoothScrollMotion(!hydrated || prefersReducedMotion);
  return decision.enabled ? <LenisRoot options={decision.options} /> : null;
}

function LenisRoot({ options }: { options: SmoothScrollOptions }) {
  const ref = useRef<LenisRef>(null);
  const pathname = usePathname();

  /*
   * Motion's frame loop drives Lenis (motion.dev/docs/lenis), in its first
   * step, `setup`, so the page has moved before anything reads it this frame:
   * `useScroll` measures in `read` (the parallax, the pinned hero) and the
   * drip's own rAF runs after Motion's. Registered in a layout effect, ahead of
   * every passive effect, so Motion's rAF is queued before the drip's.
   *
   * `useScroll` only measures after a `scroll` event, which the browser fires a
   * frame after a scripted scroll. Mid-glide that's every frame, but a glide's
   * first frame from rest would have no event yet, so it gets one here.
   */
  useLayoutEffect(() => {
    let movedLastFrame = false;
    const update = ({ timestamp }: { timestamp: number }) => {
      const lenis = ref.current?.lenis;
      if (!lenis) return;
      const before = lenis.animatedScroll;
      lenis.raf(timestamp);
      const moved = lenis.animatedScroll !== before;
      if (moved && !movedLastFrame) window.dispatchEvent(new Event('scroll'));
      movedLastFrame = moved;
    };
    frame.setup(update, true);
    return () => cancelFrame(update);
  }, []);

  // Native scrolls that start mid-glide win (see `halt`).
  useEffect(() => {
    const lenis = () => ref.current?.lenis;
    const onKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) halt(lenis());
    };
    // A press on the page's own scrollbar: it sits outside the root's client area.
    const onPointerDown = (event: PointerEvent) => {
      const root = document.documentElement;
      if (event.clientX >= root.clientWidth || event.clientY >= root.clientHeight) halt(lenis());
    };
    // A same-page anchor (the skip link) jumps natively; the hero's own glide starts after this.
    const onClick = (event: globalThis.MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (anchor) halt(lenis());
    };
    const onPopState = () => halt(lenis());
    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('click', onClick, { capture: true });
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('click', onClick, { capture: true });
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  /*
   * Route changes: Next lands a new page at the top and back/forward restores
   * the old position, both natively. Lenis only has to drop any glide still
   * running, so it never carries the old page's target over (it never touches
   * `history.scrollRestoration`).
   */
  useEffect(() => {
    halt(ref.current?.lenis);
  }, [pathname]);

  return <ReactLenis root ref={ref} options={options} />;
}

/**
 * Click handler for an in-page link that glides to its target (the hero's
 * "See Selected Projects" → `#works`): Lenis' `scrollTo` over 1.2 s, expo out,
 * then the hash lands in the URL as a native anchor would leave it. Without
 * Lenis (reduced motion, before hydration) it does nothing and the link stays
 * a plain anchor.
 */
export function useAnchorGlide() {
  const lenis = useLenis();
  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!lenis) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = event.currentTarget.getAttribute('href') ?? '';
      if (!href.startsWith('#') || href.length < 2) return;
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: SMOOTH_SCROLL_DURATION, easing: easeExpoOut });
      // Null state: Next's patched pushState copies its own router state in and syncs the URL.
      if (window.location.hash !== href) window.history.pushState(null, '', href);
    },
    [lenis]
  );
}
