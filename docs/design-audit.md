# Design Audit & Token Decisions (S0)

> Source-of-truth for the design system. Produced for **#4 (S0)**; consumed by **#5 (S1)** and the rest of the migration (**#3** PRD).
> Extracted from the live Framer site `designbyalex.dev` (homepage + `/acacia`) via raw-source parsing **and** area-weighted computed-style sampling of the rendered page.

## TL;DR decisions

| # | Decision | Outcome |
|---|----------|---------|
| a | **Typeface** | **Inter Tight** (variable, `wght 100–900`, OFL) for all UI/headings + **Space Mono** (OFL) for mono/eyebrow labels. Drop the starter's Lato & Nunito. Replace the Material Icons webfont with `lucide-react` (already installed). |
| b | **Theme** | Live site is **dark-only**. Reproduce **dark faithfully** (primary). **Light theme is net-new design** (wanted — ship both with a toggle). |
| c | **Brand accent** | **Green `#3cda64`** primary, `#61e88a` lighter/hover variant. (Blues seen in source were Framer default link styling, barely painted.) |

### Method note / correction
An initial pass over the raw HTML *CSS-rule frequency* wrongly suggested a light theme (white appears in many rules). The **area-weighted computed-style** sample of the rendered page corrected this: the page paints near-black (`#080808`, by far the largest painted area) with light text — i.e. **dark**. Rendered measurement wins; rule-frequency is not a reliable proxy for a designed theme.

---

## 1. Typography

**Families**
- **Inter Tight** — body, UI, and headings. Self-host via `next/font/google` (`Inter_Tight`); the variable font covers all weights. (Framer labelled its `@font-face` "Inter"/"Inter Display", but the font file name table reads `Inter Tight`.)
- **Space Mono** — mono / eyebrow / label accents (OFL, Google Fonts) via `next/font/google` (`Space_Mono`).
- **Icons** — drop the Material Icons webfont; use `lucide-react`.

**Weights:** 400 base. The design leans on **size + colour** contrast far more than weight — even most headings render at 400; 500/700/900 are reserved for emphasis.

**Letter-spacing:** uniform **−0.02em** across sizes (this is *on top of* Inter Tight's already-tight cut).

**Type scale** (rendered sizes; line-height shown as ratio):

| Token | Size | Line-height | Notes |
|-------|------|-------------|-------|
| `display` | 58px | 1.1 | hero |
| `h1` | 48px | 1.1 | |
| `h2` | 30px | 1.2 | |
| `h3` | 24–28px | 1.2 | |
| `lead` | 22px | 1.4 | subhead / intro |
| `body-lg` | 20px | 1.4 | |
| `body` | 18px | 1.4 | |
| `caption` | 14px | 1.6 | most common text |
| `mono-eyebrow` | 11px | 1.0 | Space Mono, uppercase labels |

> Sizes are desktop. S1 should express these as a fluid/responsive ramp; Framer emitted per-breakpoint values (the granular set 11–58px) that the table above condenses to the real tiers.

---

## 2. Colour tokens

### Dark theme — **faithful reproduction** (primary)
Maps directly onto the starter's existing `styles.css` variables (`:root` / `.dark`). Values are the rendered, area-weighted truth.

| Starter token | Value | Role |
|---------------|-------|------|
| `--background` | `#080808` | page (dominant painted surface) |
| `--card` / surface | `#131313` | cards, raised surfaces |
| `--foreground` | `#ffffff` | primary text |
| (text-2) | `#f7f7f7` | near-white text |
| `--muted-foreground` | `#a6a6a6` | secondary text |
| `--primary` (accent) | `#3cda64` | brand green (CTAs, links, highlights) |
| accent-hover | `#61e88a` | lighter green variant |
| `--border` | `rgba(255,255,255,.15)` | hairlines |
| overlay | `rgba(34,34,34,.8)` | scrims |
| `--destructive` | `#cc4141` | errors |

### Light theme — **net-new design** (proposed starting point, needs a design pass)
Not present on the live site. Proposed inversion to seed S1; **must be reviewed for contrast** — the bright green fails AA as text on white, so text/link green is darkened while fills keep the bright green.

| Token | Proposed | Note |
|-------|----------|------|
| `--background` | `#ffffff` | |
| `--card` | `#f7f7f7` | |
| `--foreground` | `#080808` | |
| `--muted-foreground` | `#6e6e6e` | |
| `--primary` (fills) | `#3cda64` | keep brand green for fills |
| green-on-light (text/links) | `~#138a3e` | darkened for AA — **TBD in design** |
| `--border` | `rgba(8,8,8,.12)` | |

### Categorical / status accents (case-study tags)
Beyond the neutral+green base, case studies use a multi-hue tag set (status / project category). Captured candidates — **finalise semantics in S4/S5**:
`#0099ff` · `#1f6feb` · `#143b8f` · `#04204c` (blues/navy) · `#fdb52a` (amber) · `#ff731c` (orange) · `#534dfa` (indigo) · `#cc4141` (red) · green family. Likely "shipped" (green) vs "in-development" (amber/orange) status colours + per-project accents.

---

## 3. Radius & motion

**Radius scale** (rendered): `sm 10px` · `md 16px` · `lg 20px` · `xl 32px` · `pill 9999px`. (Rounder than the starter's 10px default — bump `--radius`.)

**Motion**
- Micro-interactions (hover/state): `cubic-bezier(0.2, 0, 0, 1)` — a fast decelerate/ease-out — at **~100–150ms**. Seed `motion` defaults in S2 with this curve.
- Entrance/scroll choreography runs in JS (Web Animations) and wasn't capturable statically. Per the PRD this is the part to **elevate** beyond Framer, so design it fresh in S2 rather than reproduce.

---

## 4. Impact on the starter (for S1)

- `app/layout.tsx`: replace `Inter`/`Lato`/`Nunito` imports with `Inter_Tight` + `Space_Mono` (`next/font/google`); wire `--font-sans` → Inter Tight, add `--font-mono` → Space Mono.
- `styles.css`: the light/dark token **architecture already exists** — S1 swaps the placeholder OKLCH-neutral values for the tokens above (dark = `.dark`/primary, light = `:root` net-new), bumps `--radius`, and adds the accent + categorical tokens.
- Replace Material-Icons usage with `lucide-react`.

## 5. Open items
- **Light theme palette** — net-new; needs a real design pass + AA contrast check (esp. green-on-white).
- **Entrance/scroll motion** — design language to be defined in S2.
- **Categorical/status tag colours** — finalise role mapping in S4/S5 against the live case studies.
