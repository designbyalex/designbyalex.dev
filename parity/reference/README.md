# Reference snapshot (frozen)

A capture of the **Reference site** (Framer, https://designbyalex.dev) taken on 2026-10-19, before Cutover. It is what the Fidelity gate compares the Build against (ADR 0002, PRD #46). Framer will stop serving this domain at Cutover, so these files are the only Reference from then on.

**It is never re-captured.** `pnpm parity:capture-reference` is a one-off, run by the site owner while Framer was live. It refuses to run once `manifest.json` exists, it aborts if a page doesn't carry Framer's `generator` meta, and `scripts/afk/settings.json` denies it to the unattended loop. The gate only *reads* this folder. Its own Build snapshots go to the gitignored run folder.

## Contents

| File | What |
|---|---|
| `manifest.json` | Origin, capture time, browser, and one entry per page × width: snapshot and screenshot file names, `screenshotScale`, status, page height and Section ids |
| `{page}-{width}.json` | One page snapshot (format below) |
| `{page}-{width}.jpg` | Full-page screenshot, JPEG q0.6. 1440 is downscaled to 960px wide (`screenshotScale` 0.667); 768 and 390 are 1:1. Multiply snapshot CSS px by `screenshotScale` to crop a Section |

Pages: `home` (`/`), `acacia`, `mosurban`, `not-found` (`/parity-reference-missing-page`, Framer's 404). Widths: the Checkpoint widths 390 (×844), 768 (×1024) and 1440 (×900).

## How a snapshot is taken

`scripts/parity/extract.ts` (`pnpm parity:extract <url> --width 1440 [--sections reference|build]`) works against any origin: the Reference site, Vercel production or a local server. For each page and width it:

1. opens the URL in **system Google Chrome**, with Playwright pinned to 1.56.1. Playwright's bundled Chromium has no H.264, so it can't play Framer's MP4s. The Build must be extracted with the same browser.
2. renders at the Checkpoint width, DPR 1, in the **dark theme** (`prefers-color-scheme: dark`, and next-themes' `localStorage.theme`), with **`prefers-reduced-motion: reduce`**.
3. scrolls through the whole page in half-viewport steps so lazy media load and in-view reveals fire. It then scrolls each `<video>` into view, waits 1.5 s and records whether it is playing. Finally it wheels back up to the top, so a hide-on-scroll header comes back, and waits 1 s.
4. collects the DOM facts in the page (`collect.ts`) and turns them into the snapshot in Node (`build-snapshot.ts`, pure and unit-tested).

## Snapshot format (`format: 1`)

The types are in `scripts/parity/snapshot.ts`, the source of truth. Bump `SNAPSHOT_FORMAT` on any breaking change. All geometry is CSS px in page coordinates, with the page scrolled to the top, rounded to 0.1px. `local` is the same point relative to the top-left of the item's Section, or null when the item is in no Section. Compare positions by `local`, not by absolute `y`: one Section's height changes every y below it.

**Page:** `url`, `finalUrl`, `origin`, `path`, `width`, `viewport {w,h}`, `clientWidth` (less than `width` if a scrollbar took space), `colorScheme`, `reducedMotion`, `status`, `title`, `generator`, `pageHeight`, `fonts` (families that loaded), `capturedAt`, `browser`.

**`sections[]`**: `{ id, name, occurrence, box }`, in page order. `name` is Framer's layer name. `id` is unique: the name, with ` 2`, ` 3`… added for repeats (`Project Row`, `Project Row 2`). Section rules live in `scripts/parity/sections.ts`:
- `Header` (the `nav`, whose layer name is its variant, e.g. "Desktop") and `Footer` (the `footer`)
- `Hero Content` (home) and `Project Hero` (case studies; it includes the sibling `Hero Image` layer)
- `Back` (the sticky case-study pill)
- every outermost named layer inside `main`, e.g. `Works Header`, `Project Overview`, `Section Mission`, `Section CTA`

The Build marks its Sections with `data-section="<id>"` (`BUILD_SECTIONS`). The comparator's Section map (#49) pairs the two.

**`runs[]`**: leaf text runs. A run is contiguous text inside one block with one computed style, so a paragraph with a green phrase is three runs. `{ text, block, section, box, local, lines, style, opacity, link }`.
- `text` is the DOM text with whitespace collapsed, **before** `text-transform`. Quotes, dashes and case are verbatim; normalising them is the comparator's job.
- `style`: `{ family, size, lineHeight (px, or null for normal), weight, tracking (px), color, transform, fontStyle }`
- `box` is the glyph box, which can overhang the line box when the line-height is tight. `lines` counts the line boxes the run wraps onto.
- Text a visitor can't see is left out: anything clipped by an overflow ancestor (hover text-roll duplicates) or at effective opacity 0 (Framer's sizing copies of the metric numbers).
- `link` indexes `links[]`; `block` indexes `blocks[]`.

**`blocks[]`**: the nearest block-level box around runs: `{ text, tag, section, box, local }`. `text` joins its runs, which lets a matcher anchor on a whole paragraph before comparing the phrases inside it.

**`links[]`**: `{ text, href (absolute), path (same-origin only, else null), target, rel, section, box, local }`.

**`media[]`**: `{ kind: image|video|background|iframe, src, host (null for data: URLs), alt, section, box, local, natural {w,h}|null, fit, radius, video }`. `radius` is the largest corner radius on the element or on a same-size clipping wrapper. `video` is `{ autoplay, muted, controls, loop, playsInline, poster, pausedAfterView }`.

## Notes on this capture

- Framer ignores `prefers-reduced-motion` for its videos: all of them autoplay (`pausedAfterView: false`). The Build not autoplaying under reduced motion is an approved Deviation.
- At 390 and 768, Framer renders no UX (Studio Display) video on `/mosurban`: it has 2 videos there against 3 at 1440.
- `not-found` has no Sections: Framer's default 404 page has no named layers.
- Media `host` is `framerusercontent.com` throughout. That is the inventory the Build must re-host.
