# AFK run notes

Written by the unattended loop (`scripts/afk-loop.sh`): one section per ticket, then the final pass. Read this before reviewing the draft PR.

## #9 S5: Migrate Acacia case study
- Built: `content/projects/acacia.mdx` rewritten from the live `/acacia` copy (fetched via WebFetch; the text is verbatim). Header = frontmatter (status SHIPPED, title "Acacia Money", tagline, 3-paragraph intro, typology ×3, role + role description, timeline, collaborators with roles). Body = 18 blocks from the S4 library: `text` for mission / credibility (+ three user insights) / trust barrier / engagement / solution (+ key-features list) / outcome / what's-next; `quote` for each of the live page's seven pull-statements; `featureDeepDive` ×3 for onboarding, home-upgrade modules, energy profile & insights (alternating media side); `metrics` for the four outcome counters; `cta` "Want the full story?" → Calendly. Next-project link is rendered by `project-page.tsx` from the project collection once a second project exists.
- Decisions made without a human:
  - Added two fields to the `project` collection for fidelity: `intro` (rich-text, rendered between tagline and overview) and `roleDescription` (textarea, rendered under Role). `tina-lock.json` regenerated and committed.
  - `project-page.tsx` overview now follows the live order (Typology, Role, Timeline, Collaborators), labels the last column "Collaborators" (was "With") and shows each collaborator as "Name (Role)", one per line.
  - Dropped the placeholder top-level `metrics` from the Acacia frontmatter so the headline strip doesn't duplicate the Outcome section. The outcome numbers live in the `metrics` block where the live page has them.
  - Pull-statements (Framer `h5` lines like "We recognised that we didn't have a data problem…") use the `quote` block without attribution; it adds green curly quote marks, which the live page doesn't have. Accepted for reuse over a new block.
  - The per-feature summary lines under each deep-dive are authored as a bullet list in the deep-dive body.
  - Timeline uses an en dash ("Q3 2023 – Q2 2025"); live uses a hyphen.
- Stubbed:
  - **Images.** `curl` to designbyalex.dev / framerusercontent.com was denied in this session (the permission allowlist in `scripts/afk/settings.json` was not in effect), and WebFetch's markdown conversion strips `<img>`. No images are downloaded or referenced; `featureDeepDive` blocks render text-only and `public/uploads/projects/acacia/` does not exist yet. Final pass: `curl -fsSL https://designbyalex.dev/acacia -o .afk/cache/acacia.html`, grep `framerusercontent.com`, download into `public/uploads/projects/acacia/`, add `image.src`/`alt` on the three deep-dives and an `image`/`gallery` block where the live page shows screens (hero, mission, insights).
  - **Outcome metric values are `0`.** The live counters animate from 0 and the fetched text only exposes the initial "0%". Labels are correct; replace the four `value`s from the cached HTML (or from Alex) in the final pass. Kinds are `percentage`; switch to `delta` if the real copy reads "+N%".
  - Next-project link only appears once `/mosurban` (#10) exists (`resolveAdjacentProjects` returns null for a single project).
- Verify visually:
  - [ ] `/acacia` renders end to end in dark (faithful) and light.
  - [ ] Header: status eyebrow, title, tagline, intro paragraphs, 4-column overview with role description and two collaborators.
  - [ ] Text blocks: `##`/`###` headings and bold insight lead-ins read well with `prose-lg` in both themes.
  - [ ] Quote blocks without attribution look intentional as pull-statements; decide whether to hide the quote marks.
  - [ ] Deep-dive blocks without images span the row (`md:col-span-2`, added in this ticket) and read well at `max-w-3xl`.
  - [ ] Metrics grid with four items wraps to 2×2 at `md` (grid is `md:grid-cols-3`).
  - [ ] CTA button opens Calendly in the same tab (matches live).
  - [ ] Reduced motion: all reveals are `ScrollReveal` → `scrollRevealMotion`, so content renders at rest with `prefers-reduced-motion: reduce`; confirm nothing is left at opacity 0.

## #10 S6: Migrate MOS Urban case study
- Built: `content/projects/mosurban.mdx` (status `in-development`, `order: 2`, live at `/mosurban`) with the verbatim copy from designbyalex.dev/mosurban (fetched with curl into `.afk/cache/mosurban.html`, which is gitignored). Header = frontmatter (title "MOS evolution", tagline, 3-paragraph intro, typology, role + role description, timeline, tools ×4, deliverables ×8, `coverImage`). Body = 24 blocks, in live order: `image` hero → `featureDeepDive` "Where it all started" (pitch illustration, media right) → `quote` → `text` Defining the vision (+ 3 business considerations) → `text` Establishing user assumptions (+ 3 user considerations) → `text` Building stakeholder confidence (+ collaboration list) → `image` wireframes → `text` UX design and low-code development → `quote` → `text` key features list → `quote` → `video` (website walkthrough) → `text` Executing the rebrand → `quote` → `text` brand deliverables list → `image` factory illustration → `featureDeepDive` ×3 (brand strategy, brand assets, 10-year anniversary; text-only) each followed by its media (`video`, 2-up `gallery` of typography pages, `video`) → `text` Outcome / What's next ("Coming Soon…", as live) → `cta` Calendly. Six images downloaded to `public/uploads/projects/mosurban/` with alt text written from the actual pictures. The three Framer-hosted `.mp4`s are embedded via the `video` block from `framerusercontent.com`, per the PRD (no video in git). With two projects, `project-page.tsx` now renders the next/previous link on both case studies.
- Decisions made without a human:
  - Added `tools` and `deliverables` (string lists) to the `project` collection; the live overview has both columns. Rendered after Collaborators in `project-page.tsx`; Deliverables spans two grid columns and lists one item per line. `tina-lock.json` regenerated and committed.
  - Status accent: the live pills are green (shipped) and orange `#ff731c` (in-development). Added `--status-in-development` to `styles.css` (dark: `#ff731c`, faithful; light: `#b94a00` for AA contrast on white) and mapped it in `project-page.tsx`; shipped/concept keep `text-primary`. The pill background itself is not reproduced — the eyebrow label is coloured, matching how #9 rendered Acacia's status.
  - Hero and factory PNGs re-fetched with Framer's `?scale-down-to=2048` (3840px → 2048px) to keep the repo at ~1.8MB for this page instead of ~4.9MB.
  - The live "01" feature slide is a blank monitor-frame PNG with the walkthrough video playing inside it. Authored as `quote` (the slide's caption) + `video`; the frame PNG was discarded.
  - The live videos are muted autoplay loops. The `video` block has no `muted` option, so autoplay would be blocked by browsers (and would ignore reduced motion); set `autoPlay: false`, `loop: true`, with controls. Visitors click to play.
  - Framer `h5` pull-statements and the "01" `h4` caption use the `quote` block without attribution, as in #9.
  - Timeline uses an en dash ("Q3 2024 – Q4 2025"), consistent with Acacia.
  - Outcome metrics: the live counters are hidden (`opacity:0`) behind "Coming Soon…", so no `metrics` block — the text block says "Coming Soon…" for Outcome and What's next.
  - Homepage (`content/pages/home.mdx`) is still starter content; not touched (homepage ticket).
- Stubbed: none. (Open risk: the three videos stream from `framerusercontent.com`; if the Framer project is deleted after cutover they 404. Re-host on the chosen video host before DNS cutover.)
- Verify visually:
  - [ ] `/mosurban` renders end to end in dark (faithful) and light.
  - [ ] Header: orange "In development" eyebrow in both themes (contrast OK on white), title, tagline, 3 intro paragraphs; overview = Typology, Role (+ description), Timeline, Tools, Deliverables (2-col span, 8 lines).
  - [ ] Hero `image` block (phone mockup, 4:3) and the two wide `image` blocks fit `max-w-5xl` with the rounded border; dark illustrations don't look odd on the light theme.
  - [ ] `featureDeepDive` "Where it all started": pitch illustration on the right, three paragraphs on the left.
  - [ ] The three `video` blocks play the Framer mp4s with controls (direct-file playback through react-player); aspect-video wrapper has no letterbox gap in either theme.
  - [ ] 2-up `gallery` of the typography pages (16:9 each).
  - [ ] Next project / Previous links appear on both `/mosurban` and `/acacia` and point at each other.
  - [ ] CTA opens Calendly in the same tab.
  - [ ] Reduced motion: all reveals go through `ScrollReveal` → `scrollRevealMotion`; videos don't autoplay, so nothing moves with `prefers-reduced-motion: reduce`. Confirm nothing is stuck at opacity 0.
