#!/usr/bin/env bash
# Start this checkout's AFK dashboard in the background and open it.
#
#   scripts/afk/dashboard/start.sh "<tickets>" <SINCE YYYYMMDD-HHMMSS> [loop pid]
#
# scripts/afk-loop.sh runs it after preflight with every batch (AFK_DASHBOARD=0 turns that off). It stops
# the dashboard this checkout started last (the pid in .afk/dashboard.pid, if that process is still this
# server) and no other process, takes the first free port from 4789 (AFK_DASHBOARD_PORT to start
# elsewhere), writes .afk/dashboard.pid and .afk/dashboard.url, and opens the page on macOS
# (AFK_DASHBOARD_OPEN=0 to skip). The server is read-only and keeps serving after the loop ends.
# Stop it with: kill "$(cat .afk/dashboard.pid)"
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
# shellcheck source=scripts/afk/ports.sh
source scripts/afk/ports.sh

tickets=${1:?usage: start.sh "<tickets>" <SINCE YYYYMMDD-HHMMSS> [loop pid]}
since=${2:?usage: start.sh "<tickets>" <SINCE YYYYMMDD-HHMMSS> [loop pid]}
loop_pid=${3:-}
server=scripts/afk/dashboard/server.mjs
pidf=.afk/dashboard.pid
urlf=.afk/dashboard.url
mkdir -p .afk

# Stop the last dashboard from this checkout, but only if the pid still belongs to it (pids get reused).
if [[ -f $pidf ]]; then
  old=$(<"$pidf")
  if [[ $old =~ ^[0-9]+$ && $(ps -p "$old" -o command= 2>/dev/null) == *"$server $PWD "* ]]; then
    kill "$old" 2>/dev/null || true
    for _ in $(seq 20); do kill -0 "$old" 2>/dev/null || break; sleep 0.1; done
    echo "stopped this checkout's previous dashboard (pid $old)"
  fi
  rm -f "$pidf" "$urlf"
fi

port=$(free_port "${AFK_DASHBOARD_PORT:-4789}")
url="http://127.0.0.1:$port"
# Its own process group (set -m), so Ctrl-C on the loop or closing its terminal tab leaves it serving.
set -m
# shellcheck disable=SC2086 # loop_pid is empty or one number
nohup node "$server" "$PWD" "$port" "$tickets" "$since" $loop_pid </dev/null >.afk/dashboard.log 2>&1 &
pid=$!
set +m
for _ in $(seq 50); do
  listening "$port" && break
  kill -0 "$pid" 2>/dev/null || break
  sleep 0.2
done
if ! listening "$port"; then
  kill "$pid" 2>/dev/null || true
  echo "✗ dashboard didn't start (see .afk/dashboard.log)"
  exit 1
fi
echo "$pid" >"$pidf"
echo "$url" >"$urlf"
echo "dashboard: $url (stop it: kill \"\$(cat .afk/dashboard.pid)\")"
if [[ $(uname) == Darwin && ${AFK_DASHBOARD_OPEN:-1} == 1 ]]; then open "$url" || true; fi
