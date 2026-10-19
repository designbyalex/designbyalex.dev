# Parity: the Fidelity gate's inputs

The first three are owned by the site owner (ADR 0002). Agents read them and never edit them: the loop fails any unattended commit that touches them. The Baseline is the one file here the loop commits, and only lower: verification fails a run whose commits raise any of its counts above the Baseline the ticket started from, or remove one (`scripts/parity/baseline-check.ts`).

| Path | What |
|---|---|
| `reference/` | The frozen Reference snapshot of the Framer site (see its README). Never re-captured. |
| `gate-config.json` | Tolerances, matching thresholds, font aliases, forbidden media hosts, the Section map and extra routes |
| `deviations.json` | The Deviation list: the differences the owner has approved, which stop counting as Gaps |
| `baseline.json` | The Baseline: open Gaps per page, Section, width and Dimension, which may only go down. Rewritten by a passing gate run and committed with the change. A Section the Build no longer has stays at 0 |
| `../scripts/parity/`, `../scripts/afk/`, `../scripts/afk-loop.sh` | The gate's own code (extractor, comparator, ratchet, gate runner) and the loop that runs it. Owner-only like the first three, so the agent being judged can't change its judge: gate changes are attended work |

## The Fidelity gate

```bash
pnpm parity:gate                               # build-local → next start → every page × width → ratchet
pnpm parity:gate --ticket body.md              # also hold the ticket's `## Parity scope` to 0 Gaps
pnpm parity:gate --page acacia --width 1440    # partial: report and ratchet what it compared; never writes the Baseline
```

`scripts/parity/gate.ts` builds the site for production with offline Tina, serves it with `next start` on a free port (Tina's local GraphQL stays up beside it, on free ports too), extracts every page × Checkpoint width, runs the comparator and then the **Baseline ratchet** (`scripts/parity/ratchet.ts`, pure). The ratchet fails when a Section in the ticket's Parity scope still has Gaps, or when any other count rose above the Baseline. A Section the Baseline has never seen starts at its first count. On a full passing run the gate rewrites `baseline.json` if the counts moved. It exits 1 on a failure, and its last lines are the failures with their Gap messages. In the AFK loop it runs inside `scripts/afk/check.sh --ticket N`, not in CI.

A ticket's Parity scope is its `## Parity scope` list of `page · Section · Dimensions` lines. A page is a Build path (`/acacia`), a Reference page key or `404` (every route compared with the 404). A Section is a Reference Section name (`Mission` for `Section Mission`, `Project Row` for every row, `Hero` for `Hero Content`). Dimensions are Copy, Media, Layout and Type. `all` works for each part.

Each run replaces the gitignored run folder `.afk/parity/`: `report.txt` (every Gap and the verdict), `gaps.json`, `counts.json`, `ratchet.json`, `sheets/<page>-<width>.jpg` (whole-page contact sheets, Reference left, Build right), `sections/<page>-<width>--<section>.jpg` (the same per Section), `shots/` (the screenshot pairs), `build/` (the Build snapshots) and `server.log`.

## Comparing a Build

```bash
pnpm parity:diff http://localhost:3000            # every page × Checkpoint width
pnpm parity:diff https://designbyalexdev.vercel.app --page acacia --width 1440 --json gaps.json
```

It extracts the Build with the same browser and settings as the Reference (`scripts/parity/extract.ts`), runs the comparator (`scripts/parity/compare.ts`, pure) and prints the Gaps grouped by page, Section, width and Dimension, with punctuation-only differences listed apart. It always exits 0. Pass or fail is the gate's decision, made against the Baseline (above).

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

Every block root and the header and footer carry `data-section` (the `sectionId` prop of `Section` and `ScrollReveal`). A block that has no Reference Section of its own yet carries its block type (`text`, `quote`, `image`, `gallery`, `video`, `feature-deep-dive`, `metrics`, `experience`, `contact`; `project-nav` for the case-study previous/next links) and counts once per page and width as `section-extra`. Its text is still matched page-wide, as below.

While a Build Section is missing, the comparator reports it once and still matches the Section's text anywhere on the page, so Copy and Type are checked before the Section exists.

## Deviation list

Each entry has `id`, `page`, `section`, `check`, `anchor` and `decision`. A Gap is suppressed when every selector matches it:

- `page`: Reference page key (`home`, `acacia`, `mosurban`, `not-found`)
- `section`: Reference Section id, or `(page)` for status and title
- `check`: a check name, or a Dimension for all of its checks
- `anchor`: the Gap's element text, compared after quote, dash and case normalisation

Each selector is a value, a list of values, or `*`. Agents propose Deviations in their notes and never add them here.
