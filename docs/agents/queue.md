# Queue

The order the master follows when it starts the next writer, and the map of what blocks what. The master owns this file: on `DONE` it deletes the row, starts the next, and updates *Last reviewed*. Re-ordering happens only on Alex's call, noted on the PBI.

**Last reviewed:** 2026-11-11 18:05 AEDT. AFK batch #91, #92, #93, #110, #111 running on battery on Alex's call (terminal tab "AFK batch 91-111"; Alex plugs in when the battery is lower; closing the lid stops it). Hero lane: #108 rendering, nothing on Alex until the renders land. Two Off product side workers running. Waiting on Alex: 0.

## Priority

1. Cutover (#15): designbyalex.dev served from Vercel, with redirects in place and Framer cancelled.
2. Content refresh (#100): replace the soft case-study assets and refresh the MOS media.
3. Hero piece (#101 → #109): the Blender piece live in the home hero, after cutover.

Finished means: nothing. This is Alex's ongoing portfolio, with no end date. Goals have no due dates.

**Prefer:** product work first (the next Site or Hero ticket), then admin such as Dependabot and docs. A free lane takes product work first.

**Order within a tier:** oldest PBI first. Jump the order only for a stated reason, written in the row: it unblocks other work, it can use a lane the older PBI can't, or it's much smaller.

Standing calls:
- 2026-11-11: the Fidelity gate is retired (#113, ADR 0005).
- 2026-11-11: batch the work, keep testing light, and Alex reviews everything at the end of each batch. No plan gates.
- 2026-11-11: only the master may relay Alex's explicit yes to another session.

## Writer queue

| # | Lane | PBI | Why here |
|---|---|---|---|
| 1 | Site | AFK batch: #91, #92, #93, #110, #111 (RUNNING since 18:04) | Alex, 2026-11-11: "continue with afk batch" without waiting for the checks/ports PR, on battery. #93 and #110's Blocked by reworded (their blockers were merged PRs, which the guard counted as open). Ends in one draft PR from `afk/migration`, then the batch review |
| 2 | Off product | Dependabot #85 and #86 | admin, after the batch per `Prefer:`; check `tina/tina-lock.json` is regenerated |
| 3 | Content | #100 content refresh | needs Alex's assets |
| 4 | Site | #15 cutover | after the batch and its review; HITL |

## Parallel prep

| Work | Session | Status |
|---|---|---|
| Hero piece #101 → #109 lead (Hero piece lane) | hero-piece-pilot `local_fe36df13-fb11-40de-8c45-c3a1221e4224` | adopted the setup (2026-11-11 18:15). #103 → #107 closed; #108 in progress; next: on Alex's yes, merge both #108 branches into `prototype/hero-piece`, re-run the harness, then Alex's checkpoint 2 in the hero; #109 after |
| #108 animatic scene renders | hero-frames `local_1593e98f-c058-4e96-80bb-f82d6b0567ec` | Alex OK'd the gooey melt on CAM_anim_b ("Approved, render it"); re-rendering now; new setup queued for its next turn |
| #108 animatic preview | hero-frames-preview `local_4ccc9c64-19ef-4a01-87fc-7afe68144153` | READY: d0057d1 on `claude/hero-piece-anim-preview` (98/98 contrast checks); waits for the pilot's merge into `prototype/hero-piece` |
| AFK checks + Tina ports (Off product) | afk-checks-ports `local_c3b28f8a-cec5-4ffb-a584-9ab478de3aa5` | one PR: confirm the light per-ticket gate, pass free `--port` / `--datalayer-port` in `check.sh` and `build-local` |
| `reference/` cache (Off product) | reference-cache `local_c9938ae1-1aaa-494c-b4fd-a283b8968e9e` | writes `reference/` per orchestration.md → Cached facts, credential names only |

## Waiting on Alex

The one live list of what only Alex can move, with rows as the `orchestrate` skill's *Blocked on you* defines them. The master rewrites it on every change and opens every reply with it.

| # | Kind | Do | Min | Where |
|---|---|---|---|---|

None right now.

## Waiting on the client

None: Alex is the client.

## Dependencies

- #15 blocks (hard) the post-cutover work: #101 → #109.

## Small items and candidate PBIs

- In progress as one PR (afk-checks-ports): `--port` / `--datalayer-port` in `scripts/afk/check.sh` and `build-local`, and lighter AFK loop checks (tsc and biome per ticket, build and vitest only in the final pass; mostly in place already).
