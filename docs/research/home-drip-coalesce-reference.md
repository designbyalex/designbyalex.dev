# Home drip: Coalesce reference

The direction is the motion Alex signed off on 2026-11-12, distilled from the throwaway picker prototype (private page *Portfolio Home Drip Picks*, rounds 1–3). The numbers are the shipped ones: Alex's Drip tuner preset of 2026-11-13 ("Preset 13 Nov, 11:34"), which landed in #143 (PR #152). It is a reference, not product code; the product code is `components/motion-primitives/scroll-drip-canvas.tsx` (WebGL2 layer) and `scroll-drip.tsx` (host and fallback), and **the code is the source of truth**: when this doc and the code disagree, the code wins. Research and licences are in `home-drip-mask.md`.

## Update 2026-11-13: the Drip tuner preset replaced the signed-off values

Alex's Drip tuner preset of 2026-11-13 replaced the values he signed off on 2026-11-12. Every number below is the preset's. The superseded 2026-11-12 values are kept in *History* at the end, for reference only. The direction (Coalesce) and the picks that are not numbers (gloss, page colour, 1.5× sheet speed) did not change.

## Alex's picks

| Decision | Pick |
|---|---|
| Drip direction (round 1) | **C · Coalesce**: blobs of page colour rise ahead of the edge, gooey and stretching with speed, and merge into the sheet as it catches up |
| Sheet speed | Now: 1.5× the page (today's mapping) |
| Blob lead | Tuner preset: lead factor 0.8 (2026-11-12 pick: "mid", 0.6) |
| Viscosity | Tuner preset: goo k 85, stretch 0.00155 per px/s, trail 0.2 (2026-11-12 pick: "medium", k 48, 0.0007, 0.04) |
| Blob count and size | Tuner preset: 25 medium + 3 droplets on desktop, 19 + 14 under 1024 px, capped at 32 (2026-11-12 pick: "mixed", 14 + 12 and 7 + 6) |
| Edge highlight | Gloss: lit liquid; dark gloss 0.35, light edge shade 0.2 (2026-11-12: 0.5 and 0.16) |
| Colour | Now: the page colour |
| Sign-off | Round 3 **Final** on 2026-11-12; Alex's Drip tuner preset of 2026-11-13 then replaced the numbers |

## Geometry and timing

All lengths are CSS px in hero coordinates (y down from the hero's top). `H` is the hero's height (100svh), `s` is `scrollY`; the hero tops the document, so `scrollY` is `s` directly.

- **Baseline:** `L = H + 40 − 0.5·s`. This is today's 1.5×-the-page parallax, measured to the wave's mid-crest. At `s = 0` the colour sits below the fold.
- **Progress:** `P = clamp(0.5·s / (0.35·H), 0, 1)`, so blobs start from the first pixel of scroll and are fully built up over 0.35 of the hero; emergence `e = min(1, 4·P)`; blob rise `R = P · H · 0.8`.
- **Sheet edge:** `edge(x) = L + P·(9·sin(0.007x + 0.8t) + 5·sin(0.019x − 1.3t))`, where `t` is in seconds.
- **Blobs:** each blob is seeded once per width, so the layout is stable. The layout uses the approved prototype's Park–Miller generator (`s = s · 16807 mod 2147483647`) and the tuner's draw order, so the tuner's seeds give the tuner's layout. Seeds are 7 on desktop and 70 under 1024 px. The prototype spent 5 draws on each of its Melt drips (11 on desktop, 5 on phones) before the blobs; the tuner keeps that burn, so the port does too.
  - **Medium set:** 25 on desktop, 19 on phones (width < 1024). Spread evenly across the width with ±40% slot jitter. Radius 4–82 px.
  - **Droplet set:** 3 on desktop, 14 on phones. Radius 20–25 px. Their lead is multiplied by 1.4, capped at 1.25.
  - **Phone radii:** both sets × 0.6.
  - **Per blob:** a random `lead` in 0–1 and a phase `ph`. At most 32 blobs in total, which is the shader's array size. Desktop's 28 fit; on phones 33 are seeded and the last droplet is cut.
  - **Blob centre:**
    - `x = x0 + 25·e·sin(0.7t + ph)`
    - `y = L + (r + 24)·(1 − e) − lead·R + 35·e·sin(1.1t + 2ph) + max(0, v)·0.2·lead`
    - `v` is the smoothed scroll velocity in px/s. That last term (the trail, 0.2) makes blobs trail when you scroll fast.
  - **Stretch with speed:** `stretch → 1 + min(0.8, |v|·0.00155)`, eased at rate 6/s. The blob's y radius is multiplied by `stretch`.
- **Velocity:** the prototype's own: the raw per-frame scroll delta over dt, smoothed first-order with `v += (raw − v)·min(1, 8·dt)`. A raw delta above 20000 px/s (a jump, not a scroll) decays `v` instead of feeding it. A critically damped spring (Motion's `useVelocity` plus `useSpring`) was tried and dropped: it lagged the flick, so blobs barely stretched on fast scrolls.
- **Merge:** polynomial smooth-min with `k = 85` px between the sheet and every blob.
- **Render loop:** on demand. A frame schedules the next only while the hero is on screen (IntersectionObserver), the tab is visible, and the drip is visible or still settling (`P > 0`, or velocity and stretch not yet at rest). Scroll, resize, theme changes and re-entry wake it. DPR is capped at 1.5.

## Shader

WebGL2, one full-screen triangle (from `gl_VertexID`, no buffers) on a canvas that covers the hero (inside its clip, above the text, `pointer-events: none`), with premultiplied alpha. The colour fades back to the exact page colour over the last 140 px above the hero's bottom edge, so there is no seam with Selected projects. `uCol` is the `--background` token's sRGB value normalised to 0–1, *not* linearised: the shader writes it out unconverted, so sRGB in is sRGB out, which makes the fill match the page by pixel. The gloss tints mix in sRGB too.

```glsl
#version 300 es
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
}
```

## Rest states

- **Top of the page:** with `s = 0`, `P = 0` and the sheet (`L = H + 40`) and every blob sit below the fold, so nothing is visible: the same first paint as today.
- **Reduced motion:** no canvas and no loop. The hero renders exactly as it does today under reduced motion (`scrollParallaxMotion` factor 0, overlay below the fold, invisible), from first paint. The decision goes through `scrollDripMotion` in `lib/motion/reduced-motion.ts`.
- **No WebGL2, a shader that won't compile or link, or a lost context:** fall back to today's static SVG wave on `ScrollParallax`, for good (no restore attempt).

## History: the values signed off on 2026-11-12

Superseded by Alex's Drip tuner preset of 2026-11-13. These were the numbers in this doc before #143 shipped; none of them is in the code.

| Item | 2026-11-12 value | Now (2026-11-13 preset) |
|---|---|---|
| Baseline | `L = H + 130 − 0.5·s` | `L = H + 40 − 0.5·s` |
| Progress | `P = clamp((0.5·s − 60) / (0.55·H), 0, 1)` | `P = clamp(0.5·s / (0.35·H), 0, 1)` |
| Blob rise | `R = P·H·0.6` (lead "mid") | `R = P·H·0.8` |
| Medium set | 14 desktop, 7 phone; radius 26–82 | 25 desktop, 19 phone; radius 4–82 |
| Droplet set | 12 desktop, 6 phone; radius 6–18 | 3 desktop, 14 phone; radius 20–25 |
| Phone radii | × 0.65 | × 0.6 |
| Blob lead | random 0.15–1.0 | random 0–1 |
| Blob cap and `uQ` size | 16 (the prototype's array size; the port had already raised it to 32) | 32 |
| Blob x wobble | `16·e·sin(0.7t + ph)` | `25·e·sin(0.7t + ph)` |
| Blob y wobble | `10·e·sin(1.1t + 2ph)` | `35·e·sin(1.1t + 2ph)` |
| Trail | `max(0, v)·0.04·lead` | `max(0, v)·0.2·lead` |
| Stretch with speed | `1 + min(0.8, \|v\|·0.0007)` | `1 + min(0.8, \|v\|·0.00155)` |
| Merge (goo) `k` | 48 px | 85 px |
| Dark gloss | spec × 0.5 | spec × 0.35 |
| Light edge shade | `shade·0.16` | `shade·0.2` |
| Velocity | the same first-order smoothing at 8/s, suggested Motion's `useVelocity` plus a light `useSpring` as the native equivalent | first-order smoothing at 8/s on the per-frame delta (a spring lagged the flick) |
| `uCol` | "linear 0–1" | sRGB 0–1, unconverted |
