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
