# designbyalex.dev

## Agency workflow

designbyalex.dev: Alexander Blum's design portfolio, moving from Framer to Next.js + TinaCMS on Vercel, for Alex himself. Alex directs and decides. A master session sequences the work with /orchestrate; every other session does, checks and merges its own. Work runs in parallel, batched and unattended, and Alex reviews everything at the end of each batch.

- **Read first:** `docs/agents/orchestration.md` (roles, lanes, publish step, checks, gates, hand-backs), then `CONTEXT.md` and any ADR in `docs/adr/` the work touches.
- **PBIs:** GitHub issues in this repo, with P- or H-numbered titles under a PRD, picked up by the AFK loop when labelled `ready-for-agent` with **Type: AFK** and nothing open under **Blocked by**. Shape and paths are in `docs/agents/issue-tracker.md`. File with `/pbi`, run with `/pbi-loop`, or batch AFK tickets through `scripts/afk-loop.sh`.
- **Queue:** `docs/agents/queue.md`, owned by the master.
- **Session titles:** `docs/agents/session-names.md`.
- **House rules:**
  - Credentials: env var names only, never values. Copy env files with `cp` only after `git check-ignore -v .env.local`, never `git add -f` them, and keep them out of commits, PRs and logs.
  - Content is Alex's: use his copy and figures as given. A gap becomes `NEEDS ALEX`, never invented text. Case-study assets come only from Alex.
  - Git: never force-push, never push to `main` (Tina's content commits are the exception), and merge only on Alex's yes. Only the master may relay that yes. Merge `origin/main` before pushing.
  - The `~/Freelance/Portfolio/afk-migration` checkout belongs to the AFK loop. `prototype/hero-piece` never merges.
  - Shared machine: never stop another session's process. Run Tina with `--port <free> --datalayer-port <free>` and Next on a free port.
  - Testing: fast checks (tsc, biome) per ticket, `scripts/afk/check.sh --full` once per batch, and Alex reviews at the end. No plan gates and no extra test steps.
  - Every change works in light and dark, and rests from first paint under reduced motion.
  - Regenerate `tina/tina-lock.json` with `tinacms build` on every Tina schema change, and commit it.
