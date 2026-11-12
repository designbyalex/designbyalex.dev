# Environments

| Environment | URL | Served by | Verified |
|---|---|---|---|
| Branch preview | `https://designbyalexdev-git-<branch>-designbyalex.vercel.app` | Vercel | 2026-11-11: the Vercel bot's comment on PR #112 links `designbyalexdev-git-afk-migration-designbyalex.vercel.app`; `curl` on it returns 302 to Vercel SSO, while a made-up branch alias returns 404 |
| `main` | https://designbyalexdev.vercel.app | Vercel | 2026-11-11: `curl` returns 200, `server: Vercel`; it is also the repo's homepage URL in `gh repo view` |
| Production | https://designbyalex.dev | Vercel, since cutover 2026-11-12 (#15) | 2026-11-12 ~14:20 AEDT, from this machine: `curl -fsSL https://designbyalex.dev/ -D` returns HTTP/2 200, `server: Vercel`; `/acacia` and `/mosurban` likewise 200, Vercel |
| `www` | https://www.designbyalex.dev | Vercel, 308 to the apex | 2026-11-12: the cutover session's smoke on #15 ("Live on Vercel" comment) saw `www` on `/`, `/acacia` and `/mosurban` 308 to `https://designbyalex.dev/<path>`, 45/45 requests by 12:48 AEDT; not re-checked from this AFK sandbox (`www` isn't curl-allowlisted here) |

Notes:

- `<branch>` is the git branch with `/` turned into `-` (`afk/migration` → `afk-migration`). Vercel shortens very long branch names in the alias; check the bot's PR comment when a long one 404s. The shortening rule is `unverified` here.
- Branch previews sit behind Vercel deployment protection (SSO): an anonymous `curl` gets a 302 to `vercel.com/sso-api`, so open them in a browser signed in to Vercel. `main`'s alias is public. Checked 2026-11-11 with `curl`.
- `designbyalexdev-git-main-designbyalex.vercel.app` also exists and is protected like a preview (302 to SSO, 2026-11-11). Use designbyalexdev.vercel.app for `main`.
- Each deploy also gets a hashed URL (`designbyalex-<hash>-designbyalex.vercel.app`), listed in the GitHub deployment statuses (see [vercel.md](vercel.md)).
- Cutover (#15, "S11: DNS cutover at parity + redirects") ran 2026-11-12 ~12:35 AEDT and the issue CLOSED the same day on Alex's yes (`gh issue view 15`, 2026-11-12). Framer stays published off the domain as the rollback until #119 retires it after the 7-day soak (earliest 2026-11-19).
- `/home` 308s to `/` on the domain (the #98 redirect): checked 2026-11-12 ~14:20 AEDT with `curl -fsSL https://designbyalex.dev/home -D` from this machine.
- `lib/seo/site.ts` uses `NEXT_PUBLIC_SITE_URL` as the canonical origin and falls back to `https://designbyalex.dev` (read 2026-11-11).

## DNS changed at cutover (2026-11-12)

Exactly two records changed, both edited in hPanel at ~12:35 AEDT (#15's "Live on Vercel" comment); everything else — NS `ns1/ns2.dns-parking.com`, all MX/SPF/DMARC/DKIM/autodiscover mail records — was left alone and confirmed intact in the same session's D4 check at 12:47 AEDT.

| Record | Before (Framer) | After (Vercel) | TTL |
|---|---|---|---|
| `A @` | `31.43.160.6`, `31.43.161.6` | `216.198.79.1`, `64.29.17.1` | 60 |
| `CNAME www` | `sites.framer.app` | `8d4330a64f4ef3e4.vercel-dns-017.com` | 60 |

- Checked with `dig +short designbyalex.dev @1.1.1.1` (and `@8.8.8.8`, plus `dig +short www.designbyalex.dev @1.1.1.1`) in the cutover session: by 12:39 AEDT on 2026-11-12, `ns1`/`ns2.dns-parking.com`, 1.1.1.1 and 8.8.8.8 all returned only the Vercel values. `dig` is denied in this AFK sandbox, so the records are not re-checked here (2026-11-12); the apex serving `server: Vercel` (table above) is the indirect confirmation from this machine.
- Certificate: Let's Encrypt, CN `designbyalex.dev`, expires 2027-02-10; HTTPS up ~8 minutes after the switch (#15, 12:46 AEDT).
- Rollback (until #119): restore the two "Before" values at Hostinger — see `docs/cutover/runbook.md` §4 E.
