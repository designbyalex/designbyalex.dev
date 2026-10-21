#!/usr/bin/env bash
# The gate: Tina schema compile + generated types, tsc, biome on files changed since main, then the
# Fidelity gate (scripts/parity/gate.ts: build-local → next start → extractor at 390/768/1440 →
# comparator → Baseline ratchet). The Fidelity gate's report, screenshot pairs and contact sheets go to
# .afk/parity/; on a pass it may rewrite parity/baseline.json, which is committed with the change.
#
#   scripts/afk/check.sh               # per-ticket gate, ratchet only
#   scripts/afk/check.sh --ticket 58   # per-ticket gate, also holding the ticket's `## Parity scope` to 0
#                                      #   (body from .afk/tickets/58.md, written by the loop, or gh)
#   scripts/afk/check.sh --no-gate     # quick check: skip the Fidelity gate (verification never skips it)
#   scripts/afk/check.sh --full        # final pass: also build-local + vitest; the gate reuses that build
#
# The Tina step normally takes ~16 s but can hang. After AFK_TINA_TIMEOUT seconds (default 120) it is
# killed and run once more; a second hang fails the gate.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
mkdir -p .afk

full=0
gate=1
ticket=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --full) full=1 ;;
    --no-gate) gate=0 ;;
    --ticket) ticket=${2:?--ticket needs an issue number or a file}; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done
base=$(git merge-base origin/main HEAD)

step() { printf '\n▶ %s\n' "$1"; }
say() { echo "$*"; }
# shellcheck source=scripts/afk/retry.sh
source scripts/afk/retry.sh

# Kill process $1 and everything under it (pnpm exec runs tinacms as a child).
kill_tree() {
  local child
  for child in $(pgrep -P "$1"); do kill_tree "$child"; done
  kill -TERM "$1" 2>/dev/null || true
}

# with_timeout <seconds> <command...>: run the command, killing it after <seconds>. Exit 124 on a timeout,
# else the command's own status.
with_timeout() {
  local secs=$1 pid dog rc
  shift
  rm -f .afk/timed-out
  "$@" &
  pid=$!
  # The marker is written before the kill, so it exists once `wait` returns. Output closed, so a lingering
  # sleep can't hold a pipe open.
  (sleep "$secs" && touch .afk/timed-out && kill_tree "$pid") >/dev/null 2>&1 &
  dog=$!
  wait "$pid" 2>/dev/null && rc=0 || rc=$?
  kill_tree "$dog"
  wait "$dog" 2>/dev/null || true
  if [[ -f .afk/timed-out ]]; then
    rm -f .afk/timed-out
    return 124
  fi
  return "$rc"
}

tina_timeout=${AFK_TINA_TIMEOUT:-120}
step "tina: schema compile + generated types"
for try in 1 2; do
  with_timeout "$tina_timeout" pnpm exec tinacms build --local --skip-cloud-checks >.afk/check-tina.log 2>&1 && rc=0 || rc=$?
  [[ $rc == 124 && $try == 1 ]] || break
  echo "⚠ tina build hung for ${tina_timeout}s (it normally takes ~16 s); killed it, running it once more"
done
if [[ $rc == 124 ]]; then
  tail -20 .afk/check-tina.log
  echo "✗ tina build hung: no result after ${tina_timeout}s, twice (AFK_TINA_TIMEOUT; full log: .afk/check-tina.log)"
  exit 1
elif [[ $rc != 0 ]]; then
  tail -40 .afk/check-tina.log
  echo "✗ tina build failed (full log: .afk/check-tina.log)"
  exit 1
fi
if ! git diff --quiet HEAD -- tina/tina-lock.json; then
  echo "ℹ tina/tina-lock.json changed: commit it with this change (a stale lock breaks TinaCloud indexing)"
fi

step "tsc"
pnpm exec tsc --noEmit

step "biome (changed files)"
changed=$(
  {
    git diff --name-only --diff-filter=ACMR "$base" -- '*.ts' '*.tsx'
    git ls-files --others --exclude-standard -- '*.ts' '*.tsx'
  } | sort -u
)
if [[ -n "$changed" ]]; then
  # shellcheck disable=SC2086 # paths have no spaces in this repo
  pnpm exec biome lint --no-errors-on-unmatched $changed
else
  echo "no changed .ts/.tsx files"
fi

gate_args=()
if [[ $full == 1 ]]; then
  step "build-local (offline Tina + next build)"
  pnpm build-local
  step "vitest"
  pnpm test
  gate_args+=(--skip-build)
fi

if [[ $gate == 1 ]]; then
  if [[ -n $ticket ]]; then
    ticket_file=$ticket
    if [[ $ticket =~ ^[0-9]+$ ]]; then
      ticket_file=.afk/tickets/$ticket.md
      if [[ ! -f $ticket_file ]]; then
        mkdir -p .afk/tickets
        if ! retry "gh issue view #$ticket" gh issue view "$ticket" --json body -q .body; then
          echo "✗ network unavailable: gh issue view #$ticket still failing ($RETRY_ERR)"
          exit 1
        fi
        printf '%s\n' "$RETRY_OUT" >"$ticket_file"
      fi
    fi
    gate_args+=(--ticket "$ticket_file")
  fi
  step "fidelity gate (build-local → next start → extract → compare → ratchet)"
  # Called directly, not through a package.json script: package.json isn't owner-only, this file is.
  node scripts/parity/gate.ts ${gate_args[@]+"${gate_args[@]}"}
fi

printf '\n✓ gate green%s\n' "$([[ $full == 1 ]] && echo ' (full)')$([[ $gate == 0 ]] && echo ' (without the Fidelity gate)')"
