/**
 * The Coalesce drip's one shader, blob layout and motion (#143, #169), shared by the home hero's scroll
 * drip (`scroll-drip-canvas.tsx`) and the theme switch's pour (`components/theme/theme-pour.ts`). The
 * geometry and shader come from `docs/research/home-drip-coalesce-reference.md`; the numbers are Alex's Drip
 * tuner preset of 2026-11-13 ("Preset 13 Nov, 11:34"). Nothing here touches the DOM, and it only ships in
 * the two lazily loaded chunks that import it.
 */

/**
 * The uniform array's size, and the cap on blobs: 32, from Alex's tuner preset.
 * Desktop's 25 + 3 fit; under 1024 px the 19 + 14 lose their last droplet.
 */
export const MAX_BLOBS = 32;

/** One full-screen triangle off `gl_VertexID` — no buffers, no attributes. */
export const DRIP_VERT = `#version 300 es
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
 *
 * The pour adds one uniform and one line: `uInvert` turns the field inside out, so the same rising sheet
 * uncovers the page instead of covering it. The hero's source has neither.
 */
const dripFragment = (pour: boolean) => `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;          // canvas size in device px
uniform float uDpr, uT, uL, uP;
uniform int uN, uDark;${pour ? '\nuniform int uInvert;        // 1: the sheet clears the colour instead of laying it' : ''}
uniform vec3 uCol;          // the page colour, sRGB 0-1 from the background token
uniform vec4 uQ[32];        // blob x, y, radius, stretch (CSS px)

float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float edge = uL + uP * (9.0 * sin(p.x * 0.007 + uT * 0.8) + 5.0 * sin(p.x * 0.019 - uT * 1.3));
  float s = edge - p.y;                                    // < 0 inside the colour
  for (int i = 0; i < 32; i++) { if (i >= uN) break; vec4 q = uQ[i]; vec2 r = p - q.xy; r.y /= q.w;
    s = smin(s, (length(r) - q.z) * min(1.0, q.w), 85.0); }${pour ? '\n  if (uInvert == 1) s = -s;' : ''}
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

/** The home hero's fragment shader. */
export const DRIP_FRAG = dripFragment(false);
/** The theme pour's: the hero's, plus `uInvert`. */
export const DRIP_POUR_FRAG = dripFragment(true);

const UNIFORMS = ['uRes', 'uDpr', 'uT', 'uL', 'uP', 'uN', 'uDark', 'uInvert', 'uCol', 'uQ'] as const;

export interface DripProgram {
  program: WebGLProgram;
  shaders: (WebGLShader | null)[];
  loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
}

/** Compile, link and bind a drip program. Null when it won't compile or link, so the caller can fall back. */
export function createDripProgram(gl: WebGL2RenderingContext, fragment: string): DripProgram | null {
  const program = gl.createProgram();
  const shaders = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].map((type, i) => {
    const shader = gl.createShader(type);
    if (shader) {
      gl.shaderSource(shader, i === 0 ? DRIP_VERT : fragment);
      gl.compileShader(shader);
      if (program) gl.attachShader(program, shader);
    }
    return shader;
  });
  if (program) gl.linkProgram(program);
  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  // biome-ignore lint/correctness/useHookAtTopLevel: WebGL's useProgram, not a React hook.
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());
  const loc = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) as DripProgram['loc'];
  return { program, shaders, loc };
}

export interface DripBlob {
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
export function seedBlobs(width: number): DripBlob[] {
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
export function parseHexColor(raw: string): [number, number, number] | null {
  const hex = raw.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$/.test(hex) && !/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  return [0, 1, 2].map((i) => parseInt(full.slice(i * 2, i * 2 + 2), 16) / 255) as [number, number, number];
}

/** The drip's running state between frames. */
export interface DripMotion {
  /** Seconds of wobble so far. */
  t: number;
  stretch: number;
  /** Scroll velocity in px/s, smoothed first-order at 8/s from the per-frame delta, as the prototype does. */
  v: number;
  sPrev: number;
}

/**
 * Advance the drip one frame and write its blobs into `q`. The reference's geometry, in CSS px, with the
 * tuner preset's numbers: today's 1.5× mapping starting 40 px below the fold, blobs from the first pixel of
 * scroll, built up over 0.35 of the hero, lead 0.8, stretch 0.00155 per px/s, trail 0.2, wobble 25 × 35 px.
 * `s` is the scroll position, real on the hero and eased on the pour. `maxSpeed` caps the velocity the trail
 * and stretch see: the pour moves far faster than a scroll, and uncapped its trail would cancel the blobs' lead.
 * Returns the sheet's baseline and build-up.
 */
export function stepDrip(
  q: Float32Array,
  blobs: DripBlob[],
  motion: DripMotion,
  H: number,
  s: number,
  dt: number,
  maxSpeed = Number.POSITIVE_INFINITY
): { L: number; P: number } {
  const raw = (s - motion.sPrev) / dt;
  motion.sPrev = s;
  motion.v += (Math.abs(raw) > 20000 ? -motion.v : raw - motion.v) * Math.min(1, 8 * dt);
  const { t } = motion;
  const v = Math.min(motion.v, maxSpeed);
  const L = H + 40 - 0.5 * s;
  const P = Math.min(1, Math.max(0, (0.5 * s) / (0.35 * H)));
  const e = Math.min(1, 4 * P);
  const R = P * H * 0.8;
  motion.stretch += (1 + Math.min(0.8, Math.abs(v) * 0.00155) - motion.stretch) * Math.min(1, 6 * dt);

  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];
    q[i * 4] = b.x0 + 25 * e * Math.sin(0.7 * t + b.ph);
    q[i * 4 + 1] = L + (b.r + 24) * (1 - e) - b.lead * R + 35 * e * Math.sin(1.1 * t + 2 * b.ph) + Math.max(0, v) * 0.2 * b.lead;
    q[i * 4 + 2] = b.r;
    q[i * 4 + 3] = motion.stretch;
  }
  return { L, P };
}
