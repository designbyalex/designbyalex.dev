# Parity: the Fidelity gate's inputs

Everything here is owned by the site owner (ADR 0002). Agents read these files and never edit them: the loop fails any unattended commit that touches them.

| Path | What |
|---|---|
| `reference/` | The frozen Reference snapshot of the Framer site (see its README). Never re-captured. |
| `gate-config.json` | Tolerances, matching thresholds, font aliases, forbidden media hosts, the Section map and extra routes |
| `deviations.json` | The Deviation list: the differences the owner has approved, which stop counting as Gaps |

## Comparing a Build

```bash
pnpm parity:diff http://localhost:3000            # every page × Checkpoint width
pnpm parity:diff https://designbyalexdev.vercel.app --page acacia --width 1440 --json gaps.json
```

It extracts the Build with the same browser and settings as the Reference (`scripts/parity/extract.ts`), runs the comparator (`scripts/parity/compare.ts`, pure) and prints the Gaps grouped by page, Section, width and Dimension, with punctuation-only differences listed apart. It always exits 0. Pass or fail is the gate's decision (#50), made against the Baseline.

A Gap message names the page, Section, width and element text, then gives actual against expected:

```
/acacia Section Credibility @1440 "Acacia’s credibility gap": font-size 18px, expected 14px
```

## What the comparator checks

Text runs are matched by their rendered text (after CSS `text-transform`), first as whole paragraphs and then as single runs. A match ignores quote style, dash style, spacing and case, and is searched in the mapped Section first, then anywhere on the page. Each Gap has a check and a Dimension (`scripts/parity/checks.ts`):

- **Copy**: `copy-missing` (Reference text with no Build match), `copy-changed` (the same element with edited words), `copy-extra`, `punctuation` and `case` (reported apart from word changes), links (`link-missing`, `link-extra`, `link-target`), and the route (`status`, `title`).
- **Type**, per matched run: `font-family` (next/font names and `fontFamilyAliases` resolved), `font-size`, `line-height`, `font-weight`, `tracking`, `color` (OKLab distance, so `oklch()` and `rgb()` compare), `font-style`.
- **Layout**: `position` within the Section (never absolute page y), `width` of wrapping runs, `lines`, `opacity`, `wrong-section`, and per Section `section-missing`, `section-extra` and `section-size`.
- **Media**: `media-host` (any `forbiddenMediaHosts` source, subdomains included), `media-missing`, `media-extra`, `media-size`, `media-position`, `media-radius`, `media-fit`, `video-autoplay`, `video-attributes`.

## Section map

`sectionMap` pairs each Reference Section id (Framer's layer name, e.g. `Section Mission`, `Project Row 2`) with the Build Section id that marks the same region with `data-section` on its block root. A repeated name gets ` 2`, ` 3`… on both sites (`project-row`, `project-row 2`). `(none)` stands for text in no Section: on the Reference that is only Framer's 404 page.

While a Build Section is missing, the comparator reports it once and still matches the Section's text anywhere on the page, so Copy and Type are checked before the Section exists.

## Deviation list

Each entry has `id`, `page`, `section`, `check`, `anchor` and `decision`. A Gap is suppressed when every selector matches it:

- `page`: Reference page key (`home`, `acacia`, `mosurban`, `not-found`)
- `section`: Reference Section id, or `(page)` for status and title
- `check`: a check name, or a Dimension for all of its checks
- `anchor`: the Gap's element text, compared after quote, dash and case normalisation

Each selector is a value, a list of values, or `*`. Agents propose Deviations in their notes and never add them here.
