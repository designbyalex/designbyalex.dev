#!/usr/bin/env bash
# afk-loop.sh: work the migration's unattended tickets with no one at the keyboard.
#
# Each ticket gets a fresh `claude -p` run with clean context, built for speed:
# only the ~20s type check (scripts/afk/check.sh), no `next build`, no tests.
# After the last ticket, one deferred testing pass runs build-local + vitest +
# review. Then the branch is pushed once and opened as a draft PR, which is the
# only Vercel build of the whole run.
#
# Run from a checkout of branch afk/migration with a clean working tree:
#   scripts/afk-loop.sh
#
# Env:
#   AFK_TICKETS="9 10 11 12 13"  queue, in blocking order
#   AFK_MAX_ATTEMPTS=2           runs per ticket before stopping (retries see why the last run failed)
#   AFK_MODEL=                   passed through as `claude --model`
#   AFK_PUSH=1                   after the final pass, push + open a draft PR (0 = stop locally)
#   AFK_DRY_RUN=1                print what would run; change nothing
#   AFK_SMOKE=1                  check the permission allowlist with one cheap headless run, then exit
#
# Before the first run: `claude auth login` (headless runs need a logged-in CLI),
# then `AFK_SMOKE=1 scripts/afk-loop.sh`.
#
# Safe to re-run after a stop: finished work is detected by `afk(#N):` / `afk(final):` commits.
# Logs: .afk/logs/*.jsonl (full agent transcripts), .afk/verify.log (last gate output).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

BRANCH=afk/migration
TICKETS=${AFK_TICKETS:-"9 10 11 12 13"}
MAX_ATTEMPTS=${AFK_MAX_ATTEMPTS:-2}
PUSH=${AFK_PUSH:-1}
DRY=${AFK_DRY_RUN:-0}
DIR=scripts/afk
LOGS=.afk/logs

say() { printf '[afk %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
notify() { osascript -e "display notification \"$1\" with title \"AFK loop\"" >/dev/null 2>&1 || true; }
die() { say "✗ $*"; notify "Stopped: $*"; exit 1; }

# ── preflight ────────────────────────────────────────────────────────────────
[[ $(git branch --show-current) == "$BRANCH" ]] || die "not on branch $BRANCH"
[[ -z $(git status --porcelain) ]] || die "working tree not clean"
for c in claude gh pnpm jq; do command -v "$c" >/dev/null || die "missing command: $c"; done
if [[ $DRY != 1 && -z ${ANTHROPIC_API_KEY:-} ]] && ! claude auth status 2>/dev/null | jq -e .loggedIn >/dev/null; then
  die "claude CLI is not logged in. Run: claude auth login"
fi
git fetch -q origin main
[[ -d node_modules ]] || { say "installing dependencies"; pnpm install --frozen-lockfile; }
mkdir -p "$LOGS" .afk/cache

# A commit on this branch (since main) whose subject starts with $1.
has_commit() { git log --format=%s "$(git merge-base origin/main HEAD)..HEAD" | grep "^$1" >/dev/null; }

# claude -p with the AFK allowlist; full transcript to $2, one-line summary to stdout.
run_claude() {
  local prompt=$1 log=$2
  shift 2
  claude -p "$prompt" \
    --settings "$DIR/settings.json" \
    --permission-mode acceptEdits \
    --strict-mcp-config \
    --output-format stream-json --verbose \
    ${AFK_MODEL:+--model "$AFK_MODEL"} \
    "$@" >"$log" 2>&1 || true
  jq -r 'select(.type=="result") | "  agent: \(.subtype), \(.num_turns) turns, $\(.total_cost_usd // 0 | tostring)"' \
    "$log" 2>/dev/null | tail -1 || true
}

# Did the run finish properly? Marker commit, clean tree, gate green. Reason → .afk/verify.log.
verify() {
  local marker=$1 out=.afk/verify.log
  shift
  if ! has_commit "$marker"; then
    echo "No commit with a subject starting '$marker' was made." >"$out"
    return 1
  fi
  if [[ -n $(git status --porcelain) ]]; then
    { echo "Working tree not clean after your commit:"; git status --short; } >"$out"
    return 1
  fi
  "$DIR/check.sh" "$@" >"$out" 2>&1 || return 1
  if [[ -n $(git status --porcelain) ]]; then
    { echo "check.sh left uncommitted changes (likely tina/tina-lock.json); commit them:"; git status --short; } >"$out"
    return 1
  fi
}

feedback() {
  printf '\n## Your previous attempt failed verification\n\n'
  printf 'The loop script checked your last run, and it failed (output below). The working tree may still hold that '
  printf "run's changes: continue from them, fix the cause, and finish the remaining steps. If that run already "
  printf 'committed, add a follow-up commit with the same subject prefix.\n\n'
  printf '```\n%s\n```\n' "$(tail -60 .afk/verify.log)"
}

# Run one unit of work until it verifies, or give up and stop the loop.
#   attempt_unit <label> <marker> <prompt-template-text> <verify-args (string)> [claude args...]
attempt_unit() {
  local label=$1 marker=$2 tpl=$3 vargs=$4 fb="" attempt prompt log
  shift 4
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    prompt=${tpl//\{\{FEEDBACK\}\}/$fb}
    log="$LOGS/$label-$(date +%Y%m%d-%H%M%S)-a$attempt.jsonl"
    say "▶ $label: attempt $attempt/$MAX_ATTEMPTS (transcript: $log)"
    run_claude "$prompt" "$log" "$@"
    # shellcheck disable=SC2086 # vargs is empty or a single flag
    if verify "$marker" $vargs; then
      say "✓ $label: $(git log -1 --format=%s)"
      notify "$label done"
      return 0
    fi
    say "  verification failed: $(head -1 .afk/verify.log)"
    fb=$(feedback)
  done
  die "$label failed after $MAX_ATTEMPTS attempts. See $LOGS and .afk/verify.log; the working tree is left as-is"
}

# ── optional: prove the allowlist works headlessly, then exit ────────────────
if [[ ${AFK_SMOKE:-0} == 1 ]]; then
  say "permission smoke test (haiku). Expected: 1-6 RAN, 7-10 DENIED"
  # 3-4 fetch a real page and image: a bare-host fetch can pass while every /<path> fetch is denied.
  # 5 quotes its URL (as a query string forces), 6 resizes the image from 4.
  claude -p 'Permission smoke test. Run each command below exactly as written, one Bash call each, in order, even if one fails. Do nothing else. Then reply with one line per command: "<n>. RAN" or "<n>. DENIED".
1. git status --short
2. gh issue view 9 --json title -q .title
3. curl -fsSL https://designbyalex.dev/acacia -o .afk/cache/smoke.html
4. curl -fsSL https://framerusercontent.com/images/2aTwCHUSykoESjmoANhjXk4uY2o.png -o .afk/cache/smoke.png
5. curl -fsSL "https://framerusercontent.com/images/2aTwCHUSykoESjmoANhjXk4uY2o.png?scale-down-to=512" -o .afk/cache/smoke-quoted.png
6. sips -Z 256 .afk/cache/smoke.png --out .afk/cache/smoke-256.png
7. git push --dry-run origin afk/migration
8. gh issue comment 9 --body smoke-test
9. pnpm build-local
10. git checkout main' \
    --settings "$DIR/settings.json" --permission-mode acceptEdits --strict-mcp-config --model haiku \
    --disallowedTools "Bash(scripts/afk/check.sh --full:*)" "Bash(pnpm build-local:*)" "Bash(pnpm test:*)"
  exit 0
fi

# ── tickets ──────────────────────────────────────────────────────────────────
ticket_tpl=$(cat "$DIR/ticket.md")
for n in $TICKETS; do
  marker="afk(#$n):"
  if has_commit "$marker"; then say "✓ #$n already done"; continue; fi
  state=$(gh issue view "$n" --json state -q .state)
  if [[ $state != OPEN ]]; then say "· #$n is $state, skipping"; continue; fi
  issue=$(gh issue view "$n" --json number,title,body -q '"### #\(.number): \(.title)\n\n\(.body)"')
  if [[ $DRY == 1 ]]; then say "would run #$n: $(head -1 <<<"$issue")"; continue; fi

  tpl=${ticket_tpl//\{\{N\}\}/$n}
  tpl=${tpl//\{\{ISSUE\}\}/$issue}
  attempt_unit "ticket-$n" "$marker" "$tpl" "" \
    --disallowedTools "Bash(scripts/afk/check.sh --full:*)" "Bash(pnpm build-local:*)" "Bash(pnpm test:*)"
done

# ── deferred testing pass ────────────────────────────────────────────────────
if has_commit "afk(final):"; then
  say "✓ final pass already done"
elif [[ $DRY == 1 ]]; then
  say "would run the final testing pass, then $([[ $PUSH == 1 ]] && echo 'push + open a draft PR' || echo 'stop locally')"
  exit 0
else
  list=$(for n in $TICKETS; do printf '#%s ' "$n"; done)
  tpl=$(cat "$DIR/final.md")
  tpl=${tpl//\{\{TICKETS\}\}/${list% }}
  attempt_unit "final" "afk(final):" "$tpl" "--full"
fi

say "▶ independent full check before pushing"
"$DIR/check.sh" --full >.afk/final-check.log 2>&1 || die "full check failed. See .afk/final-check.log"
[[ -z $(git status --porcelain) ]] || die "full check left uncommitted changes"

# ── one push, one draft PR, one Vercel build ─────────────────────────────────
if [[ $PUSH != 1 ]]; then
  say "✓ all done locally (AFK_PUSH=0). Review docs/afk/NOTES.md, then push $BRANCH"
  notify "All done locally"
  exit 0
fi

git push -u origin "$BRANCH"
if gh pr view "$BRANCH" --json number >/dev/null 2>&1; then
  say "PR already open for $BRANCH"
else
  body=.afk/pr-body.md
  {
    echo "Unattended build of the migration tickets. **Draft until visually QA'd**: see the final checklist in the notes below."
    echo
    for n in $TICKETS; do echo "Closes #$n"; done
    echo
    cat docs/afk/NOTES.md
    echo
    echo "🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  } >"$body"
  gh pr create --draft --base main --head "$BRANCH" \
    --title "AFK: migration tickets $(echo "$TICKETS" | sed 's/^/#/; s/ /, #/g')" \
    --body-file "$body"
fi
say "✓ done. Draft PR open; the Vercel preview is the run's only build"
notify "Done: draft PR open"
