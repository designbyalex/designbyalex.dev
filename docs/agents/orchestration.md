# Orchestration

How sessions work together on designbyalex.dev. Every session reads this after `CLAUDE.md`. PBIs follow `docs/agents/issue-tracker.md`. The master's runbook is the `orchestrate` skill. Its state file is `docs/agents/queue.md`, and session titles follow `docs/agents/session-names.md`.

Agency mode: a master sequences and briefs the work, and each session does, checks and merges its own. This is a personal portfolio with no end date. Work runs in **parallel, batched and unattended (AFK)**, with light automatic checks. Alex reviews and tests everything once, at the end of each batch.

## Roles

- **Alex, director.** Decides scope, taste and approvals. Every question reaches Alex batched, in one round, with a recommendation first.
- **Master.** Sequences and unblocks, and does no hands-on work. It owns the queue, writes every brief, reads back every hand-back, and builds the end-of-batch review page. It is the only session that may relay Alex's decisions to other sessions (see *Human gates*).
- **Writer.** Changes one lane end to end for one PBI or one batch: build, fast checks, push, merge on Alex's yes. One writer per lane at a time. The AFK loop (`scripts/afk-loop.sh`) counts as the Site writer while it runs.
- **Held writer.** The next writer on a lane, started while the current one builds. It reads the PBI, puts every question to Alex in one round, sends `READY` and waits for `go`. It is read-only on the lane until then.
- **Side worker.** Drafts tickets, scripts, docs and research. It reads the product, writes only its own new files and merges its own branch. Any number can run in parallel.
- **Sweeper.** Not used separately: the AFK loop's final pass is the sweep (see *Sweep*).
- **Picker.** A side worker that keeps one design-picker page per area and runs batched taste rounds on it.

## Master checks

On every wake, in addition to the `orchestrate` skill's own list:

- `gh pr list` for open PRs, including Dependabot.
- `gh issue list --label ready-for-agent --state open` for what the next AFK batch can take.
- `pgrep -f afk-loop.sh` to see whether the AFK loop is running. While it runs, it holds the Site lane.

## Models

Every nested session runs on the strongest available model. Only Alex changes a session's model.

## Lanes

A lane is one part of the product that one session may write at a time. Writers overlap across lanes, never within one. The master names the lane in every brief.

| Lane | What it is | Publish step | Measured check | Writer rule |
|---|---|---|---|---|
| Site | `app/`, `components/`, `lib/`, `styles.css`, `tina/` schema | push the branch; Vercel builds a preview | per ticket: tsc and biome; once per batch: `scripts/afk/check.sh --full` (Tina, tsc, biome, build, vitest) in the final pass | one writer at a time; the AFK loop counts as the writer while it runs |
| Content | `content/*.mdx`, `public/uploads/` | a Tina save commits to `main`; Vercel builds | the Vercel build passes | Alex in Tina, or one agent using Alex's copy as given |
| Hero piece | Blender scene scripts and renders in `~/Freelance/Portfolio/site/logo/`, plus the `prototype/hero-piece` branch, which is never merged | a render plus a local review build | the renders exist; Alex's checkpoint in Blender | one scene writer plus one preview writer, on disjoint files |
| Off product | `scripts/`, `docs/`, `reference/`, tickets | merge | the script runs, or its dry run starts | any number of side workers |

A session touches no other lane's files. A side worker that settles a decision writes it on the issue it settles; lasting ones become an ADR in `docs/adr/`.

## Where things live

- **The repo:** this folder, `designbyalex/designbyalex.dev` on GitHub, merging by GitHub PR into `main`.
- **The product:** this repo, Next.js + TinaCMS on Vercel. Alex edits copy through Tina Cloud, which commits "TinaCMS content update" straight to `main`.
- **Publish target:** the branch's Vercel preview (`designbyalexdev-git-<branch>-designbyalex.vercel.app`) or localhost. `main` deploys to designbyalexdev.vercel.app. Production is designbyalex.dev, which Framer serves until cutover (#15). Nothing goes there without Alex's explicit yes.
- **Worktrees:** every session that writes gets its own worktree. The AFK loop keeps its fixed checkout at `~/Freelance/Portfolio/afk-migration` on `afk/migration`. Copy env files into a worktree with `cp`, only after `git check-ignore -v .env.local` confirms the file is ignored.
- **Cached facts:** `reference/` holds what a session would otherwise rediscover: the environment URLs, the Tina env var names (`NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`, `NEXT_PUBLIC_TINA_BRANCH`), the Vercel project, the live Framer page URLs until cutover, where the hero piece sources live, and the port workaround. Credential names only, never values.
- **Before planning:** read `CONTEXT.md` and any ADR in `docs/adr/` the work touches.
- **Before pushing:** merge `origin/main`, since Tina commits there on its own.
- **Tina schema changes:** regenerate `tina/tina-lock.json` with `tinacms build` and commit it.
- **Every change** works in light and dark, and rests from first paint under reduced motion.
- **Ports:** this machine runs several sessions at once. Start Tina with `--port <free> --datalayer-port <free>` (defaults 4001 and 9000) and Next on a free port. Never stop another session's server.

## Complexity flags

Every PBI's first line is one flag. The agent proposes it with one sentence of reasoning. Alex confirms or overrides, and an override stands. The flag sits alongside the loop's **Type: AFK|HITL** line: both agent flags can be AFK, and HITL marks anything that needs Alex mid-way (a picker, Blender, the cutover).

| Flag | Meaning | Loop |
|---|---|---|
| `trivial-manual` | Alex does it in a dashboard or in Tina | Alex does it; the agent closes the issue |
| `trivial-agent` | one small change, no new pattern | build, fast checks, close; goes on the batch review if visible |
| `complex-agent` | a new pattern or wide reach | build, fast checks, full check in the batch's final pass, then the batch review |

| The PBI requires… | Flag |
|---|---|
| a copy edit in Tina, a Vercel env var | `trivial-manual` |
| a copy fix, one component prop, one token, one config value | `trivial-agent` |
| a new block or section, motion, a shared component, a Tina schema change, routing and redirects | `complex-agent` |

## Plan gate

None. This workflow has no plan gates: the ticket body is the plan, and Alex reviews the result at the end of the batch.

## Backup

Git is the backup for code and content. The hero scene scripts rebuild every render. Keep `.blend` files that may hold Alex's hand edits outside any worktree that might be cleaned up, for example in `~/Freelance/Portfolio/hero-piece-scene-out-backup/`.

## Publish gate

Before every push:

1. No other writer on this lane is mid-build (`list_sessions`, the queue, `pgrep -f afk-loop.sh`).
2. The branch is up to date with `origin/main`.
3. The fast checks pass (tsc, biome). For the last push of a batch, `scripts/afk/check.sh --full` passes.
4. Push to the branch's Vercel preview only. Done when the push lands; the preview is checked in the batch review, not per ticket.

## Light check

Once per batch, not per ticket:

1. The Vercel deploy of the batch's branch is Ready.
2. Every visible change in the batch is a row on one end-of-batch review page (like the 2026-11-11 motion review), with Framer and preview links and Accept or Needs work.
3. Alex goes through the page. The master turns each Needs work into a fix on the same PR, or into a ticket.

## Standing checks

Run by `scripts/afk/check.sh` (`--full` adds the build and vitest), each exiting non-zero on failure:

- the Tina schema build and generated types
- `tsc`
- biome on changed files
- `pnpm build-local` (with `--full`)
- `vitest run` (with `--full`)

No new probes or test suites unless something keeps breaking. `check.sh` runs Tina on the first free ports from 4100 and 9100 (override with `TINA_PORT` / `TINA_DATALAYER_PORT`) and passes them to `build-local`, which defaults to 4101 and 9101 when run on its own, so builds don't clash with another session's Tina on 4001 or 9000.

## Sweep

The AFK loop's final pass is the sweep: it runs `scripts/afk/check.sh --full` once over the whole batch and writes its findings to the batch's Final pass section in `docs/afk/NOTES.md`. There is no separate sweeper or DoD walk.

## What counts as evidence

The automatic checks settle what code can show. Alex's eyes settle everything visual, asked once per batch on the review page, or in a picker round for a taste call.

## Human gates

- **Explicit yes from Alex:** merging to `main`, anything on the domain or DNS (the cutover), Vercel, Tina Cloud or GitHub settings, cancelling Framer, deleting branches, issues or content, closing a PRD, and anything sent from Alex's accounts (email, socials). Alex gives the yes in the acting session, **or to the master**, which may relay it to that session quoting Alex's words and the date. Only the master may relay. A yes relayed by any other session, or a child passing one on, is never a substitute.
- **Taste calls:** design-picker rounds, batched so one page covers several decisions. Each decision is one question, with the current state as option `now` and a recommendation.

## House rules

- **Credentials:** env var names only, never values. Copy env files with `cp` only after `git check-ignore`, never `git add -f` them, and keep them out of commits, PRs and logs.
- **Content is Alex's:** use his copy and figures as given. A gap becomes `NEEDS ALEX`, never invented text. Case-study assets for Acacia and MOS Urban come only from Alex.
- **Git:** never force-push, and never push to `main`; Tina's own content commits are the exception. The `~/Freelance/Portfolio/afk-migration` checkout belongs to the AFK loop. `prototype/hero-piece` never merges.
- **Shared machine:** never stop another session's process. Use free ports.
- **Testing:** fast checks per ticket, the full check once per batch, and Alex reviews at the end. No extra test steps.
- **Tina:** regenerate `tina/tina-lock.json` on every schema change.

## Merging

Each session opens a PR for its own branch and merges it only on Alex's yes (*Human gates*):

```bash
git merge origin/main            # resolve, then push
git push -u origin HEAD
gh pr create --base main --title "<title>" --body "<body>"
# after Alex's yes, given here or relayed by the master:
gh pr merge <PR> --merge
gh pr view <PR> --json state -q .state   # must print MERGED
git push origin --delete <branch>
```

Done when the PR shows merged and the remote branch is gone. Other sessions merge `origin/main` at their next safe point. An AFK batch is one draft PR from `afk/migration`; it merges after the batch review.

## Hand-backs

The app relays only the first 400 characters of a session's turn, so the **first line stands alone**: state, issue numbers, sha.

| First line | Means |
|---|---|
| `READY: #N <what>` | my part is complete, waiting on the next move |
| `go` | (master to a held writer) the lane is yours |
| `DONE: #N <what>, <PR or files>, sha <sha>` | finished, checked, merged, issue closed |
| `NEEDS ALEX: <do this, where>, <N> min` | Alex has one exact action to take; the master relays it word for word |
| `BLOCKED: <what>` | stuck on something the master can clear |
| `HELD: #N <step reached>` | paused itself (offline, lane conflict) |

- **State changes only.** A session with nothing new says nothing.
- **One question round, at the start.** Every question for Alex goes before the first write. Mid-build, ask only about what the build turned up.
- **Title before message:** set the state emoji per `session-names.md`, then send.
- **Wake the master:** whenever you wait on Alex (a `NEEDS`, a picker round, a yes to merge) and on `DONE`, also `SendMessage` the first line to the master id in your brief.
- **Long notes** go in the repo (`docs/afk/NOTES.md` for loop batches, `docs/handbacks/<N>.md` otherwise) or on the issue, never only in chat.

## Going offline

When Alex says he's going offline, the master forwards it to every running session at once. Each session checkpoints (commits everything, WIP included), publishes nothing, sends `HELD: #N <step reached>` and stops. The master writes the resume order into the queue's *Last reviewed* line. On return it re-reads live state and sends `go` in that order.

## Fix the process

When a rule, skill or doc sends you wrong, fix it on your branch, put what broke and why in the commit message, and name the fix in your hand-back. A fix to a file another running session owns goes in your hand-back for the master.
