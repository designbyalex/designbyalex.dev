# Environments

| Environment | URL | Served by | Verified |
|---|---|---|---|
| Branch preview | `https://designbyalexdev-git-<branch>-designbyalex.vercel.app` | Vercel | 2026-11-11: the Vercel bot's comment on PR #112 links `designbyalexdev-git-afk-migration-designbyalex.vercel.app`; `curl` on it returns 302 to Vercel SSO, while a made-up branch alias returns 404 |
| `main` | https://designbyalexdev.vercel.app | Vercel | 2026-11-11: `curl` returns 200, `server: Vercel`; it is also the repo's homepage URL in `gh repo view` |
| Production | https://designbyalex.dev | Framer, until cutover (#15) | 2026-11-11: `curl` returns 200, `server: Framer/a75ac78` |
| `www` | https://www.designbyalex.dev | Framer | 2026-11-11: `curl` returns 308 to `https://designbyalex.dev/` |

Notes:

- `<branch>` is the git branch with `/` turned into `-` (`afk/migration` → `afk-migration`). Vercel shortens very long branch names in the alias; check the bot's PR comment when a long one 404s. The shortening rule is `unverified` here.
- Branch previews sit behind Vercel deployment protection (SSO): an anonymous `curl` gets a 302 to `vercel.com/sso-api`, so open them in a browser signed in to Vercel. `main`'s alias is public. Checked 2026-11-11 with `curl`.
- `designbyalexdev-git-main-designbyalex.vercel.app` also exists and is protected like a preview (302 to SSO, 2026-11-11). Use designbyalexdev.vercel.app for `main`.
- Each deploy also gets a hashed URL (`designbyalex-<hash>-designbyalex.vercel.app`), listed in the GitHub deployment statuses (see [vercel.md](vercel.md)).
- Cutover is issue #15, "S11: DNS cutover at parity + redirects", OPEN on 2026-11-11 (`gh issue view 15`). Nothing goes to production without Alex's explicit yes.
- `lib/seo/site.ts` uses `NEXT_PUBLIC_SITE_URL` as the canonical origin and falls back to `https://designbyalex.dev` (read 2026-11-11).
