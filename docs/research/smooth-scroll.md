# Smooth scrolling

Alex asked for smooth scrolling on 2026-11-13. This file records his answers, the options survey and the direction he picked, with its numbers. The PBI that builds it is linked at the end.

## Decision (2026-11-13)

Alex picked these on the Portfolio Smooth Scroll Picks page, round 1 (https://claude.ai/artifact/N26uDF5Q6q9WEZgGDmMjj4). The page ran the real home page with real Lenis 1.3.27 for every option, in dark and light.

| Decision | Pick | Values |
|---|---|---|
| Scroll feel | **Cinematic** | Lenis `duration: 1.2`, `easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t))` (Lenis' own expo-out). Every wheel event starts a fresh 1.2 s eased glide to the new target. |
| Wheel distance | **1.2×** | `wheelMultiplier: 1.2` |
| "See Selected Projects" jump (`#works`) | **Glide, 1.2 s expo out** (suggested) | `lenis.scrollTo(target, { duration: 1.2, easing: expoOut })` |
| Drip stretch | **As tuned** (suggested) | The drip keeps reading `window.scrollY` with its current constants: stretch gain 0.00155 per px/s, cap 0.8, velocity smoothing 8/s. |

Options he passed over: Native (the control), Balanced (`lerp 0.1`), Weighty (`lerp 0.07`, suggested), Heavy (`lerp 0.05`); wheel 1× (suggested) and 0.8×; Instant and Sweep (1.6 s ease in-out) jumps; Livelier drip (gain 0.0023).

### Scope, from the question round (2026-11-13)

- **Pages:** the whole site, mounted once in the root layout.
- **Inputs:** mouse wheel and trackpad are smoothed (both arrive as wheel events). Touch keeps the device's own momentum (`syncTouch: false`).
- **Why:** a premium, weighty feel.
- **Reduced motion:** always native. Lenis is not created at all, so nothing changes from first paint. Lenis' own `respectReducedMotion` (on by default since 1.3.26) is not enough, because it still routes the wheel through a short glide.
- **Tracking:** a standalone PBI, with no parent PRD.

### Settled without a pick

- **Route changes:** the new page starts at the top instantly, under the view-transition crossfade. Back and forward restore the old position with no glide. Lenis never touches `history.scrollRestoration`.
- **In-page links:** only the hero's "See Selected Projects" glides, through `lenis.scrollTo`. Lenis' `anchors` option stays off, so the skip link (`#main`) keeps its native instant jump and moves focus as it does today.
- **Keyboard, scrollbar drag, find-in-page and focus scrolling:** native. Lenis does not intercept them and re-syncs to them as plain `scroll` events.

## Options surveyed

Primary sources only, all accessed 2026-11-13. Sizes are min+gzip, measured by bundling one import with esbuild and gzipping it.

| Option | Licence | Size | Keeps native scroll | Notes |
|---|---|---|---|---|
| **Lenis 1.3.27** (picked) | MIT | 5.5 kB; 6.3 kB with `lenis/react` | Yes: it writes `window.scrollTo` each frame | `window.scrollY`, `scroll` events and Motion's `useScroll` keep working and report the smoothed position. Sticky, fixed and the skip link need no change. Touch is native unless `syncTouch`. No keyboard handler. |
| Motion (`motion` 12) | MIT | 0 kB | n/a | Ships no smooth scroller. motion.dev documents driving Lenis from Motion's frame loop. |
| GSAP ScrollSmoother 3.15.1 | GSAP Standard "no charge" licence (Webflow can change it; it bars building competing no-code tools) | 51 kB with core and ScrollTrigger | No: it moves the page content with a transform inside a fixed wrapper | `scrollY` runs ahead of what's on screen, so `useScroll` and the drip desync. Fixed elements must leave the wrapper, sticky likely breaks, and it sets `history.scrollRestoration` to `manual`. No reduced-motion handling. |
| CSS `scroll-behavior: smooth` | n/a | 0 kB | Yes | Smooths anchor jumps and scripted scrolls only, never the wheel. Already forced to `auto` under reduced motion in `styles.css`. |
| CSS scroll-driven animations | n/a | 0 kB | Yes (effects, not scrolling) | In all three engines since Firefox 159 (2026-10-27). They drive effects, not the scroll itself. |
| Locomotive Scroll 5.0.2 | MIT | 8.5 kB | Yes (it wraps Lenis) | Pins an older Lenis 1.3.17 with no reduced-motion support. A second copy of Lenis if used alongside it. |

### How Lenis' numbers work

- **`lerp`** (default 0.1) is frame-rate independent: `damp(x, y, lerp × 60, dt)`. It closes a fixed share of the gap every frame, so lower is heavier. 0.1 settles in about 0.5 s.
- **`duration` + `easing`:** used instead of `lerp` when `duration` is a number. Each input runs a fixed-length eased glide, which is what Cinematic uses.
- **`wheelMultiplier`** scales each wheel delta before smoothing.
- **`lenis.velocity`** is per frame, not per second. The drip keeps its own px/s maths on `window.scrollY`.

### Effect on the drip and Motion

- With Lenis, `window.scrollY` is already smooth. The drip's velocity is softer and trails longer than with a raw wheel.
- On the picker, Alex judged the drip at its tuned constants and kept them.
- `useScroll` parallax and the pinned hero follow the smoothed position with no change. Driving Lenis from Motion's frame loop keeps them on the same frame.

## Build notes for the PBI

- Add `lenis@1.3.27` and mount `<ReactLenis root>` in a client component in `app/layout.tsx`. Pass the options: `duration: 1.2`, `easing: expoOut`, `wheelMultiplier: 1.2`, `smoothWheel: true`, `syncTouch: false`, `anchors: false`, `autoRaf: false`.
- Drive Lenis from Motion's frame loop: `frame.update((d) => lenis.raf(d.timestamp), true)`, or `frame.setup` per motion.dev. That way `useScroll` and the drip read the current frame's position.
- Gate the provider through `lib/motion/reduced-motion.ts` like the other primitives. Under `prefers-reduced-motion: reduce` it renders nothing, and it tears down live when the setting changes.
- On a pathname change, call `lenis.scrollTo(0, { immediate: true })` (or let Next scroll, then `lenis.resize()`). Keep `html { scroll-behavior: auto }`. Consider `stopInertiaOnNavigate: true`.
- Point the hero's `#works` action at `lenis.scrollTo(target, { duration: 1.2, easing: expoOut })` when Lenis is running. Otherwise it stays a plain anchor.
- Check that `data-lenis-prevent` is unneeded for the case-study carousel (`overflow-clip`, not a scroller).
- The Tina admin (`/admin`) is a separate app and gets no Lenis.

## PBI

- #161 P53: Smooth scrolling sitewide with Lenis (Cinematic). Site lane, complex-agent, filed 2026-11-13.

## Sources

- npm registry and packages, via `npm view` and `npm pack`: `lenis@1.3.27` (`README.md`, `LICENSE`, `dist/lenis.mjs`, `dist/lenis-react.mjs`, `dist/lenis.css`), `lenis@1.3.17`, `gsap@3.15.1`, `locomotive-scroll@5.0.2`, `motion`, `@mdn/browser-compat-data@8.1.9`
- https://github.com/darkroomengineering/lenis and its releases
- https://motion.dev/docs/lenis
- https://motion.dev/docs/react-use-scroll
- https://gsap.com/standard-license
- https://gsap.com/docs/v3/Plugins/ScrollSmoother/
- https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior
- https://nextjs.org/docs/app/api-reference/components/link
- https://scroll.locomotive.ca/docs
- The full survey notes (2026-11-13) are in the master's shared notes folder, `smooth-scroll-research.md`.
