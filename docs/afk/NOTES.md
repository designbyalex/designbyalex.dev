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

## #11 S7: Homepage assembled
- Built: `content/pages/home.mdx` rewritten as five blocks with the verbatim copy from designbyalex.dev (fetched with curl into `.afk/cache/home.html`): `hero` → `selectedProjects` → `about` → `experience` → `contact`. Four new homepage blocks in `components/blocks/` (`selected-projects.tsx`, `about.tsx`, `experience.tsx`, `contact.tsx`), registered in `components/blocks/index.tsx` and on the `page` collection only; the starter `hero.tsx` was rewritten in place as the faithful homepage hero (same template name, fields trimmed to headline / tagline / actions / image). Four images downloaded to `public/uploads/home/` (hero logo-mark card, both project thumbnails, the about portrait) with alt text written from the actual pictures. `tina-lock.json` regenerated and committed.
  - Motion: hero card zooms out (`ScrollReveal scale={1.08}`, new option on `scrollRevealMotion`, unit-tested) → headline per-character (`TextReveal per="char"`) → tagline per-word → action. Every section reveals on scroll through `ScrollReveal`; experience rows and about parts stagger; project thumbnails use `HoverLift`. All of it routes through `lib/motion/reduced-motion.ts`, so reduced motion renders at rest.
  - Selected-projects links resolve to `/acacia` and `/mosurban`; the section is `id="works"` so the hero's "See Selected Projects" anchor (`#works`, as live) jumps to it.
- Decisions made without a human:
  - Selected projects are hand-authored items (`status`, `title`, `tagline`, `href`, thumbnail) rather than Tina `reference`s to the `project` collection. The live homepage uses different titles ("Acacia sustainable home upgrades" vs "Acacia Money") and thumbnails from the case studies, and a reference would pull both full case-study bodies (`ProjectParts`) into the homepage query. Revisit if a `featured` flag is wanted.
  - About section is modelled as `parts[]` of `{lead, text}` (bright lead-in + muted continuation, matching the live `h5` + muted span) instead of rich text; the last part is lead-only. Layout: text column + portrait beside it on desktop (live: text, then a half-width "Media Grid" image).
  - Hero layout: the live hero stacks a scaled background layer, the logo-mark image and the text. Rendered here as the image card (capped at `48vh` so the headline stays above the fold on laptops) with the headline / tagline / action beneath, not overlaid, so the chrome mark isn't covered by text.
  - Status pills on project rows: translucent `bg-foreground/10` pill with a coloured dot (`bg-primary` shipped, `bg-status-in-development` in-development) and white uppercase mono label, matching the live white-on-translucent pills.
  - Contact block = "Let's talk" display heading + primary `mailto:` button ("Get in touch") + secondary links (LinkedIn, See full CV). The live footer-bottom links (Home / LinkedIn / See full CV / copyright) are the global Footer's job; `content/global/index.json` (nav, footer socials still TinaCMS placeholders) was not touched — follow-up for the final pass or a global-content ticket.
  - Years label authored as "’23 – ’25" (live literally renders `'23 - 25'`); experience periods use en dashes ("2025 – Present"), consistent with the case-study timelines.
  - Removed the starter hero's `icon` and `videoUrl` fields (unused by the faithful hero); `hero` stays registered on the `project` collection untouched.
- Stubbed:
  - `pnpm test` was denied in this session (the allowlist in `scripts/afk/settings.json` was not in effect for it), so the two new `scrollRevealMotion` scale tests ran only via tsc, not Vitest. Final pass runs `scripts/afk/check.sh --full`.
  - `/about` (`content/pages/about.mdx`) is still starter content and the header nav still links to it; out of scope here.
- Verify visually:
  - [ ] `/` renders end to end in dark (faithful) and light; no starter content left.
  - [ ] Hero on load: card zooms out, headline arrives per character, tagline per word, then the pill button; headline is above the fold at 1440×900 and on a phone.
  - [ ] Hero card height (`clamp(220px,48vh,600px)`) crops the teal logo-mark sensibly at phone widths.
  - [ ] "See Selected Projects" scrolls to the projects section with the sticky header clearing it (`scroll-mt-20`).
  - [ ] Project rows: 4:3 thumbnails, status pill + dot colours (green / orange, and orange still legible on white), title turns green on hover, arrow chip hides below `sm`; rows link to `/acacia` and `/mosurban`.
  - [ ] About: four parts with bright lead-in + muted text at `text-2xl`; portrait card crops OK at `4/5` (md) and `4/3` (lg), teal background doesn't look odd in light theme.
  - [ ] Experience: six hairline rows, period in mono on the right, role drops to its own line below `sm`; CV button opens Google Drive in a new tab.
  - [ ] Contact: display-size "Let's talk", green pill button opens mailto, LinkedIn / CV links open in new tabs.
  - [ ] Reduced motion (`prefers-reduced-motion: reduce`): everything renders at rest, nothing stuck at opacity 0 or scaled.
  - [ ] Tina visual editor: each block and list item is click-to-edit; thumbnails upload into `uploads/home`.
