// The comparator command: extracts a Build origin at every Reference page × Checkpoint width (plus the
// gate config's extra routes, compared with the Reference 404) and prints its Gaps against the frozen
// Reference snapshot, after subtracting the Deviation list.
//
//   node scripts/parity/diff.ts <build-origin> [--page acacia,home] [--width 1440] [--json gaps.json] [--save dir]
//
// --json writes the Comparisons (the gate's input to the Baseline ratchet); --save keeps the Build snapshots.
// It reports and exits 0 whatever it finds: pass/fail is the gate's call (#50), not this command's.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { type Comparison, compare } from './compare.ts';
import { parseDeviations, parseGateConfig } from './config.ts';
import { extractPage, launchBrowser } from './extract.ts';
import { formatReport } from './report.ts';
import { BUILD_SECTIONS } from './sections.ts';
import { parseManifest, parsePageSnapshot } from './validate.ts';

const PARITY = new URL('../../parity/', import.meta.url);
const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, PARITY), 'utf8'));

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { page: { type: 'string' }, width: { type: 'string' }, json: { type: 'string' }, save: { type: 'string' } },
});
const [origin] = positionals;
if (!origin) {
  console.error('usage: node scripts/parity/diff.ts <build-origin> [--page acacia,home] [--width 1440] [--json gaps.json] [--save dir]');
  process.exit(2);
}
const list = (v: string | undefined) => (v ? v.split(',').map((s) => s.trim()) : null);
const pages = list(values.page);
const widths = list(values.width)?.map(Number) ?? null;

const manifest = parseManifest(readJson('reference/manifest.json'));
const config = parseGateConfig(readJson('gate-config.json'));
const deviations = parseDeviations(readJson('deviations.json'));

const targets = [
  ...manifest.captures.map((c) => ({ capture: c, path: c.path })),
  ...Object.entries(config.extraRoutes).flatMap(([path, page]) => manifest.captures.filter((c) => c.page === page).map((c) => ({ capture: c, path }))),
].filter(({ capture, path }) => (!pages || pages.includes(capture.page) || pages.includes(path)) && (!widths || widths.includes(capture.width)));

if (values.save) mkdirSync(values.save, { recursive: true });
const comparisons: Comparison[] = [];
const browser = await launchBrowser();
try {
  for (const { capture, path } of targets) {
    const reference = parsePageSnapshot(readJson(`reference/${capture.snapshot}`));
    const { snapshot: build } = await extractPage(browser, { url: new URL(path, origin).href, width: capture.width, sections: BUILD_SECTIONS });
    if (values.save)
      writeFileSync(
        join(values.save, `${path.replace(/^\/|\/$/g, '').replace(/\W+/g, '-') || 'home'}-${capture.width}.json`),
        `${JSON.stringify(build, null, 2)}\n`
      );
    comparisons.push(compare({ page: capture.page, reference, build, config, deviations }));
  }
} finally {
  await browser.close();
}

process.stdout.write(formatReport(comparisons));
if (values.json) writeFileSync(values.json, `${JSON.stringify(comparisons, null, 2)}\n`);
