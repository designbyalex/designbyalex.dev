# Parity audit: Framer site vs migrated Next.js + TinaCMS build

> **Screenshots:** `/Users/work/Freelance/Portfolio/repo/.claude/worktrees/parity-audit-9d6893/.scratch/parity-audit/screens/`
> These are gitignored local files. Every screenshot path below is relative to that directory.

| | |
|---|---|
| Source of truth | https://designbyalex.dev (Framer, dark only) — called **live** below |
| Migrated build | https://designbyalexdev.vercel.app (Vercel production of `main` @ `936a4b1`) — called **new** below |
| Audited | 2026-10-19 |
| Pages | `/`, `/acacia`, `/mosurban`, global chrome (header, footer, 404), `/about` |
| Widths | 390 (mobile emulation, 390×844), 768 (768×1024), 1440 (1440×900) |
| Purpose | Factual input to the parity PRD that blocks DNS cutover (#15). **Facts only, no ranking.** |

This doc lists differences only. It does not say which ones block cutover. Each gap gets a rough size: **S** (an hour or two, one file), **M** (a block component or token pass, about a day) or **L** (a new block or layout system, or design work, more than a day). Each also gets one line on what fixing it touches: *content* (Tina documents), *block* (a component under `components/blocks` or `components/layout`), *tokens/CSS* (`styles.css`, the type ramp), or *schema* (a Tina collection or template change).

---

## 0. How the evidence was gathered

- **Capture tool.** Screenshots came from headless Google Chrome (the system install, driven by `puppeteer-core`), not the in-app browser. The in-app browser can't write screenshots to disk, and this audit needed several hundred files saved. Both are Chromium. All captures are 1× DPR JPEG at quality 70. The scripts are in `.scratch/parity-audit/tools/` (gitignored): `capture.mjs`, `interact.mjs`, `styles.mjs`, `text.mjs`, `media.mjs`, `rm.mjs`.
- **Layout of the screenshot directory.**
  - `{live|new}/{page}/{width}/00-fold.jpg`: the first viewport, 3 s after load, before any scrolling.
  - `{live|new}/{page}/{width}/NN-<section>.jpg`: one viewport with the section's top at the top of the screen. `-b`, `-c` and so on continue a section that is taller than the viewport. Before these were taken, the capture scrolled through the whole page so scroll reveals had fired. Fixed or sticky chrome (the new header, the live "Back" pill) is left in the shot as a user would see it.
  - Live section names are Framer's own layer names (`Section Mission`, `Project Row` and so on). New section names are the first line of the section's text, or `media` for image-only sections.
  - `new-light/…` is the new site in its light theme (1440, 390). `new-rm/…` is the new site with `prefers-reduced-motion: reduce` (1440).
  - `{live|new}/interactions/`: entrance frames at fixed times, header state on scroll, hover rest/hover pairs, a home → `/acacia` transition at fixed times, the case-study hero while scrolling, MOS video state, and reduced-motion frames. `log.txt` in each folder holds the measured values quoted below.
- **Supporting data** in `.scratch/parity-audit/`:
  - `manifest-*.json`: the section → file map for every page and width.
  - `data/sty-*.c.txt`: the computed type style of every visible text node (font family, size/line-height, weight, tracking, colour).
  - `data/txt-*.txt`: rendered copy used for the copy diff.
  - `data/med-*.txt`: every image and video with its source URL and rendered size.
  - `sheets/*.jpg`: side-by-side contact sheets, live on the left.

---

## 1. Section maps (live order)

### `/` home
| # | Live (Framer layer) | New (block) |
|---|---|---|
| 1 | Header (transparent overlay) | Header (fixed bar) |
| 2 | Hero Content: full-viewport gradient hero | `hero`: bordered card, then headline |
| 3 | Works Header "Selected projects '23 - 25'" | `selectedProjects` header |
| 4 | Project Row ×2 (staggered) | `selectedProjects` rows ×2 (centred) |
| 5 | Project Overview: About + portrait + Experience + CV, in one two-column section | `about` block, then a separate `experience` block |
| 6 | Footer: "Let's talk / Get in touch" + links + bottom bar | `contact` block (home only), then the site footer |

### `/acacia` (15 live sections → 27 new blocks)
Live: Project Hero → Overview → Mission → Credibility → Trust → Engagement → Solution → Onboarding → Consent → Modules → Profile → Outcome → Next → CTA (with the Next-project card) → Footer.
New: header block → hero image → mission text → quote → credibility → trust → quote → engagement → quote → solution → quote → key features → image → onboarding deep-dive → 2-up images → consent / modules / profile deep-dives → outcome → quote → metrics → what's next → quote → image → CTA → Previous/Next → footer.
**The section order and copy match live.** The difference is the composition: live puts several pieces inside one two-column section (heading on the left; body, pull-statement and image on the right), while new splits them into a stack of separate full-width blocks.

### `/mosurban` (15 live sections → 27 new blocks)
Live: Project Hero → Overview → Pitch → Vision → Users → Clients → UX (with the Studio Display video) → Brand → Identity (video) → Assets → Years (video) → Outcome (placeholder metric cards) → Next ("Coming Soon…" panel) → CTA (with the Next-project card) → Footer.
New: the same order as a stack of blocks. Outcome and What's next are merged into one text block.

### Other routes
| Route | Live | New |
|---|---|---|
| `/about` | **404** (Framer default page) | 200: TinaCMS starter "What is this?" page |
| any bad URL | Framer default 404, white | Themed 404 with header and footer |
| `/styleguide` | 404 | 200: internal style guide, publicly reachable |
| `/admin` | n/a | 200 (Tina admin; expected) |

---

## 2. Cross-cutting differences (affect every page)

### 2.1 Typography

Measured values, from computed styles at 1440 unless a width is given (`data/sty-*`).

| Role | Live | New | Evidence |
|---|---|---|---|
| Font families | **"Inter Display"** for display and headings, **"Inter"** for body and UI (both served by framerusercontent), Space Mono for labels, Material Icons for the arrow and download glyphs | **Inter Tight** for everything, Space Mono, lucide icons | `interactions/log.txt` (loaded fonts) |
| Glyph width check (string "I'm a digital product designer", 100px, no tracking) | Inter Display w400 = 1257px; **Inter w400 = 1378px** | Inter Tight w400 = 1234px, w500 = 1266px | `interactions/log.txt` |
| Home hero headline | 75px / 1.1, **w400**, −1.5px (−0.02em) · 42px at 390 | 72px / 1.1, **w500**, −1.44px · 44px at 390 | `live/home/1440/00-fold.jpg`, `new/home/1440/00-fold.jpg` |
| Case-study title (h1) | 58px / 1.1, w400, −1.16px | 60px / 1.0, w500, −1.5px | `*/acacia/1440/00-fold.jpg` |
| Section heading | 40px / 1.2, **w400**, −0.4px | Home: 30px w500 −0.75px. Case-study text blocks: **30px w700**, normal tracking (Tailwind `prose` h2) | `live/acacia/1440/04-section-credibility.jpg`, `new/acacia/1440/05-fighting-for-credibility.jpg` |
| Case-study subheading | Same size as the heading (40px Inter Display w400), grey #a6a6a6, on its own line under the heading | Merged into the h2 on the same line ("What's Acacia's mission? Making the…"), or a 24px w600 h3 | `*/acacia/1440/03-*` |
| Pull-statement | 28px / 1.4 w400 white, closing phrase in green, **no quote marks** | 30px / 1.375 **w500** `blockquote`, centred, **green curly quote glyphs** | `live/acacia/1440/05-section-trust.jpg`, `new/acacia/1440/07-*.jpg` |
| Case-study body | Inter **14px / 22.4px**, #a6a6a6 (insight titles #f7f7f7) | Inter Tight **18px / 32px**, **`oklch(0.872 0.01 258)`** (Tailwind `prose` gray, a cool blue-grey that isn't a site token) | `data/sty-*-acacia-1440.c.txt` |
| Case-study tagline | 32px Inter Display w400, grey, in the right column beside the title | 20px Inter Tight, grey, under the title | `*/acacia/1440/00-fold.jpg` |
| Case-study intro / overview | **28px / 1.4 Inter Display, white**, with **green highlighted phrases** | 18px / 32px prose grey, no highlights | `live/acacia/1440/02-section-overview.jpg`, `new/acacia/1440/01-shipped.jpg` |
| Home about paragraphs | 28px / 1.4, **lead-in green**, rest white | 24px / 1.375, **lead-in white**, rest grey | `live/home/1440/05-project-overview.jpg`, `new/home/1440/03-about.jpg` |
| Project row title | Inter **18px** white, stacked over an 18px grey tagline | **30px w500** h3 (24px at 390) | `*/home/1440/03-*` / `02-*` |
| Mono labels (status, dates) | Space Mono 11px / 11px, **no tracking** | Space Mono 11–12px, **+0.1em tracking** | status pills on home |
| Experience row | Company 20px white / role 20px grey / period **14px Inter** "2025-Present" | 18px / 16px / **12px Space Mono uppercase** "2025 – PRESENT" | `live/home/1440/05-project-overview-c.jpg`, `new/home/1440/04-experience.jpg` |
| Footer headline | "Let's talk / Get in touch" 48px Inter Display w400 | No equivalent in the footer. The home `contact` block uses 72px w500 | §2.3 |

- **Type ramp.** New has no typography tokens. Sizes are per-component Tailwind classes, and case-study text runs through the `prose` defaults (h2 w700, gray body). Already recorded in NOTES → *Review findings not fixed* ("No type tokens exist yet"; display headings set at 72px against the audit's 58px).
- **The S0 design audit doesn't match the live fonts.** `docs/design-audit.md` says Framer's Inter / Inter Display files are really Inter Tight. The glyph-width check above shows three different widths: live body "Inter" is about 12% wider than Inter Tight, and live "Inter Display" w400 sits between Inter Tight w400 and w500. So new body copy is set noticeably narrower than live everywhere.
- Size **L**: touches *tokens/CSS* (a type ramp and the prose overrides) plus most *blocks*.

### 2.2 Colour
| Item | Live | New |
|---|---|---|
| Page background | #080808 | #080808 (match) |
| Body text greys | #a6a6a6, #f7f7f7, #ededed | #a6a6a6 on home; **`oklch(0.872 0.01 258)` blue-grey in every case-study text block** (prose default) |
| Green usage | Inline highlights in body copy, pull-statement endings, about lead-ins, "Experience" label, "Some user insights" labels, hover states | Mono eyebrows, quote glyphs, buttons, hover. **No inline highlights** |
| Home hero | Teal→green gradient background image filling the viewport | No gradient. A #131313 bordered card on #080808 |
| Footer band | #131313 (rgb 19,19,19) | Transparent; a border line only |
| Header | Transparent over the content | `oklab(0.134 …/0.5)` with a 64px backdrop blur and a bottom border |

Size **M**: touches *tokens/CSS* (prose colour), *content* (inline highlight marks in the rich text) and the *hero block*.

### 2.3 Header and footer (global chrome)
| | Live | New | Evidence |
|---|---|---|---|
| Header layout | White mark only (no name), left. Right: "Let's talk" 20px text **plus a 40px green circle with an arrow**. Transparent. 96px tall | Green mark tile + "Alexander Blum" text, left. Right: "Let's talk" as a 14px grey text link + a **theme toggle**. Fixed, 83px, blurred bar | `live/home/1440/00-fold.jpg`, `new/home/1440/00-fold.jpg` |
| Header on scroll | **Hides on scroll down, comes back on scroll up**, still transparent over the content | Always visible | `*/interactions/home-scrolled-1600.jpg`, `home-wheel-up.jpg` |
| Header at 390 / 768 | Mark + "Let's talk" + green circle | Mark tile + name + theme toggle + **hamburger menu** | `*/home/390/00-fold.jpg` |
| "Let's talk" target | `mailto:` with `target=_blank` | `mailto:`, same tab | probe |
| Header hover | Text and circle state change (subtle) | Text colour, 150ms | `*/interactions/hdr-letstalk-*.jpg` |
| Footer content | Mark; "Let's talk / **Get in touch ↗**" 48px (Get in touch → mailto, turns green on hover); links **Home / Linkedin / See full CV**; bottom bar in Space Mono 11px uppercase: "2025 Alexander Blum" and "♥ Made with love ♥" | Mark tile; "© 2026 Alexander Blum, All rights reserved" 14px; one LinkedIn icon | `live/home/1440/06-footer.jpg`, `new/home/1440/06-footer.jpg` |
| Footer CTA on case studies | Present (it's the global footer) | **Absent**: case studies end with Previous/Next and the © line | `live/acacia/1440/15-footer.jpg`, `new/acacia/1440/27-footer.jpg` |
| Footer at 390 | Stacked; links listed vertically; bottom bar kept | LinkedIn icon over the © line | `*/home/390/06-footer.jpg` |

Known in NOTES: the header isn't a pill, and the footer is missing the Home / See full CV links. Newly observed here: the header shows the name and a theme toggle, the header doesn't hide on scroll, the footer has no "Let's talk / Get in touch" CTA, the bottom-bar copy differs, and the year is 2026 vs 2025.
- Header: size **M**, touches *block* (`header.tsx`) and possibly the *schema* (a CTA-button style on nav items).
- Footer: size **M**, touches the *schema* (footer text links, CTA headline, bottom-bar strings), the *block* (`footer.tsx`) and *content*.

### 2.4 Layout and grid
- **Live gutters** are about 48px at 1440: images run 1344px wide, and the case-study hero image is full-bleed at 1440. **New** uses a `max-w-7xl` + `px-6` container. Images render 1022px wide; videos 1232px.
- **Case-study composition.** Live uses a two-column grid with hairline separators between sections: heading and subheading in the left column; body, sub-labels, pull-statement and media in the right column (about 532–672px). New is a single centred column of full-width blocks, so body lines run about 1000px long against about 530px on live.
- **Vertical rhythm.** Live sections are large and padded (600–1600px each at 1440). New blocks use a uniform `py-12`, so pages are shorter: acacia 14 729 → 12 129px, mosurban 14 203 → 13 562px, home 5 728 → 5 258px at 1440.
- Size **L**: touches the *block* layer (a two-column case-study section block, or a layout option on the text, quote and image blocks), the *schema* (grouping heading, body, statement and media into one section), and a *content* re-author of both case studies.

### 2.5 Motion system
| Motion | Live | New | Evidence |
|---|---|---|---|
| Home entrance | Gradient background fades 0→0.9 while scaling 1.5→1 (1s, ease `[0.5,0,0.88,0.77]`); mark fades in (1.5s); headline reveals **line by line**; content block rises 60px (1s, `[0.2,0.8,0.2,0.8]`); tagline + CTA rise 60px after a 1s delay (1.2s). Values from Framer's `__framer__appearAnimationsContent` | Card fades/zooms in; headline **per character** with blur(6px)→0 and a 0.4em rise (0.5s each, 0.05s stagger, `[0.16,1,0.3,1]`); tagline per word; then the button | `*/interactions/home-entrance-{0000..3500}ms.jpg`, `.scratch/parity-audit/sheets/entrance.jpg` |
| Scroll reveals | Fade/rise on entering the viewport (2 of 3 in-view elements still below 0.95 opacity 100ms after a jump to y=3300) | `scrollRevealMotion`: y 24px, 0.6s, once, `amount 0.3` (5 of 5 below 0.95 at +100ms) | `*/interactions/rm-home-jump-3300.jpg` (without RM, see `data/int-*.log`) |
| Page transition home → case study | The page goes black. The case-study **title rises out of a mask** and the **hero image opens from a horizontal line** into a band (frames at 200 / 400 / 700ms). The header persists | View Transitions crossfade (old page fades out; new page fades in and rises 12px); done by about 200ms; no hero choreography | `*/interactions/transition-to-acacia-*.jpg`, `sheets/trans.jpg` |
| Case-study hero on scroll | **Scroll-linked**: the hero image mask grows to fill the viewport (at y=400) while the title moves away, then the content scrolls over it (Framer "Hero Image Mask", 2000px tall) | Static image card | `*/interactions/acacia-hero-{0,400,900}.jpg` |
| Project row hover (home) | A **green circular arrow button appears** top-right on the thumbnail | Title turns green and the arrow chip outline turns green; small lift | `*/interactions/row-acacia-{rest,hover}.jpg` |
| Next-project card hover | Green arrow circle appears on the thumbnail | Text link turns green | `*/interactions/acacia-next-{rest,hover}.jpg` |
| Footer "Get in touch" hover | Turns green | n/a (the footer has no CTA); the home contact pill has a 150ms colour change | `*/interactions/contact-{rest,hover}.jpg` |
| CV link | Small uppercase text + download icon; doubled text layer (looks like a text-roll hover; the roll itself wasn't captured) | Bordered pill, 150ms colour change | `*/interactions/cv-button-*.jpg` |
| Header on scroll | Hide on down, show on up | None (fixed) | §2.3 |

The S0 audit and the PRD said to design entrance and scroll motion *fresh* rather than copy it. The table records what Framer does so the PRD can decide which parts of it count as parity.
- Size: **L** for the case-study hero scroll and page-transition choreography (a new motion primitive plus hero *block* work). **M** for the hover affordances (*block*). **S** for header hide-on-scroll (*block*).

### 2.6 Copy (sitewide)
The rendered copy diff (`data/txt-*.txt`) shows **body copy is verbatim** on all three pages. The differences:
- **Typographic characters.** Live uses curly apostrophes and quotes throughout the case studies (`wasn’t`, `Acacia’s`, `“too hard basket.”`). New renders straight ones (`wasn't`, `"too hard basket."`) in about 25 places across `/acacia` and `/mosurban`. Ranges: live `'23 - 25'`, `2025-Present`, `Q3 2023 - Q2 2025`; new `’23 – ’25`, `2025 – PRESENT`, `Q3 2023 – Q2 2025`.
- **Live typo corrected on new:** "always in **the their** corner" became "always in their corner" (Acacia, Engagement).
- **Case** is changed by CSS on new: eyebrows uppercase ("ONBOARDING FLOW", "TYPOLOGY"); the live CV label "DOWNLOAD FULL CV" is "Download full CV"; "Linkedin" is "LinkedIn".
- **Breakpoint-specific copy on live:** the CTA subline is "There’s plenty more behind the scenes." at 1440 but "There’s more behind the scenes. Let’s grab a coffee and dive in." at 768 and 390. New uses the 1440 text at every width.
- **Metadata.** Live uses one `<title>` and description for every page ("Alexander Blum | UX • Product Design"), with `og:image` on framerusercontent. New has per-page titles ("Acacia Money · Alexander Blum"), descriptions taken from the tagline, and `og:image` on `assets.tina.io`. (Intended per #13.)

Size **S**: touches *content* (find-and-replace on the quotes, plus a per-breakpoint string if wanted).

### 2.7 Media hosting
| Asset | Live host | New host |
|---|---|---|
| Images | `framerusercontent.com/images/*` | `assets.tina.io/a2354178-…/…` through `/_next/image`. Copies also sit in `public/uploads/` |
| MOS videos ×3 (`xKoBMHM…mp4` 0.9MB, `5TAk61j…mp4` 0.3MB, `uLQTEsg…mp4` 2.2MB) | `framerusercontent.com/assets/` | **Same Framer URLs** (known risk: they 404 if the Framer project goes) |
| Fonts | framerusercontent (Inter, Inter Display), Google (Space Mono, Material Icons) | Self-hosted through `next/font` (Inter Tight, Space Mono) |
| OG image | `framerusercontent.com/assets/9JhBJVO…png` | `/uploads/home/og.png`, **2.3MB** at 2400×1260 (known) |

Size **S**: re-host the videos (*content* plus upload) and resize the OG image.

---

## 3. Home `/` gap list

| ID | Section | Framer | New | Evidence | Size · touches |
|---|---|---|---|---|---|
| H1 | Hero: composition | Full-viewport (100vh) section; teal→green gradient image behind everything; headline top-left; glass mark in the right half; tagline bottom-left; "See Selected Projects ↓" bottom-right on a hairline. At 390 and 768 the headline is on top and the mark is large and cropped at the bottom | Bordered dark card (mark, height clamped to 48vh), then the headline below, then the tagline, then a pill button. At 1440×900 the tagline only partly fits in the fold and the button falls below it | `*/home/1440/00-fold.jpg`, `*/home/768/00-fold.jpg`, `*/home/390/00-fold.jpg` | **L** · hero *block* + *schema* (background image, layout variant) + *content* |
| H2 | Hero: imagery | Gradient PNG (`nEeSut…png`, alt "Hero image with abstract blue pattern") + mark render (`LUpt7Z…png`, 2880×1800). On the gradient the mark reads **green glass** | `home/hero.png` (1152×720, alt "Three chrome triangles…"), the same 16:10 aspect, on #131313, reads **grey chrome**. It looks like the same render without the gradient behind it (not confirmed byte-for-byte) | same | **M** · *content* (upload the gradient) + hero *block* |
| H3 | Hero: tagline at 390 | **Hidden** at mobile width (no tagline text node at 390) | Shown | `*/home/390/00-fold.jpg`, `data/sty-live-home-390.c.txt` | **S** · hero *block* |
| H4 | Hero: CTA | "See Selected Projects" as a 18px text link + arrow, right-aligned on a hairline | Bordered pill, left, below the tagline | `*/interactions/see-projects-*.jpg` | **S** · hero *block* |
| H5 | Hero: headline wrap at 390 | Clean left edge | **Lines 3–5 start one space in** (" committed to", " my constant", " evolution."), in both themes. Probably whitespace inside the per-character spans | `new/home/390/00-fold.jpg`, `new-light/home/390/00-fold.jpg` | **S** · `text-effect` motion primitive |
| H6 | Hero: type | 75px w400 Inter Display; tagline 18px Inter | 72px w500 Inter Tight; tagline 20px | §2.1 | (part of 2.1) |
| H7 | Works header | "Selected projects" + "'23 - 25'" at the same size (40px), dates grey and right-aligned | 30px heading + 12px mono dates | `*/home/1440/02-*` | **S** · *block* |
| H8 | Project rows: layout | **Staggered**: Acacia image about 1037px wide aligned left, MOS image the same width aligned **right**. Thumbnails about 16:9 (1037×576), radius 20. Status pill **overlays the image** top-left. Title and tagline below, small (18px) | Both rows centred, 4:3 (1022×767). Status pill **below** the image. 30px title. Arrow chip on the right | `live/home/1440/03-project-row.jpg`, `04-project-row.jpg`, `new/home/1440/02-selected-projects*.jpg` | **M** · selected-projects *block* |
| H9 | Project rows: hover | Green arrow circle appears on the image | Title turns green, chip outline turns green | §2.5 | **S** · *block* |
| H10 | About: layout | One "Project Overview" section. **Sticky "About" heading** in the left column (40px, hairline above), stays put while the right column scrolls. Right column: four paragraphs, then the portrait card (672×755) **below** the text, then Experience, then CV | "About" heading + paragraphs on the left, portrait card (542×407) **beside** the text on the right. Experience is a separate block with its own h2 | `live/home/1440/05-project-overview{,-b,-c,-d}.jpg`, `new/home/1440/03-about.jpg`, `04-experience.jpg` | **M** · about/experience *blocks* (sticky column) |
| H11 | About: colour | Lead-in phrases **green**, rest white, 28px | Lead-in white, rest grey, 24px | §2.1 | **S** · about *block* |
| H12 | Experience: rows | Stacked company / role / period in the right column, a **decorative "+" icon** on each row (not interactive: cursor `auto`, clicking changes nothing), hairlines. Label "Experience" is 14px green | Three-column table rows; period in mono uppercase; no icons; 30px "Experience" h2 | `live/interactions/experience-{rest,hover,click}.jpg`, `new/home/1440/04-experience.jpg` | **S** · experience *block* |
| H13 | CV link | Small right-aligned "DOWNLOAD FULL CV" + download icon (Material Icons) | Bordered pill "Download full CV" + lucide icon, left-aligned | `*/interactions/cv-button-*.jpg` | **S** · *block* |
| H14 | Contact | No separate contact section; the global footer carries "Let's talk / Get in touch ↗" | A home-only `contact` block (72px "Let's talk", green pill "Get in touch", LinkedIn ↗, See full CV ↗), then the footer | `live/home/1440/06-footer.jpg`, `new/home/1440/05-let-s-talk.jpg` | **M** · footer/contact *blocks* + *schema* (see 2.3) |
| H15 | Hero image weight | Gradient PNG 1920×1080 + mark PNG 2880×1800 (Framer CDN) | Optimised through next/image (21KB for the hero card) | `data/med-*-home.txt` | (info) |

---

## 4. `/acacia` gap list

| ID | Section | Framer | New | Evidence | Size · touches |
|---|---|---|---|---|---|
| A1 | Back control | **"← Back" pill**, sticky through the whole page (top-left at 1440, top-right at 768/390), links to `./` | None; only the header logo goes home | every live acacia tile | **S** · new layout *block* on the project template |
| A2 | Hero: composition | Status pill + 58px title on the left, 32px grey tagline in the **right** column. **Full-bleed hero image (1440×1170)** straight below the title, **scroll-linked mask expansion** | Mono green "SHIPPED" eyebrow (no pill), title, tagline under it, then intro + overview, **then** the hero image in a 1022px rounded card | `*/acacia/1440/00-fold.jpg`, `*/interactions/acacia-hero-*.jpg` | **L** · project-page header *block* + motion |
| A3 | Overview: layout | Two columns: intro paragraphs (28px Inter Display **white**, **green key phrases**) on the left; a stacked metadata list with hairlines on the right: Typology / **Product** / Role (+ description) / Timeline / Collaborators | Intro paragraphs in 18px prose grey, full width, no highlights; then a **4-column** row Typology / Role / Timeline / Collaborators | `live/acacia/1440/02-section-overview.jpg`, `new/acacia/1440/01-shipped.jpg` | **M** · project-page *block* + *content* (highlights) |
| A4 | Overview: fields | Separate **"Product: B2B2C SaaS Platform"** row; Role "Product Designer." | Product folded into Typology ("Fintech & Sustainability, Product, B2B2C SaaS Platform"); no "Product" label | copy diff | **S** · *schema* (add `product`) + *content* |
| A5 | Mission | Two columns. Left: "What's Acacia's mission?" white + "Making the renewable energy transition frictionless." grey on its own line. Right: an **Acacia logo on a green grid card** (image), small body text, then a pull-statement with a green ending | One bold 30px line holding both sentences; full-width paragraph; centred blockquote. **The logo-grid card is missing** | `live/acacia/1440/03-section-mission.jpg`, `new/acacia/1440/03-*.jpg` | **M** · text *block* layout + *content* (missing image) |
| A6 | Credibility / Trust / Engagement | Two columns. "Some user insights" as a **green 14px label**; three insights with hairlines; pull-statements in the right column, no quote marks | Single column; "Some user insights" is a 24px h3; insight titles bold; separate centred blockquotes with green curly quotes | `live/acacia/1440/04..06-*.jpg`, `new/acacia/1440/05..09-*.jpg` | **L** (shared with 2.4) |
| A7 | Solution + key features | Key features list **with an icon per item** and hairlines; full-width dark laptop image 1344px | Plain bullet list; image in a 1022px card | `live/acacia/1440/07-section-solution{,-b}.jpg`, `new/acacia/1440/12-*.jpg`, `13-media.jpg` | **M** · *block* (icon list) + *schema* |
| A8 | Deep-dives (Onboarding, Consent, Modules, Profile) | Left column: title (white) + subtitle (grey). Right column: body, then a **summary statement** (white with a green ending), then the image (about 532px). Onboarding's two phones sit in two dark cards across the full width | Alternating image/text split, mono green eyebrow (UPPERCASE title), subtitle as the heading, body, then the summary **split into three bullets** | `live/acacia/1440/08..11-*.jpg`, `new/acacia/1440/14..18-*.jpg` | **M** · feature-deep-dive *block* + *content* (statement vs bullets) |
| A9 | Outcome metrics | **Four #131313 rounded cards**, a 58px number at the bottom-left with a caption under it (stacked one per row at 390). The numbers render as two stacked text layers (white and black), which looks like a rolling-counter effect; the animation wasn't captured | Plain centred numbers (48px w600), 4-column (2×2 at 390), no cards | `live/acacia/1440/12-section-outcome.jpg`, `live/acacia/390/12-section-outcome*.jpg`, `new/acacia/1440/21-25.jpg` | **M** · metrics *block* |
| A10 | What's next image | Full-width 1344px design-system image | 1022px card | `*/acacia/1440/13-*` / `24-media.jpg` | **S** (shared with 2.4) |
| A11 | CTA + next project | **One section, two columns.** Left: "Want the full story?" (40px) + two-line grey sub + "Go to Calendly" text + green circle arrow. Right: "**Next project**" heading + **card** (812×521 thumbnail, status pill overlay, title, tagline; hover shows a green arrow) | Centred CTA (48px w600 title, green pill button). Below a hairline, **Previous** and **Next project** text links, **both pointing at `/mosurban`** | `live/acacia/1440/14-section-cta.jpg`, `new/acacia/1440/25-*.jpg`, `26-previous.jpg` | **M** · CTA *block* + next-project in `project-page.tsx` (known in NOTES) |
| A12 | Footer | Global footer with "Let's talk / Get in touch" | © line + LinkedIn icon only | §2.3 | (2.3) |
| A13 | Image count | 9 images, framerusercontent | 8 images (logo-grid card missing; next-project thumbnail not shown) | `data/med-*-acacia.txt` | (A5, A11) |

---

## 5. `/mosurban` gap list

Everything in A1–A3, A6 (two-column composition), A8, A11 and A12 applies in the same way. MOS-specific items:

| ID | Section | Framer | New | Evidence | Size · touches |
|---|---|---|---|---|---|
| M1 | Hero image | Full-bleed (1440×1170) phone render behind the title, scroll-linked | 1022px card below the overview | `*/mosurban/1440/00-fold.jpg`, `01-*` | (A2) |
| M2 | Overview | Two columns, intro with green highlights, metadata incl. Tools and an 8-line Deliverables list | 4-column row (Typology / Role / Timeline / Tools), then a full-width 2-column Deliverables list | `live/mosurban/1440/02-section-overview.jpg`, `new/mosurban/1440/01-in-development{,-b}.jpg` | (A3) |
| M3 | Pitch image | Tall right-column image, 532×622, **radius 16** | 542×499 beside the text, **radius 0** on the image | `live/mosurban/1440/03-section-pitch.jpg`, `new/mosurban/1440/03-where-it-all-started.jpg` | **S** · image *block* |
| M4 | **Videos: behaviour** | All three **autoplay, muted, loop, `playsinline`, no controls** (verified playing: `paused=false`) | **No autoplay, unmuted, native controls**, loop. Paused at 0:00 even **without** reduced motion | `*/interactions/mos-video-{0,1,2}.jpg`, `data/int-*.log` | **S** · *content* (autoplay flag) / video *block* defaults |
| M5 | **Videos: presentation** | Video 1 plays **inside a Studio Display device-frame image** (`bUXzUE…png`, 780×598) within the UX section. Videos 2 and 3 are **537×321 inside the right column** of the Identity and Years sections | Each video is its own full-width section, 1232×624, `object-fit: contain` (letterboxed); no device frame | `live/mosurban/1440/07-section-ux{,-b}.jpg`, `09-section-identity.jpg`, `11-section-years.jpg`, `new/mosurban/1440/13-media.jpg`, `19-media.jpg`, `23-media.jpg` | **M** · video *block* (frame option, sizing) + *content* (frame image) |
| M6 | Videos: hosting | framerusercontent | **Same framerusercontent URLs** | §2.7 | **S** (known) |
| M7 | Key features / brand deliverables lists | Icon + hairline lists | Bullet lists | `live/mosurban/1440/08-section-brand.jpg`, `new/mosurban/1440/16-*.jpg` | (A7) |
| M8 | Typography gallery | Two cards 675×393 side by side | Two 566×318 images | `live/mosurban/1440/10-section-assets.jpg`, `new/mosurban/1440/21-media.jpg` | **S** (shared with 2.4) |
| M9 | Outcome | "Outcome" + "Coming Soon…" + **four placeholder metric cards** ("100%" with a ruled line) | Text only: "Outcome / Coming Soon…" | `live/mosurban/1440/12-section-outcome.jpg`, `new/mosurban/1440/24-outcome.jpg` | **S** · *content* (metrics block with placeholders) |
| M10 | What's next | Its own section: "What's next for Mos?" + "Coming Soon…" + a **hatched placeholder panel** | Merged into the Outcome text block | `live/mosurban/1440/13-section-next{,-b}.jpg` | **S** · *content* |
| M11 | Section number | Live DOM text has an "01" before "Executing the rebrand" (looks like a step label) | Absent | copy diff | **S** · *content* |
| M12 | Next project | Card linking to Acacia (thumbnail `PbjvL3…png`) | Previous **and** Next both "Acacia Money" | `live/mosurban/1440/14-section-cta.jpg`, `new/mosurban/1440/26-previous.jpg` | (A11) |

---

## 6. Global: 404 and `/about`

| ID | Item | Framer | New | Evidence | Size · touches |
|---|---|---|---|---|---|
| G1 | 404 | Framer's **default white** page: Framer logo, "Page not found", "This page doesn't exist or has moved.", "Back to home". Title "Page Not Found \| Framer". No site chrome | Dark, with site header and footer; green "Page not found" 72px; starter copy "Lost, this page is. In another system, it may be."; green pill "Take me home". Title "Alexander Blum \| UX • Product Design" | `live/nope-404/{390,1440}/00-fold.jpg`, `new/nope-404/{390,1440}/00-fold.jpg` | **S** · *content* (`app/not-found.tsx` copy) |
| G2 | `/about` | Doesn't exist (Framer 404) | TinaCMS starter page ("What is this?", tutorial links to tina.io, Discord, `http://localhost:3000`, `./LICENSE`). Known in NOTES | `new/about/1440/01-what-is-this*.jpg` | **S** · *content* (delete or redirect) |
| G3 | `/about` first paint | n/a | **The first viewport is blank** at 1440 and 390: the content's scroll-reveal starts at opacity 0 and doesn't fire until the user scrolls (measured opacity 0 after 3s) | `new/about/1440/00-fold.jpg`, `new/about/390/00-fold.jpg` | (G2) |
| G4 | `/styleguide` | 404 | Public 200 (internal design-system page) | curl | **S** · route config |

---

## 7. Width-specific notes

- **768.** Live uses its tablet layout: the home hero is stacked (headline on top, large cropped mark below), the case-study "Back" pill sits top-right, and the overview is a single column with the metadata list under the intro. New at 768 shows the mobile header (hamburger + toggle), the hero card above the headline, and 4:3 project thumbnails. Evidence: `*/home/768/00-fold.jpg`, `*/home/768/03-project-row.jpg` vs `new/home/768/02-selected-projects.jpg`, `live/acacia/768/02-section-overview.jpg` vs `new/acacia/768/01-shipped-b.jpg`.
- **390.** Live keeps the case-study two-column content as one column, with headings above. Live metric cards stack one per row; new shows a 2×2 grid. Case-study headings on new render at w700 ("What's next for Acacia? Impact now, growth tomorrow" over three bold lines), against live's w400. Evidence: `live/acacia/390/12-section-outcome*.jpg`, `new/acacia/390/21-25.jpg`, `new/acacia/390/22-*.jpg`.
- Status pills: on live they **overlay the thumbnail** at every width; on new they sit below the thumbnail at every width.

---

## 8. Light theme (new only; net-new design, obvious defects only)

Captured at 1440 and 390: `new-light/{home,acacia,mosurban,nope-404}/…`
- **Nothing broken found.** Text, imagery and buttons all render. The dark product screenshots sit in dark cards on a white page, which reads as intended. The chrome hero mark on the light card is legible. 404: dark-green heading on white, legible.
- **Shared with dark:** the 390 headline indentation defect (H5): `new-light/home/390/00-fold.jpg`.
- **Not done:** no numeric contrast measurement. NOTES says token contrast was computed, not eyeballed. The screens above show no visibly low-contrast text.

---

## 9. Reduced motion (`prefers-reduced-motion: reduce`)

| Check | New | Live (for reference) | Evidence |
|---|---|---|---|
| Home entrance | No animation, but the **headline is server-rendered at opacity 0 with blur(6px)** and stays invisible until hydration. Measured: opacity 0 at +200ms, then 1 with no blur at +500ms. Card and tagline are visible from first paint. Without JavaScript the headline would never show | n/a | `new/interactions/rm-home-150ms.jpg` (headline missing), `rm-home-{200,500}ms.jpg`, `new-rm/home/1440/00-fold.jpg` |
| Scroll reveal 100ms after jumping to y=3300 | **0 of 5** in-view elements below 0.95 opacity (without RM: 5 of 5) | 2 of 3 still animating: **Framer ignores RM** | `*/interactions/rm-home-jump-3300.jpg` |
| Route transition | `TransitionLink` skips `startViewTransition`; CSS turns off `::view-transition-*` animations | n/a | `styles.css` §reduced-motion |
| Videos | Never autoplay (and they don't autoplay without RM either; see M4) | Autoplay regardless | M4 |
| Hover | Global CSS sets transitions to 0.01ms | n/a | `styles.css:169` |

New honours reduced motion once hydrated: no element animates. Pre-hydration, text-reveal content is hidden. Live does not honour reduced motion.

---

## 10. Known deviations from `docs/afk/NOTES.md` (Final pass), folded in

| NOTES item | Covered by |
|---|---|
| Framer-hosted MOS videos | 2.7, M6 |
| `/about` is starter content | G2 (plus G3: blank first viewport) |
| Header "Let's talk" isn't a pill | 2.3 |
| Footer missing Home and See full CV links | 2.3 (also missing: the "Let's talk / Get in touch" CTA and the bottom bar) |
| Next-project link isn't a card; "Previous" shown | A11, M12 (both links point to the same project) |
| No typography token ramp; 72px display against the audit's 58px | 2.1 |
| `og.png` is 2.3MB | 2.7 |
| Hero is card-above-text, not overlaid | H1, H2 |
| Pull-statements use green curly quote marks that live lacks | 2.1, A6 |
| Binary duplication (`hero.png` = thumbnails) | Not a visual gap; out of scope here |
| View transitions on back/forward not exercised | Not exercised here either (only forward click captured) |

---

## 11. Automatable checks

The previous AFK gate (tsc, Tina schema, biome, vitest, build) checks that the code compiles and the content is valid. It caught none of the gaps above. Below is what an unattended agent could verify itself with the same kind of headless-Chrome tooling used for this audit (`.scratch/parity-audit/tools/`), and what needs a person.

### Can be checked automatically (deterministic, cheap)
1. **Section-pair screenshots at fixed widths.** For each page × {390, 768, 1440}, capture live and new section by section after a full scroll-through. Pair the sections through a hand-written **section map** (live Framer layer name → new block index, as in §1). The capture itself is fully automatable. *Scoring* a pair by pixel diff is not useful while the layouts differ this much. A perceptual or vision-model judgement ("same composition? same imagery? same hierarchy?") can produce a pass/fail per section to triage, but it's a judgement call, not a hard gate.
2. **Computed-style assertions.** Pin per-role values taken from live (`data/sty-live-*`): family, size, weight, tracking, line-height and colour for display, section heading, body, pull-statement, label, at each width. Then assert the new site's computed styles match within a tolerance. This would have caught all of 2.1 and the prose blue-grey in 2.2.
3. **Copy diff.** Rendered text, normalised per page, diffed against a frozen live snapshot. Fail on word changes; separately report punctuation-only changes (curly vs straight, dashes). Would have caught 2.6, M9–M11 and the footer strings.
4. **Link and target inventory.** Every `<a>`: text, `href`, `target`, per page, compared with live (header mailto `_blank`, footer Home / CV, Back, Next-project target, both Previous/Next pointing at one project).
5. **Media inventory.** Image and video counts per page, rendered sizes, border radius, `autoplay`/`muted`/`controls`/`playsinline`, `paused` after scrolling into view, and the **host of every media URL**. Fail on any `framerusercontent.com` or `assets.tina.io`, as the cutover policy requires. Would have caught M4, M6, A13 and the missing images.
6. **Geometry checks.** Image width ÷ viewport width, gutters, column count of a section (are the heading and body side by side?), status pill inside or outside the thumbnail's box, element order. Cheap with `getBoundingClientRect`. Would have caught 2.4, H8, A3 and A9.
7. **First-paint and reveal sanity.** Fold screenshot at +3s with no scrolling: assert no above-the-fold text node sits at opacity < 0.95 (catches G3). Jump-scroll: assert every reveal settles within N ms.
8. **Reduced-motion assertions.** Under emulated RM, assert zero elements in mid-animation after load and after a jump (as in §9), and that no video autoplays.
9. **Motion timing samples.** Screenshot strips at fixed times (0/300/700/1200/2000 ms) after load and after a route click. Capturing these is automatable. Comparing them meaningfully against live isn't (see below). Frame *count until stable* and *time to final layout* can be asserted.
10. **Route and status checks.** `/about`, `/styleguide`, a bad URL: expected status code and `<title>`.
11. **Asset weight budget.** Assert the OG image and hero images stay under a byte limit.

### Needs a human eye
- Whether a composition *feels* like live: the hero's gradient and glass mark, staggered rows, two-column case studies, full-bleed imagery. The agent can flag differences; whether a difference is acceptable is a design call.
- **Motion quality**: the line-by-line headline reveal, the masked title rise, the hero image opening from a line, the scroll-linked hero expansion, the hover feel. Frame strips record that motion exists and roughly when it happens, not whether it feels right. The PRD also says to *elevate* motion rather than copy it, so there's no fixed target.
- Which deviations are improvements to keep (themed 404, per-page titles, the typo fix, reduced-motion support, curly vs straight quotes).
- Light-theme aesthetics (net-new; no source of truth).
- Image crop and focal choices (4:3 vs 16:9 thumbnails, hero crop on a phone).
- The font question in 2.1 (Inter + Inter Display vs Inter Tight) needs someone to decide which to match. The agent can only measure the difference.

### A fidelity feedback loop for the AFK harness
Checks 2–8 and 10–11 are deterministic, run in under a minute per page, and give agents a specific failure message ("`/acacia` section 6 body: 18px/32px oklch(...) expected 14px/22.4px #a6a6a6"). They could join `scripts/afk/check.sh --full` as a parity gate once the expected values are frozen from live into a fixture. Check 1, and check 9's comparison, fit better as a per-ticket report a human reviews: paired screenshots in a contact sheet like `.scratch/parity-audit/sheets/*.jpg`.
