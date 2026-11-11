# Vercel

| Fact | Value | Verified |
|---|---|---|
| Team (scope) | `designbyalex` | 2026-11-11: the Vercel commit status on `main` links `vercel.com/designbyalex/designbyalex.dev/...` |
| Project | `designbyalex.dev` | same link |
| Dashboard | https://vercel.com/designbyalex/designbyalex.dev | same link |
| Git integration | GitHub `designbyalex/designbyalex.dev`; `main` deploys to Production, other branches to Preview | 2026-11-11: `gh api repos/designbyalex/designbyalex.dev/deployments` shows `vercel[bot]` deploys, Production for `main` commits (4fd792b, cae43ff) and Preview for branch commits (e460744) |
| Project and org IDs | `unverified` | no `.vercel/project.json` in this repo, the main checkout or `~/Freelance/Portfolio/afk-migration` on 2026-11-11 |
| Vercel CLI | not installed | `which vercel` found nothing on 2026-11-11 |

## Reading deploys without the CLI

These read-only `gh` commands worked on 2026-11-11:

```bash
gh api repos/designbyalex/designbyalex.dev/deployments --jq '.[0:5][] | {environment, ref, created_at}'
```

```bash
gh api repos/designbyalex/designbyalex.dev/commits/<sha>/statuses --jq '.[] | select(.context=="Vercel") | {state, target_url}'
```

```bash
gh api repos/designbyalex/designbyalex.dev/deployments/<id>/statuses --jq '.[0] | {state, environment_url}'
```

The Vercel bot also comments on each PR with its preview link.

## Env vars on Vercel

Which env vars the Vercel project sets is `unverified` (no CLI, and the dashboard needs Alex's sign-in). The names the code reads are in [tina.md](tina.md). Changing Vercel settings needs Alex's explicit yes.
