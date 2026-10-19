// The Fidelity gate (PRD #46, ADR 0002): production build (offline Tina) → local `next start` → extractor at
// every Reference page × Checkpoint width → comparator → Baseline ratchet. The AFK loop runs it per ticket
// through scripts/afk/check.sh.
//
//   node scripts/parity/gate.ts [--ticket body.md] [--skip-build] [--page acacia] [--width 1440]
//
// --ticket   the ticket body; its `## Parity scope` lines must reach 0 Gaps
// --skip-build  serve the existing .next build (check.sh --full has just run build-local)
// --page / --width  a partial run, for a quick look: it reports and ratchets the pages it compared, and
//               never writes the Baseline
//
// Writes the run folder .afk/parity/ (gitignored, replaced each run): report.txt, gaps.json, counts.json,
// ratchet.json, shots/ (Reference and Build screenshots), sheets/ (per page and width, Reference left,
// Build right), sections/ (the same per Section) and server.log. On a full passing run it rewrites
// parity/baseline.json when the counts moved; commit it with the change.
//
// Exit 0 = pass, 1 = fail (the reasons and the Gap messages behind them are the last lines printed).
import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { type Comparison, compare } from './compare.ts';
import { parseDeviations, parseGateConfig, NO_SECTION, PAGE_SECTION } from './config.ts';
import { sideBySide } from './contact-sheet.ts';
import { extractPage, launchBrowser } from './extract.ts';
import { type Counts, countGaps, describeFailure, type Failure, formatBaseline, parseBaseline, parseParityScope, ratchet, type ScopeLine } from './ratchet.ts';
import { formatReport } from './report.ts';
import { BUILD_SECTIONS } from './sections.ts';
import type { PageSnapshot } from './snapshot.ts';
import { parityTargets, pathSlug } from './targets.ts';
import { parseManifest, parsePageSnapshot } from './validate.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const PARITY = join(ROOT, 'parity');
const BASELINE = join(PARITY, 'baseline.json');
const RUN = join(ROOT, '.afk/parity');
const SERVER_TIMEOUT_MS = 15 * 60_000;
/** Gap messages printed under each failure, and failures printed, so the loop's retry feedback stays short. */
const MESSAGES_PER_FAILURE = 4;
const FAILURES_SHOWN = 10;

const { values } = parseArgs({
  options: {
    ticket: { type: 'string' },
    'skip-build': { type: 'boolean', default: false },
    page: { type: 'string' },
    width: { type: 'string' },
  },
});
const list = (v: string | undefined) => (v ? v.split(',').map((s) => s.trim()) : null);
const pages = list(values.page);
const widths = list(values.width)?.map(Number) ?? null;
const partial = Boolean(pages || widths);

const started = Date.now();
const secs = (since: number) => `${Math.round((Date.now() - since) / 1000)}s`;
const say = (line: string) => console.log(line);
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

// Inputs first: a bad Parity scope or a malformed Baseline should fail in a second, not after the build.
let scope: ScopeLine[] = [];
try {
  if (values.ticket) scope = parseParityScope(readFileSync(values.ticket, 'utf8'));
} catch (e) {
  say(`✗ Fidelity gate: ${(e as Error).message}`);
  process.exit(1);
}
const manifest = parseManifest(readJson(join(PARITY, 'reference/manifest.json')));
const config = parseGateConfig(readJson(join(PARITY, 'gate-config.json')));
const deviations = parseDeviations(readJson(join(PARITY, 'deviations.json')));
const committed = existsSync(BASELINE) ? readFileSync(BASELINE, 'utf8') : null;
const baseline = committed === null ? null : parseBaseline(JSON.parse(committed));
const targets = parityTargets(manifest, config, { pages, widths });

rmSync(RUN, { recursive: true, force: true });
for (const dir of ['shots', 'sheets', 'sections', 'build']) mkdirSync(join(RUN, dir), { recursive: true });

say(`Parity scope: ${scope.length ? scope.map((l) => l.text).join('; ') : 'none (ratchet only)'}`);

// ---- Local production server -------------------------------------------------------------------------

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, () => {
      const { port } = s.address() as { port: number };
      s.close(() => resolve(port));
    });
  });

// `tinacms build --local -c` serves Tina's local GraphQL for as long as the command runs, which the
// production server needs for routes it renders on demand (the 404). Fresh ports keep it clear of a dev
// server. --skip-build reuses a build that baked in Tina's default port, so it keeps the defaults.
async function startServer(): Promise<{ origin: string; proc: ChildProcess }> {
  const port = await freePort();
  const tinaPorts = values['skip-build'] ? [] : ['--port', `${await freePort()}`, '--datalayer-port', `${await freePort()}`];
  const command = `${values['skip-build'] ? '' : 'NODE_ENV=production next build && '}next start -p ${port}`;
  const log = openSync(join(RUN, 'server.log'), 'w');
  const proc = spawn('pnpm', ['exec', 'tinacms', 'build', '--local', '--skip-cloud-checks', ...tinaPorts, '-c', command], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });
  const origin = `http://localhost:${port}`;
  let exited: number | null = null;
  proc.once('exit', (code) => {
    exited = code ?? -1;
  });
  const deadline = Date.now() + SERVER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (exited !== null) throw new Error(`the build or server exited (code ${exited}) before serving ${origin}`);
    const ok = await fetch(origin, { signal: AbortSignal.timeout(5_000) }).then(
      (r) => r.ok,
      () => false
    );
    if (ok) return { origin, proc };
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`no response from ${origin} within ${SERVER_TIMEOUT_MS / 60_000} minutes`);
}

function stopServer(proc: ChildProcess) {
  // The whole process group: pnpm, tinacms, its shell and next start.
  if (proc.pid && proc.exitCode === null) {
    try {
      process.kill(-proc.pid, 'SIGTERM');
    } catch {}
  }
}

// ---- Extraction, comparison and review images ------------------------------------------------------

const comparisons: Comparison[] = [];
const sectionsCompared = new Map<Comparison, string[]>();

/** The Reference Sections a comparison covers, plus the page-level and unsectioned buckets the Reference uses. */
const referenceSections = (ref: PageSnapshot) => {
  const ids = ref.sections.map((s) => s.id);
  ids.push(PAGE_SECTION);
  if ([...ref.runs, ...ref.links, ...ref.media].some((x) => x.section === null)) ids.push(NO_SECTION);
  return ids;
};

let server: { origin: string; proc: ChildProcess } | null = null;
const tServer = Date.now();
try {
  say(`▶ ${values['skip-build'] ? 'serving the existing build' : 'build-local (offline Tina + next build)'} → next start`);
  server = await startServer();
  say(`  serving ${server.origin} after ${secs(tServer)} (log: .afk/parity/server.log)`);

  const tExtract = Date.now();
  const browser = await launchBrowser();
  try {
    for (const { capture, path } of targets) {
      const slug = `${pathSlug(path)}-${capture.width}`;
      const reference = parsePageSnapshot(readJson(join(PARITY, 'reference', capture.snapshot)));
      const { snapshot: build, screenshot } = await extractPage(browser, {
        url: new URL(path, server.origin).href,
        width: capture.width,
        sections: BUILD_SECTIONS,
        // The Reference screenshot's scale, so the two sides line up px for px.
        screenshot: { width: Math.round(capture.width * capture.screenshotScale) },
      });
      writeFileSync(join(RUN, 'build', `${slug}.json`), `${JSON.stringify(build, null, 2)}\n`);
      const comparison = compare({ page: capture.page, reference, build, config, deviations });
      comparisons.push(comparison);
      sectionsCompared.set(comparison, referenceSections(reference));

      const refJpeg = readFileSync(join(PARITY, 'reference', capture.screenshot));
      const buildJpeg = screenshot!;
      writeFileSync(join(RUN, 'shots', `${slug}-reference.jpg`), refJpeg);
      writeFileSync(join(RUN, 'shots', `${slug}-build.jpg`), buildJpeg);
      const title = `${path} @${capture.width}`;
      writeFileSync(
        join(RUN, 'sheets', `${slug}.jpg`),
        await sideBySide(browser, { jpeg: refJpeg, label: `Reference ${title}` }, { jpeg: buildJpeg, label: `Build ${title}` })
      );
      const k = capture.screenshotScale;
      const crop = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k });
      for (const s of reference.sections) {
        const b = build.sections.find((x) => x.id === config.sectionMap[s.id]);
        if (!b || s.box.h < 1 || b.box.h < 1) continue;
        writeFileSync(
          join(RUN, 'sections', `${slug}--${s.id.replace(/\W+/g, '-').toLowerCase()}.jpg`),
          await sideBySide(
            browser,
            { jpeg: refJpeg, label: `Reference ${s.id} ${title}`, crop: crop(s.box) },
            { jpeg: buildJpeg, label: `Build data-section="${b.id}" ${title}`, crop: crop(b.box) }
          )
        );
      }
      say(`  ${title}: ${comparison.gaps.length} Gaps (${comparison.matched.runs}/${comparison.matched.of} runs matched)`);
    }
  } finally {
    await browser.close();
  }
  say(`  extracted ${targets.length} page × width targets in ${secs(tExtract)}`);
} catch (e) {
  say(`✗ Fidelity gate: ${(e as Error).message}`);
  say('  server log tail:');
  try {
    say(readFileSync(join(RUN, 'server.log'), 'utf8').trimEnd().split('\n').slice(-25).join('\n'));
  } catch {}
  process.exit(1);
} finally {
  if (server) stopServer(server.proc);
}

// ---- Report, ratchet, Baseline -------------------------------------------------------------------------

const counts = countGaps(comparisons, (c) => sectionsCompared.get(c) ?? []);
// A partial run is held to the Baseline only where it looked.
const compared = (b: Counts): Counts =>
  Object.fromEntries(
    Object.entries(b)
      .filter(([path]) => counts[path])
      .map(([path, p]) => [
        path,
        {
          page: p.page,
          sections: Object.fromEntries(
            Object.entries(p.sections).map(([s, w]) => [s, Object.fromEntries(Object.entries(w).filter(([width]) => widths?.includes(Number(width)) ?? true))])
          ),
        },
      ])
  );
const result = ratchet({ baseline: baseline && partial ? compared(baseline) : baseline, counts, scope });

const messagesFor = (f: Failure) =>
  comparisons
    .flatMap((c) => c.gaps)
    .filter((g) => g.path === f.path && g.section === f.section && g.width === f.width && g.dimension === f.dimension)
    .map((g) => g.message);

const totals = (path: string) =>
  [...new Set(comparisons.filter((c) => c.path === path).map((c) => c.width))]
    .map((w) => `@${w} ${comparisons.filter((c) => c.path === path && c.width === w).reduce((n, c) => n + c.gaps.length, 0)}`)
    .join(', ');
const summary = [...new Set(comparisons.map((c) => c.path))].map((path) => `  ${path}: ${totals(path)}`);

const verdict: string[] = [];
if (result.pass) {
  verdict.push(`✓ Fidelity gate passed: ${result.reason}`);
} else {
  verdict.push(`✗ Fidelity gate failed (${result.failures.length} ${result.failures.length === 1 ? 'failure' : 'failures'}):`);
  for (const f of result.failures.slice(0, FAILURES_SHOWN)) {
    verdict.push(`  ${describeFailure(f)}`);
    const messages = messagesFor(f);
    verdict.push(...messages.slice(0, MESSAGES_PER_FAILURE).map((m) => `    ${m}`));
    if (messages.length > MESSAGES_PER_FAILURE) verdict.push(`    … ${messages.length - MESSAGES_PER_FAILURE} more`);
  }
  if (result.failures.length > FAILURES_SHOWN) verdict.push(`  … ${result.failures.length - FAILURES_SHOWN} more failures`);
}

writeFileSync(join(RUN, 'gaps.json'), `${JSON.stringify(comparisons, null, 2)}\n`);
writeFileSync(join(RUN, 'counts.json'), formatBaseline(counts));
writeFileSync(join(RUN, 'ratchet.json'), `${JSON.stringify({ pass: result.pass, reason: result.reason, failures: result.failures }, null, 2)}\n`);
writeFileSync(join(RUN, 'report.txt'), `${formatReport(comparisons)}\n${verdict.join('\n')}\n${result.pass ? '' : `\nAll failures:\n${result.reason}\n`}`);

if (result.pass && !partial) {
  const next = formatBaseline(counts);
  if (next !== committed) {
    writeFileSync(BASELINE, next);
    verdict.push(`ℹ parity/baseline.json ${committed === null ? 'created' : 'updated'}: commit it with this change`);
  }
}
if (partial) verdict.push('ℹ partial run (--page/--width): the Baseline is not written');

say('Gaps per page:');
say(summary.join('\n'));
say(`Run folder: .afk/parity/ (report.txt, sheets/ Reference left · Build right, sections/, shots/). Wall time ${secs(started)}`);
say(verdict.join('\n'));
process.exit(result.pass ? 0 : 1);
