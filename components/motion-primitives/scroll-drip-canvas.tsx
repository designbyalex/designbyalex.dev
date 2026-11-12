'use client';
import { useScroll, useSpring, useVelocity } from 'motion/react';
import * as React from 'react';

/**
 * The Coalesce drip's WebGL2 layer (#143): blobs of page colour rise ahead of
 * the sheet's edge, stretch and trail with scroll speed, and merge gooily into
 * it — Alex's signed-off picks, ported number-for-number from
 * `docs/research/home-drip-coalesce-reference.md`. This file is loaded only
 * through `ScrollDrip`'s dynamic import, so none of it ships in the initial
 * bundle and it never runs on the server or under reduced motion.
 *
 * The canvas covers the hero (the host positions it `absolute`, inside the
 * hero's clip, above the text) and all geometry is CSS px in hero coordinates,
 * y down from the hero's top — the hero tops the document, so `scrollY` is the
 * reference's `s` directly. Scroll and velocity come from Motion's `useScroll`
 * + `useVelocity`, smoothed by a light critically-damped `useSpring` at the
 * reference's 8/s rate.
 *
 * The render loop is on-demand: a frame schedules the next only while the hero
 * is on screen (IntersectionObserver), the tab is visible, and the drip is
 * visible or still settling (`P > 0`, or velocity/stretch not yet at rest).
 * Scroll, resize, theme changes and re-entry wake it. DPR is capped at 1.5.
 *
 * Any failure — no WebGL2 context, a shader that won't compile or link, a lost
 * context — reports `onFail` and the host falls back to the static SVG wave.
 */

/** The uniform array's size. The reference text says 16, but Alex's picked counts (14 medium + 12 droplets on desktop) need 26, so the port sizes it to 32. */
const MAX_BLOBS = 32;

/** One full-screen triangle off `gl_VertexID` — no buffers, no attributes. */
const VERT = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * The reference's fragment shader verbatim, except `uQ[16]` → `uQ[32]` (see
 * MAX_BLOBS) and the colour space note: `uCol` is the `--background` token's
 * sRGB value normalised to 0–1, *not* linearised — the shader writes it out
 * unconverted, so sRGB in = sRGB out is what makes the fill match the page by
 * pixel. The gloss tints then mix in sRGB too, which is what Alex signed off.
 */
const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;          // canvas size in device px
uniform float uDpr, uT, uL, uP;
uniform int uN, uDark;
uniform vec3 uCol;          // the page colour, sRGB 0-1 from the background token
uniform vec4 uQ[32];        // blob x, y, radius, stretch (CSS px)

float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float edge = uL + uP * (9.0 * sin(p.x * 0.007 + uT * 0.8) + 5.0 * sin(p.x * 0.019 - uT * 1.3));
  float s = edge - p.y;                                    // < 0 inside the colour
  for (int i = 0; i < 32; i++) { if (i >= uN) break; vec4 q = uQ[i]; vec2 r = p - q.xy; r.y /= q.w;
    s = smin(s, (length(r) - q.z) * min(1.0, q.w), 48.0); }
  float d = -s;                                            // ~ px into the colour
  float al = clamp(d / max(fwidth(d), 1e-3) + 0.5, 0.0, 1.0);

  // Gloss: lit from the top left. n points from the hero into the colour.
  vec3 col = uCol; bool dk = uDark == 1;
  vec2 g = vec2(dFdx(d), -dFdy(d)); vec2 n = length(g) > 1e-4 ? normalize(g) : vec2(0.0, 1.0);
  vec2 lgt = normalize(vec2(-0.45, -1.0));
  float facing = max(dot(-n, lgt), 0.0);
  float band = smoothstep(0.0, 1.5, d) * (1.0 - smoothstep(2.0, 16.0, d));
  float spec = pow(facing, 5.0) * band;
  float body = facing * (1.0 - smoothstep(4.0, 40.0, d));
  float shade = max(dot(n, lgt), 0.0) * (1.0 - smoothstep(2.0, 28.0, d));
  if (dk) col += vec3(0.85, 1.0, 0.92) * spec * 0.5 + vec3(0.6, 0.9, 0.75) * body * 0.035;
  else col = mix(col, vec3(0.06, 0.2, 0.15), shade * 0.16 + body * 0.05);

  float toBottom = smoothstep(0.0, 140.0, uRes.y / uDpr - p.y);
  col = mix(uCol, col, toBottom);
  o = vec4(clamp(col, 0.0, 1.0) * al, al);
}`;

interface DripBlob {
  /** Resting x (CSS px): even spread across the width with ±40% slot jitter. */
  x0: number;
  /** Radius (CSS px): medium 26–82, droplet 6–18; both × 0.65 under 1024px. */
  r: number;
  /** How far ahead of the sheet it rises (fraction of `R`); droplets × 1.4, capped at 1.25. */
  lead: number;
  /** Wobble phase. */
  ph: number;
}

/** Deterministic PRNG so the layout is stable: same width → same blobs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed the blob layout for a hero width, per the reference's counts and radii. */
function seedBlobs(width: number): DripBlob[] {
  const phone = width < 1024;
  const sizeScale = phone ? 0.65 : 1;
  const rand = mulberry32(0x143c0a1e);
  const sets = [
    { count: phone ? 7 : 14, rMin: 26, rMax: 82, droplet: false },
    { count: phone ? 6 : 12, rMin: 6, rMax: 18, droplet: true },
  ];
  const blobs: DripBlob[] = [];
  for (const set of sets) {
    const slot = width / set.count;
    for (let i = 0; i < set.count; i++) {
      const lead = 0.15 + rand() * 0.85;
      blobs.push({
        x0: (i + 0.5) * slot + (rand() * 2 - 1) * 0.4 * slot,
        r: (set.rMin + rand() * (set.rMax - set.rMin)) * sizeScale,
        lead: set.droplet ? Math.min(1.25, lead * 1.4) : lead,
        ph: rand() * Math.PI * 2,
      });
    }
  }
  return blobs.slice(0, MAX_BLOBS);
}

/** `#rgb`/`#rrggbb` → sRGB 0–1. Null on anything else, so the caller can keep its last good colour. */
function parseHexColor(raw: string): [number, number, number] | null {
  const hex = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$/.test(hex) && !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  return [0, 1, 2].map((i) => parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255) as [number, number, number];
}

export interface ScrollDripCanvasProps {
  className?: string;
  /** The first frame has rendered — the host can drop the static fallback with no gap. */
  onActive: () => void;
  /** WebGL2 is unavailable, the program failed, or the context was lost — the host falls back for good. */
  onFail: () => void;
}

export default function ScrollDripCanvas({ className, onActive, onFail }: ScrollDripCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  // Critically damped at ω = 8/s — Motion's native equivalent of the reference's `v += (raw − v)·min(1, 8·dt)`.
  const velocity = useSpring(rawVelocity, { stiffness: 64, damping: 16 });
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

    const program = gl.createProgram();
    const shaders = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map((type, i) => {
      const shader = gl.createShader(type);
      if (shader) {
        gl.shaderSource(shader, i === 0 ? VERT : FRAG);
        gl.compileShader(shader);
        if (program) gl.attachShader(program, shader);
      }
      return shader;
    });
    if (program) gl.linkProgram(program);
    if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
      hooks.current.onFail();
      return;
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook.
    gl.useProgram(program);
    gl.bindVertexArray(gl.createVertexArray());
    const loc = Object.fromEntries(['uRes', 'uDpr', 'uT', 'uL', 'uP', 'uN', 'uDark', 'uCol', 'uQ'].map((n) => [n, gl.getUniformLocation(program, n)]));

    let raf = 0;
    let running = false;
    let active = false;
    let heroOnScreen = true;
    let last = 0;
    let t = 0;
    let stretch = 1;
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
      t += dt;

      // The reference's geometry, in hero CSS px: today's 1.5× mapping, lead "mid", viscosity "medium".
      const s = scrollY.get();
      const v = velocity.get();
      const H = cssH;
      const L = H + 130 - 0.5 * s;
      const P = Math.min(1, Math.max(0, (0.5 * s - 60) / (0.55 * H)));
      const e = Math.min(1, 4 * P);
      const R = P * H * 0.6;
      stretch += (1 + Math.min(0.8, Math.abs(v) * 0.0007) - stretch) * Math.min(1, 6 * dt);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        q[i * 4] = b.x0 + 16 * e * Math.sin(0.7 * t + b.ph);
        q[i * 4 + 1] = L + (b.r + 24) * (1 - e) - b.lead * R + 10 * e * Math.sin(1.1 * t + 2 * b.ph) + Math.max(0, v) * 0.04 * b.lead;
        q[i * 4 + 2] = b.r;
        q[i * 4 + 3] = stretch;
      }

      gl.uniform2f(loc.uRes, canvas.width, canvas.height);
      gl.uniform1f(loc.uDpr, dpr);
      gl.uniform1f(loc.uT, t);
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
      const settled = P <= 0 && Math.abs(v) < 5 && Math.abs(stretch - 1) < 0.005;
      if (!heroOnScreen || document.hidden || settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !heroOnScreen || document.hidden) return;
      running = true;
      last = performance.now();
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

    const unsubscribe = scrollY.on('change', wake);

    readTheme();
    resize();
    wake();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      unsubscribe();
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
