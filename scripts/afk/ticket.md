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

- Your one feedback loop is **the gate**: `scripts/afk/check.sh`. Run it before committing and fix until it's green.
- Run everything in the foreground (Bash `timeout` up to 600000) and never set `run_in_background`. This is a headless run: ending your turn exits the process and kills any background task or subagent, so never end it while one is pending.
- Builds, tests and visual checks all run once, in the final pass after the last ticket. Keep momentum: build the ticket, get the gate green, commit.
- Your output is a local commit on `afk/migration`. The loop script handles everything after that: push, PR, and issues.

## Rules that bite in this repo

- **Tina schema changes:** the gate rewrites `tina/tina-lock.json`. Commit it in the same commit. A stale lock breaks TinaCloud indexing and every Vercel build.
- **Blocks:** `Section` + `sectionBlockSchemaField`, a theme token from `styles.css` for every colour, `tinaField` on editable elements, and registration in `components/blocks/index.tsx` plus the relevant collection(s).
- **Motion:** goes through `components/motion-primitives/*`. They route through `lib/motion/reduced-motion.ts`, so reduced motion comes with them.
- **Themes:** everything works in dark (primary, faithful to Framer) and light (net-new).
- **Content from the live Framer site** (the source of truth for *faithful*):
  - Page HTML: `curl -fsSL https://designbyalex.dev/<path> -o .afk/cache/<name>.html`, then grep it.
  - Images: `curl -fsSL https://framerusercontent.com/<path> -o public/uploads/projects/<slug>/<name>.<ext>`, referenced as `/uploads/projects/<slug>/<name>.<ext>`.
  - Video: embed from its external host with the video block.
  - URLs stay `/acacia` and `/mosurban`.
- Make the smallest change that meets the acceptance criteria.

## Done means

1. Every acceptance criterion is accounted for: met in code, or listed under *Verify visually* or *Stubbed* with the reason. Visual checks (both themes, reduced motion, fidelity to Framer) go under *Verify visually*.
2. The gate is green.
3. You appended a section to `docs/afk/NOTES.md`:
   ```
   ## #{{N}} <ticket title>
   - Built: …
   - Decisions made without a human: …
   - Stubbed: …
   - Verify visually: (checklist)
   ```
4. Your work is committed with `git add -A`, subject `afk(#{{N}}): <short summary>`, body ending `Refs #{{N}}`, and the working tree is clean.

Then stop.
{{FEEDBACK}}
