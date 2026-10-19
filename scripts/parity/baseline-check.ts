// Did a commit raise the Baseline? The AFK loop's verification runs this on parity/baseline.json as committed
// when the ticket started and as committed now (ratchet.ts, baselineRaised): an agent may lower counts, never
// raise one or drop a Section.
//
//   node scripts/parity/baseline-check.ts <before.json> <after.json>
//
// A missing <before.json> means there was no Baseline yet. Exit 0 = not raised. Exit 10 = raised, one line per
// count on stdout. Anything else is a crash.
import { existsSync, readFileSync } from 'node:fs';
import { baselineRaised, parseBaseline } from './ratchet.ts';

export const RAISED_EXIT = 10;

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) {
  console.error('usage: node scripts/parity/baseline-check.ts <before.json> <after.json>');
  process.exit(2);
}
const read = (path: string) => parseBaseline(JSON.parse(readFileSync(path, 'utf8')));
const before = existsSync(beforePath) ? read(beforePath) : null;
const after = existsSync(afterPath) ? read(afterPath) : {};
const raised = baselineRaised(before, after);
for (const r of raised)
  console.log(
    r.dimension
      ? `${r.path} ${r.section} @${r.width} ${r.dimension}: ${r.before} → ${r.after}`
      : `${r.path} ${r.section} @${r.width}: removed (it had ${r.before} Gaps)`
  );
process.exit(raised.length > 0 ? RAISED_EXIT : 0);
