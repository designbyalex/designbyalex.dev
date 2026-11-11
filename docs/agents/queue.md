# Queue

The order the master follows when it starts the next writer, and the map of what blocks what. The master owns this file: on `DONE` it deletes the row, starts the next, and updates *Last reviewed*. Re-ordering happens only on Alex's call, noted on the PBI.

**Last reviewed:** 2026-11-11 18:20 AEDT. AFK batch running (#91, #92 done; #93 building), shown in the watcher session afk-batch and the live dashboard at http://127.0.0.1:4789. A side worker is making the dashboard open with every batch. Hero lane: #108 rendering. Waiting on Alex: 1 (the list is below).

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
| 1 | Site | AFK batch: #91, #92, #93, #110, #111 (RUNNING since 18:04; watcher session afk-batch `local_259c4470-ee7b-4f45-95ab-23ee25324c7b`; dashboard http://127.0.0.1:4789; #91 553043f and #92 cfbf10a done. This batch keeps the old `check.sh` (Tina on 9000): the branch is behind `origin/main` (#115, #116), so a re-run's preflight stops on "diverged" until `origin/main` is merged by hand, and the batch PR needs it merged before review) | Alex, 2026-11-11: "continue with afk batch" without waiting for the checks/ports PR, on battery. #93 and #110's Blocked by reworded (their blockers were merged PRs, which the guard counted as open). Ends in one draft PR from `afk/migration`, then the batch review |
| 2 | Off product | Dependabot #85 and #86 | admin, after the batch per `Prefer:`; check `tina/tina-lock.json` is regenerated |
| 3 | Content | #100 content refresh | needs Alex's assets |
| 4 | Site | #15 cutover | after the batch and its review; HITL |

## Parallel prep

| Work | Session | Status |
|---|---|---|
| Hero piece #101 → #109 lead (Hero piece lane) | hero-piece-pilot `local_fe36df13-fb11-40de-8c45-c3a1221e4224` | adopted the setup (2026-11-11 18:15). #103 → #107 closed; #108 in progress; next: on Alex's yes, merge both #108 branches into `prototype/hero-piece`, re-run the harness, then Alex's checkpoint 2 in the hero; #109 after |
| #108 animatic scene renders | hero-frames `local_1593e98f-c058-4e96-80bb-f82d6b0567ec` | Alex OK'd the gooey melt on CAM_anim_b ("Approved, render it"); re-rendering now; new setup queued for its next turn |
| AFK dashboard autostart (Off product) | afk-dashboard `local_967ef96a-6e0b-456b-8ceb-541c86d6ac1d` | Alex, 2026-11-11: the dashboard should run with every AFK batch. Moving it into `scripts/afk/dashboard/`, started and opened by the loop; merges only after the current batch ends |
| #108 animatic preview | hero-frames-preview `local_4ccc9c64-19ef-4a01-87fc-7afe68144153` | READY: d0057d1 on `claude/hero-piece-anim-preview` (98/98 contrast checks); waits for the pilot's merge into `prototype/hero-piece` |

## Waiting on Alex

The one live list of what only Alex can move, with rows as the `orchestrate` skill's *Blocked on you* defines them. The master rewrites it on every change and opens every reply with it.

| # | Kind | Do | Min | Where |
|---|---|---|---|---|
| 1 | Yes | say yes to merge PR #117 (master's queue and the AFK watcher rule, docs only) | 2 | [PR #117](https://github.com/designbyalex/designbyalex.dev/pull/117) |

## Waiting on the client

None: Alex is the client.

## Dependencies

- #15 blocks (hard) the post-cutover work: #101 → #109.

## Small items and candidate PBIs

- None open. Both earlier items shipped in PR #116 (2026-11-11). The running batch still uses the old gate; the next batch gets the new one.
