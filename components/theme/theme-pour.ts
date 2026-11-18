import { DRIP_POUR_FRAG, type DripMotion, MAX_BLOBS, createDripProgram, parseHexColor, seedBlobs, stepDrip } from '@/components/motion-primitives/drip-shader';
import type { ThemePourMotion } from '@/lib/motion/reduced-motion';

/**
 * The theme switch's pour (#169): the home drip, reversed. The canvas is the hero's shader mirrored top to
 * bottom, so its rising sheet pours down the page with the same blobs, goo and glossy lip. It runs twice:
 * once laying the new theme's page colour over the page, and, once the theme has flipped under full cover,
 * again with the field inverted, so the same sheet shape drains the colour off the bottom and uncovers the
 * new content.
 *
 * Everything is built on the click and torn down at the end, context included, so no loop or WebGL context
 * outlives a switch. This file is its own chunk, fetched after hydration.
 */

/** How far past the bottom of the viewport the sheet's baseline runs, clear of its wobble. */
const OVERRUN = 60;
/** How much of the entrance curve a half uses. Its long tail is invisible here, so each half stops at this point. */
const CURVE_USED = 0.32;

/** The `--background` a theme declares, read from the stylesheet because the other theme isn't applied yet. */
function themeBackground(dark: boolean): [number, number, number] {
  const selector = dark ? '.dark' : ':root';
  const search = (rules: CSSRuleList): string => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
        const value = rule.style.getPropertyValue('--background');
        if (value) return value;
      } else if ('cssRules' in rule) {
        const nested = search((rule as CSSGroupingRule).cssRules);
        if (nested) return nested;
      }
    }
    return '';
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const color = parseHexColor(search(sheet.cssRules));
      if (color) return color;
    } catch {
      // A cross-origin sheet can't be read, and never holds the token.
    }
  }
  return dark ? [8 / 255, 8 / 255, 8 / 255] : [1, 1, 1];
}

/** A CSS cubic-bezier as a function of progress, solved by bisection. */
function cubicBezier([x1, y1, x2, y2]: ThemePourMotion['ease']): (x: number) => number {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x) => {
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (at(x1, x2, mid) < x) low = mid;
      else high = mid;
    }
    return at(y1, y2, (low + high) / 2);
  };
}

export interface PourThemeOptions {
  /** The theme being switched to. */
  dark: boolean;
  motion: ThemePourMotion;
  /** The page is fully covered: flip the theme now. Always called once, even if the pour fails part way. */
  onCovered: () => void;
  /** The canvas is gone. */
  onDone: () => void;
}

/** Start a pour. False when WebGL2 or the shader isn't available, and the caller swaps the theme itself. */
export function pourTheme({ dark, motion, onCovered, onDone }: PourThemeOptions): boolean {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: false });
  if (!gl) return false;
  const release = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  const drip = createDripProgram(gl, DRIP_POUR_FRAG);
  if (!drip) {
    release();
    return false;
  }
  const { loc } = drip;

  canvas.setAttribute('aria-hidden', 'true');
  // Above the header so it pours over everything, and click-through so the toggle stays usable.
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;height:100lvh;z-index:60;pointer-events:none;transform:scaleY(-1)';
  document.body.append(canvas);

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const H = rect.height;
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(H * dpr));
  gl.viewport(0, 0, canvas.width, canvas.height);

  const blobs = seedBlobs(rect.width);
  const q = new Float32Array(MAX_BLOBS * 4);
  const color = themeBackground(dark);
  const curve = cubicBezier(motion.ease);
  const ease = (u: number) => curve(u * CURVE_USED) / curve(CURVE_USED);
  // About a viewport a second: the trail stays well inside the blobs' lead of up to 0.8 H.
  const maxSpeed = H;
  // The scroll that carries the sheet's baseline from below the fold to past the far edge.
  const travel = 2 * (H + 40 + OVERRUN);
  const state: DripMotion = { t: 0, stretch: 1, v: 0, sPrev: 0 };

  let phase: 'cover' | 'flip' | 'drain' = 'cover';
  let phaseStart = performance.now();
  let last = phaseStart;
  let flipFrames = 0;
  let covered = false;
  let finished = false;
  let raf = 0;

  const cover = () => {
    if (covered) return;
    covered = true;
    onCovered();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', finish);
    cover();
    canvas.remove();
    release();
    onDone();
  };

  const onVisibility = () => {
    if (document.hidden) finish();
  };

  const draw = (s: number, dt: number, invert: boolean) => {
    const { L, P } = stepDrip(q, blobs, state, H, s, dt, maxSpeed);
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uT, state.t);
    gl.uniform1f(loc.uL, L);
    gl.uniform1f(loc.uP, P);
    gl.uniform1i(loc.uN, blobs.length);
    gl.uniform1i(loc.uDark, dark ? 1 : 0);
    gl.uniform1i(loc.uInvert, invert ? 1 : 0);
    gl.uniform3f(loc.uCol, color[0], color[1], color[2]);
    gl.uniform4fv(loc.uQ, q);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    state.t += dt;

    if (phase === 'cover') {
      const u = Math.min(1, (now - phaseStart) / motion.coverMs);
      draw(travel * ease(u), dt, false);
      if (u >= 1) {
        phase = 'flip';
        phaseStart = now;
        cover();
      }
    } else if (phase === 'flip') {
      // Hold full cover until next-themes has swapped the class and the new theme has painted beneath it.
      const swapped = document.documentElement.classList.contains('dark') === dark;
      if (swapped) flipFrames++;
      if (flipFrames >= 2 || now - phaseStart > 400) {
        phase = 'drain';
        phaseStart = now;
        state.v = 0;
        state.sPrev = 0;
        state.stretch = 1;
      }
    } else {
      const u = Math.min(1, (now - phaseStart) / motion.drainMs);
      draw(travel * ease(u), dt, true);
      if (u >= 1) {
        finish();
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  };

  // A stalled tab or a lost context must never leave the page under the sheet.
  const watchdog = window.setTimeout(finish, motion.coverMs + motion.drainMs + 1500);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', finish);
  raf = requestAnimationFrame(frame);
  return true;
}
