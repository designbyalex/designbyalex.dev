// The parity extractor: renders one URL at one Checkpoint width and returns its PageSnapshot.
// Works against any origin: the Reference site, Vercel production or a local server.
//
//   node scripts/parity/extract.ts <url> [--width 1440] [--sections build|reference] [--light] [--out snap.json] [--screenshot shot.jpg]
import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { type Browser, type Page, chromium } from 'playwright';
import { buildSnapshot } from './build-snapshot.ts';
import { collectInPage, contrastInPage, probeVideosInPage } from './collect.ts';
import { toSrgb } from './colour.ts';
import type { SectionRule } from './raw.ts';
import { BUILD_SECTIONS, REFERENCE_SECTIONS } from './sections.ts';
import { type CheckpointWidth, type PageSnapshot, VIEWPORT_HEIGHT } from './snapshot.ts';
import type { RunContrast } from './theme.ts';

export interface ExtractOptions {
  url: string;
  width: number;
  sections: SectionRule[];
  colorScheme?: 'dark' | 'light';
  /** Also take a full-page JPEG, downscaled to this width (default: the page width). */
  screenshot?: { width?: number; quality?: number };
  /** Also measure each text run's contrast against its rendered background (theme.ts). */
  contrast?: boolean;
}

export interface Extraction {
  snapshot: PageSnapshot;
  /** JPEG bytes when a screenshot was requested. */
  screenshot: Buffer | null;
  /** Per snapshot run, when contrast was requested. */
  contrast: (RunContrast | null)[] | null;
}

// Text made transparent everywhere, so a screenshot shows only what renders behind it. Transitions off, so a
// link's colour transition can't leave text half-faded when the shot is taken.
const HIDE_TEXT = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important;
  transition: none !important; }`;

// System Google Chrome, not Playwright's Chromium: Chromium lacks the H.264 codec, so it can't play the
// Framer videos and would misreport playback. The Reference and every Build run use the same browser.
export const launchBrowser = () => chromium.launch({ channel: 'chrome' });

const SCROLL_STEP_WAIT_MS = 150;
const VIDEO_WAIT_MS = 1500;
const SETTLE_MS = 1000;

export async function extractPage(browser: Browser, opts: ExtractOptions): Promise<Extraction> {
  const colorScheme = opts.colorScheme ?? 'dark';
  const viewport = { w: opts.width, h: VIEWPORT_HEIGHT[opts.width as CheckpointWidth] ?? 900 };
  const context = await browser.newContext({
    viewport: { width: viewport.w, height: viewport.h },
    deviceScaleFactor: 1,
    colorScheme,
    reducedMotion: 'reduce',
  });
  // The Build's theme toggle (next-themes) persists its choice here; the media query covers everything else.
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, colorScheme);

  try {
    const page = await context.newPage();
    const response = await page.goto(opts.url, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    // Full scroll-through so lazy media load and in-view reveals fire. The page can grow as it goes.
    for (let y = 0; y < (await page.evaluate(() => document.documentElement.scrollHeight)); y += Math.round(viewport.h / 2)) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(SCROLL_STEP_WAIT_MS);
    }
    await page.evaluate(probeVideosInPage, VIDEO_WAIT_MS);
    await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete), undefined, { timeout: 10_000 }).catch(() => {});
    // Back to the top by scrolling up, as a visitor would: a header that hides on scroll down only
    // comes back on an upward scroll, not on a jump.
    await page.evaluate((top) => window.scrollTo(0, top), viewport.h);
    await page.waitForTimeout(SCROLL_STEP_WAIT_MS);
    await page.mouse.move(viewport.w / 2, viewport.h / 2);
    await page.mouse.wheel(0, -2 * viewport.h);
    await page.waitForFunction(() => window.scrollY === 0, undefined, { timeout: 5_000 }).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(SETTLE_MS);

    const raw = await page.evaluate(collectInPage, opts.sections);
    const snapshot = buildSnapshot(raw, {
      url: opts.url,
      finalUrl: page.url(),
      width: opts.width,
      viewport,
      colorScheme,
      status: response?.status() ?? 0,
      capturedAt: new Date().toISOString(),
      browser: `Google Chrome ${browser.version()}`,
    });

    let screenshot: Buffer | null = null;
    if (opts.screenshot) {
      const png = await page.screenshot({ fullPage: true, type: 'png' });
      screenshot = await toJpeg(browser, png, opts.screenshot.width ?? opts.width, opts.screenshot.quality ?? 0.6);
    }
    let contrast: (RunContrast | null)[] | null = null;
    if (opts.contrast) {
      const style = await page.addStyleTag({ content: HIDE_TEXT });
      await page.waitForTimeout(SCROLL_STEP_WAIT_MS);
      const png = await page.screenshot({ fullPage: true, type: 'png' });
      await style.evaluate((el) => (el as Element).remove());
      const runs = snapshot.runs.map((r) => {
        const c = toSrgb(r.style.color);
        return { box: r.box, fg: c ? ([c[0], c[1], c[2], c[3] * r.opacity] as [number, number, number, number]) : null };
      });
      contrast = await inBlankPage(browser, (p) => p.evaluate(contrastInPage, { png: `data:image/png;base64,${png.toString('base64')}`, runs }));
    }
    return { snapshot, screenshot, contrast };
  } finally {
    await context.close();
  }
}

// Image work happens in a browser page, so the harness needs no image library.
async function inBlankPage<T>(browser: Browser, work: (page: Page) => Promise<T>): Promise<T> {
  const page = await browser.newPage();
  try {
    return await work(page);
  } finally {
    await page.close();
  }
}

// Downscale and re-encode in the browser itself.
async function toJpeg(browser: Browser, png: Buffer, width: number, quality: number): Promise<Buffer> {
  return inBlankPage(browser, async (page) => {
    const dataUrl = await page.evaluate(
      async ({ src, width, quality }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const scale = Math.min(1, width / img.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', quality);
      },
      { src: `data:image/png;base64,${png.toString('base64')}`, width, quality }
    );
    return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  });
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: 'string', default: '1440' },
      sections: { type: 'string', default: 'build' },
      light: { type: 'boolean', default: false },
      out: { type: 'string' },
      screenshot: { type: 'string' },
    },
  });
  const [url] = positionals;
  if (!url) {
    console.error(
      'usage: node scripts/parity/extract.ts <url> [--width 1440] [--sections build|reference] [--light] [--out snap.json] [--screenshot shot.jpg]'
    );
    process.exit(2);
  }
  const browser = await launchBrowser();
  try {
    const { snapshot, screenshot } = await extractPage(browser, {
      url,
      width: Number(values.width),
      sections: values.sections === 'reference' ? REFERENCE_SECTIONS : BUILD_SECTIONS,
      colorScheme: values.light ? 'light' : 'dark',
      screenshot: values.screenshot ? {} : undefined,
    });
    const json = `${JSON.stringify(snapshot, null, 2)}\n`;
    if (values.out) writeFileSync(values.out, json);
    else process.stdout.write(json);
    if (values.screenshot && screenshot) writeFileSync(values.screenshot, screenshot);
  } finally {
    await browser.close();
  }
}
