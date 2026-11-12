# Home drip: Coalesce reference

This is the motion Alex signed off on 2026-11-12, distilled from the throwaway picker prototype (private page *Portfolio Home Drip Picks*, rounds 1–3) so the Site lane can reproduce it. It is a reference, not product code. Port it into a client component; don't copy it in as-is. Research and licences are in `home-drip-mask.md`.

## Alex's picks (2026-11-12)

| Decision | Pick |
|---|---|
| Drip direction (round 1) | **C · Coalesce**: blobs of page colour rise ahead of the edge, gooey and stretching with speed, and merge into the sheet as it catches up |
| Sheet speed | Now: 1.5× the page (today's mapping) |
| Blob lead | Now: mid |
| Viscosity | Now: medium |
| Blob count and size | Mixed: medium blobs plus droplets |
| Edge highlight | Gloss: lit liquid |
| Colour | Now: the page colour |
| Sign-off (round 3) | **Final** |

## Geometry and timing

All lengths are CSS px in hero coordinates (y down from the hero's top). `H` is the hero's height (100svh), `s` is `scrollY`.

- **Baseline:** `L = H + 130 − 0.5·s`. This is today's 1.5×-the-page parallax, measured to the wave's mid-crest. At `s = 0` the colour sits fully below the fold.
- **Progress:** `P = clamp((0.5·s − 60) / (0.55·H), 0, 1)`; emergence `e = min(1, 4·P)`; blob rise `R = P · H · 0.6` (lead "mid").
- **Sheet edge:** `edge(x) = L + P·(9·sin(0.007x + 0.8t) + 5·sin(0.019x − 1.3t))`, where `t` is in seconds.
- **Blobs:** each blob is seeded once per width with a fixed seed, so the layout is stable.
  - **Medium set:** 14 on desktop, 7 on phones (width < 1024). Spread evenly across the width with ±40% jitter. Radius 26–82 px.
  - **Droplet set:** 12 on desktop, 6 on phones. Radius 6–18 px. Their lead is multiplied by 1.4, capped at 1.25.
  - **Phone radii:** both sets × 0.65.
  - **Per blob:** a random `lead` in 0.15–1.0 and a phase `ph`. At most 16 blobs in total, which is the shader's array size.
  - **Blob centre:**
    - `x = x0 + 16·e·sin(0.7t + ph)`
    - `y = L + (r + 24)·(1 − e) − lead·R + 10·e·sin(1.1t + 2ph) + max(0, v)·0.04·lead`
    - `v` is the smoothed scroll velocity in px/s. That last term makes blobs trail when you scroll fast.
  - **Stretch with speed (viscosity "medium"):** `stretch → 1 + min(0.8, |v|·0.0007)`, eased at rate 6/s. The blob's y radius is multiplied by `stretch`.
- **Velocity:** `v` is the raw frame delta / dt, smoothed with `v += (raw − v)·min(1, 8·dt)`. Motion's `useVelocity(scrollY)` plus a light `useSpring` is the native equivalent.
- **Merge (viscosity "medium"):** polynomial smooth-min with `k = 48` px between the sheet and every blob.

## Shader

WebGL2, one full-screen triangle on a canvas that covers the hero (inside its clip, above the text, `pointer-events: none`), with premultiplied alpha. The colour fades back to the exact page colour over the last 140 px above the hero's bottom edge, so there is no seam with Selected projects.

```glsl
#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;          // canvas size in device px
uniform float uDpr, uT, uL, uP;
uniform int uN, uDark;
uniform vec3 uCol;          // the page colour, linear 0–1 from the background token
uniform vec4 uQ[16];        // blob x, y, radius, stretch (CSS px)

float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float edge = uL + uP * (9.0 * sin(p.x * 0.007 + uT * 0.8) + 5.0 * sin(p.x * 0.019 - uT * 1.3));
  float s = edge - p.y;                                    // < 0 inside the colour
  for (int i = 0; i < 16; i++) { if (i >= uN) break; vec4 q = uQ[i]; vec2 r = p - q.xy; r.y /= q.w;
    s = smin(s, (length(r) - q.z) * min(1.0, q.w), 48.0); }
  float d = -s;                                            // ≈ px into the colour
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
}
```

## Rest states

- **Top of the page:** with `s = 0`, `P = 0` and every blob sits below `L`, so nothing is visible: the same first paint as today.
- **Reduced motion:** no canvas and no loop. The hero renders exactly as it does today under reduced motion (`scrollParallaxMotion` factor 0, overlay below the fold, invisible), from first paint.
- **No WebGL2, or a lost context:** fall back to today's static SVG wave on `ScrollParallax`.
