#!/usr/bin/env bash
# The gate: the cheap per-ticket check (~20s): Tina schema compile + generated types, tsc,
# and biome on files changed since main. No `next build`, no vitest.
#
#   scripts/afk/check.sh          # per-ticket gate
#   scripts/afk/check.sh --full   # final pass: also build-local + vitest
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
mkdir -p .afk

full=0
[[ "${1:-}" == "--full" ]] && full=1
base=$(git merge-base origin/main HEAD)

step() { printf '\n▶ %s\n' "$1"; }

step "tina: schema compile + generated types"
if ! pnpm exec tinacms build --local --skip-cloud-checks >.afk/check-tina.log 2>&1; then
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
