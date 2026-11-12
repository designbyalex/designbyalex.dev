# Home hero Scroll Overlay: making the drip feel alive

Research note, 2026-11-12. Question: which free/open-source libraries, components, techniques and assets could make the home hero's scroll-linked page-colour overlay livelier, drippier and more fluid, and which one fits this app?

Code read first: `components/blocks/hero.tsx` (Scroll Overlay block), `components/motion-primitives/scroll-parallax.tsx`, `lib/motion/reduced-motion.ts` (`scrollParallaxMotion`), `public/uploads/home/hero-scroll-overlay.svg`, `styles.css` (`--background` is `#ffffff`, and `#080808` under `.dark`).

Sizes are bundlephobia's min+gzip unless marked "measured". "Measured" means I fetched the dist file from jsDelivr and ran `gzip -9` on it. Anything marked **unverified** is an estimate or recollection that I could not confirm from a primary source.

## Status: picker rounds

- **Round 1, 2026-11-12:** Alex picked **C · Coalesce** over Melt, Slosh and Ink bleed: blobs of page colour rise ahead of the edge and merge into it gooily. The picks are on the private picker page *Portfolio Home Drip Picks*.
- **What that means for the ranking below:** blobs merging into the sheet need smooth-min metaball merging, which the procedural SVG path (option 1) can't do cheaply. So the pick points to option 2, a custom WebGL2 SDF shader. The picker's prototype is exactly that: one fragment shader, up to 16 blobs and a smooth-min. It stays a throwaway in the picker page.
- **Round 2** tunes Coalesce: sheet speed, blob lead, viscosity, blob count and size, edge highlight, and colour. The final picks, library, perf budget and reduced-motion rest state go on the PBI.

## Summary

1. The overlay reads as a sheet because it is one rigid vector translated at a constant 1.5× page speed. Nothing deforms, nothing reacts to velocity, and there is no edge cue, so in dark mode it is a flat #080808 plane rising.
2. You don't need a library to get drips and velocity response. A procedural SVG path, rebuilt from a few spring-driven "strands" fed by Motion's `useScroll` → `useVelocity` → `useSpring` (all already shipped), keeps SSR, keeps the fill on the `--background` token in both themes, and adds about 0 KB of dependencies.
3. A small custom WebGL2 fragment shader is the step up for "fluid": smooth-min merging, detaching droplets, noise wobble and a meniscus highlight. Paper's Apache-2.0 `ShaderMount` (about 5 KB gz) can host it, so there is no WebGL boilerplate to write. Its risks are colour-seam matching, context loss and battery.
4. The SVG goo filter is a poor fallback here. The blur+contrast variant needs an opaque backdrop, which the gradient hero doesn't have, and the alpha-threshold variant re-filters a viewport-sized area every frame. Full fluid sims, three.js/R3F, Rive and Lottie are all oversized for one edge.
5. Ranking: (1) procedural SVG drip path with Motion springs; (2) a custom SDF shader layered on (1) as progressive enhancement; (3) CSS-only `clip-path: shape()` driven by a scroll timeline, with no JS and no velocity.

## Why it reads as a sheet

- **One rigid shape.** `hero-scroll-overlay.svg` is a single closed cubic path in a 3000 × 2575.1 box. Its wavy top spans y ≈ 0–233 units, about 9% of its height. At 1440 px wide only the middle 1440 px of the 3000 px element is visible, so you see a gentle ripple about 150 px deep. Nothing in the file or in the code changes the path.
- **Constant, linear speed.** `ScrollParallax speed={150}` sets the factor to `150/100 − 1 = 0.5`, so `y = −scrollY × 0.5` on top of normal flow (`lib/motion/reduced-motion.ts`, `scroll-parallax.tsx`). The edge moves at exactly 1.5× the scroll with no easing, lag, overshoot or settle. It reaches the top of the viewport after about two-thirds of a viewport of scroll.
- **Ignores velocity.** A flick and a slow drag produce the same geometry. Liquid reads as liquid when it lags, stretches and recoils.
- **No drips form.** The wave has no pendant shapes (necks and bulbs), so nothing "hangs" or "lets go".
- **No surface or edge light.** The fill is one flat token colour. In dark mode, a #080808 plane over a saturated gradient reads as a black card. Light mode has the same problem with white.
- **Two static assets for the two themes.** The light and dark files are separate background images (hero.tsx comment: "a file can't read the token"). Any animated version has to read `--background` live instead.

## Techniques & libraries

| Option | Licence (exact) | Size (min+gz) | Mobile cost | Reduced motion | SSR / Next fit | Light/dark (fill = token) | Verdict |
|---|---|---|---|---|---|---|---|
| Procedural SVG path (own code) + Motion springs | n/a (own code); Motion is MIT | about 0 KB new; own code est. 2–4 KB | low; one path re-raster per changed frame, idle when springs settle | render the rest path, no springs | inline SVG renders on the server | `fill: var(--background)`; exact by construction | **Best fit** |
| SVG goo filter (feGaussianBlur + feColorMatrix alpha threshold) | n/a (SVG 1.1 / Filter Effects) | 0 KB | high over large areas; whole filter region re-rendered when its content changes (**unverified** per-engine numbers) | drop the filter, show the static shape | fine | alpha-only matrix keeps RGB, so token colour survives | Only for small regions (the drip band); not a fallback |
| CSS blur + `contrast()` "goo" | n/a (CSS) | 0 KB | medium–high | `animation: none` | fine | **Breaks**: needs an opaque backdrop, but the hero is a gradient | Reject |
| feTurbulence + feDisplacementMap | n/a (SVG) | 0 KB | high when animated (noise regenerated per frame; **unverified** numbers) | static noise or none | fine | displacement only moves pixels, so the colour stays exact | Optional edge wobble on a small band; risky on iOS |
| GSAP MorphSVG | "Standard 'no charge' license" (gsap.com/standard-license), not OSI | measured: core 27.8 KB + MorphSVG 9.3 KB (+ ScrollTrigger 17.6 KB) | low (main-thread path tween) | `gsap.matchMedia()` | client-only effect | path fill can use the token | Free to ship but not open source; needs designed keyframe shapes |
| flubber | MIT | 18.1 KB (0.4.2) | low | n/a | client | yes | Only if morphing between hand-drawn keyframes |
| CSS `clip-path: shape()` + `animation-timeline` | n/a (CSS) | 0 KB | low–medium (clip-path repaint; compositor support **unverified**) | `@media (prefers-reduced-motion)` → `animation: none` | pure CSS, SSR-perfect | div with the background token | **Good zero-JS option**, no velocity |
| CSS `mask-image` | n/a (CSS) | 0 KB | low for static masks | static | fine | mask the token-coloured div | Fine for a static edge; not deformable on its own |
| Canvas 2D drips / metaballs | n/a (own code) | about 0 KB new | medium; CPU raster at DPR 2–3, and `ctx.filter` is behind a flag in Safari | static frame or none | client-only, needs SSR fallback | read `--background` at runtime | Worse than SVG for the same geometry |
| Custom WebGL2 SDF shader (raw or Paper `ShaderMount`) | own code; Paper Shaders Apache-2.0 | raw about 0 KB; `ShaderMount` about 5.0 KB gz (bundlephobia exports-sizes) | low–medium GPU, one full-screen pass; ~0.1–0.3 ms/frame main thread (**unverified** estimate) | never mount; keep static SVG | `next/dynamic({ ssr:false })` in a client component, with SSR SVG beneath | read `--background` and pass it as a uniform; seam risk | **Step-up** |
| OGL | `Unlicense` (package.json; repo has no LICENSE file) | 34.2 KB full; README: core 8 KB, total 29 KB | low | app-level | client-only | uniform | OK host if more than one quad is needed |
| regl | MIT | 37.7 KB | low | app-level | client-only | uniform | Fine, heavier than needed |
| curtains.js | MIT | 23.5 KB | low–medium (DOM-synced planes) | app-level | client-only | uniform | Built for DOM-image planes; last push Apr 2025 |
| three.js | MIT | 185.7 KB (r187) | depends | app-level | client-only | uniform | Oversized for one quad |
| @react-three/fiber | MIT | 57.7 KB (v9) + three | depends | app-level | v9 needs React ≥19 (this app is React 18) | uniform | Reject |
| WebGL-Fluid-Simulation (PavelDoGreat) | MIT | measured: script.js 11.0 KB gz (plus dat.gui in demo) | **high**: 20 pressure iterations/frame, dye 1024 (512 on mobile) | not mounted | client-only | dye colour plus background | Reject for this; good reference |

### Notes per item

**Procedural SVG path (own code).** Treat the overlay's top edge as a function y(x): the existing wave plus N "strands". Each strand is a damped spring (length, velocity) whose target length rises with scroll progress and with |scroll velocity|. When the scroll slows it overshoots and recoils, which gives the "alive" lag. Draw each strand as path geometry: a narrowing neck into a round bulb using cubic Béziers, the same way vector drip illustrations are drawn, so no filter is needed. A bulb that passes a stretch threshold can detach as a separate `<circle>` that falls and fades. Rebuild `d` only while some spring is moving and stop when they all settle, so the cost is zero at rest. The outer `motion.div` translate stays compositor-only. Set the fill to `var(--background)` on the inline SVG, which removes the two-asset theme split. CSS `d` can't do this in Safari (MDN BCD: "parses, but has no effect"), so `d` has to be set as an attribute from JS.

**SVG goo filter.** The canonical alpha-threshold matrix is `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7` after `feGaussianBlur` (CSS-Tricks, Codrops/Lucas Bebber). It touches only alpha, so a single-colour fill keeps its exact RGB. That's good for the token. The cost scales with filter-region area, and the region here is viewport-wide. Two more points against it as a fallback: CSS filter functions don't apply to SVG elements in Safari (WebKit bug 246106), and an SVG `<filter>` must be used instead. Engine-level per-frame costs are **unverified**. Use it only on a small, separate drip band if at all.

**CSS blur + contrast().** Per Filter Effects §13.1.8, `contrast()` is an `feComponentTransfer` on R, G and B only, with no `feFuncA`. Blurred alpha edges therefore never threshold unless there is an opaque backdrop behind them. The hero is a gradient, so this trick can't work here.

**feTurbulence + feDisplacementMap.** These give an organic wobble to an edge. Animating `baseFrequency`/`seed` regenerates the noise every frame. A cheaper approach is static turbulence with an animated `scale` on the displacement (still a re-filter). Displacement moves pixels, so the colour stays exact. Use it only on a narrow edge band.

**GSAP MorphSVG / flubber.** Both morph between authored shapes. MorphSVG is now covered by GSAP's standard "no charge" licence: commercial use is allowed, Webflow owns it, there is a restriction on tools that compete with Webflow's visual builder, and it is not OSI open source. flubber is MIT, but its last tagged release is old and its CI badge points at legacy Travis. Either one fits only if Alex draws keyframe drip shapes. Neither gives velocity-driven physics by itself.

**CSS `clip-path: shape()` + scroll timeline.** `shape()` is supported in Chrome 135, Safari 18.4 and Firefox 148, and `animation-timeline: scroll()/view()` in Chrome 115, Safari 26 and Firefox 159. Firefox 159 shipped 2026-10-27, so as of November 2026 all three engines have both (MDN BCD). Clip a token-coloured div with a wavy-plus-drips `shape()` whose keyframes keep the same command structure, so they interpolate, and key it to a `view()` timeline on the hero. It needs zero JS, but the drips lengthen with position, not velocity. Whether clip-path animation runs off the main thread differs per engine (**unverified**). Older browsers keep today's Motion translate. Motion's `useScroll` can also drive `clipPath` through `ScrollTimeline` when fed `scrollYProgress` via `useTransform` (motion.dev useScroll docs).

**CSS `mask-image`.** Supported unprefixed in Chrome 120, Safari 15.4 and Firefox 53. It suits a static or translated edge (mask a token div with the wave SVG), but the mask image can't deform unless it is itself animated. It doesn't add life by itself.

**Canvas 2D.** It has the same geometry as the SVG approach but is rasterised on the CPU at DPR 2–3 over a viewport-wide canvas. It needs a client-only mount and an SSR stand-in, and `CanvasRenderingContext2D.filter` (for blur goo) is behind a preference flag in Safari (MDN BCD). `OffscreenCanvas` (Safari 16.4) helps with threading but not with fidelity. It has no advantage over SVG here.

**Custom WebGL2 SDF shader.** Write the edge as a signed distance:

1. the wave as a function of x,
2. each drip as an uneven capsule (narrow neck, round bulb),
3. merging through `smin`, the polynomial smooth-min,
4. optional domain warp from 1–2 octaves of noise.

Sources for the maths are iq's smooth-min and 2D-distance articles. Uniforms: progress, smoothed velocity, time, resolution, background colour, and per-drip spring state (about 12 vec2s). Interior output is exactly `vec4(u_bg, 1.0)`, plus a thin edge term for a meniscus highlight (light mode) or rim (dark mode) that never changes the interior.

Paper's vanilla `ShaderMount` (Apache-2.0) takes your `fragmentShader`, exposes `setUniforms`, pauses with IntersectionObserver and `visibilitychange`, and caps resolution with `maxPixelCount`/`minPixelRatio`. Its default `minPixelRatio` is 2, so lower it on phones. It uses WebGL2 (Safari 15+). Mount it with `next/dynamic(..., { ssr: false })` from a client component (Next docs: `ssr:false` is not allowed in Server Components). Keep the SSR SVG underneath until the first GL frame. Handle `webglcontextlost` by falling back to the SVG.

The main risk is a **colour seam**: canvas output vs CSS `--background` must match to the 8-bit level where the overlay meets the page below. Verify with a pixel probe in both themes on Safari and Chrome (**unverified**).

**Full fluid sims.** PavelDoGreat's (MIT) runs advection, divergence, 20 pressure iterations, curl, bloom and sunrays per frame. It drops dye resolution to 512 on mobile and turns off bloom/sunrays without linear filtering (its `script.js`). Stable fluids (GPU Gems ch. 38) is the theory behind it. It looks great, but it's a cursor toy, not a scroll edge, and too expensive for a hero handoff.

## Components & assets

| Item | Licence | Size | Fit |
|---|---|---|---|
| React Bits: MetaBalls, Liquid Ether, Ferrofluid | **MIT + Commons Clause** (LICENSE.md): use "as part of an application, website, or product" is allowed, but you may "not sell, sublicense, or redistribute the components themselves". Not OSI open source. | MetaBalls.jsx 21 KB source, raw WebGL, no deps; Liquid Ether 27 KB source | Cursor-driven blobs or fluid, not a scroll edge. Both check `prefers-reduced-motion`. Committing the component's source to this **public** repo is a grey area under "redistribute". Use as reference only. |
| Paper Shaders (`@paper-design/shaders[-react]`) | Apache-2.0 (LICENSE; README asks you to keep LICENSE and NOTICE when redistributing) | full 64.3 KB / React 83.0 KB; `Metaballs` export about 26.8 KB, `ShaderMount` about 5.0 KB (exports-sizes) | Metaballs orbit a centre (time-driven), not an edge. **`ShaderMount` is the useful part.** Pin the version (0.0.x ships breaking changes, per README). React 18 peer OK. |
| shaders.com (`shaders` npm) | MIT for engine and components (repo LICENSE); editor, presets and Pro are under separate terms | 99.0 KB (4.0.7) | Has a `Goo` metaball component, but it's **WebGPU** ("Real WebGPU", README). Firefox's WebGPU is partial (no Linux, no Android; MDN BCD). Too heavy and risky for this. |
| @shadergradient/react | MIT (README) | 49.5 KB + three + R3F | Gradients, not drips. README says Next 15 App Router needs R3F v9 + React 19. Reject. |
| Aceternity UI (Gooey Input, Wavy Background, Liquid Glass…) | Free tier licence **not stated**; site terms say you must not "Redistribute content from ui.aceternity.com"; Pro licence forbids redistributing source | n/a | Treat as **not freely licensed** for a public repo. Reference only. |
| Magic UI | MIT | n/a | No drip component. `scroll-based-velocity.tsx` is a good reference: `useVelocity(scrollY)` → `useSpring({ damping: 50, stiffness: 400 })`. |
| Unicorn Studio | **Proprietary**: the SDK may be used "only for integration with legitimate Unicorn Studio projects" (unicornstudio.js README). Third-party `unicornstudio-react` wrapper is MIT, but the runtime is not. | n/a | Not free/OSS. Don't ship. |
| Lottie drip assets (LottieFiles) | Lottie Simple License: commercial use allowed, attribution "strongly encouraged" but not required, no compiling to build a competing service | lottie_light measured 45.4 KB gz; dotlottie-web 31.4 KB + wasm measured 480 KB gz | Can be scrubbed by scroll but not velocity-physical. Needs runtime colour override for the token. Assets must come from Alex (house rule), so a stock drip is out anyway. |
| Rive | runtime MIT (rive-wasm LICENSE); editor is SaaS | @rive-app/canvas 86.6 KB + rive.wasm measured 919 KB gz | Far too heavy for one edge. Reject. |
| Codrops demos | MIT "if not specifically mentioned otherwise" (codrops licensing page). Older repos carry "Don't republish, redistribute or sell 'as-is'" (e.g. CreativeGooeyEffects README). | n/a | Fine to learn from and adapt. Check each repo. |
| CodePen pens | Public pens are "automatically MIT licensed" (CodePen docs) | n/a | Fine to adapt with attribution. |

## Scroll drivers

**Motion (already a dependency, MIT, 0 KB marginal).** `useScroll()` gives `scrollY`/`scrollYProgress` and can hand `opacity`/`transform`/`clipPath`/`filter` to the browser's `ScrollTimeline` for hardware acceleration (motion.dev useScroll). `useVelocity(scrollY)` gives a velocity motion value and can be chained for acceleration (motion.dev useVelocity). Units are per second by inference from the docs' ±3000 example (**unverified** wording). `useSpring` smooths it. `useReducedMotion` already gates `ScrollParallax`. Read values with `.get()` inside one rAF or `useMotionValueEvent`, then write the path or uniforms directly, not through React state.

**GSAP ScrollTrigger.** `scrub: <seconds>` gives catch-up smoothing and `getVelocity()` returns px/s (gsap.com ScrollTrigger docs). `gsap.matchMedia()` is the documented way to branch on media queries, including reduced motion. Measured cost is 27.8 KB core + 17.6 KB ScrollTrigger gz, under a free but non-OSI licence. It would duplicate Motion, so it isn't worth adding.

**CSS scroll-driven animations.** Zero JS and supported by all three engines as of Firefox 159. They can't read velocity, so they suit approach 3 only.

**Velocity shaping (any driver).** Clamp |v| to around 4000 px/s and map it through a soft curve (e.g. `1 − e^(−|v|/1500)`) to a stretch target. Give each strand its own spring with slightly different stiffness so they don't move in lockstep. Scrolling up (negative v) should shorten the strands and briefly fatten the bulbs. Codrops' WebGL Scroll Spiral uses the same idea: velocity × 0.99 per frame as damping.

## Inspiration

All links resolved on 2026-11-12. Codrops and CodePen links were checked in a real browser because they 403 bots.

1. [Codrops: SVG Shape Overlays demo](https://tympanus.net/Development/ShapeOverlays/): per-point staggered easing of a wavy edge, with 2–3 stacked layers that give the edge depth. This is the closest relative of our overlay.
2. [Codrops: Dynamic Shape Overlays with SVG](https://tympanus.net/codrops/2017/10/17/dynamic-shape-overlays-with-svg/): the per-point delay maths (code: [ykob/shape-overlays](https://github.com/ykob/shape-overlays), MIT).
3. [Codrops: Creative Gooey Effects](https://tympanus.net/codrops/2015/03/10/creative-gooey-effects/): origin of the alpha-threshold goo and its filter-region caveats.
4. [CSS-Tricks: The Gooey Effect](https://css-tricks.com/gooey-effect/): reference matrices (`18 -7`, `19 -9`) for tuning neck thickness.
5. [CodePen: Liquid Dripping – CSS Only](https://codepen.io/pareshd/pen/xgOEQb): drip strands on a top edge. Take the neck/bulb proportions and the timing offsets.
6. [CodePen: SVG DRIP](https://codepen.io/digitalcraft/pen/MwoyZd): an interactive drip with goo. Take how a bulb detaches.
7. [CodePen: Ink Droplets – Black](https://codepen.io/dfsmith/pen/gOjwxXE): dark ink on light. Shows how a dark fill can still read as liquid.
8. [CodePen: Gooey Menu (Lucas Bebber)](https://codepen.io/lbebber/pen/LELBEo): classic goo merging and the springy overshoot timing.
9. [CodePen: GreenSock "Scroll Shader"](https://codepen.io/GreenSock/pen/EaVbXeM): minimal wiring from scroll to shader uniform.
10. [Codrops: WebGL Scroll Spiral](https://tympanus.net/codrops/2017/04/26/webgl-scroll-spiral/): scroll velocity with 0.99 damping fed into a shader (regl).
11. [Codrops: Smooth WebGL Shader Transformation on Scroll](https://tympanus.net/codrops/2021/07/13/rock-the-stage-with-a-smooth-webgl-shader-transformation-on-scroll/): scroll-progress uniforms plus noise for organic variation.
12. [Codrops: Liquid Distortion demo](https://tympanus.net/Development/LiquidDistortion/): displacement-map wobble. Take the amplitude decay after movement stops.
13. [Codrops: Morphing Page Transition](https://tympanus.net/codrops/2017/08/08/morphing-page-transition/): full-screen path-morph handoff. Its comments note it breaks on scrollable pages, which is worth avoiding.
14. [WebGL Fluid Simulation demo](https://paveldogreat.github.io/WebGL-Fluid-Simulation/): the ceiling of "fluid". Use it to calibrate how much is too much.
15. [Inigo Quilez: smooth minimum](https://iquilezles.org/articles/smin/) and [2D distance functions](https://iquilezles.org/articles/distfunctions2d/): `smin` plus the uneven capsule (a drip in one SDF).
16. [Paper Shaders: Metaballs](https://shaders.paper.design/metaballs): a tuning reference for merge softness and colour banding.
17. [React Bits: Liquid Ether](https://reactbits.dev/backgrounds/liquid-ether): a stable-fluids look at modest resolution (0.5×). Reference only (licence above).
18. [Awwwards: Appia Bio, Technology (++hellohello)](https://www.awwwards.com/inspiration/technology-appia-bio): lists a "Mitosis Animation (Metaballs)" element, cell-like merge/split as brand motion.
19. [Awwwards: Victor Sin 2026, Scroll projects transition](https://www.awwwards.com/inspiration/mobile-layout-victor-sin-2026): tagged webgl/shader/fluid. A scroll-driven fluid handoff in a portfolio. The visual is in a video, so I didn't verify it beyond the tags.
20. [Awwwards: Quai Network section transitions (Unseen Studio)](https://www.awwwards.com/inspiration/section-transitions-quai-network): WebGL section transitions on scroll. Take the pacing of the handoff.

## Recommendation

The hypothesis was "a lightweight custom WebGL (or Canvas 2D) shader/metaball layer driven by Motion `useScroll` + `useVelocity`, with an SVG goo-filter fallback, beats pulling in a large lib". The evidence says it is **partly right**:

- Custom and Motion-driven does beat every library above. three/R3F are 185 + 58 KB, and R3F v9 needs React 19. Paper's metaballs are the wrong shape. React Bits is Commons Clause. Unicorn is proprietary. Rive's wasm is 919 KB.
- The goo-filter fallback is the wrong fallback. The contrast variant can't work over a gradient, and the alpha variant is a viewport-wide re-filter. The right fallback is the static or procedural SVG.
- Canvas 2D loses to SVG for the same geometry (CPU raster, no `ctx.filter` in Safari, no SSR).
- WebGL isn't needed to get drips and velocity response. It is needed for merging, detaching blobs and edge light. So it is rank 2, not rank 1.

### 1. Procedural SVG drip edge driven by Motion springs (do first)

- **Build:** replace the background-image div with an inline SVG whose fill is `var(--background)`. Rest path = today's wave (so SSR and first paint match the Reference). Add 8–14 strands with spring physics, drawn as neck+bulb Béziers. Optional detaching `<circle>` droplets. Drive it from `useScroll` + `useVelocity(scrollY)` + `useSpring`. Keep the existing 1.5× translate on the wrapper.
- **Budget:** +0 KB dependencies, est. 2–4 KB gz own code. Main thread est. 0.2–0.5 ms/frame while springs move, then 0 at rest. GPU: compositing only, plus one path re-raster per changed frame (Safari rasterises on the CPU; est. 1–3 ms on a mid phone, **unverified**). Cap path complexity on narrow screens.
- **Reduced motion:** `useReducedMotion` → no springs and no translate. The overlay renders the static rest path in place from first paint, exactly as it does today.
- **Risks:** path rebuild jank if `d` is set through React state, so set it imperatively. Drips must not cover the "See Selected Projects" link before it's tappable. Alex must approve the drip count and length (it's a creative call, so mark it `NEEDS ALEX`).

### 2. Custom WebGL2 SDF shader layer (step-up for "fluid", on top of 1)

- **Build:** a fragment shader using the wave SDF, uneven-capsule drips merged with `smin`, light noise warp and a thin meniscus/rim term, hosted in Paper's vanilla `ShaderMount` (Apache-2.0) or about 150 lines of raw WebGL2. Uniforms come from the same Motion springs. Lazy-mount via `next/dynamic({ ssr:false })` on first scroll or idle. Keep approach 1's SVG underneath until the first frame, and use it again on context loss or when WebGL2 is missing.
- **Budget:** about 5 KB gz (`ShaderMount`) + est. 3–5 KB own. Main thread est. 0.1–0.3 ms/frame. GPU: one full-screen pass at capped DPR 1.5 on phones (about 0.7 Mpx at 390×844), est. under 2 ms on recent mobile GPUs (**unverified**). Init est. 20–60 ms for context and compile (**unverified**), deferred off first paint. Render on demand: stop when springs settle and the hero is offscreen (`ShaderMount` already observes intersection and visibility).
- **Reduced motion:** never mounted. The approach-1 static SVG is the rest state.
- **Risks:** a colour seam between canvas output and the CSS `--background` (needs a pixel probe in both themes on Safari/Chrome). The theme toggle must update the colour uniform (observe the `.dark` class). Battery and thermals on long sessions. One more WebGL context on the page. Paper's 0.0.x API churn (pin the version).

### 3. CSS-only `clip-path: shape()` on a scroll timeline (cheapest alternative)

- **Build:** a token-coloured div clipped by a `shape()` edge with 3–4 keyframes (drips lengthening), driven by `animation-timeline: view()` on the hero. On engines without support, today's Motion translate applies.
- **Budget:** 0 KB JS, about 0 ms/frame JS. clip-path repaint per frame is engine-dependent (**unverified**).
- **Reduced motion:** `@media (prefers-reduced-motion: reduce) { animation: none }` → static rest shape from first paint.
- **Risks:** no velocity response, so it will feel "animated", not "alive". Keyframes must share command structure to interpolate. Firefox only gained timelines in 159 (2026-10-27), so it's very fresh.

## Sources

Repo: `components/blocks/hero.tsx`, `components/motion-primitives/scroll-parallax.tsx`, `lib/motion/reduced-motion.ts`, `public/uploads/home/hero-scroll-overlay.svg`, `styles.css`.

Specs and compat:
- MDN BCD `animation-timeline` (Chrome 115, Safari 26, Firefox 159): https://github.com/mdn/browser-compat-data/blob/main/css/properties/animation-timeline.json · Firefox 159 release date 2026-10-27: https://github.com/mdn/browser-compat-data/blob/main/browsers/firefox.json
- MDN animation-timeline: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline · WebKit guide: https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
- `shape()` (Chrome 135, Safari 18.4, Firefox 148): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape/shape · BCD: https://github.com/mdn/browser-compat-data/blob/main/css/types/basic-shape.json
- clip-path: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path · mask-image: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-image
- CSS `d` (Safari "parses, but has no effect"): https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/d
- CSS filters not applied to SVG elements in Safari: https://bugs.webkit.org/show_bug.cgi?id=246106 · BCD filter: https://github.com/mdn/browser-compat-data/blob/main/css/properties/filter.json
- Filter Effects §13.1.8 contrast equivalent (R, G, B only): https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
- feGaussianBlur https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur · feColorMatrix https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feColorMatrix · feTurbulence https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence · feDisplacementMap https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap
- Canvas `filter` (Safari behind flag): https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter · OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas · WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- WebGPU support (BCD api/GPU): https://github.com/mdn/browser-compat-data/blob/main/api/GPU.json
- prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- Next.js lazy loading / `ssr:false`: https://nextjs.org/docs/app/guides/lazy-loading

Libraries (licence and size):
- GSAP standard licence: https://gsap.com/standard-license/ · MorphSVG: https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/ · ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · matchMedia: https://gsap.com/docs/v3/GSAP/gsap.matchMedia() · dist measured from https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/
- flubber (MIT): https://github.com/veltman/flubber · https://bundlephobia.com/package/flubber
- OGL (Unlicense in package.json; README sizes): https://github.com/oframe/ogl · https://bundlephobia.com/package/ogl
- three.js (MIT): https://threejs.org/ · R3F (MIT, v9 peer React ≥19): https://r3f.docs.pmnd.rs/getting-started/introduction · https://registry.npmjs.org/@react-three/fiber/latest
- curtains.js (MIT): https://www.curtainsjs.com/ · https://github.com/martinlaxenaire/curtainsjs
- regl (MIT): https://github.com/regl-project/regl
- WebGL-Fluid-Simulation (MIT): https://github.com/PavelDoGreat/WebGL-Fluid-Simulation · Stable fluids, GPU Gems ch. 38: https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu
- Paper Shaders (Apache-2.0): https://github.com/paper-design/shaders · https://shaders.paper.design/ · exports sizes: https://bundlephobia.com/package/@paper-design/shaders-react
- shaders.com (MIT, WebGPU): https://github.com/shader-effects-inc/shaders · https://shaders.com/docs/components/goo
- shadergradient (MIT; Next 15 App Router note): https://github.com/ruucm/shadergradient · https://shadergradient.co/
- React Bits (MIT + Commons Clause): https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md · https://reactbits.dev/
- Magic UI (MIT): https://magicui.design/ · https://github.com/magicuidesign/magicui
- Aceternity UI: https://ui.aceternity.com/licence · https://ui.aceternity.com/terms · https://ui.aceternity.com/components/gooey-input
- Unicorn Studio SDK licence: https://github.com/hiunicornstudio/unicornstudio.js · https://www.unicorn.studio/
- Lottie: https://lottiefiles.com/page/license · https://github.com/airbnb/lottie-web · dotLottie: https://github.com/LottieFiles/dotlottie-web
- Rive runtime (MIT): https://github.com/rive-app/rive-wasm · https://rive.app/docs/runtimes/web/web-js
- Codrops licence: https://tympanus.net/codrops/licensing/ · CodePen licence: https://blog.codepen.io/documentation/licensing/
- Motion: https://motion.dev/docs/react-use-scroll · https://motion.dev/docs/react-use-velocity · https://motion.dev/docs/react-use-spring · https://motion.dev/docs/react-use-reduced-motion
- Bundle sizes: https://bundlephobia.com (API `api/size` and `api/exports-sizes`, queried 2026-11-12)
