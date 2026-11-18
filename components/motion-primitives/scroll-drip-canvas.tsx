'use client';
import * as React from 'react';
import { DRIP_FRAG, type DripBlob, type DripMotion, MAX_BLOBS, createDripProgram, parseHexColor, seedBlobs, stepDrip } from './drip-shader';

/**
 * The Coalesce drip's WebGL2 layer (#143): blobs of page colour rise ahead of
 * the sheet's edge, stretch and trail with scroll speed, and merge gooily into
 * it. The geometry and shader come from
 * `docs/research/home-drip-coalesce-reference.md` and live in `drip-shader.ts`,
 * which the theme switch's pour shares (#169); the numbers are Alex's
 * Drip tuner preset of 2026-11-13 ("Preset 13 Nov, 11:34"), which retuned the
 * sheet's timing, the blob mix, the goo, the trail and the gloss. This file is loaded only
 * through `ScrollDrip`'s dynamic import, so none of it ships in the initial
 * bundle and it never runs on the server or under reduced motion.
 *
 * The canvas covers the hero (the host positions it `absolute`, inside the
 * hero's clip, above the text) and all geometry is CSS px in hero coordinates,
 * y down from the hero's top — the hero tops the document, so `scrollY` is the
 * reference's `s` directly. Velocity is the prototype's own: the raw per-frame
 * scroll delta over dt, smoothed first-order at 8/s. A critically damped spring
 * lagged the flick, so blobs barely stretched on fast scrolls (#143 findings).
 *
 * The blob layout uses the approved prototype's Park–Miller generator and draw
 * order, so the tuner's seeds give the tuner's layout here: 25 medium + 3
 * droplets on desktop, 19 + 14 under 1024 px (cut to the 32-blob cap).
 *
 * The render loop is on-demand: a frame schedules the next only while the hero
 * is on screen (IntersectionObserver), the tab is visible, and the drip is
 * visible or still settling (`P > 0`, or velocity/stretch not yet at rest).
 * Scroll, resize, theme changes and re-entry wake it. DPR is capped at 1.5.
 *
 * Any failure — no WebGL2 context, a shader that won't compile or link, a lost
 * context — reports `onFail` and the host falls back to the static SVG wave.
 */

export interface ScrollDripCanvasProps {
  className?: string;
  /** The first frame has rendered — the host can drop the static fallback with no gap. */
  onActive: () => void;
  /** WebGL2 is unavailable, the program failed, or the context was lost — the host falls back for good. */
  onFail: () => void;
}

export default function ScrollDripCanvas({ className, onActive, onFail }: ScrollDripCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // The host passes stable callbacks, but route them through a ref so the GL setup never re-runs.
  const hooks = React.useRef({ onActive, onFail });
  hooks.current = { onActive, onFail };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: false });
    if (!gl) {
      hooks.current.onFail();
      return;
    }

    const drip = createDripProgram(gl, DRIP_FRAG);
    if (!drip) {
      hooks.current.onFail();
      return;
    }
    const { program, shaders, loc } = drip;

    let raf = 0;
    let running = false;
    let active = false;
    let heroOnScreen = true;
    let last = 0;
    const motion: DripMotion = { t: 0, stretch: 1, v: 0, sPrev: 0 };
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let blobs: DripBlob[] = [];
    let color: [number, number, number] = [0, 0, 0];
    let dark = true;
    const q = new Float32Array(MAX_BLOBS * 4);

    // The drip's fill is the page colour, read from the token at runtime — one code path for both themes.
    const readTheme = () => {
      dark = document.documentElement.classList.contains('dark');
      const token = parseHexColor(getComputedStyle(document.documentElement).getPropertyValue('--background'));
      color = token ?? (dark ? [8 / 255, 8 / 255, 8 / 255] : [1, 1, 1]);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      if (rect.width !== cssW) blobs = seedBlobs(rect.width);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      motion.t += dt;

      const { L, P } = stepDrip(q, blobs, motion, cssH, window.scrollY, dt);

      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uDpr, dpr);
      gl.uniform1f(loc.uT, motion.t);
      gl.uniform1f(loc.uL, L);
      gl.uniform1f(loc.uP, P);
      gl.uniform1i(loc.uN, blobs.length);
      gl.uniform1i(loc.uDark, dark ? 1 : 0);
      gl.uniform3f(loc.uCol, color[0], color[1], color[2]);
      gl.uniform4fv(loc.uQ, q);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!active) {
        active = true;
        hooks.current.onActive();
      }

      // Keep looping only while there is something to animate: the drip on screen (P > 0 wobbles
      // continuously), or velocity/stretch still settling. Hidden tab or off-screen hero stops it cold.
      const settled = P <= 0 && Math.abs(motion.v) < 5 && Math.abs(motion.stretch - 1) < 0.005;
      if (!heroOnScreen || document.hidden || settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !heroOnScreen || document.hidden) return;
      running = true;
      // Start the delta from here: a stale position or speed from before the loop slept would read as a jolt.
      last = performance.now();
      motion.sPrev = window.scrollY;
      motion.v = 0;
      raf = requestAnimationFrame(frame);
    };

    const onLost = () => {
      // No restore attempt (no preventDefault): the ticket's fallback is the static wave, for good.
      running = false;
      cancelAnimationFrame(raf);
      hooks.current.onFail();
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      heroOnScreen = entry?.isIntersecting ?? false;
      if (heroOnScreen) wake();
    });
    io.observe(canvas);

    const onVisibility = () => {
      if (!document.hidden) wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // A theme switch updates the colour live: watch the class next-themes toggles and re-read the token.
    const mo = new MutationObserver(() => {
      readTheme();
      wake();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('scroll', wake, { passive: true });

    readTheme();
    resize();
    wake();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', wake);
      mo.disconnect();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      for (const shader of shaders) if (shader) gl.deleteShader(shader);
      gl.deleteProgram(program);
      // No loseContext() here: React strict mode's dev-only remount re-runs this effect on the *same*
      // canvas, and getContext would hand it the same — by then irrecoverably lost — context, so the
      // drip would retire to the fallback on every `next dev` / Tina-preview load. On a real unmount
      // the canvas element leaves the DOM and the context is reclaimed with it.
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
