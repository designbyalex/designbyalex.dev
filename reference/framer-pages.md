# Framer pages (historical — cutover happened 2026-11-12)

**Historical.** The Reference site — designbyalex.dev served by Framer — no longer exists on the domain: cutover (#15) moved DNS to Vercel on 2026-11-12 (~12:35 AEDT), and these URLs now serve the Build ([environments.md](environments.md)). Checked 2026-11-12 ~14:20 AEDT from this machine: `curl -fsSL https://designbyalex.dev/ -D` returns `server: Vercel`, not Framer. The Framer project itself stays published, disconnected from the domain, as the rollback until #119 retires it (earliest 2026-11-19).

The table below is what Framer served, kept as history; its Verified column records pre-cutover checks. The cached page HTML in `.afk/cache/` and the copy/assets already migrated remain the source of truth for "faithful" (`CONTEXT.md`).

| Page | URL | Verified |
|---|---|---|
| Home | https://designbyalex.dev/ | 2026-11-11: `curl` 200, `server: Framer/a75ac78`, title "Alexander Blum \| UX • Product Design" |
| Acacia case study | https://designbyalex.dev/acacia | 2026-11-11: `curl` 200, Framer, same title |
| MOS Urban case study | https://designbyalex.dev/mosurban | 2026-11-11: `curl` 200, Framer, same title |
| 404 | any unknown path, for example https://designbyalex.dev/zz-404check | 2026-11-11: `curl` 404, Framer, title "Page Not Found \| Framer" |

Notes:

- `www.designbyalex.dev` redirects (308) to the bare domain (2026-11-11).
- Whether Framer serves other pages (an about page, a CV page) is `unverified`; only the four above were checked.
- Copy and assets from these pages are Alex's. Case-study assets for Acacia and MOS Urban come only from Alex.
- These URLs now serve the Build directly (2026-11-12, see above); for `main` pre-merge or a branch preview, use designbyalexdev.vercel.app or the branch alias ([environments.md](environments.md)).
