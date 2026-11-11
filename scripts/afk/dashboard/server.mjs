// Read-only live dashboard for the AFK loop. Reads the run's own files; never writes to the checkout.
//   node .afk/dashboard/server.mjs [/path/to/afk-migration] [port]
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const ROOT = process.argv[2] ?? '/Users/work/Freelance/Portfolio/afk-migration';
const PORT = Number(process.argv[3] ?? 4789);
const AFK = join(ROOT, '.afk');
const sh = (cmd, args, opts = {}) => {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000, ...opts });
  } catch {
    return '';
  }
};
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

// Issue titles: one `gh issue list` at startup, retried per request while gh is offline.
const titles = new Map();
const loadTitles = () => {
  const out = sh('gh', ['issue', 'list', '--state', 'all', '--limit', '200', '--json', 'number,title', '--jq', '.[] | "\\(.number)\\t\\(.title)"']);
  for (const line of out.split('\n').filter(Boolean)) {
    const [n, t] = line.split('\t');
    titles.set(Number(n), t.replace(/^P\d+:\s*/, ''));
  }
};
loadTitles();
const titleOf = (n) => {
  if (!titles.size) loadTitles();
  return titles.get(n) ?? `#${n}`;
};

// Queue: argv[4] ("94 95 89"), else AFK_TICKETS, else the loop script's default.
const queue = () => {
  const m = /TICKETS=\$\{AFK_TICKETS:-"([^"]+)"\}/.exec(read(join(ROOT, 'scripts/afk-loop.sh')));
  return (process.argv[4] ?? process.env.AFK_TICKETS ?? m?.[1] ?? '').split(/\s+/).filter(Boolean).map(Number);
};

// When the loop's output isn't tee'd into run.log, rebuild the same lines from the run's transcripts
// (.afk/logs/ticket-N-YYYYMMDD-HHMMSS-aK.jsonl) and its afk(#N) commits. Only transcripts started at or
// after SINCE (argv[5], "YYYYMMDD-HHMMSS") count, so older runs' files stay out.
const SINCE = process.argv[5] ?? null;
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
  const subjects = new Map(
    sh('git', ['log', '--format=%ct %s', 'origin/main..HEAD'])
      .split('\n')
      .map((l) => /^(\d+) (afk\(#(\d+)\):.*)$/.exec(l))
      .filter(Boolean)
      .map((m) => [Number(m[3]), { subject: m[2], t: new Date(Number(m[1]) * 1000) }])
  );
  const hms = (d) => d.toTimeString().slice(0, 8);
  const finalStarted = logs.some((f) => /^final-(\d{8}-\d{6})-a\d+\.jsonl$/.exec(f)?.[1] >= SINCE);
  const out = [];
  attempts.forEach((a, i) => {
    out.push(`[afk ${hms(stamp(a.at))}] ▶ ticket-${a.n}: attempt ${a.k}/2 (transcript: ${a.f})`);
    const result = read(join(ROOT, a.f))
      .split('\n')
      .filter((l) => l.includes('"type":"result"'))
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
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
  const get = (n) => (t[n] ??= { attempts: [], done: false, failed: false, cost: 0, turns: 0 });
  let current = null;
  let stopped = null;
  for (const line of lines) {
    let m;
    if ((m = /\] ▶ ticket-(\d+): attempt (\d+)\/(\d+) \(transcript: (.+?)\)/.exec(line))) {
      current = Number(m[1]);
      const d = /-(\d{8})-(\d{6})-a\d+\.jsonl$/.exec(m[4]);
      const start = d ? new Date(`${d[1].slice(0, 4)}-${d[1].slice(4, 6)}-${d[1].slice(6)}T${d[2].slice(0, 2)}:${d[2].slice(2, 4)}:${d[2].slice(4)}`) : null;
      get(current).attempts.push({ n: Number(m[2]), of: Number(m[3]), transcript: join(ROOT, m[4]), start, end: null, verify: null });
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

const etimeMs = (e) => {
  const [d, rest] = e.includes('-') ? e.split('-') : [0, e];
  const p = rest.split(':').map(Number);
  const s = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
  return (Number(d) * 86400 + s) * 1000;
};

// What is running right now, from the process table. Anchor on the interpreter: the agent's
// `claude -p` command line embeds the ticket prompt, which names these scripts.
function phase() {
  const ps = sh('ps', ['-axo', 'pid=,ppid=,etime=,command=']);
  const procs = ps
    .split('\n')
    .map((l) => /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => ({ pid: m[1], ppid: m[2], etime: m[3], cmd: m[4] }));
  const byPid = new Map(procs.map((p) => [p.pid, p]));
  const loop = procs.find((p) => /^(\S*\/)?bash scripts\/afk-loop\.sh/.test(p.cmd));
  const check = procs.find((p) => /^(\S*\/)?bash (\S*\/)?scripts\/afk\/check\.sh --ticket/.test(p.cmd));
  let gate = null;
  if (check) {
    const parent = byPid.get(check.ppid);
    const viaLoop = parent && /afk-loop\.sh/.test(parent.cmd);
    gate = { by: viaLoop ? 'loop verification' : loop ? "agent's own gate run" : 'manual gate run', etime: check.etime };
    const step = procs.find((p) => p.ppid === check.pid && !/^(caffeinate|tee|tail)/.test(p.cmd));
    gate.step = !step
      ? 'starting'
      : /tinacms/.test(step.cmd)
        ? 'Tina schema build'
        : /tsc/.test(step.cmd)
          ? 'tsc'
          : /biome/.test(step.cmd)
            ? 'biome'
            : /gate\.ts/.test(step.cmd)
              ? 'Fidelity gate'
              : step.cmd.slice(0, 60);
    if (gate.step === 'Fidelity gate') {
      const build = join(AFK, 'parity/build');
      const t0 = Date.now() - etimeMs(check.etime);
      const done = existsSync(build) ? readdirSync(build).filter((f) => f.endsWith('.json') && statSync(join(build, f)).mtimeMs >= t0) : [];
      const serving = procs.some((p) => /next start|next-server/.test(p.cmd));
      gate.detail = !serving && !done.length ? 'production build (Tina + next build)' : `extracting pages: ${done.length}/18`;
    }
  }
  return { loopAlive: !!loop, loopUptime: loop?.etime ?? null, gate };
}

// Gap total after each afk(#N) commit, from the committed Baseline.
const baselineCache = new Map();
function baselineTrend() {
  const commits = sh('git', ['log', '--reverse', '--format=%h %s', 'origin/main..HEAD']).trim().split('\n').filter(Boolean);
  const points = [['start', 'origin/main', 'origin/main']].concat(
    commits.map((c) => {
      const sha = c.split(' ')[0];
      const subject = c.slice(c.indexOf(' ') + 1);
      const n = /afk\(#(\d+)\)/.exec(subject)?.[1];
      return [n ? `#${n}` : sha, sha, subject];
    })
  );
  const out = [];
  for (const [label, ref, subject] of points) {
    const sha = sh('git', ['rev-parse', '--short', ref]).trim();
    if (!baselineCache.has(sha)) {
      let total = null;
      const dims = { Copy: 0, Media: 0, Layout: 0, Type: 0 };
      try {
        total = 0;
        for (const page of Object.values(JSON.parse(sh('git', ['show', `${sha}:parity/baseline.json`])).counts))
          for (const widths of Object.values(page.sections))
            for (const c of Object.values(widths))
              for (const [k, v] of Object.entries(c)) {
                total += v;
                dims[k] = (dims[k] ?? 0) + v;
              }
      } catch {
        total = null;
      }
      baselineCache.set(sha, { total, dims });
    }
    out.push({ label, subject, ...baselineCache.get(sha) });
  }
  // Only afk(#N) points and the start; a ticket with several commits shows once, at its last Baseline.
  const kept = out.filter((b) => b.label === 'start' || b.label.startsWith('#'));
  return kept.filter((b, i) => b.label !== kept[i + 1]?.label);
}

function sheets() {
  const dir = join(AFK, 'parity/sheets');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => a.f.localeCompare(b.f, 'en', { numeric: true }));
}

function status() {
  const run = parseRun();
  const q = queue();
  const ph = phase();
  const committed = new Set(
    sh('git', ['log', '--format=%s', 'origin/main..HEAD'])
      .split('\n')
      .map((s) => /^afk\(#(\d+)\)/.exec(s)?.[1])
      .filter(Boolean)
      .map(Number)
  );
  const rows = q.map((n) => {
    const tk = run.tickets[n] ?? { attempts: [], done: false, failed: false, cost: 0, turns: 0 };
    const state = tk.done ? 'done' : run.current === n && ph.loopAlive ? 'running' : committed.has(n) ? 'unverified' : tk.failed ? 'failed' : 'queued';
    return { n, title: titleOf(n), state, attempts: tk.attempts.length, cost: tk.cost, verify: tk.attempts.map((a) => a.verify).filter(Boolean) };
  });
  const cur = run.current && run.tickets[run.current]?.attempts.at(-1);
  const now = cur && ph.loopAlive ? activity(cur.transcript) : null;
  const doneCount = rows.filter((r) => r.state === 'done').length;
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
    stopped: ph.loopAlive ? null : (run.stopped ?? 'not running'),
    progress: { done: doneCount, total: q.length, avgTicketMs: avg, etaMs: avg ? avg * (q.length - doneCount) : null },
    cost: rows.reduce((a, r) => a + r.cost, 0),
    rows,
    current: now ? { n: run.current, title: titleOf(run.current), attempt: cur.n, of: cur.of, start: cur.start, agentDone: !!cur.agentDone, ...now } : null,
    baseline: baselineTrend(),
    sheets: sheets(),
    tail: run.tail,
  };
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/status') {
    let body;
    try {
      body = JSON.stringify(status());
    } catch (e) {
      body = JSON.stringify({ error: String(e?.stack ?? e) });
    }
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }).end(body);
  } else if (url.pathname.startsWith('/sheets/')) {
    const f = join(AFK, 'parity/sheets', decodeURIComponent(url.pathname.slice(8)).replace(/[/\\]/g, ''));
    if (!existsSync(f)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'no-store' }).end(readFileSync(f));
  } else {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(readFileSync(new URL('./index.html', import.meta.url)));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`AFK dashboard on http://127.0.0.1:${PORT}`));
