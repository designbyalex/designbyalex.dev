# Tina

## Env var names

Names only. Values live in your local env file and in the Vercel project, never in the repo.

| Name | Used for | Verified |
|---|---|---|
| `NEXT_PUBLIC_TINA_CLIENT_ID` | Tina Cloud client ID (`clientId`) | `tina/config.tsx` line 9 and `.env.example`, 2026-11-11 |
| `TINA_TOKEN` | Tina Cloud read token (`token`) | `tina/config.tsx` line 14 and `.env.example`, 2026-11-11 |
| `NEXT_PUBLIC_TINA_BRANCH` | Branch override (`branch`), first choice | `tina/config.tsx` line 11 and `.env.example`, 2026-11-11 |

The branch resolves in this order (`tina/config.tsx` lines 10-13, read 2026-11-11): `NEXT_PUBLIC_TINA_BRANCH`, then `NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF` (set by Vercel), then `HEAD` (Netlify's, unused here).

`.env.example` also lists `VERCEL_ENV=preview` "to see the preview functionality" (read 2026-11-11).

## Copying env files into a worktree

Run `git check-ignore -v .env.local` in the source checkout first. Copy with `cp` only if it prints an ignore rule; if it doesn't, stop and tell the master. Never `git add -f` an env file. Reading one to list names is fine; never write a value anywhere.

## Tina Cloud and content

- Alex edits copy in Tina Cloud, which commits "TinaCMS content update" straight to `main` (`docs/agents/orchestration.md`, read 2026-11-11). Merge `origin/main` before every push.
- Media: Tina Cloud media store, `public/uploads` (`tina/config.tsx`, `media.tina`, read 2026-11-11).
- Admin builds to `public/admin` (`build.outputFolder`, read 2026-11-11).
- Collections: `Page`, `Project`, `Global` (`tina/config.tsx` schema, read 2026-11-11).
- CLI: `@tinacms/cli` ^4.0.2, `tinacms` ^3.14.4 (`package.json`, read 2026-11-11).

## Lock file

Every change under `tina/collection/` or `tina/fields/` ships with a regenerated `tina/tina-lock.json`. `tinacms build` (including `pnpm build-local`) rewrites it on CLI 4; commit the diff. A stale lock makes Tina Cloud indexing fail ("Unable to seed content/...") and the Vercel build stop at "Checking indexing process in TinaCloud". Source: the agent memory note on the lock, and repeated "`tina-lock.json` regenerated and committed" entries in `docs/afk/NOTES.md`; read 2026-11-11.

Ports for `tinacms dev` and `tinacms build` are in [ports.md](ports.md).
