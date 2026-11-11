# Framer pages (until cutover)

The Reference site: designbyalex.dev, served by Framer until cutover (#15). It is the source of truth for "faithful" (`CONTEXT.md`). After cutover these URLs serve the new build and this file goes stale.

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
- To see the Build's version of the same page, swap the origin for designbyalexdev.vercel.app (`main`) or a branch preview ([environments.md](environments.md)).
