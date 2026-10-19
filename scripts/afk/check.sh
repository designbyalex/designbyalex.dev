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
        gh issue view "$ticket" --json body -q .body >"$ticket_file"
      fi
    fi
    gate_args+=(--ticket "$ticket_file")
  fi
  step "fidelity gate (build-local → next start → extract → compare → ratchet)"
  pnpm --silent parity:gate ${gate_args[@]+"${gate_args[@]}"}
fi

printf '\n✓ gate green%s\n' "$([[ $full == 1 ]] && echo ' (full)')$([[ $gate == 0 ]] && echo ' (without the Fidelity gate)')"
