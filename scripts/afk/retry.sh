# retry.sh: retry a network command with backoff. Sourced by scripts/afk-loop.sh and scripts/afk/check.sh.
#
#   retry <what> <command...>
#
# Runs the command up to AFK_NET_TRIES times (default 5), waiting AFK_NET_DELAY seconds (default 20)
# before the second try and doubling each wait: 20 + 40 + 80 + 160 s, about 5 minutes in all. A dark
# wake or a dropped Wi-Fi shouldn't end a run that has been going for hours. Each retry is logged
# with `say`, which the caller defines. Returns 0 on the first success, 1 once the tries run out.
#
# The command's stdout is kept in RETRY_OUT, not printed. RETRY_ERR holds the first line of its last
# failure (stderr, or stdout when stderr was empty), for the caller's error message: that's where gh, git
# and curl say what went wrong ("error connecting to api.github.com"). The command can be a shell
# function, so a check-then-act step (is a PR open? if not, open one) retries as a whole.
retry() {
  local what=$1 tries=${AFK_NET_TRIES:-5} delay=${AFK_NET_DELAY:-20} try err rc
  shift
  err=$(mktemp)
  RETRY_OUT="" RETRY_ERR=""
  for ((try = 1; ; try++)); do
    if RETRY_OUT=$("$@" 2>"$err"); then
      rm -f "$err"
      return 0
    else
      rc=$?
    fi
    RETRY_ERR=$(grep -m1 -v '^[[:space:]]*$' "$err" || grep -m1 -v '^[[:space:]]*$' <<<"$RETRY_OUT" || true)
    RETRY_ERR=${RETRY_ERR:-exit $rc}
    if ((try >= tries)); then
      rm -f "$err"
      return 1
    fi
    say "  $what failed (try $try/$tries: $RETRY_ERR); retrying in ${delay}s"
    sleep "$delay"
    delay=$((delay * 2))
  done
}
