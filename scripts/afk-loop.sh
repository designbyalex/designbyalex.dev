#!/usr/bin/env bash
# afk-loop.sh: work the migration's unattended tickets with no one at the keyboard.
#
# Each ticket gets a fresh `claude -p` run with clean context. Its gate (scripts/afk/check.sh
# --ticket N) is the type/schema/lint check plus the Fidelity gate (scripts/parity/gate.ts): a local
# production build, extracted at 390/768/1440 and compared with the frozen Reference snapshot, then
# ratcheted against parity/baseline.json. The ticket's `## Parity scope` must reach 0 Gaps; no other
# count may rise. On a failure the gate's messages are the retry's feedback. No tests per ticket.
# After the last ticket, one deferred testing pass runs build-local + vitest + review. Then the
# branch is pushed once and opened as a draft PR, which is the only Vercel build of the whole run.
#
# Verification fails any run whose commits touch the owner-only files ($PROTECTED): the Deviation
# list, the gate config, the Reference snapshot, and the gate's own code (scripts/parity, scripts/afk,
# this script), so the agent being judged can't change its judge. It also fails a run that raises any
# count in parity/baseline.json above the Baseline the ticket started from, or drops one
# (scripts/parity/baseline-check.ts): only a passing gate lowers it. Agents propose Deviations in the notes.
#
# Run from a checkout of branch afk/migration with a clean working tree, on AC power with the lid open:
#   caffeinate -dis scripts/afk-loop.sh
# A run takes hours. On battery, closing the lid sleeps the Mac whatever caffeinate asks, and a dark wake
# has no network, so preflight stops on battery power (AFK_ALLOW_BATTERY=1 to run anyway). Every network
# call (gh, git fetch/push, pnpm install) retries with backoff for about 5 minutes before the run stops.
# Preflight fast-forwards the branch to origin/main, and stops if it has diverged.
#
# Every queued ticket passes the ticket guard (scripts/afk/ticket-guard.ts) first: it skips
# HITL tickets, tickets without the `ready-for-agent` label, and tickets with an open
# `## Blocked by` issue that wasn't finished earlier in this run. Each skip prints its reason.
#
# Env:
#   AFK_TICKETS="53 55 56 57 58 59 60 61 62 63 64 65 54 66"
#                                queue, in blocking order: the PRD #46 parity tickets; #54 and #66 are final sweeps
#   AFK_MAX_ATTEMPTS=2           runs per ticket before stopping (retries see why the last run failed)
#   AFK_MODEL=                   passed through as `claude --model`
#   AFK_PUSH=1                   after the final pass, push + open a draft PR (0 = stop locally)
#   AFK_DRY_RUN=1                print what would run; change nothing
#   AFK_SMOKE=1                  check the permission allowlist with one cheap headless run, then exit
#   AFK_ALLOW_BATTERY=1          run on battery power anyway (dry and smoke runs only warn)
#   AFK_NET_TRIES=5 AFK_NET_DELAY=20
#                                tries per network call, and the first wait in seconds (it doubles)
#
# Before the first run: `claude auth login` (headless runs need a logged-in CLI),
# then `AFK_SMOKE=1 scripts/afk-loop.sh`.
#
# Safe to re-run after a stop: finished work is detected by `afk(#N):` / `afk(final):` commits.
# Logs: .afk/logs/*.jsonl (full agent transcripts), .afk/verify.log (last gate output),
# .afk/parity/ (last Fidelity gate run: report, screenshot pairs, contact sheets).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

BRANCH=afk/migration
TICKETS=${AFK_TICKETS:-"53 55 56 57 58 59 60 61 62 63 64 65 54 66"}
MAX_ATTEMPTS=${AFK_MAX_ATTEMPTS:-2}
PUSH=${AFK_PUSH:-1}
DRY=${AFK_DRY_RUN:-0}
DIR=scripts/afk
LOGS=.afk/logs
# Owner-only (ADR 0002): an unattended commit that touches these fails verification. Gate changes are
# attended work.
PROTECTED=(parity/deviations.json parity/gate-config.json parity/reference scripts/parity scripts/afk scripts/afk-loop.sh)

say() { printf '[afk %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
notify() { osascript -e "display notification \"$1\" with title \"AFK loop\"" >/dev/null 2>&1 || true; }
die() { say "✗ $*"; notify "Stopped: $*"; exit 1; }

# shellcheck source=scripts/afk/retry.sh
source "$DIR/retry.sh"
# net <what> <command...>: retry a network command (scripts/afk/retry.sh); stop the run once it gives up.
# Its stdout is in RETRY_OUT.
net() { retry "$@" || die "network unavailable: $1 still failing after ${AFK_NET_TRIES:-5} tries ($RETRY_ERR)"; }

# ── preflight ────────────────────────────────────────────────────────────────
if [[ $(uname) == Darwin && $(pmset -g batt 2>/dev/null) == *"'Battery Power'"* ]]; then
  battery="on battery power: closing the lid will sleep the Mac and stop the run. Plug in, keep the lid open, and run \`caffeinate -dis scripts/afk-loop.sh\`"
  if [[ ${AFK_ALLOW_BATTERY:-0} == 1 || $DRY == 1 || ${AFK_SMOKE:-0} == 1 ]]; then
    say "⚠ $battery"
    notify "Warning: on battery power"
  else
    die "$battery (or set AFK_ALLOW_BATTERY=1)"
  fi
fi
# caffeinate execs the command in place and asserts from a helper "on behalf of" its pid.
[[ $(uname) != Darwin || $(pmset -g assertions 2>/dev/null) == *"on behalf of"*"(pid $$)"* ]] ||
  say "⚠ not running under caffeinate: idle sleep can stop the run. Use \`caffeinate -dis scripts/afk-loop.sh\`"
[[ $(git branch --show-current) == "$BRANCH" ]] || die "not on branch $BRANCH"
[[ -z $(git status --porcelain) ]] || die "working tree not clean"
for c in claude gh pnpm jq; do command -v "$c" >/dev/null || die "missing command: $c"; done
if [[ $DRY != 1 && -z ${ANTHROPIC_API_KEY:-} ]] && ! claude auth status 2>/dev/null | jq -e .loggedIn >/dev/null; then
  die "claude CLI is not logged in. Run: claude auth login"
fi
net "git fetch origin main" git fetch -q origin main
# Never build on a stale branch: fast-forward to origin/main, or stop if that isn't possible.
deps_changed=0
if git merge-base --is-ancestor origin/main HEAD; then
  say "$BRANCH is up to date with origin/main ($(git rev-list --count origin/main..HEAD) ahead)"
elif git merge-base --is-ancestor HEAD origin/main; then
  if [[ $DRY == 1 ]]; then
    say "would fast-forward $BRANCH to origin/main ($(git rev-parse --short origin/main))"
  else
    git diff --quiet HEAD origin/main -- pnpm-lock.yaml || deps_changed=1
    git merge -q --ff-only origin/main
    say "fast-forwarded $BRANCH to origin/main ($(git rev-parse --short HEAD))"
  fi
else
  die "$BRANCH has diverged from origin/main and can't fast-forward. Merge or rebase it by hand, then re-run"
fi
[[ -d node_modules && $deps_changed == 0 ]] || { say "installing dependencies"; net "pnpm install" pnpm install --frozen-lockfile; }
mkdir -p "$LOGS" .afk/cache .afk/tickets

# A commit on this branch (since main) whose subject starts with $1.
has_commit() { git log --format=%s "$(git merge-base origin/main HEAD)..HEAD" | grep "^$1" >/dev/null; }

# Tickets finished on this branch (since main): the numbers of its `afk(#N):` commits.
finished_tickets() { git log --format=%s "$(git merge-base origin/main HEAD)..HEAD" | sed -n 's/^afk(#\([0-9]*\)):.*/\1/p' | tr '\n' ' '; }

# Ticket guard for issue JSON $1 (from `gh issue view`), given finished tickets $2 and the
# $issue_states map. Exit 0 = run; exit 10 = skip, with the reasons on stdout.
ticket_guard() {
  jq -c --argjson states "$issue_states" --arg finished "$2" \
    '{body, labels: [.labels[].name], issueStates: $states, finished: ($finished | split(" ") | map(select(. != "") | tonumber))}' <<<"$1" |
    node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "$DIR/ticket-guard.ts"
}

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

# Owner-only files changed by this branch's commits since main, one per line.
protected_changes() { git diff --name-only "$(git merge-base origin/main HEAD)" HEAD -- "${PROTECTED[@]}"; }

# Counts in parity/baseline.json at HEAD that are above (or missing from) the Baseline at commit $1, one
# per line. Exit 0 = none; non-zero = raised (or the check crashed), with the reasons on stdout.
baseline_raised() {
  local before=.afk/baseline-before.json
  git show "$1:parity/baseline.json" >"$before" 2>/dev/null || rm -f "$before"
  node scripts/parity/baseline-check.ts "$before" parity/baseline.json 2>&1
}

# Did the run finish properly? Marker commit, clean tree, owner-only files untouched, gate green.
# Reason → .afk/verify.log.
verify() {
  local marker=$1 out=.afk/verify.log touched raised
  shift
  if ! has_commit "$marker"; then
    echo "No commit with a subject starting '$marker' was made." >"$out"
    return 1
  fi
  if [[ -n $(git status --porcelain) ]]; then
    { echo "Working tree not clean after your commit:"; git status --short; } >"$out"
    return 1
  fi
  touched=$(protected_changes)
  if [[ -n $touched ]]; then
    {
      echo "✗ Your commits modify owner-only Fidelity gate files, which an unattended run must never change:"
      sed 's/^/  /' <<<"$touched"
      echo "Restore them with \`git restore --source=origin/main -- <path>\` and commit that with the same subject prefix."
      echo "To propose a Deviation, add it under \"## Proposed deviations\" in docs/afk/NOTES.md instead."
    } >"$out"
    return 1
  fi
  if ! raised=$(baseline_raised "$UNIT_START"); then
    {
      echo "✗ Your commits raise parity/baseline.json above the Baseline this run started from ($(git rev-parse --short "$UNIT_START")):"
      sed 's/^/  /' <<<"$raised"
      echo "The Baseline may only go down, and only a passing Fidelity gate writes it. Restore it with"
      echo "\`git restore --source=$(git rev-parse --short "$UNIT_START") -- parity/baseline.json\`, close the Gaps instead, and commit."
    } >"$out"
    return 1
  fi
  "$DIR/check.sh" "$@" >"$out" 2>&1 || return 1
  if [[ -n $(git status --porcelain) ]]; then
    { echo "check.sh left uncommitted changes (tina/tina-lock.json, or parity/baseline.json after a passing Fidelity gate); commit them:"; git status --short; } >"$out"
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
  # The Baseline this unit must not raise: as committed before its first attempt.
  UNIT_START=$(git rev-parse HEAD)
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    prompt=${tpl//\{\{FEEDBACK\}\}/$fb}
    log="$LOGS/$label-$(date +%Y%m%d-%H%M%S)-a$attempt.jsonl"
    say "▶ $label: attempt $attempt/$MAX_ATTEMPTS (transcript: $log)"
    run_claude "$prompt" "$log" "$@"
    # shellcheck disable=SC2086 # vargs is empty, a flag, or a flag and its value
    if verify "$marker" $vargs; then
      say "✓ $label: $(git log -1 --format=%s)"
      notify "$label done"
      return 0
    fi
    say "  verification failed: $(grep -m1 '✗' .afk/verify.log || head -1 .afk/verify.log)"
    fb=$(feedback)
  done
  die "$label failed after $MAX_ATTEMPTS attempts. See $LOGS and .afk/verify.log; the working tree is left as-is"
}

# ── optional: prove the allowlist works headlessly, then exit ────────────────
if [[ ${AFK_SMOKE:-0} == 1 ]]; then
  say "permission smoke test (haiku). Expected: 1-8 RAN, 9-13 DENIED"
  # 3-4 fetch a real page and image: a bare-host fetch can pass while every /<path> fetch is denied.
  # 5 quotes its URL (as a query string forces), 6 resizes the image from 4.
  # 7 drives Playwright's system Chrome; 8 is the Fidelity gate (a local production build, served by
  # next start on a free port, extracted, compared and ratcheted) on one page and width. It takes a few
  # minutes. 13 must stay denied: the Reference snapshot is never re-captured.
  claude -p 'Permission smoke test. Run each command below exactly as written, one Bash call each, in order, with a Bash timeout of 600000, even if one fails. Do nothing else. Then reply with one line per command: "<n>. RAN" or "<n>. DENIED".
1. git status --short
2. gh issue view 9 --json title -q .title
3. curl -fsSL https://designbyalex.dev/acacia -o .afk/cache/smoke.html
4. curl -fsSL https://framerusercontent.com/images/2aTwCHUSykoESjmoANhjXk4uY2o.png -o .afk/cache/smoke.png
5. curl -fsSL "https://framerusercontent.com/images/2aTwCHUSykoESjmoANhjXk4uY2o.png?scale-down-to=512" -o .afk/cache/smoke-quoted.png
6. sips -Z 256 .afk/cache/smoke.png --out .afk/cache/smoke-256.png
7. pnpm parity:extract https://designbyalex.dev/parity-reference-missing-page --width 390 --out .afk/cache/smoke-extract.json
8. pnpm parity:gate --page not-found --width 390
9. git push --dry-run origin afk/migration
10. gh issue comment 9 --body smoke-test
11. pnpm build-local
12. git checkout main
13. pnpm parity:capture-reference' \
    --settings "$DIR/settings.json" --permission-mode acceptEdits --strict-mcp-config --model haiku \
    --disallowedTools "Bash(scripts/afk/check.sh --full:*)" "Bash(pnpm build-local:*)" "Bash(pnpm test:*)"
  exit 0
fi

# ── tickets ──────────────────────────────────────────────────────────────────
ticket_tpl=$(cat "$DIR/ticket.md")
# Every issue's state, fetched once, for the guard's `## Blocked by` check.
net "gh issue list" gh issue list --state all --limit 1000 --json number,state
issue_states=$(jq -c 'map({key: (.number | tostring), value: .state}) | from_entries' <<<"$RETRY_OUT")
# Finished this run. A dry run counts the tickets it would run, so later skips match a real run.
finished=$(finished_tickets)
for n in $TICKETS; do
  marker="afk(#$n):"
  if has_commit "$marker"; then say "✓ #$n already done"; continue; fi
  net "gh issue view #$n" gh issue view "$n" --json number,state,title,body,labels
  issue_json=$RETRY_OUT
  state=$(jq -r .state <<<"$issue_json")
  if [[ $state != OPEN ]]; then say "· skip #$n: it is $state"; continue; fi
  reason=$(ticket_guard "$issue_json" "$finished") && rc=0 || rc=$?
  case $rc in
    0) ;;
    10) say "· skip #$n: $reason"; continue ;;
    *) die "ticket guard crashed on #$n (exit $rc)" ;;
  esac
  issue=$(jq -r '"### #\(.number): \(.title)\n\n\(.body)"' <<<"$issue_json")
  if [[ $DRY == 1 ]]; then say "would run #$n: $(head -1 <<<"$issue")"; finished+=" $n"; continue; fi

  tpl=${ticket_tpl//\{\{N\}\}/$n}
  tpl=${tpl//\{\{ISSUE\}\}/$issue}
  # The gate reads the ticket's `## Parity scope` from here (scripts/afk/check.sh --ticket N).
  jq -r .body <<<"$issue_json" >".afk/tickets/$n.md"
  attempt_unit "ticket-$n" "$marker" "$tpl" "--ticket $n" \
    --disallowedTools "Bash(scripts/afk/check.sh --full:*)" "Bash(pnpm build-local:*)" "Bash(pnpm test:*)"
  finished+=" $n"
done

# Only finished tickets go into the final pass and the PR, never skipped ones.
read -ra done_tickets <<<"$finished"
if [[ ${#done_tickets[@]} == 0 ]]; then
  say "no tickets to run; stopping"
  exit 0
fi

# ── deferred testing pass ────────────────────────────────────────────────────
if has_commit "afk(final):"; then
  say "✓ final pass already done"
elif [[ $DRY == 1 ]]; then
  say "would run the final testing pass, then $([[ $PUSH == 1 ]] && echo 'push + open a draft PR' || echo 'stop locally')"
  exit 0
else
  list=$(printf '#%s ' "${done_tickets[@]}")
  tpl=$(cat "$DIR/final.md")
  tpl=${tpl//\{\{TICKETS\}\}/${list% }}
  attempt_unit "final" "afk(final):" "$tpl" "--full"
fi

say "▶ independent full check before pushing"
[[ -z $(protected_changes) ]] || die "commits on $BRANCH modify owner-only files: $(protected_changes | tr '\n' ' ')"
baseline_raised "$(git merge-base origin/main HEAD)" >.afk/baseline-check.log || die "commits on $BRANCH raise parity/baseline.json above main's. See .afk/baseline-check.log"
"$DIR/check.sh" --full >.afk/final-check.log 2>&1 || die "full check failed. See .afk/final-check.log"
[[ -z $(git status --porcelain) ]] || die "full check left uncommitted changes"

# ── one push, one draft PR, one Vercel build ─────────────────────────────────
if [[ $PUSH != 1 ]]; then
  say "✓ all done locally (AFK_PUSH=0). Review docs/afk/NOTES.md, then push $BRANCH"
  notify "All done locally"
  exit 0
fi

net "git push" git push -q -u origin "$BRANCH"
# NOTES.md outgrows GitHub's body limit over a run, so the body links to it and quotes the Proposed
# deviations and the last Final pass (scripts/afk/pr-body.ts).
net "gh repo view" gh repo view --json url -q .url
body=.afk/pr-body.md
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "$DIR/pr-body.ts" "$RETRY_OUT/blob/$BRANCH/docs/afk/NOTES.md" \
  "${done_tickets[@]}" <docs/afk/NOTES.md >"$body"
# Open PRs only: `gh pr view <branch>` also matches a merged or closed one. Retried as a whole: a create
# that reached GitHub before the connection dropped is found by the list.
open_pr() {
  local url
  url=$(gh pr list --head "$BRANCH" --state open --json url --jq '.[0].url // empty') || return
  if [[ -n $url ]]; then
    echo "PR already open for $BRANCH: $url"
    return 0
  fi
  url=$(gh pr create --draft --base main --head "$BRANCH" \
    --title "AFK: migration tickets $(printf '#%s, ' "${done_tickets[@]}" | sed 's/, $//')" \
    --body-file "$body") || return
  echo "draft PR open: ${url##*$'\n'}"
}
net "gh pr create" open_pr
say "✓ done. $RETRY_OUT. The Vercel preview is the run's only build"
notify "Done: draft PR open"
