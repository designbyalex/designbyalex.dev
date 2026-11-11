# Motion review fixes, 2026-11-11

Evidence for the four "Needs work" items from Alex's motion review of #112. Everything here was captured from a local production build (`tinacms build --local` + `next start`). Each run used a fresh browser (cold cache), 4× CPU throttling and a Fast-4G-like network, unless noted. `probe.mjs` made it; `summary.json` has the numbers.

## 1. The case-study hero reveal fails on the first visit

**Cause.** The entrance was motion/react tweens that started at hydration. On a cold load the 1.4 MB bundle keeps the main thread busy, so:

- the band stayed covered (and the title hidden) until hydration, about 2.7 s here;
- the tweens run on the main thread, so any long task during them stalls the frame and the tween jumps ahead. Even unthrottled, a cold load had 165–230 ms gaps, and the title jumped from 56 px to 25 px in one frame. On a slower machine the whole second fits inside the gaps: "stays black, then snaps".

A second visit hits the browser's compiled-code cache, hydrates fast and looks fine. That's why it only failed the first time.

**Fix.** The entrance is now CSS keyframes, which run on the compositor and keep playing while the main thread is busy:

- The title, pill and tagline rise from the first paint.
- The mask waits for the hero image to decode (capped at 2.5 s), then slides off.
- An inline script starts the mask on a hard load before the bundle runs; an effect does it after a client-side navigation.
- Phones and tablets now get the same band reveal as desktop.

**Evidence.**

- `timeline-cold-acacia-1440-dark-before-vs-after.jpg` and `…-390-…`: one frame every 250 ms from navigation start. The top row is the PR before this fix, the bottom row is the fix. Before, the band and title are blank for about 2.5 s; after, both are up by about 0.75 s.
- `recording-cold-*-before.webm` / `…-after.webm`: the same runs as video.
- `cold-acacia-{1440,768,390}-{dark,light}.jpg`: the reveal on a cold hard load, one frame every 80 ms.
- `nav-home-to-acacia-*.jpg`: the first client-side navigation from `/`, cold.
- Measured from the video frames: every run opens the band over about 0.5 s with 10–12 in-between frames at 25 fps. The largest single-frame step is 21–25%, which is the easing curve's own steepest 40 ms step (24.1%). The occasional 34–37% is one dropped recorder frame, not a stall.

## 2. The case-study hero needs JavaScript

The server HTML is now the resting state. The start state only applies under `@media (scripting: enabled)` with no reduced-motion preference, so:

- **With JavaScript disabled,** the hero is at rest and visible: `nojs-{acacia,mosurban}-{1440,768,390}.jpg`.
- **With reduced motion,** it is at rest from the first frame (every sampled frame: mask hidden, title untransformed).
- **Otherwise,** the first paint is already the start state, so the resting state never flashes before the animation.

## 3. The home hero differs between light and dark

Two differences were removed:

- the light-only scrim band under the header;
- the page colour showing through the hero. The section had no background of its own, so the 90% gradient and the blended mark sat on white in light. It now sits on the dark page colour (#080808) in both themes.

Light and dark screenshots of the hero now differ only in the theme toggle's sun/moon icon, at all three widths. The wave that scrolls up into Selected projects still follows the theme, because it is the page colour arriving.

**Contrast over the hero (identical in both themes now):**

| Text | Size | Contrast | Needs |
|---|---|---|---|
| Headline | 42–75px | 4.2–5.1:1 | 3:1 ✅ |
| Tagline | 18px | 11:1 | 4.5:1 ✅ |
| "See Selected Projects" | 18px | 6.5–8.7:1 | 4.5:1 ✅ |
| Header "Let's talk" | 20px | 2.2–2.4:1 | 4.5:1 ❌ |

"Let's talk" sits on the brightest corner of the gradient. Dark has always measured this (it matches Framer); the removed light scrim was the only thing lifting light to AA. **Decision for Alex:**

- accept it as in Framer;
- or add one subtle top scrim to both themes, which would change dark slightly from Framer.

## 4. Near-black header flash before hydration on `/`

The header's over-hero styling now hangs off one attribute, `data-over-hero`, instead of React state:

- **The server** renders it white on `/`, theme-coloured elsewhere.
- **An inline script** right after the header keeps it in step with the scroll position until hydration.
- **The hydrated header** takes over after that.

**Evidence** (light, with the bundle blocked to freeze the pre-hydration state):

- `prehydration-header-top-*.png`: white over the hero.
- `prehydration-header-midpage-reload-*.png`: theme-coloured after a mid-page reload, because the script corrects it when the browser restores the scroll position.

**Trade-off chosen:** server-render white on `/` and correct with a tiny script, rather than a CSS-only approach. CSS scroll-driven animations would skip the script, but Firefox doesn't support them. The one remaining miss: with JavaScript disabled entirely, a mid-page load of `/` keeps a white header over the white page until you scroll back up. With JavaScript on, the header is right from the first paint in every case tested.
