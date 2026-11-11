// Read-only live dashboard for the AFK loop. Reads the run's own files and the process table; never
// writes to the checkout. scripts/afk-loop.sh starts it with every batch (scripts/afk/dashboard/start.sh).
//   node scripts/afk/dashboard/server.mjs [root] [port] ["<tickets>"] [SINCE YYYYMMDD-HHMMSS] [loop pid]
// root defaults to the checkout this file is in, port to 4789. With SINCE, progress is rebuilt from the
// run's transcripts (.afk/logs/ticket-*.jsonl, final-*.jsonl); without it, from .afk/run.log. With a loop
// pid, only that loop and its children count; without one, any `afk-loop.sh` on the machine does.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.argv[2] || fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '');
const PORT = Number(process.argv[3] || 4789);
const LOOP_PID = process.argv[6] || null;
const AFK = join(ROOT, '.afk');
const sh = (cmd, args, opts = {}) => {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, ...opts });
  } catch {
    return '';
  }
};
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// Issue titles: one `gh issue list` on the first request, retried per request while gh is offline.
const titles = new Map();
const loadTitles = () => {
  const out = sh('gh', ['issue', 'list', '--state', 'all', '--limit', '200', '--json', 'number,title', '--jq', '.[] | "\\(.number)\\t\\(.title)"']);
  for (const line of out.split('\n').filter(Boolean)) {
    const [n, t] = line.split('\t');
    titles.set(Number(n), t.replace(/^[PH]\d+:\s*/, ''));
  }
};
const titleOf = (n) => {
  if (!titles.size) loadTitles();
  return titles.get(n) ?? `#${n}`;
};

// Queue: argv[4] ("94 95 89"), else AFK_TICKETS, else the loop script's default.
const queue = () => {
  const m = /TICKETS=\$\{AFK_TICKETS:-"([^"]+)"\}/.exec(read(join(ROOT, 'scripts/afk-loop.sh')));
  return (process.argv[4] || process.env.AFK_TICKETS || m?.[1] || '').split(/\s+/).filter(Boolean).map(Number);
};

// afk(#N) commits on this branch since main: ticket number → { subject, time }.
const afkCommits = () =>
  new Map(
    sh('git', ['log', '--reverse', '--format=%ct %s', 'origin/main..HEAD'])
      .split('\n')
      .map((l) => /^(\d+) (afk\(#(\d+)\):.*)$/.exec(l))
      .filter(Boolean)
      .map((m) => [Number(m[3]), { subject: m[2], t: new Date(Number(m[1]) * 1000) }])
  );

// When the loop's output isn't tee'd into run.log, rebuild the same lines from the run's transcripts
// (.afk/logs/ticket-N-YYYYMMDD-HHMMSS-aK.jsonl) and its afk(#N) commits. Only transcripts started at or
// after SINCE (argv[5], "YYYYMMDD-HHMMSS") count, so older runs' files stay out.
const SINCE = process.argv[5] || null;
function runLines() {
  const runLog = join(AFK, 'run.log');
  if (!SINCE) return read(runLog).split('\n');
  const sinceMs = stamp(SINCE)?.getTime() ?? 0;
  if (existsSync(runLog) && statSync(runLog).mtimeMs >= sinceMs) return read(runLog).split('\n');
  const q = queue();
  const logs = existsSync(join(AFK, 'logs')) ? readdirSync(join(AFK, 'logs')) : [];
  const attempts = logs
    .map((f) => /^ticket-(\d+)-(\d{8}-\d{6})-a(\d+)\.jsonl$/.exec(f))
    .filter((m) => m && q.includes(Number(m[1])) && m[2] >= SINCE)
    .map((m) => ({ f: `.afk/logs/${m[0]}`, n: Number(m[1]), at: m[2], k: Number(m[3]) }))
    .sort((a, b) => a.at.localeCompare(b.at));
  const subjects = afkCommits();
  const hms = (d) => d.toTimeString().slice(0, 8);
  const finalStarted = logs.some((f) => /^final-(\d{8}-\d{6})-a\d+\.jsonl$/.exec(f)?.[1] >= SINCE);
  const out = [];
  // Committed before this run (a re-run after a stop): the loop prints these as already done.
  for (const n of q) if (subjects.has(n) && !attempts.some((a) => a.n === n)) out.push(`[afk --:--:--] ✓ #${n} already done`);
  attempts.forEach((a, i) => {
    out.push(`[afk ${hms(stamp(a.at))}] ▶ ticket-${a.n}: attempt ${a.k}/2 (transcript: ${a.f})`);
    const result = read(join(ROOT, a.f))
      .split('\n')
      .filter((l) => l.includes('"type":"result"'))
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter((r) => r?.type === 'result')
      .at(-1);
    if (result) out.push(`  agent: ${result.subtype}, ${result.num_turns} turns, $${result.total_cost_usd ?? 0}`);
    // The loop only moves on (to another ticket, or to the final pass) once a ticket has passed verification.
    const next = attempts[i + 1];
    const commit = subjects.get(a.n);
    const movedOn = next ? next.n !== a.n : finalStarted;
    if (commit && movedOn) {
      out.push(`[afk ${hms(commit.t)}] ✓ ticket-${a.n}: ${commit.subject}`);
    } else if (next && next.n === a.n) {
      out.push(`[afk ${hms(stamp(next.at))}]   verification failed: retried (gate output: .afk/verify.log)`);
    }
  });
  if (finalStarted) out.push('[afk --:--:--] final testing pass started (tickets done)');
  return out;
}
function stamp(s) {
  const d = /^(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)$/.exec(s);
  return d ? new Date(`${d[1]}-${d[2]}-${d[3]}T${d[4]}:${d[5]}:${d[6]}`) : null;
}

// run.log → per-ticket events. Times are HH:MM:SS; the transcript file name carries the date.
function parseRun() {
  const lines = runLines();
  const t = {};
  const get = (n) => {
    t[n] ??= { attempts: [], done: false, failed: false, cost: 0, turns: 0 };
    return t[n];
  };
  let current = null;
  let stopped = null;
  for (const line of lines) {
    let m = /\] ▶ ticket-(\d+): attempt (\d+)\/(\d+) \(transcript: (.+?)\)/.exec(line);
    if (m) {
      current = Number(m[1]);
      const d = /-(\d{8}-\d{6})-a\d+\.jsonl$/.exec(m[4]);
      get(current).attempts.push({ n: Number(m[2]), of: Number(m[3]), transcript: join(ROOT, m[4]), start: d ? stamp(d[1]) : null, end: null, verify: null });
      stopped = null;
    } else if ((m = /agent: (\w+), (\d+) turns, \$([\d.]+)/.exec(line)) && current) {
      const tk = get(current);
      tk.cost += Number(m[3]);
      tk.turns += Number(m[2]);
      const a = tk.attempts.at(-1);
      if (a) a.agentDone = true;
    } else if ((m = /\[afk (\d\d:\d\d:\d\d)\] ✓ ticket-(\d+): (.*)/.exec(line))) {
      const tk = get(Number(m[2]));
      tk.done = true;
      tk.subject = m[3];
      const a = tk.attempts.at(-1);
      if (a) {
        a.end = m[1];
        a.verify = 'pass';
      }
      current = null;
    } else if ((m = /\[afk (\d\d:\d\d:\d\d)\]\s+verification failed: (.*)/.exec(line)) && current) {
      const a = get(current).attempts.at(-1);
      if (a) {
        a.end = m[1];
        a.verify = m[2];
      }
    } else if ((m = /✓ #(\d+) already done/.exec(line))) {
      get(Number(m[1])).done = true;
    } else if ((m = /· skip #(\d+): (.*)/.exec(line))) {
      get(Number(m[1])).skipped = m[2];
    } else if ((m = /\] ✗ (.*)/.exec(line))) {
      stopped = m[1];
      if (current && /failed after/.test(m[1])) get(current).failed = true;
    } else if (/error connecting to api.github.com/.test(line)) {
      stopped = 'GitHub unreachable (network)';
    } else if (/draft PR|all done/.test(line)) {
      stopped = null;
    }
  }
  return { tickets: t, current, stopped, tail: lines.filter((l) => l.trim()).slice(-12) };
}

// The live transcript: recent tool calls with their descriptions.
function activity(file) {
  const out = [];
  let lastText = '';
  for (const line of read(file).split('\n')) {
    if (!line.startsWith('{"type":"assistant"')) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    const at = ev.timestamp ?? null;
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'text' && c.text?.trim()) lastText = c.text.trim();
      if (c.type !== 'tool_use') continue;
      const i = c.input ?? {};
      const what =
        i.description ??
        (i.file_path ? `${c.name} ${i.file_path.replace(`${ROOT}/`, '')}` : null) ??
        (i.pattern ? `${c.name} "${i.pattern}"` : null) ??
        (i.command ? i.command.slice(0, 120) : null) ??
        c.name;
      out.push({ at, tool: c.name, what });
    }
  }
  return { recent: out.slice(-14).reverse(), calls: out.length, lastText: lastText.slice(0, 600) };
}

// The gate step a check.sh process is on, from the newest of its descendants' command lines.
const GATE_STEPS = [
  [/vitest/, 'vitest'],
  [/build-local|next build/, 'build-local'],
  [/biome/, 'biome'],
  [/\btsc\b/, 'tsc'],
  [/tinacms/, 'Tina schema build'],
];

// What is running right now, from the process table. Anchor on the interpreter: the agent's
// `claude -p` command line embeds the ticket prompt, which names these scripts.
function phase() {
  const procs = sh('ps', ['-axo', 'pid=,ppid=,etime=,command='])
    .split('\n')
    .map((l) => /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => ({ pid: m[1], ppid: m[2], etime: m[3], cmd: m[4] }));
  const children = (pid) => procs.filter((p) => p.ppid === pid);
  const descendants = (pid) => children(pid).flatMap((c) => [c, ...descendants(c.pid)]);
  const isLoop = (p) => /^(\S*\/)?bash (\S*\/)?scripts\/afk-loop\.sh/.test(p.cmd);
  const isCheck = (p) => /^(\S*\/)?bash (\S*\/)?scripts\/afk\/check\.sh( --full)?\s*$/.test(p.cmd);
  const loop = LOOP_PID ? procs.find((p) => p.pid === LOOP_PID && isLoop(p)) : procs.find(isLoop);
  const scope = LOOP_PID ? (loop ? descendants(loop.pid) : []) : procs;
  // check.sh's watchdog is a forked copy of check.sh: take the outermost one.
  const check = scope.find((p) => isCheck(p) && !isCheck(procs.find((q) => q.pid === p.ppid) ?? { cmd: '' }));
  let gate = null;
  if (check) {
    const parent = procs.find((p) => p.pid === check.ppid);
    const full = /--full\s*$/.test(check.cmd);
    const viaLoop = parent && isLoop(parent);
    const by = viaLoop ? (full ? 'loop full check' : 'loop verification') : loop ? "agent's own gate run" : 'manual gate run';
    const cmds = descendants(check.pid)
      .filter((p) => !isCheck(p))
      .map((p) => p.cmd);
    const step = GATE_STEPS.find(([re]) => cmds.some((c) => re.test(c)))?.[1] ?? 'starting';
    gate = { by, step, full, etime: check.etime };
  }
  return { loopAlive: !!loop, loopUptime: loop?.etime ?? null, gate };
}

function status() {
  const run = parseRun();
  const q = queue();
  const ph = phase();
  const committed = afkCommits();
  const rows = q.map((n) => {
    const tk = run.tickets[n] ?? { attempts: [], done: false, failed: false, cost: 0, turns: 0 };
    const state = tk.done
      ? 'done'
      : run.current === n && ph.loopAlive
        ? 'running'
        : committed.has(n)
          ? 'unverified'
          : tk.failed
            ? 'failed'
            : tk.skipped
              ? 'skipped'
              : 'queued';
    return {
      n,
      title: titleOf(n),
      state,
      skipped: tk.skipped ?? null,
      attempts: tk.attempts.length,
      cost: tk.cost,
      verify: tk.attempts.map((a) => a.verify).filter(Boolean),
    };
  });
  const cur = run.current && run.tickets[run.current]?.attempts.at(-1);
  const now = cur && ph.loopAlive ? activity(cur.transcript) : null;
  const doneCount = rows.filter((r) => r.state === 'done').length;
  const toRun = rows.filter((r) => r.state !== 'skipped').length;
  const durations = q
    .map((n) => run.tickets[n])
    .filter((t) => t?.done && t.attempts[0]?.start && t.attempts.at(-1)?.end)
    .map((t) => {
      const s = t.attempts[0].start;
      const [h, m, sec] = t.attempts.at(-1).end.split(':').map(Number);
      const e = new Date(s);
      e.setHours(h, m, sec);
      if (e < s) e.setDate(e.getDate() + 1);
      return e - s;
    });
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  return {
    now: new Date().toISOString(),
    branch: sh('git', ['branch', '--show-current']).trim(),
    head: sh('git', ['log', '-1', '--format=%h %s']).trim(),
    power: /AC Power/.test(sh('pmset', ['-g', 'batt'])) ? 'AC' : 'battery',
    loop: ph,
    stopped: ph.loopAlive ? null : run.stopped,
    progress: { done: doneCount, total: toRun, avgTicketMs: avg, etaMs: avg && ph.loopAlive ? avg * (toRun - doneCount) : null },
    cost: rows.reduce((a, r) => a + r.cost, 0),
    rows,
    current: now ? { n: run.current, title: titleOf(run.current), attempt: cur.n, of: cur.of, start: cur.start, agentDone: !!cur.agentDone, ...now } : null,
    tail: run.tail,
  };
}

const page = readFileSync(new URL('./index.html', import.meta.url));
createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/status') {
    let body;
    try {
      body = JSON.stringify(status());
    } catch (e) {
      body = JSON.stringify({ error: String(e?.stack ?? e) });
    }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(body);
  } else if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(page);
  } else {
    res.writeHead(404).end();
  }
}).listen(PORT, '127.0.0.1', () => console.log(`AFK dashboard on http://127.0.0.1:${PORT} (root ${ROOT})`));
