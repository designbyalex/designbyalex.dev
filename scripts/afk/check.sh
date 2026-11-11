#!/usr/bin/env bash
# The gate: Tina schema compile + generated types, tsc and biome on files changed since main.
#
#   scripts/afk/check.sh               # per-ticket gate
#   scripts/afk/check.sh --full        # final pass: also build-local + vitest
#
# The Tina step normally takes ~16 s but can hang. After AFK_TINA_TIMEOUT seconds (default 120) it is
# killed and run once more; a second hang fails the gate.
#
# Tina's local servers default to ports 4001 and 9000, which other sessions' `tinacms dev` often hold. The
# gate takes the first free ports from 4100 and 9100 instead (or TINA_PORT / TINA_DATALAYER_PORT if set) and
# exports them, so `pnpm build-local` uses the same pair.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
mkdir -p .afk

full=0
while [[ $# -gt 0 ]]; do
  case $1 in
    --full) full=1 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done
base=$(git merge-base origin/main HEAD)

step() { printf '\n▶ %s\n' "$1"; }
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

# listening <port>: is anything listening on it? Tina binds IPv6 ::1 only, so probe both loopbacks.
listening() { (: </dev/tcp/::1/"$1") 2>/dev/null || (: </dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
# free_port <start>: the first port from <start> up that nothing on this machine is listening on.
free_port() {
  local p=$1
  while listening "$p"; do p=$((p + 1)); done
  echo "$p"
}
export TINA_PORT=${TINA_PORT:-$(free_port 4100)}
export TINA_DATALAYER_PORT=${TINA_DATALAYER_PORT:-$(free_port 9100)}

tina_timeout=${AFK_TINA_TIMEOUT:-120}
step "tina: schema compile + generated types (ports $TINA_PORT, datalayer $TINA_DATALAYER_PORT)"
for try in 1 2; do
  with_timeout "$tina_timeout" pnpm exec tinacms build --local --skip-cloud-checks \
    --port "$TINA_PORT" --datalayer-port "$TINA_DATALAYER_PORT" >.afk/check-tina.log 2>&1 && rc=0 || rc=$?
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

if [[ $full == 1 ]]; then
  step "build-local (offline Tina + next build)"
  pnpm build-local
  step "vitest"
  pnpm test
fi

printf '\n✓ gate green%s\n' "$([[ $full == 1 ]] && echo ' (full)')"
