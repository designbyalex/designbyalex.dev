# Gotchas

- **Tina lock.** Any Tina schema change ships a regenerated, committed `tina/tina-lock.json` (`tinacms build` writes it). A stale lock breaks Tina Cloud indexing and the Vercel build. Details in [tina.md](tina.md). Verified 2026-11-11 from the lock memory note and `docs/afk/NOTES.md`.
- **Tailwind scans docs.** Tailwind v4 runs with automatic source detection here (`styles.css` imports `tailwindcss` with no source restriction, checked 2026-11-11), so it reads every file git doesn't ignore, markdown included. Never paste a url-shaped arbitrary Tailwind background class into a markdown file: it becomes a real CSS rule, css-loader tries to resolve the url, and `next build` fails. Describe such classes in prose. Hit in #88 (agent memory note, read 2026-11-11).
- **Port 9000.** A busy datalayer port is a sibling session's server, not a bug. See [ports.md](ports.md).
- **`tinacms build --local` can hang** at "Indexing local files"; rerunning the same command fixed it (`docs/afk/NOTES.md` line 276, read 2026-11-11).
- **Branch previews need a Vercel sign-in.** An anonymous fetch gets a 302 to Vercel SSO. See [environments.md](environments.md).
