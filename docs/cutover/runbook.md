# Cutover runbook (#15)

Moves designbyalex.dev from Framer (the Reference site) to Vercel (the Build), then retires Framer. It runs after the current AFK batch (#91, #92, #93, #110, #111) merges and Alex reviews it.

Every step on the domain, DNS, Vercel, Tina Cloud or Framer is **Alex's, in his own dashboards, on his explicit yes**. No agent changes any of them.

Supersedes the checklist comment on #15 from 2026-11-11 00:25 UTC. That comment is still right on the DNS and the steps; this file re-checks every fact, adds the HSTS outage window, analytics and Tina admin, and says where each fact came from.

Unless a line says otherwise, every check here ran on **2026-11-11, 18:15–18:35 AEDT**, from this machine, against Framer on `designbyalex.dev` and the Build on `designbyalexdev.vercel.app` (`main` at 410b84c, the latest Production deploy). `unverified` means it couldn't be checked from here.

## 1. Where things stand

| What | State | Checked |
|---|---|---|
| Production | `designbyalex.dev` served by Framer | `curl -sI`: `server: Framer/a75ac78` |
| `main` | `designbyalexdev.vercel.app` served by Vercel | `curl -sI`: `server: Vercel` |
| Registrar | Hosting Concepts B.V. d/b/a Registrar.eu (Hostinger's registrar backend), `client transfer prohibited` | RDAP at `pubapi.registry.google` |
| Domain expiry | 2027-02-17 | RDAP |
| DNS host | Hostinger: nameservers `ns1/ns2.dns-parking.com`, SOA contact `dns.hostinger.com`, SOA serial 2026110501 | `dig NS`, `dig SOA` |
| Redirects in the Build | `/home` → `/` (308), already merged | PR #98, merged 2026-11-11 (`next.config.ts`, `next.config.test.ts`) |
| `robots.txt` and `sitemap.xml` in the Build | served, already merged | #99, merged 2026-11-11; `curl` 200 on `main` |
| Analytics in the Build | `@vercel/analytics` (`<Analytics />` in `app/layout.tsx`) | `grep`; whether Web Analytics is switched on in the Vercel project is `unverified` |
| Analytics on Framer | Framer's own (`events.framer.com/script`) | `grep` on Framer's home HTML; it stops when Framer is cancelled |

## 2. URL inventory and redirect map

### What Framer serves

Sources: Framer's `/sitemap.xml` and `/robots.txt`, every `href` on `/`, `/acacia`, `/mosurban` and the 404, and a probe of likely paths.

| Path | Framer | Build (`main`) | Action |
|---|---|---|---|
| `/` | 200 | 200 | none |
| `/acacia` | 200 | 200 | none |
| `/mosurban` | 200 | 200 | none |
| `/#works` (home nav anchor) | anchor on `/` | `id="works"` on `/` | none |
| `/acacia/`, `/mosurban/` | 308 → no slash | 308 → no slash | none |
| `/ACACIA` | 404 | 404 | none (same on both) |
| `/robots.txt` | 200: `Allow: /` + sitemap line | 200: same rules | none |
| `/sitemap.xml` | 200: lists only `/` | 200: lists `/`, `/acacia`, `/mosurban` | none (the Build's is more complete) |
| `/favicon.ico` | 404 (icons live on `framerusercontent.com`) | 404 (icons at `/icon.svg`, `/apple-icon.png`) | none: no old icon URL is on the domain |
| unknown path (`/zz-404check`) | 404 | 404 | none |
| `/about`, `/cv`, `/resume`, `/work`, `/contact`, `/home`, `/blog`, `/projects`, `/404` | all 404 | `/home` 308 → `/` (Build-only duplicate), rest 404 | none |
| `/admin` | n/a | 200 (Tina admin, via rewrite to `/admin/index.html`) | none |
| `/styleguide` | n/a | 404 in production | none |

Host-level, all checked with `curl`:

- `https://www.designbyalex.dev/<path>` → 308 to `https://designbyalex.dev/<path>` on Framer. Vercel must do the same (step C2).
- `http://designbyalex.dev/<path>` → 308 to `https://`. Vercel does this by default (`unverified` until cutover).
- `.dev` is on the browser HSTS preload list, so browsers never use `http://` here anyway. Framer sends `strict-transport-security: max-age=31536000`; Vercel sends `max-age=63072000; includeSubDomains; preload`.

Anything ever indexed: the Wayback Machine's CDX API returned "Temporarily Offline" at 18:25 AEDT, so today's check is `unverified`. The 00:25 UTC comment on #15 reports that the Wayback Machine agreed with the sitemap and links: only `/`, `/acacia` and `/mosurban`.

Outbound links (CV on Google Drive, LinkedIn, Calendly on the case studies, the `mailto:` contact) are identical on both sites (`grep` on each page's `href`s). None depends on the domain.

### Share images and icons

| Page | Framer `og:image` | Build `og:image` |
|---|---|---|
| `/`, 404 | a PNG on `framerusercontent.com` | `https://designbyalex.dev/uploads/home/og.jpg`: 200 `image/jpeg` on `main` today, resolves on the domain once DNS moves |
| `/acacia` | same Framer PNG | Tina cover on `assets.tina.io` (`projects/acacia/hero.png`) |
| `/mosurban` | same Framer PNG | Tina cover on `assets.tina.io` (`projects/mosurban/hero.png`) |

Canonical and `og:url` use `https://designbyalex.dev` on both sites (the Build's home omits the trailing slash, which is the same URL). Social sites cache Framer's card until re-scraped (step D5).

### Proposed redirect map

**No change.** No Framer URL changes path, so none needs a redirect. The block already on `main` (from #98) stays as it is:

```ts
async redirects() {
  return [
    { source: '/home', destination: '/', permanent: true },
  ];
},
```

`next.config.test.ts` already guards that no redirect shadows `/`, `/acacia` or `/mosurban`. The `www` → apex redirect is a Vercel domain setting (step C2), not code.

## 3. DNS today and what survives

`dig @1.1.1.1` for each name and type, 18:28 AEDT.

| Name | Type | Value | TTL | At cutover |
|---|---|---|---|---|
| `@` | NS | `ns1.dns-parking.com`, `ns2.dns-parking.com` | 86400 | **keep**: don't change nameservers |
| `@` | A | `31.43.160.6`, `31.43.161.6` (Framer) | 60 | **replace** with Vercel's A record |
| `@` | AAAA | none | | nothing to remove |
| `@` | CAA | none | | nothing to change; any CA, Vercel's included, may issue |
| `www` | CNAME | `sites.framer.app` | 60 | **replace** with Vercel's CNAME |
| `@` | MX | `5 mx1.hostinger.com`, `10 mx2.hostinger.com` | 14400 | **keep: email** |
| `@` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | 3600 | **keep: email** |
| `_dmarc` | TXT | `v=DMARC1; p=none` | 3600 | **keep: email** |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com` (live DKIM key) | 300 | **keep: email** |
| `hostingermail-b._domainkey`, `hostingermail-c._domainkey` | CNAME | `hostingermail-b/c.dkim.mail.hostinger.com` (empty keys today) | 300 | **keep: email** |
| `autodiscover`, `autoconfig` | CNAME | `autodiscover/autoconfig.mail.hostinger.com` | 300 | **keep: email** |
| `_vercel` | TXT | none | | add only if Vercel asks (step C3) |

No TXT record verifies Google Search Console, and neither site has a `google-site-verification` meta tag (`dig TXT`, `grep`). Whether Alex uses Search Console is a question below. Other names may exist that `dig` can't list (a zone transfer isn't open); Hostinger's DNS records page is the full list. Screenshot it before step C4.

Only two records change: the apex A record(s) and the `www` CNAME. Everything else, email above all, stays.

## 4. Cutover steps

Each step marked **Alex's yes** is a dashboard action only Alex takes. An agent may run the read-only checks.

### A. Before the day

1. **Agent:** every issue under #15's Blocked by is closed (section 6), and the batch PR is merged.
2. **Agent:** the latest `main` Production deploy is Ready (`gh api repos/designbyalex/designbyalex.dev/deployments`, see `reference/vercel.md`).
3. **Alex:** spot-check https://designbyalexdev.vercel.app/ in both themes. It is what goes live.
4. **Alex:** pick a quiet hour. `.dev` is HSTS-preloaded, so browsers refuse plain `http` and block click-through on a certificate error: between the DNS switch and Vercel issuing the certificate, visitors who reach Vercel get an error, not Framer. Vercel usually issues within minutes (`unverified` here).

### B. Answer the open questions

Section 7. Search Console and Vercel Web Analytics change steps D6 and D7.

### C. Switch (about 20 min)

1. **Alex's yes.** Vercel → team `designbyalex` → project `designbyalex.dev` → Settings → Domains → Add `designbyalex.dev`. This can be done ahead of the day: Framer keeps serving until DNS changes.
2. **Alex's yes.** When Vercel offers it, add `www.designbyalex.dev` too, redirecting (308) to `designbyalex.dev`. That matches Framer's behaviour today. Both domains show Invalid Configuration until C4; the page lists the exact records to add.
3. **Alex's yes, only if asked.** If Vercel asks for a `_vercel` TXT verification record (it does when the domain is linked to another Vercel account), add it at Hostinger first.
4. **Alex's yes.** Hostinger hPanel → Domains → designbyalex.dev → DNS / Nameservers → DNS records. Screenshot the page first: that is the rollback.
   - Delete both `A @` records (`31.43.160.6`, `31.43.161.6`) and add the A record Vercel's Domains page shows for the apex, TTL 60. The 00:25 UTC comment on #15 read `216.198.79.1` and `64.29.17.1` from Vercel's API; `unverified` today (no Vercel CLI here). Go by the dashboard.
   - Edit `CNAME www` from `sites.framer.app` to the CNAME Vercel shows for `www`, TTL 60. The same comment read a project-specific `*.vercel-dns-017.com` value, with `cname.vercel-dns.com` as the generic fallback; `unverified` today.
   - Leave every MX, TXT, `_dmarc`, `_domainkey`, `autodiscover` and `autoconfig` record alone.
5. **Agent:** watch propagation. With TTL 60, most resolvers switch within about 5 minutes.

   ```bash
   dig +short designbyalex.dev @1.1.1.1; dig +short designbyalex.dev @8.8.8.8; dig +short www.designbyalex.dev @1.1.1.1
   ```

   Done when no line shows `31.43.x.x` or `sites.framer.app`.
6. **Alex:** Vercel → Domains shows Valid Configuration for both, and `www` shows the redirect.

### D. Smoke list (agent, read-only, right after C6)

1. Server and pages:

   ```bash
   curl -sI https://designbyalex.dev/ | grep -i '^server'   # server: Vercel
   ```

   ```bash
   for p in / /acacia /mosurban /robots.txt /sitemap.xml /uploads/home/og.jpg /admin; do printf '%s ' $p; curl -s -o /dev/null -w '%{http_code}\n' https://designbyalex.dev$p; done   # all 200
   ```

2. Redirects and errors:

   ```bash
   for u in https://designbyalex.dev/home https://designbyalex.dev/acacia/ https://www.designbyalex.dev/acacia https://www.designbyalex.dev/ http://designbyalex.dev/mosurban https://designbyalex.dev/nope; do printf '%s ' $u; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' $u; done
   ```

   Expect 308 to `/`, 308 to `/acacia`, 308 to `https://designbyalex.dev/acacia`, 308 to `https://designbyalex.dev/`, 308 to `https://designbyalex.dev/mosurban`, and 404.
3. Sitemap and canonical: `curl -s https://designbyalex.dev/sitemap.xml` lists the three pages on `https://designbyalex.dev`, and each page's `rel="canonical"` points at `designbyalex.dev`, not `vercel.app`.
4. Email survived: `dig +short designbyalex.dev MX` still shows `mx1/mx2.hostinger.com`, and `dig +short designbyalex.dev TXT` still shows the SPF line.
5. **Alex:** share cards. Paste `/`, `/acacia` and `/mosurban` into LinkedIn's Post Inspector; it shows the new card and clears LinkedIn's cached Framer card.
6. **Alex:** email. Send a message to the domain mailbox and reply from it (skip if the domain has no mailbox, see section 7).
7. **Alex:** Tina. Open https://designbyalex.dev/admin, sign in and open the home page without saving. If Tina Cloud refuses the origin, add `https://designbyalex.dev` to the Tina Cloud project's site URLs (**Alex's yes**: Tina Cloud setting). Whether that list needs it is `unverified`; the vercel.app admin keeps working either way.
8. **Alex, if used:** Vercel → project → Analytics shows page views from `designbyalex.dev`. Search Console: resubmit `https://designbyalex.dev/sitemap.xml`.
9. **Alex:** both themes on a phone, on mobile data, to confirm nobody is served Framer from a cached resolver.

### E. Rollback (any time before Framer is cancelled, about 5 min)

**Alex's yes.** At Hostinger, put the two records back from the C4 screenshot: delete the Vercel A record(s), re-add `A @ 31.43.160.6` and `A @ 31.43.161.6`, and set `CNAME www` back to `sites.framer.app`. With TTL 60, Framer serves again within minutes.

This only works while Framer still has the site published with `designbyalex.dev` connected. Don't remove the domain in Framer or cancel the plan until F. Leave the Vercel domains attached during a rollback; they go back to Invalid Configuration and do no harm.

### F. Retire Framer (about 10 min, a week later)

Filed as #119 (section 8).

1. Wait about 7 days after D passes, with no rollback.
2. **Agent:** re-run D1; `server: Framer` must not appear.
3. **Alex:** export anything to keep from the Framer project, including its analytics history if wanted (Framer's analytics stop at cancel).
4. **Alex's yes.** In Framer, remove the custom domain from the site, then unpublish and cancel or downgrade the site plan.
5. **Alex's yes, optional.** At Hostinger, raise the two new records' TTL from 60 to 3600.
6. Tick #15's acceptance criteria and close it.

## 5. After cutover (agent work)

- `reference/framer-pages.md` goes stale and `reference/environments.md`'s Production row changes to Vercel. Filed as #120 (section 8).
- `CONTEXT.md`'s Reference site entry ("until cutover") stays true as history; no change needed.
- Domain renewal is due 2027-02-17 at Registrar.eu/Hostinger (RDAP). Not part of the cutover; noted so it isn't missed.

## 6. #15's Blocked by, today

`gh issue view <N>` for each, 18:30 AEDT.

| Issue | State | Closed |
|---|---|---|
| #14 S10: Tina Cloud + Vercel preview deploy | closed | 2026-11-11 |
| #47 to #51 (P1 to P5, loop and Fidelity gate setup) | closed | 2026-10-19 |
| #52 P21: Parity sign-off | closed | 2026-11-10 |
| #53 to #67 (P6 to P20, parity build) | closed | 2026-10-21 |
| #68 P22, #69 P23 (motion) | closed | 2026-11-11 |
| #87 P24, #88 P25, #89 P26, #90 P27 (motion and hover) | closed | 2026-11-11 |
| #94 P29, #95 P30 | closed | 2026-11-11 |
| #99 sitemap and robots (a PR) | merged | 2026-11-11 |
| **#91 P28: Light-theme surfaces** | **open** | in the current AFK batch |
| **#92 P31: Portrait corners in plain CSS** | **open** | in the current AFK batch |
| **#93 P32: 404 redesign** | **open** | in the current AFK batch |

So 31 of 34 are done. The three open ones close when the batch PR merges. #110 and #111 are in the same batch but aren't on #15's list.

### Proposed #15 body changes

For the master to apply or pass on; this session doesn't edit #15.

- AC 1: "Redirects configured for any changed paths" is met by #98 (no Framer path changes; `/home` → `/`). Tick it.
- AC 2: "Parity review passed" is met by #52 (closed 2026-11-10), plus Alex's review of the current batch.
- Blocked by: trim to #91, #92, #93 (everything else is closed) and add the batch review.
- Add a line: "Steps: `docs/cutover/runbook.md`." Retiring Framer moves to its own ticket, so AC 4 can read "Framer retirement filed as #119".

## 7. Questions for Alex

One round. Each has a default the runbook assumes.

1. **Search Console.** Is designbyalex.dev in Google Search Console? No DNS or meta verification exists today. Default: no, so D8 skips it.
2. **Vercel Web Analytics.** Is it on for the project? The Build ships the component; without the dashboard toggle it records nothing. Default: leave as is, and D8 checks it if on.
3. **Email.** Is there a mailbox at the domain on Hostinger? MX, SPF, DKIM and DMARC point there. Default: yes, keep every mail record and run D6.
4. **Ticket flags.** Accept the two new tickets' flags (section 8)?

## 8. Tickets filed from this runbook

Both are post-cutover, not `ready-for-agent`, and wait on #15.

| Ticket | Flag | Type | What |
|---|---|---|---|
| #119 P36: Retire Framer after the cutover soak | `trivial-manual` | HITL | step F |
| #120 P37: Refresh reference/ after cutover | `trivial-agent` | AFK | section 5's first bullet |
