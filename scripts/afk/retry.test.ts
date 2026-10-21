import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const retrySh = join(__dirname, 'retry.sh');
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'afk-retry-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

// Runs `retry` under `set -euo pipefail`, as the loop does, with a stub that fails its first
// `failures` calls (exit 1, with gh's two-line "error connecting to api.github.com" on stderr) and then
// prints some JSON.
// `sleep` is stubbed to record each wait instead of waiting.
function run(failures: number, env: Record<string, string> = {}) {
  const script = `
    set -euo pipefail
    say() { echo "say: $*"; }
    sleep() { echo "slept $1"; }
    source "$RETRY_SH"
    stub() {
      local n=$(( $(cat "$DIR/calls" 2>/dev/null || echo 0) + 1 ))
      echo "$n" >"$DIR/calls"
      if (( n <= ${failures} )); then
        printf 'error connecting to api.github.com\ncheck your internet connection or https://githubstatus.com\n' >&2
        return 1
      fi
      echo '{"number": 55}'
    }
    if retry "gh issue view #55" stub; then
      echo "out: $RETRY_OUT"
    else
      echo "gave up: $RETRY_ERR"
    fi
    echo "calls: $(cat "$DIR/calls")"
  `;
  // The caller's AFK_NET_* would change the defaults under test.
  const { AFK_NET_TRIES: _tries, AFK_NET_DELAY: _delay, ...parent } = process.env;
  const r = spawnSync('bash', ['-c', script], {
    encoding: 'utf8',
    env: { ...parent, RETRY_SH: retrySh, DIR: dir, ...env },
  });
  expect(r.status).toBe(0);
  return r.stdout.trim().split('\n');
}

describe('retry', () => {
  it('returns the output of a command that succeeds first time, without waiting', () => {
    expect(run(0)).toEqual(['out: {"number": 55}', 'calls: 1']);
  });

  it('retries a failing command with doubling waits until it succeeds', () => {
    expect(run(3)).toEqual([
      'say:   gh issue view #55 failed (try 1/5: error connecting to api.github.com); retrying in 20s',
      'slept 20',
      'say:   gh issue view #55 failed (try 2/5: error connecting to api.github.com); retrying in 40s',
      'slept 40',
      'say:   gh issue view #55 failed (try 3/5: error connecting to api.github.com); retrying in 80s',
      'slept 80',
      'out: {"number": 55}',
      'calls: 4',
    ]);
  });

  it('gives up after the last try, with the last error, and no wait after it', () => {
    const lines = run(10);
    expect(lines.filter((l) => l.startsWith('slept'))).toEqual(['slept 20', 'slept 40', 'slept 80', 'slept 160']);
    expect(lines.slice(-2)).toEqual(['gave up: error connecting to api.github.com', 'calls: 5']);
  });

  it('honours AFK_NET_TRIES and AFK_NET_DELAY', () => {
    const lines = run(10, { AFK_NET_TRIES: '2', AFK_NET_DELAY: '3' });
    expect(lines.filter((l) => l.startsWith('slept'))).toEqual(['slept 3']);
    expect(lines.at(-1)).toBe('calls: 2');
  });

  it('succeeds on the last try', () => {
    expect(run(4).slice(-2)).toEqual(['out: {"number": 55}', 'calls: 5']);
  });
});
