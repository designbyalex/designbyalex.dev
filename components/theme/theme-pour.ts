import {
  DRIP_POUR_FRAG,
  type DripBlob,
  MAX_BLOBS,
  createDripProgram,
  nextStretch,
  parseHexColor,
  seedBlobs,
  wobbleX,
  wobbleY,
} from '@/components/motion-primitives/drip-shader';

/**
 * The theme switch's pour (#169), built to Alex's pick on the Portfolio Refinement Picks page, "Pours down
 * (drip, reversed)": one pass down the page with blobs leading the edge and a bloom at the toggle, the new
 * theme's page showing through the goo behind it.
 *
 * A View Transition holds the old page as a snapshot while the new page goes live above it, clipped to the
 * sheet. The clip is a vector path traced from the drip's own field each frame, a little inside the edge. The
 * home drip's shader paints the glossy lip over that line at full resolution, so the path's steps never show.
 *
 * Everything is built on the click and torn down at the end, context included, so no loop or WebGL context
 * outlives a switch. This file is its own chunk, fetched after hydration.
 */

/** How far ahead of the sheet the blobs run, in CSS px at full lead, easing back by 40% over the pour. */
const BLOB_LEAD = 92;
/** The bloom that swells at the toggle, as a radius in CSS px. */
const BLOOM_RADIUS = 140;
/** Where the sheet's edge starts above the viewport and ends below it. */
const OVERRUN = 80;
/** The new page shows from this far inside the edge, under the lip the shader paints. */
const CLIP_INSET = 8;
/** The grid the clip is traced on, in CSS px. Finer than the lip is deep. */
const ROW = 6;
const COLUMN = 8;
/** The drip's goo, as in the shader. */
const GOO = 85;

/** How close to the toggle's centre a click counts as a click on it, in CSS px. */
const TOGGLE_RADIUS = 24;

const NAME = 'theme-pour';
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const smin = (a: number, b: number, k: number) => {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
};

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

export interface PourThemeOptions {
  /** The theme being switched to. */
  dark: boolean;
  /** The centre of the toggle, in viewport px. */
  origin: { x: number; y: number };
  durationMs: number;
  /** Flip the theme. Always called once when the pour starts. */
  applyTheme: () => void;
  /** The toggle was clicked mid-pour. The browser sends such clicks to the page root, past the button. */
  onToggleClick: () => void;
  /** The pour is over and everything it built is gone. */
  onDone: () => void;
}

/** Start a pour. False when the browser can't run it, and the caller swaps the theme itself. */
export function pourTheme({ dark, origin, durationMs, applyTheme, onToggleClick, onDone }: PourThemeOptions): boolean {
  if (!document.startViewTransition || document.hidden) return false;
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
  const root = document.documentElement;

  // The canvas rides above the snapshots as its own live layer, and the page stays clickable beneath them.
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100vh;height:100lvh;pointer-events:none;view-transition-name:${NAME}`;
  const style = document.createElement('style');
  // Nothing else animates during the swap, or the new page's colours would still be fading as the sheet reveals them.
  style.textContent = `*,*::before,*::after{transition:none!important}
::view-transition,::view-transition-group(*),::view-transition-image-pair(*),::view-transition-old(*),::view-transition-new(*){pointer-events:none}
::view-transition-old(root),::view-transition-new(root),::view-transition-group(${NAME}),::view-transition-new(${NAME}){animation:none;mix-blend-mode:normal}`;
  document.head.append(style);
  // The header joins the page's snapshot, so the sheet passes over it with everything else.
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) header.style.viewTransitionName = 'none';

  const W = window.innerWidth;
  const H = Math.max(window.innerHeight, Math.round(window.visualViewport?.height ?? 0));
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(1, Math.round(W * dpr));
  canvas.height = Math.max(1, Math.round(H * dpr));
  gl.viewport(0, 0, canvas.width, canvas.height);

  // The tuner's layout, less one blob on phones to make room for the bloom.
  const blobs: DripBlob[] = seedBlobs(W).slice(0, MAX_BLOBS - 1);
  const count = blobs.length + 1;
  const q = new Float32Array(MAX_BLOBS * 4);
  const color = themeBackground(dark);

  let t = 0;
  let v = 0;
  let stretch = 1;
  let edge = -OVERRUN;
  let start = 0;
  let last = 0;
  let raf = 0;
  let applied = false;
  let finished = false;
  let clip: Animation | null = null;

  /** Lay out the sheet's edge and blobs for progress `p`. Positions in `q` are mirrored for the shader. */
  const place = (p: number, dt: number) => {
    const next = easeOutCubic(p) * (H + 2 * OVERRUN) - OVERRUN;
    v += ((next - edge) / dt - v) * Math.min(1, 8 * dt);
    edge = next;
    stretch = nextStretch(stretch, v, dt);
    blobs.forEach((b, i) => {
      q[i * 4] = b.x0 + wobbleX(b, t);
      q[i * 4 + 1] = H - (edge + b.lead * BLOB_LEAD * (1 - 0.4 * p) + wobbleY(b, t));
      q[i * 4 + 2] = b.r;
      q[i * 4 + 3] = stretch;
    });
    const bloom = blobs.length * 4;
    q[bloom] = origin.x;
    q[bloom + 1] = H - origin.y;
    q[bloom + 2] = easeOutCubic(Math.min(1, p * 2)) * BLOOM_RADIUS;
    q[bloom + 3] = 1;
  };

  /** The drip's field at a screen point, from the blobs near this row: below zero is inside the goo. */
  const field = (x: number, y: number, near: number[]) => {
    let s = y - edge + 9 * Math.sin(x * 0.007 + t * 0.8) + 5 * Math.sin(x * 0.019 - t * 1.3);
    for (const i of near) {
      const w = q[i * 4 + 3];
      const blob = (Math.hypot(x - q[i * 4], (H - y - q[i * 4 + 1]) / w) - q[i * 4 + 2]) * Math.min(1, w);
      s = smin(s, blob, GOO);
    }
    return s + CLIP_INSET;
  };

  /** Trace the goo as rows of spans: a vector clip, so there is no image to encode each frame. */
  const tracePath = () => {
    let reach = edge;
    for (let i = 0; i < count; i++) reach = Math.max(reach, H - q[i * 4 + 1] + q[i * 4 + 2] * q[i * 4 + 3]);
    const top = Math.max(0, Math.min(H, Math.floor((edge - 24) / ROW) * ROW));
    const bottom = Math.min(H, reach + GOO / 4 + ROW);
    let path = top > 0 ? `M0 0H${W}V${top}H0Z` : '';
    for (let y = top; y < bottom; y += ROW) {
      const mid = y + ROW / 2;
      const near: number[] = [];
      for (let i = 0; i < count; i++) {
        if (Math.abs(H - mid - q[i * 4 + 1]) / q[i * 4 + 3] - q[i * 4 + 2] < GOO + CLIP_INSET) near.push(i);
      }
      let previous = field(0, mid, near);
      let from = previous < 0 ? 0 : -1;
      for (let x = COLUMN; x < W + COLUMN; x += COLUMN) {
        const at = Math.min(x, W);
        const value = field(at, mid, near);
        if (value < 0 !== previous < 0) {
          const cross = Math.round(at - COLUMN + (COLUMN * previous) / (previous - value));
          if (value < 0) from = cross;
          else {
            path += `M${from} ${y}H${cross}V${y + ROW}H${from}Z`;
            from = -1;
          }
        }
        previous = value;
      }
      if (from >= 0) path += `M${from} ${y}H${W}V${y + ROW}H${from}Z`;
    }
    return `path('${path || 'M0 0'}')`;
  };

  const draw = () => {
    gl.uniform2f(loc.uRes, canvas.width, canvas.height);
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uT, t);
    gl.uniform1f(loc.uL, H - edge);
    gl.uniform1f(loc.uP, 1);
    gl.uniform1i(loc.uN, count);
    gl.uniform1i(loc.uDark, dark ? 1 : 0);
    gl.uniform3f(loc.uCol, color[0], color[1], color[2]);
    gl.uniform4fv(loc.uQ, q);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const apply = () => {
    if (applied) return;
    applied = true;
    applyTheme();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('click', onClick, true);
    canvas.removeEventListener('webglcontextlost', skip);
    apply();
    clip?.cancel();
    canvas.remove();
    style.remove();
    if (header) header.style.viewTransitionName = '';
    release();
    onDone();
  };

  const transition = document.startViewTransition(async () => {
    document.body.append(canvas);
    apply();
    // next-themes swaps the class in an effect: the new snapshot waits for it.
    const begun = performance.now();
    while (root.classList.contains('dark') !== dark && performance.now() - begun < 300) {
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  });
  const skip = () => transition.skipTransition();
  const onVisibility = () => {
    if (document.hidden) skip();
  };

  const onClick = (event: MouseEvent) => {
    if (event.target === root && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <= TOGGLE_RADIUS) onToggleClick();
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    t += dt;
    const p = Math.min(1, (now - start) / durationMs);
    place(p, dt);
    draw();
    const path = tracePath();
    (clip?.effect as KeyframeEffect | null)?.setKeyframes({ clipPath: [path, path] });
    if (p >= 1) skip();
    else raf = requestAnimationFrame(frame);
  };

  transition.ready
    .then(() => {
      start = last = performance.now();
      place(0, 1 / 60);
      draw();
      const path = tracePath();
      clip = root.animate({ clipPath: [path, path] }, { duration: durationMs + 1500, fill: 'both', pseudoElement: '::view-transition-new(root)' });
      raf = requestAnimationFrame(frame);
    })
    .catch(finish);
  transition.finished.then(finish, finish);

  // A stalled tab or a lost context must never leave the page frozen on its snapshot.
  const watchdog = window.setTimeout(skip, durationMs + 1500);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('click', onClick, true);
  canvas.addEventListener('webglcontextlost', skip);
  return true;
}
