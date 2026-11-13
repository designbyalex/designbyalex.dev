# Ship the Hero piece as rendered video

The Hero piece (#101) is the green-glass Brand mark in the home hero. It melts in, then loops: it slumps into a formless blob and reforms. It ships as pre-rendered video, not as scroll-driven frames or real-time 3D. Blender renders the committed scene script (`hero-piece/`) in Cycles, and the hero plays the clips over a still. The design has no cursor or scroll interaction, which is the only reason #101 gave for real-time 3D. Video shows exactly what Alex approved in the render, decodes in hardware on every browser, and needs no 3D runtime in the bundle.

## What ships

- **Clips** in `public/hero-piece/`: `glass-clear-intro` (2.1 s, played once) and `glass-clear-idle` (7 s, seamless loop), each in wide (1440×900) and portrait (600×1300). They are H.264 MP4 at 30 fps, muted, with no audio and `playsinline`, plus VP9 WebM where that comes out smaller.
- **Stills**: `glass-clear.webp` (2880×1800) and `glass-clear-portrait.webp` (1200×2600). Each one is the first paint, the loading state, the video poster and the reduced-motion view.
- **Player** (`components/hero-piece/`): the portrait set below 1024px, the wide set otherwise, never both. It plays the intro once, then two idle videos hand off to each other, so the loop never seeks or flashes. Under reduced motion it renders no `<video>` at all, on the server or before hydration.
- **Backdrop**: the final look is glass-edge on a plain backdrop with no grid, shipped as `glass-clear`. A grid backdrop was used only while tuning, to judge the refraction, and Alex had it removed before launch. The hero shows the render full-bleed under a soft scrim, rather than blending a mark over the CSS gradient.

## Alternatives

- **Scroll-driven frames**: an image sequence scrubbed by scroll. Rejected because nothing in the design is driven by scroll. Hundreds of stills also weigh more than one H.264 stream and cost more to decode.
- **Real-time 3D** (WebGL / three.js transmission): rejected. The look depends on path-traced refraction, dispersion and a gooey remeshed melt. Real-time glass would only approximate that, and would vary by GPU. It would add a few hundred KB of JavaScript plus shader compile time, and keep the GPU busy on phones. That would be worth it only for cursor or scroll interaction, and the design has neither.

## Expected cost

| File | Wide | Portrait | Budget (wide / portrait) |
|---|---|---|---|
| Still (WebP) | 68 KB | 41 KB | n/a |
| Intro (MP4) | 300 KB | 160 KB | ≤ 800 KB / ≤ 500 KB |
| Idle (MP4) | 690 KB | 380 KB | ≤ 1.5 MB / ≤ 1 MB |

- **Bytes:** about 1.1 MB per visit on desktop and 0.6 MB on phones, every file within its budget. Clips load after the still; under reduced motion only the still loads. That is well within ADR 0001's limits, which cap each file at 10 MB.
- **Playback:** a continuous hardware-decoded loop. That's light on desktop, a small steady battery cost on phones, and nothing under reduced motion.
- **Changing the look:** any change means re-rendering in Blender. Cycles took about 96 minutes for the four clips on an Apple GPU, at 64 samples. The scene script and `hero-piece/glass-look-alex-edge-nogrid.json` are the source of truth, not the MP4s.

## Consequences

- Revisit this ADR if the hero gains cursor or scroll interaction, or if the clips outgrow their budgets or ADR 0001's limits.
- Not yet tested in Safari or on iOS.
