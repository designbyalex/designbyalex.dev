You are working unattended on designbyalex.dev (a Framer → TinaCMS + Next.js portfolio migration), implementing one ticket: #{{N}}. No human will answer questions: make the reasonable call, and write it down.

## The ticket

{{ISSUE}}

## Read before you build

- The PRD: `gh issue view 3`. Its **Implementation Decisions** section is binding.
- `docs/design-audit.md`: design tokens, type scale, colour, radius, motion.
- `docs/afk/NOTES.md`: what earlier unattended tickets built and decided. Stay consistent with it.
- `.github/copilot-instructions.md`: the server/client page split (`page.tsx` fetches data, `client-page.tsx` renders with `useTina`).
- Existing patterns: `components/blocks/*`, `tina/collection/*`, `content/**`, `components/motion-primitives/*`.

## Velocity

- Your one feedback loop is **the gate**: `scripts/afk/check.sh --ticket {{N}}`. It runs the Tina schema build, tsc and biome, then the **Fidelity gate** (below), which takes a few minutes. Run it before committing and fix until it's green. For a quick type/lint check while you work, `scripts/afk/check.sh --no-gate` skips the Fidelity gate; verification never skips it.
- Run everything in the foreground (Bash `timeout` 600000) and never set `run_in_background`. This is a headless run: ending your turn exits the process and kills any background task or subagent, so never end it while one is pending.
- Tests and the code review run once, in the final pass after the last ticket. Keep momentum: build the ticket, get the gate green, commit.
- Your output is a local commit on `afk/migration`. The loop script handles everything after that: push, PR, and issues.

## The Fidelity gate

The gate holds the Build to **Parity** with the Reference site (Framer, frozen in `parity/reference/`): it builds the site for production, serves it locally, renders `/`, `/acacia`, `/mosurban`, the 404 and the extra routes at 390, 768 and 1440 (dark theme, reduced motion), and compares each with the Reference snapshot (ADR 0002, `parity/README.md`). Every difference is a **Gap**, with a Dimension: Copy, Media, Layout or Type.

- **Parity scope.** The ticket's `## Parity scope` lists `page · Section · Dimensions` lines, naming Reference Sections (Framer's layer names: `Mission` is `Section Mission`, `Project Row` covers every row; `all` means every page or Section). Every Gap in scope must reach **0**.
- **Baseline.** Everywhere else, the Gap count per page, Section, width and Dimension in `parity/baseline.json` may stay the same or go down, never rise. When the gate passes, it rewrites `parity/baseline.json` if any count moved: commit it in the same commit.
- **On a failure** the gate's last lines name each failing page, Section, width and Dimension with its Gap messages (element text, actual against expected). Those messages are the retry feedback if verification fails.
- **The run folder `.afk/parity/`**, replaced on each run:
  - `report.txt`: every Gap, grouped by page, Section, width and Dimension, with the ratchet's verdict.
  - `sections/<page>-<width>--<section>.jpg`: one Section, Reference left, Build right. Open them with Read to check composition the diff can't express (spacing, alignment, crops, colour). Do this for every Section in scope before you commit.
  - `sheets/<page>-<width>.jpg`: whole-page contact sheets, Reference left, Build right. `shots/` has the raw screenshots, `build/` the Build snapshots, `gaps.json` the Gaps as data.
- **Section markers.** The gate finds Build Sections by `data-section="<id>"` on each block root (the `sectionId` prop of `Section` and `ScrollReveal`). The ids are fixed by `sectionMap` in `parity/gate-config.json` (`Section Mission` → `mission`). A block that renders a Reference Section must carry its mapped id. Never rename an existing id to dodge a Gap.
- **Owner-only files.** Never edit `parity/deviations.json` (the Deviation list), `parity/gate-config.json` (tolerances and the Section map) or anything in `parity/reference/`, and never run `pnpm parity:capture-reference`. Verification fails the run if a commit touches them.
- **Proposed deviations.** If you believe a Gap is a difference the site owner should approve, rather than fix, add it under a `## Proposed deviations` heading in `docs/afk/NOTES.md` (create the heading once, at the end of the file): page, Section, check, the element text, and why. A proposal doesn't suppress the Gap. If the ticket can't reach 0 in scope without it, fix what you can, write that down, and stop: the owner decides.

## Rules that bite in this repo

- **Tina schema changes:** the gate rewrites `tina/tina-lock.json`. Commit it in the same commit. A stale lock breaks TinaCloud indexing and every Vercel build.
- **Blocks:** `Section` + `sectionBlockSchemaField`, a theme token from `styles.css` for every colour, `tinaField` on editable elements, and registration in `components/blocks/index.tsx` plus the relevant collection(s).
- **Motion:** goes through `components/motion-primitives/*`. They route through `lib/motion/reduced-motion.ts`, so reduced motion comes with them.
- **Themes:** everything works in dark (primary, faithful to Framer) and light (net-new).
- **Content from the live Framer site** (the source of truth for *faithful*):
  - Page HTML: `curl -fsSL https://designbyalex.dev/<path> -o .afk/cache/<name>.html`, then grep it.
  - Images: `curl -fsSL https://framerusercontent.com/<path> -o public/uploads/projects/<slug>/<name>.<ext>`, referenced as `/uploads/projects/<slug>/<name>.<ext>`.
  - Video: commit the file under `public/` (ADR 0001). The Fidelity gate fails any media still served from `framerusercontent.com`.
  - URLs stay `/acacia` and `/mosurban`.
- Make the smallest change that meets the acceptance criteria.

## Done means

1. Every acceptance criterion is accounted for: met in code, or listed under *Verify visually* or *Stubbed* with the reason. Visual checks (both themes, reduced motion, fidelity to Framer) go under *Verify visually*.
2. The gate is green (`scripts/afk/check.sh --ticket {{N}}`), and any `parity/baseline.json` change it made is in your commit.
3. You appended a section to `docs/afk/NOTES.md`:
   ```
   ## #{{N}} <ticket title>
   - Built: …
   - Decisions made without a human: …
   - Stubbed: …
   - Fidelity gate: Gaps before → after in the Parity scope, and the Baseline change
   - Verify visually: (checklist)
   ```
4. Your work is committed with `git add -A`, subject `afk(#{{N}}): <short summary>`, body ending `Refs #{{N}}`, and the working tree is clean.

Then stop.
{{FEEDBACK}}
