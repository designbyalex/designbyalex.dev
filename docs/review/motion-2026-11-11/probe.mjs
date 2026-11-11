// Probe for the motion-review fixes on #112 (2026-11-11): the case-study hero
// entrance on a cold first visit and a client-side navigation, and the home
// header before hydration.
//
//   pnpm exec next start -p 3211   # a production build
//   node docs/review/motion-2026-11-11/probe.mjs [baseUrl] [outDir]
//
// A one-off record of how this folder was made, not project tooling: Playwright
// left the devDependencies with the Fidelity gate (#113). Add it for a run
// (pnpm add -D playwright@1.56.1) and drop it again after.
//
// Every run uses a fresh browser context (cold cache) with 4x CPU throttling and
// a Fast-4G-like network, records video, and measures the band reveal from the
// video frames (what the compositor painted, not main-thread samples): the share
// of the hero band showing image rather than mask, frame by frame. A smooth
// reveal climbs in small steps every frame. The old motion/react version held the
// band covered until hydration (about 2.7s here), then ran a main-thread tween
// that long tasks could stall.
// Writes frame strips (JPEG), screenshots and a summary (JSON) to outDir.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:3211';
const out = process.argv[3] ?? 'docs/review/motion-2026-11-11';
mkdirSync(out, { recursive: true });

const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];
const THEMES = ['dark', 'light'];
const FPS = 25;

async function throttle(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 60,
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (2 * 1024 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

async function newContext(browser, { width, height, theme, video, js = true, reducedMotion = 'no-preference' }) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion,
    javaScriptEnabled: js,
    ...(video ? { recordVideo: { dir: video, size: { width, height } } } : {}),
  });
  // next-themes follows the system scheme by default; pin the stored theme too.
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('theme', t);
    } catch {}
  }, theme);
  return context;
}

/** The hero band's box in CSS px, measured once the page has settled. */
async function bandBox(page) {
  return page.evaluate(() => {
    const mask = document.querySelector('.hero-mask');
    const box = mask?.parentElement?.getBoundingClientRect();
    const top = window.innerWidth >= 1280 ? 350 : box.top;
    return { x: Math.round(box.left + box.width * 0.5), top: Math.round(top), bottom: Math.round(Math.min(box.bottom, window.innerHeight)) };
  });
}

/** Share of a 1px column in [top, bottom) that differs from the page colour, per video frame. */
function revealCurve(videoPath, band, theme) {
  const frames = join(out, '.frames');
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames);
  const height = band.bottom - band.top;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-i', videoPath, '-vf', `fps=${FPS},format=gray,crop=1:${height}:${band.x}:${band.top}`, '-f', 'rawvideo', '-pix_fmt', 'gray', join(frames, 'col.raw')]);
  const raw = execFileSync('cat', [join(frames, 'col.raw')], { maxBuffer: 1 << 28 });
  const ground = theme === 'dark' ? 8 : 255;
  const curve = [];
  for (let f = 0; f + height <= raw.length; f += height) {
    let shown = 0;
    for (let y = 0; y < height; y++) if (Math.abs(raw[f + y] - ground) > 12) shown++;
    curve.push(shown / height);
  }
  rmSync(frames, { recursive: true, force: true });
  return curve;
}

/**
 * From the reveal curve: when the band starts opening (the last frame it is
 * fully covered), how long it takes, the frames spent mid-reveal and the
 * biggest single-frame jump. Frames before the case study is up (a blank page,
 * the home page) are skipped by anchoring on the covered frame.
 */
function analyse(curve) {
  const settled = curve.at(-1) ?? 0;
  let covered = -1;
  for (let i = curve.length - 1; i >= 0; i--) {
    if (curve[i] <= 0.02 * settled) {
      covered = i;
      break;
    }
  }
  if (covered < 0) return { revealStartMs: null, revealMs: null, midFrames: null, maxJumpPct: null, note: 'band never seen covered' };
  const end = curve.findIndex((v, i) => i > covered && v >= 0.98 * settled);
  let maxJump = 0;
  for (let i = covered + 1; i <= end; i++) maxJump = Math.max(maxJump, (curve[i] - curve[i - 1]) / (settled || 1));
  return {
    revealStartMs: Math.round((covered / FPS) * 1000),
    revealMs: Math.round(((end - covered) / FPS) * 1000),
    midFrames: Math.max(0, end - covered - 1),
    maxJumpPct: Math.round(maxJump * 100),
  };
}

/** A strip of video frames, one every `stepMs` from `fromMs`. */
function strip(videoPath, name, fromMs, stepMs = 80, count = 14, width = 220) {
  const file = join(out, `${name}.jpg`);
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-ss', String(fromMs / 1000), '-i', videoPath,
    '-vf', `fps=${1000 / stepMs},scale=${width}:-2,tile=${count}x1:padding=4:color=gray`,
    '-frames:v', '1', '-q:v', '4', file,
  ]);
  return file;
}

async function sampleRest(page) {
  return page.evaluate(() => {
    const mask = document.querySelector('.hero-mask');
    const title = document.querySelector('h1 .hero-rise');
    const img = document.querySelector('[data-section="project-hero"] img');
    return {
      maskDisplay: mask && getComputedStyle(mask).display,
      titleTransform: title && getComputedStyle(title).transform,
      titleAnimations: title ? title.getAnimations().length : null,
      imageLoaded: Boolean(img?.complete && img.naturalWidth),
    };
  });
}

const browser = await chromium.launch();
const summary = { base, entrance: [], navigation: [], noJs: [], reducedMotion: [], header: [] };

for (const w of WIDTHS) {
  for (const theme of THEMES) {
    // 1. Cold first visit, hard load.
    const videoDir = join(out, '.video');
    rmSync(videoDir, { recursive: true, force: true });
    let context = await newContext(browser, { ...w, theme, video: videoDir });
    let page = await context.newPage();
    await throttle(page);
    const t0 = Date.now();
    await page.goto(`${base}/acacia`, { waitUntil: 'commit' });
    await page.waitForTimeout(5000);
    const band = await bandBox(page);
    const loadMs = Date.now() - t0;
    await context.close();
    let video = join(videoDir, readdirSync(videoDir)[0]);
    let curve = revealCurve(video, band, theme);
    const cold = { width: w.name, theme, ...analyse(curve) };
    cold.strip = strip(video, `cold-acacia-${w.name}-${theme}`, Math.max(0, (cold.revealStartMs ?? 0) - 160));
    summary.entrance.push(cold);
    console.log('cold', JSON.stringify(cold), `(${loadMs}ms wall)`);

    // 2. First client-side navigation from / (cold), once hydrated.
    rmSync(videoDir, { recursive: true, force: true });
    context = await newContext(browser, { ...w, theme, video: videoDir });
    page = await context.newPage();
    await throttle(page);
    const n0 = Date.now();
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    const clickAt = Date.now() - n0;
    await page.locator('a[href="/acacia"]').first().click();
    await page.waitForURL('**/acacia');
    await page.waitForTimeout(4000);
    const navBand = await bandBox(page);
    await context.close();
    video = join(videoDir, readdirSync(videoDir)[0]);
    curve = revealCurve(video, navBand, theme);
    // Only analyse frames after the click (the home page shares no pixels with the band's ground reliably).
    const after = curve.slice(Math.floor((clickAt / 1000) * FPS));
    const nav = { width: w.name, theme, ...analyse(after) };
    nav.revealStartMs = nav.revealStartMs === null ? null : nav.revealStartMs + Math.floor((clickAt / 1000) * FPS) * (1000 / FPS);
    nav.strip = strip(video, `nav-home-to-acacia-${w.name}-${theme}`, Math.max(0, (nav.revealStartMs ?? clickAt) - 640));
    summary.navigation.push(nav);
    console.log('nav ', JSON.stringify(nav));
    rmSync(videoDir, { recursive: true, force: true });
  }

  // 3. Without JavaScript: the hero is at rest and visible.
  for (const route of ['acacia', 'mosurban']) {
    const context = await newContext(browser, { ...w, theme: 'dark', js: false });
    const page = await context.newPage();
    await page.goto(`${base}/${route}`, { waitUntil: 'load' });
    const rest = await sampleRest(page);
    const file = join(out, `nojs-${route}-${w.name}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
    summary.noJs.push({ width: w.name, route, ...rest, screenshot: file });
    console.log('nojs', w.name, route, JSON.stringify(rest));
    await context.close();
  }

  // 4. Reduced motion: at rest from the first frame.
  {
    const context = await newContext(browser, { ...w, theme: 'dark', reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      window.__rest = [];
      const tick = () => {
        const mask = document.querySelector('.hero-mask');
        const title = document.querySelector('h1 .hero-rise');
        if (title) window.__rest.push(`${mask && getComputedStyle(mask).display}|${getComputedStyle(title).transform}`);
        if (window.__rest.length < 120) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const page = await context.newPage();
    await page.goto(`${base}/acacia`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const states = [...new Set(await page.evaluate(() => window.__rest))];
    summary.reducedMotion.push({ width: w.name, states });
    console.log('rm  ', w.name, JSON.stringify(states));
    await context.close();
  }

  // 5. The home header before hydration (the bundle blocked, inline scripts still run), light theme.
  {
    const context = await newContext(browser, { ...w, theme: 'light' });
    const page = await context.newPage();
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    const read = () =>
      page.evaluate(() => {
        const header = document.querySelector('header[data-section="header"]');
        const link = header.querySelector('nav a');
        return { overHero: header.dataset.overHero, linkColour: getComputedStyle(link).color, scrollY: Math.round(scrollY) };
      });
    await page.goto(`${base}/`, { waitUntil: 'load' });
    const top = await read();
    await page.screenshot({ path: join(out, `prehydration-header-top-${w.name}-light.png`), clip: { x: 0, y: 0, width: w.width, height: 120 } });
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(200);
    const scrolled = await read();
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(500);
    const reloaded = await read();
    await page.screenshot({ path: join(out, `prehydration-header-midpage-reload-${w.name}-light.png`), clip: { x: 0, y: 0, width: w.width, height: 120 } });
    summary.header.push({ width: w.name, top, scrolled, reloaded });
    console.log('hdr ', w.name, JSON.stringify({ top, scrolled, reloaded }));
    await context.close();
  }
}

await browser.close();
writeFileSync(join(out, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`wrote ${out}/summary.json`);
