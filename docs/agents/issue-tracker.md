# Issue tracker: GitHub

PBIs for designbyalex.dev live as GitHub issues in this repo. Use the `gh` CLI, which infers the repo from `git remote -v`. The AFK loop (`scripts/afk-loop.sh`) reads these issues directly, so keep the shape below.

## Commands

- **Read:** `gh issue view <N> --json number,title,body,labels,state --comments`
- **List open PBIs:** `gh issue list --state open --json number,title,labels`
- **What the loop can take:** `gh issue list --label ready-for-agent --state open`
- **Comment:** `gh issue comment <N> --body "..."`
- **Label:** `gh issue edit <N> --add-label "..."` / `--remove-label "..."`
- **Close:** `gh issue close <N> --comment "<PR and sha>"` (the AFK batch PR closes its tickets when it merges)

## PBI id

The issue's own number, `#N`. Titles carry a series prefix: `P<n>:` for migration and polish work, `H<n>:` for the hero piece, and `PRD:` for a parent. For example: `#110 P34: Lucide for every icon`. Commits, branches and notes use `#N`.

## Filing a PBI

Take the next free P- or H-number from the open and closed titles. Then:

```bash
gh issue create --title "P<n>: <imperative summary>" --label ready-for-agent --body "$(cat <<'EOF'
<body in the PBI shape below>
EOF
)"
```

Add `ready-for-agent` only when the ticket is **Type: AFK** and needs nothing more from Alex. Add `post-cutover` for work that waits for #15, and `bug` for a defect. An open PBI that blocks it goes under `## Blocked by`. For a retrofit, write the new body to a temp file and run `gh issue edit <N> --body-file <tmp>`.

## Labels

- `ready-for-agent`: the AFK loop may take it (also needs **Type: AFK** and nothing open under `## Blocked by`).
- `post-cutover`: waits for the DNS cutover (#15).
- `bug`: a defect in something already built.

## PBI shape

```markdown
**<trivial-manual | trivial-agent | complex-agent>**  <one sentence of reasoning>

## Parent
- #<PRD>

## What to build
**Type: <AFK | HITL>.** <what and why, in Alex's words where he gave them>

## Where it lives
- Lane: <Site | Content | Hero piece | Off product>
- Page or route: </, /acacia, /mosurban, 404>
- Components or files: <paths>
- Tina collection and fields: <content/…, tina/…, or none>
- Tokens: <styles.css tokens it uses; a value with no token is a question for Alex>
- Check in: dark and light, at 1440, 768 and 390

## Acceptance criteria
- [ ] Concrete, checkable condition
- [ ] Alex accepts it on the batch review (for anything visible)

## Blocked by
- #<N>, or "None"
```

## Paths

- **Plan:** none; the ticket body is the plan.
- **DoD:** none; the acceptance criteria and the batch review cover it.
- **Long hand-back notes:** `docs/afk/NOTES.md` for loop batches, `docs/handbacks/<N>.md` otherwise.
- **PRDs:** GitHub issues titled `PRD: …` (#3, #46, #101).
- **Decisions:** on the issue they settle; lasting ones as an ADR in `docs/adr/`.

## When a skill says "publish to the issue tracker"

File a PBI as above.

## When a skill says "fetch the relevant ticket"

`gh issue view <N> --comments`.
