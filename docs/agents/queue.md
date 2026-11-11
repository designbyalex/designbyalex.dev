# Queue

The order the master follows when it starts the next writer, and the map of what blocks what. The master owns this file: on `DONE` it deletes the row, starts the next, and updates *Last reviewed*. Re-ordering happens only on Alex's call, noted on the PBI.

**Last reviewed:** 2026-11-11 18:00 AEDT. Set up today. #112 merged (8 motion tickets and the 4 review fixes), so the Site lane and `afk/migration` are free for the next batch. Waiting on Alex: 1 (the list is below).

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
| 1 | Site | next AFK batch: #91, #92, #93, #110, #111 | all `ready-for-agent`; the lane is free since #112 merged |
| 2 | Off product | Dependabot #85 and #86 | admin, after the batch per `Prefer:`; check `tina/tina-lock.json` is regenerated |
| 3 | Content | #100 content refresh | needs Alex's assets |
| 4 | Site | #15 cutover | after the batch and its review; HITL |

## Parallel prep

| Work | Session | Status |
|---|---|---|
| Hero piece #108 animatic (Hero piece lane) | hero-piece-pilot and its scene/preview sessions | B close-up picked; new melt loaded in Alex's Blender, waiting on his OK before re-rendering; "Let's talk" contrast fixed (d0057d1) |

## Waiting on Alex

The one live list of what only Alex can move, with rows as the `orchestrate` skill's *Blocked on you* defines them. The master rewrites it on every change and opens every reply with it.

| # | Kind | Do | Min | Where |
|---|---|---|---|---|
| 1 | Yes | merge the agency workflow setup PR | 1 | here |

## Waiting on the client

None: Alex is the client.

## Dependencies

- #15 blocks (hard) the post-cutover work: #101 → #109.

## Small items and candidate PBIs

- Pass `--datalayer-port` (and `--port`) in `scripts/afk/check.sh` and `build-local`, so builds don't clash with other sessions' Tina servers.
- Lighter AFK loop checks: tsc and biome per ticket, the build and vitest only in the final pass.
