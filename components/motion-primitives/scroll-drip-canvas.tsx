'use client';
import * as React from 'react';

/**
 * The Coalesce drip's WebGL2 layer (#143): blobs of page colour rise ahead of
 * the sheet's edge, stretch and trail with scroll speed, and merge gooily into
 * it. The geometry and shader come from
 * `docs/research/home-drip-coalesce-reference.md`; the numbers are Alex's
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

/**
 * The uniform array's size, and the cap on blobs: 32, from Alex's tuner preset.
 * Desktop's 25 + 3 fit; under 1024 px the 19 + 14 lose their last droplet.
 */
const MAX_BLOBS = 32;

/** One full-screen triangle off `gl_VertexID` — no buffers, no attributes. */
const VERT = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * The reference's fragment shader with the tuner preset's numbers (32 blobs, goo
 * k = 85, dark gloss 0.35, light edge shade 0.2), and one note on colour space: `uCol` is the `--background` token's
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
    s = smin(s, (length(r) - q.z) * min(1.0, q.w), 85.0); }
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
  if (dk) col += vec3(0.85, 1.0, 0.92) * spec * 0.35 + vec3(0.6, 0.9, 0.75) * body * 0.035;
  else col = mix(col, vec3(0.06, 0.2, 0.15), shade * 0.2 + body * 0.05);

  float toBottom = smoothstep(0.0, 140.0, uRes.y / uDpr - p.y);
  col = mix(uCol, col, toBottom);
  o = vec4(clamp(col, 0.0, 1.0) * al, al);
}`;

interface DripBlob {
  /** Resting x (CSS px): even spread across the width with ±40% slot jitter. */
  x0: number;
  /** Radius (CSS px): medium 4–82, droplet 20–25; both × 0.6 under 1024px. */
  r: number;
  /** How far ahead of the sheet it rises (fraction of `R`, random 0–1); droplets × 1.4, capped at 1.25. */
  lead: number;
  /** Wobble phase. */
  ph: number;
}

/** The approved prototype's PRNG (Park–Miller minimal standard), so its seeds give its exact layout. */
function parkMiller(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Seed the blob layout for a hero width, with the tuner's draws in its order, so
 * every width gets the layout Alex saved. Seeds are 7 on desktop and 70 under
 * 1024 px. The prototype spent 5 draws on each of its Melt drips (11 on desktop,
 * 5 on phones) before the blobs; the tuner keeps that burn, so it stays here too.
 */
function seedBlobs(width: number): DripBlob[] {
  const phone = width < 1024;
  const sizeScale = phone ? 0.6 : 1;
  const rand = parkMiller(phone ? 70 : 7);
  for (let i = 0; i < (phone ? 5 : 11) * 5; i++) rand();
  const sets = [
    { count: phone ? 19 : 25, rMin: 4, rMax: 82, leadBoost: 1 },
    { count: phone ? 14 : 3, rMin: 20, rMax: 25, leadBoost: 1.4 },
  ];
  const blobs: DripBlob[] = [];
  for (const set of sets) {
    for (let i = 0; i < set.count; i++) {
      blobs.push({
        x0: ((i + 0.5 + (rand() - 0.5) * 0.8) / set.count) * width,
        r: (set.rMin + rand() * (set.rMax - set.rMin)) * sizeScale,
        lead: Math.min(1.25, rand() * set.leadBoost),
        ph: rand() * 6.28,
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
    // Scroll velocity in px/s, smoothed first-order at 8/s from the per-frame delta, as the prototype does.
    let v = 0;
    let sPrev = 0;
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

      // The reference's geometry, in hero CSS px, with the tuner preset's numbers: today's 1.5×
      // mapping starting 40 px below the fold, blobs from the first pixel of scroll, built up over
      // 0.35 of the hero, lead 0.8, stretch 0.00155 per px/s, trail 0.2, wobble 25 × 35 px.
      const s = window.scrollY;
      const raw = (s - sPrev) / dt;
      sPrev = s;
      v += (Math.abs(raw) > 20000 ? -v : raw - v) * Math.min(1, 8 * dt);
      const H = cssH;
      const L = H + 40 - 0.5 * s;
      const P = Math.min(1, Math.max(0, (0.5 * s) / (0.35 * H)));
      const e = Math.min(1, 4 * P);
      const R = P * H * 0.8;
      stretch += (1 + Math.min(0.8, Math.abs(v) * 0.00155) - stretch) * Math.min(1, 6 * dt);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        q[i * 4] = b.x0 + 25 * e * Math.sin(0.7 * t + b.ph);
        q[i * 4 + 1] = L + (b.r + 24) * (1 - e) - b.lead * R + 35 * e * Math.sin(1.1 * t + 2 * b.ph) + Math.max(0, v) * 0.2 * b.lead;
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
      // Start the delta from here: a stale position or speed from before the loop slept would read as a jolt.
      last = performance.now();
      sPrev = window.scrollY;
      v = 0;
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
