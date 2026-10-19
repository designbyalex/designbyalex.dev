// Smoke test: the extractor in a real browser against a static fixture page served from localhost.
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractPage, launchBrowser } from './extract.ts';
import { BUILD_SECTIONS } from './sections.ts';
import type { PageSnapshot } from './snapshot.ts';

const html = readFileSync(new URL('./fixtures/smoke.html', import.meta.url), 'utf8');

let server: Server;
let browser: Browser;
let origin: string;
let snap: PageSnapshot;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/') res.writeHead(200, { 'content-type': 'text/html' }).end(html);
    else res.writeHead(404).end('not found');
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  browser = await launchBrowser();
  ({ snapshot: snap } = await extractPage(browser, { url: `${origin}/`, width: 390, sections: BUILD_SECTIONS }));
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await new Promise((r) => server?.close(r));
});

describe('extractPage on a static fixture', () => {
  it('reports the page itself', () => {
    expect(snap).toMatchObject({
      origin,
      path: '/',
      width: 390,
      viewport: { w: 390, h: 844 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      status: 200,
      title: 'Parity fixture',
      generator: 'parity fixture',
    });
    expect(snap.pageHeight).toBeGreaterThan(1600);
    expect(snap.sections.map((s) => s.id)).toEqual(['hero', 'media']);
  });

  it('returns leaf text runs with geometry and computed style', () => {
    const title = snap.runs.find((r) => r.text === 'Acacia');
    expect(title).toMatchObject({
      section: 'hero',
      local: { x: 48 },
      lines: 1,
      opacity: 1,
      link: null,
      style: { size: 58, lineHeight: 63.8, weight: 400, tracking: -1.16, color: 'rgb(247, 247, 247)', transform: 'none', fontStyle: 'normal' },
    });
    // The run box is the glyph box, which can overhang the 40px padding when the line-height is tight.
    expect(title?.local?.y).toBeCloseTo(40, -1);
    expect(title?.box.w).toBeGreaterThan(0);

    const phrase = snap.runs.filter((r) => snap.blocks[r.block].text === 'A trusted platform for carers, built with care.');
    expect(phrase.map((r) => [r.text, r.style.color])).toEqual([
      ['A trusted platform', 'rgb(247, 247, 247)'],
      ['for carers', 'rgb(56, 220, 119)'],
      [', built with care.', 'rgb(247, 247, 247)'],
    ]);
    expect(snap.runs.find((r) => r.text === 'Shipped')?.style.transform).toBe('uppercase');
    expect(snap.runs.find((r) => r.text === 'Outside any section')).toMatchObject({ section: null, local: null });
  });

  it('drops text a visitor cannot see: clipped hover duplicates and opacity-0 sizing copies', () => {
    expect(snap.runs.filter((r) => r.text === 'Get in touch')).toHaveLength(1);
    expect(snap.runs.filter((r) => r.text === '25%')).toHaveLength(1);
  });

  it('returns links with text, href and target', () => {
    const link = snap.links.find((l) => l.text === 'Next project');
    expect(link).toMatchObject({ href: `${origin}/mosurban`, path: '/mosurban', target: '_blank', rel: 'noopener', section: 'media' });
    const run = snap.runs.find((r) => r.text === 'Next project');
    expect(run && snap.links[run.link ?? -1]).toBe(link);
  });

  it('returns the video with its playback attributes and rendered size', () => {
    const video = snap.media.find((m) => m.kind === 'video');
    expect(video).toMatchObject({
      section: 'media',
      alt: 'Studio Display',
      radius: 12,
      box: { w: 320, h: 180 },
      video: { autoplay: true, muted: true, controls: false, loop: true, playsInline: true, poster: null, pausedAfterView: true },
    });
  });
});
