# Ports

This machine runs several sessions at once. Never stop another session's server; pick a free port instead.

| Server | Default | Flag | Verified |
|---|---|---|---|
| Tina local GraphQL server | 4001 | `--port <free>` (`-p`) | `tinacms dev --help` and `tinacms build --help`, CLI in `node_modules`, 2026-11-11 |
| Tina datalayer | 9000 | `--datalayer-port <free>` | same |
| Next dev | 3000 | `-p <free>` on `next dev` | Next's default; `unverified` here |

## The clash

A sibling session's `tinacms dev` (for example a hero-piece preview worktree) holds 4001 and 9000. Then `tinacms build`, `tinacms build --local` and `pnpm build-local` die with "Datalayer server is busy on port 9000". It is not a code bug. Seen on 2026-11-11 in the AFK loop's #68 verification and the post-#113 merge check, both times held by `hero-piece-frames-preview-667242` (agent memory note on port 9000; `docs/afk/NOTES.md` line 738 has an earlier instance).

## The workaround

Run the build on free ports. This worked on 2026-11-11 (agent memory note):

```bash
pnpm exec tinacms build --local --skip-cloud-checks --port 4011 --datalayer-port 9011 -c "NODE_ENV=production next build"
```

For a parallel dev server:

```bash
pnpm exec tinacms dev --port <free> --datalayer-port <free> -c "next dev --turbopack -p <free>"
```

To see who holds a port without touching it:

```bash
lsof -nP -iTCP:9000 -sTCP:LISTEN
```

`package.json`'s `dev`, `build` and `build-local` scripts pass no port flags, and `scripts/afk/check.sh` didn't on 2026-11-11 (`docs/agents/orchestration.md` → Standing checks lists the fix as not yet made). An AFK-checks side worker was changing that the same day; check `scripts/afk/check.sh` for the current state.
