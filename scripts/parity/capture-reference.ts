// ONE-OFF. Freezes the Reference snapshot of the Framer site into parity/reference/.
// Run once by the site owner while Framer still serves designbyalex.dev, then commit the output.
// Nothing in the unattended loop may run this (scripts/afk/settings.json denies it): after Cutover the
// domain serves the Build, and re-capturing would silently replace the Reference with the Build itself.
//
//   pnpm parity:capture-reference               # refuses if parity/reference/manifest.json exists
//   pnpm parity:capture-reference --overwrite   # owner only, and only while Framer is live
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { extractPage, launchBrowser } from './extract.ts';
import { REFERENCE_SECTIONS } from './sections.ts';
import { CHECKPOINT_WIDTHS, type PageSnapshot, SNAPSHOT_FORMAT } from './snapshot.ts';

const ORIGIN = 'https://designbyalex.dev';
const OUT = new URL('../../parity/reference/', import.meta.url);
const PAGES = [
  { key: 'home', path: '/' },
  { key: 'acacia', path: '/acacia' },
  { key: 'mosurban', path: '/mosurban' },
  { key: 'not-found', path: '/parity-reference-missing-page' },
] as const;
// Screenshots are a visual record, not the comparison itself, so they are downscaled to keep the
// committed Reference near 5 MB. JSON geometry stays at full CSS-px precision.
const SCREENSHOT_WIDTH: Record<number, number> = { 390: 390, 768: 768, 1440: 960 };
const JPEG_QUALITY = 0.6;

const { values } = parseArgs({ options: { overwrite: { type: 'boolean', default: false } } });
if (existsSync(new URL('manifest.json', OUT)) && !values.overwrite) {
  console.error('✗ parity/reference/ already holds a Reference snapshot. It is frozen: see parity/reference/README.md.');
  process.exit(1);
}

// Refuse anything that isn't Framer: after Cutover this origin serves the Build.
const assertReference = (key: string, s: PageSnapshot) => {
  const ok = key === 'not-found' ? s.status === 404 : s.status === 200 && s.generator?.startsWith('Framer');
  if (!ok) throw new Error(`${s.url} @${s.width} does not look like the Framer Reference site (status ${s.status}, generator ${s.generator})`);
};

const browser = await launchBrowser();
const browserName = `Google Chrome ${browser.version()}`;
const files: { name: string; data: string | Buffer }[] = [];
const entries = [];
try {
  for (const page of PAGES) {
    for (const width of CHECKPOINT_WIDTHS) {
      const t0 = Date.now();
      const { snapshot, screenshot } = await extractPage(browser, {
        url: ORIGIN + page.path,
        width,
        sections: REFERENCE_SECTIONS,
        screenshot: { width: SCREENSHOT_WIDTH[width], quality: JPEG_QUALITY },
      });
      assertReference(page.key, snapshot);
      const base = `${page.key}-${width}`;
      files.push({ name: `${base}.json`, data: `${JSON.stringify(snapshot, null, 2)}\n` });
      if (screenshot) files.push({ name: `${base}.jpg`, data: screenshot });
      entries.push({
        page: page.key,
        path: page.path,
        width,
        snapshot: `${base}.json`,
        screenshot: `${base}.jpg`,
        // Multiply snapshot CSS px by this to find a box in the screenshot.
        screenshotScale: Math.min(1, SCREENSHOT_WIDTH[width] / width),
        status: snapshot.status,
        pageHeight: snapshot.pageHeight,
        sections: snapshot.sections.map((s) => s.id),
      });
      console.log(
        `✓ ${base}: ${snapshot.status}, ${snapshot.sections.length} sections, ${snapshot.runs.length} runs, ${snapshot.media.length} media (${Date.now() - t0} ms)`
      );
    }
  }
} finally {
  await browser.close();
}

// Write only once every capture has succeeded, so a failed run never leaves a partial Reference.
mkdirSync(OUT, { recursive: true });
for (const f of files) writeFileSync(new URL(f.name, OUT), f.data);
const manifest = {
  format: SNAPSHOT_FORMAT,
  origin: ORIGIN,
  capturedAt: new Date().toISOString(),
  browser: browserName,
  captures: entries,
};
writeFileSync(new URL('manifest.json', OUT), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\nWrote ${files.length + 1} files to parity/reference/. Commit them; never re-capture.`);
