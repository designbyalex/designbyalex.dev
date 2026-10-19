You are working unattended on designbyalex.dev. Tickets {{TICKETS}} are committed on branch `afk/migration`, built for speed with only the gate (`scripts/afk/check.sh`) per ticket. This is the deferred testing pass. No human will answer questions: make the reasonable call, and write it down.

## Never background anything

This is a headless `claude -p` run. When you end your turn, the process exits and every background task and subagent still running is killed: nothing will "report back", and the commit never happens.

- Run the gate in the foreground: `scripts/afk/check.sh --full > .afk/full-gate.log 2>&1` with a Bash `timeout` of 600000 (the maximum), then read the log.
- Never set `run_in_background` on Bash or Agent calls, including review subagents. Wait for each one's result.
- Never end your turn while a subagent or background task is pending. Your last action is the commit, and you end your turn only once the tree is clean.

## Steps

1. Read `docs/afk/NOTES.md` and `git log --reverse origin/main..HEAD`.
1a. Finish the stubs a harness bug forced. Ticket #9 ran while the curl allowlist was broken (fixed in a later `chore(afk):` commit), so its images and its four outcome counter values are stubbed: see its *Stubbed* notes. Do them now, the way the tickets do:
   - Page HTML: `curl -fsSL https://designbyalex.dev/acacia -o .afk/cache/acacia.html`, then grep it for `framerusercontent.com` URLs and the counter targets.
   - Images: `curl -fsSL https://framerusercontent.com/<path> -o public/uploads/projects/acacia/<name>.<ext>`, referenced as `/uploads/projects/acacia/<name>.<ext>`, with `alt` text, wherever the live page shows them.
   - Update #9's *Stubbed* items in `docs/afk/NOTES.md` to say what's now done. Do the same for any other ticket whose notes say curl was denied.
2. Run the full gate, `scripts/afk/check.sh --full`, which adds `pnpm build-local` (offline Tina + `next build`) and vitest. Fix each failure at its root cause, with the smallest change.
3. Add the tests the PRD's **Testing Decisions** section calls for (`gh issue view 3`): every pure module added under `lib/` on this branch gets a colocated `*.test.ts`.
4. Review the whole diff (`git diff origin/main...HEAD`) against every acceptance criterion of every ticket (`gh issue view <n>`). Use the `mattpocock-skills:code-review` skill if it's available; otherwise review by hand. Fix real defects.
5. Re-run the full gate until it's green.
6. Append a `## Final pass` section to `docs/afk/NOTES.md` with:
   - what failed, and how you fixed it
   - the tests you added
   - every acceptance criterion of every ticket, marked met or not met (with the reason)
   - review findings you chose not to fix
   - open risks
   - **one consolidated visual QA checklist**: every page × dark/light × reduced motion, plus the items the tickets deferred
7. Commit with `git add -A`, subject `afk(final): <short summary>`, leaving the working tree clean.

Your output is a local commit on `afk/migration`. The loop script re-runs the full gate itself, then pushes and opens the PR.
{{FEEDBACK}}
