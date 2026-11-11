# Reference cache

Facts a session would otherwise rediscover. Each line says where it was checked and when. A fact that couldn't be checked is marked `unverified`. Credential names only, never values.

When a fact changes, fix it here and update its "verified" note. If you can't check it, mark it `unverified` rather than guessing.

| File | What it holds |
|---|---|
| [environments.md](environments.md) | Preview, main and production URLs, and who serves each |
| [vercel.md](vercel.md) | The Vercel team and project, and how to read deploys without the CLI |
| [tina.md](tina.md) | Tina env var names, branch resolution, the lock-file rule |
| [framer-pages.md](framer-pages.md) | The live Framer pages until cutover (#15) |
| [hero-piece-sources.md](hero-piece-sources.md) | Where the hero piece's scene, sources and backups live |
| [ports.md](ports.md) | Tina and Next ports on this shared machine, and the workaround |
| [gotchas.md](gotchas.md) | One line each: the Tina lock, Tailwind scanning docs |

All facts below were checked on 2026-11-11 against `main` at 4fd792b unless a line says otherwise.
