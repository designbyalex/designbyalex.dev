# Port helpers, sourced by scripts/afk/check.sh and scripts/afk/dashboard/start.sh.

# listening <port>: is anything listening on it? Tina binds IPv6 ::1 only, so probe both loopbacks.
listening() { (: </dev/tcp/::1/"$1") 2>/dev/null || (: </dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
# free_port <start>: the first port from <start> up that nothing on this machine is listening on.
free_port() {
  local p=$1
  while listening "$p"; do p=$((p + 1)); done
  echo "$p"
}
