# Port helpers, sourced by scripts/afk/check.sh and scripts/afk/dashboard/start.sh.

# listening <port>: is anything listening on it? Tina binds IPv6 ::1 only, and /dev/tcp's ::1 probe
# depends on the bash build (macOS's 3.2 may resolve IPv4 only), so a ::1-only listener can read as
# "free" and the gate would reuse its port. lsof sees every bind on every address; /dev/tcp stays as
# the fallback for a machine without it.
listening() {
  if command -v lsof >/dev/null 2>&1; then
    [ -n "$(lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null)" ]
  else
    (: </dev/tcp/::1/"$1") 2>/dev/null || (: </dev/tcp/127.0.0.1/"$1") 2>/dev/null
  fi
}
# free_port <start>: the first port from <start> up that nothing on this machine is listening on.
free_port() {
  local p=$1
  while listening "$p"; do p=$((p + 1)); done
  echo "$p"
}
