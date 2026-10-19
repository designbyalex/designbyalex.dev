import { describe, expect, it } from 'vitest';
import { buildSnapshot, type SnapshotMeta } from './build-snapshot.ts';
import type { RawCapture, RawFragment } from './raw.ts';
import type { TextStyle } from './snapshot.ts';

const meta: SnapshotMeta = {
  url: 'https://designbyalex.dev/acacia',
  finalUrl: 'https://designbyalex.dev/acacia',
  width: 1440,
  viewport: { w: 1440, h: 900 },
  colorScheme: 'dark',
  status: 200,
  capturedAt: '2026-10-19T00:00:00.000Z',
  browser: 'chrome 141',
};

const white: TextStyle = {
  family: 'Inter Display',
  size: 28,
  lineHeight: 39.2,
  weight: 400,
  tracking: 0,
  color: 'rgb(247, 247, 247)',
  transform: 'none',
  fontStyle: 'normal',
};
const green: TextStyle = { ...white, color: 'rgb(56, 220, 119)' };

const frag = (text: string, x: number, style = white, extra: Partial<RawFragment> = {}): RawFragment => ({
  text,
  space: false,
  block: 0,
  link: null,
  rects: [{ x, y: 100, w: text.length * 10, h: 39 }],
  style,
  opacity: 1,
  ...extra,
});
const space = (block = 0): RawFragment => ({ text: ' ', space: true, block, link: null, rects: [], style: white, opacity: 1 });

const raw = (over: Partial<RawCapture>): RawCapture => ({
  title: 'Acacia',
  generator: 'Framer abc123',
  pageHeight: 3000,
  clientWidth: 1440,
  fonts: ['Inter'],
  sections: [],
  blocks: [{ tag: 'P', section: null, box: { x: 0, y: 100, w: 600, h: 39 } }],
  fragments: [],
  links: [],
  media: [],
  ...over,
});

describe('buildSnapshot: leaf text runs', () => {
  it('joins style-uniform fragments into one run and splits at a colour change', () => {
    const s = buildSnapshot(
      raw({ fragments: [frag('Acacia is', 0), space(), frag('a', 100), space(), frag('trusted platform', 120, green), frag(' for carers.', 280)] }),
      meta
    );
    expect(s.runs.map((r) => [r.text, r.style.color])).toEqual([
      ['Acacia is a', 'rgb(247, 247, 247)'],
      ['trusted platform', 'rgb(56, 220, 119)'],
      ['for carers.', 'rgb(247, 247, 247)'],
    ]);
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0].text).toBe('Acacia is a trusted platform for carers.');
  });

  it('counts the line boxes a wrapping run occupies and boxes all of them', () => {
    const wrapped = frag('Making the case for care', 0, white, {
      rects: [
        { x: 40, y: 100, w: 500, h: 39 },
        { x: 40, y: 139.2, w: 320, h: 39 },
        { x: 360, y: 139.6, w: 80, h: 39 },
      ],
    });
    const [run] = buildSnapshot(raw({ fragments: [wrapped] }), meta).runs;
    expect(run.lines).toBe(2);
    expect(run.box).toEqual({ x: 40, y: 100, w: 500, h: 78.6 });
  });

  it('keeps runs in different blocks apart even when their style matches', () => {
    const s = buildSnapshot(
      raw({
        blocks: [
          { tag: 'H2', section: null, box: { x: 0, y: 0, w: 600, h: 48 } },
          { tag: 'P', section: null, box: { x: 0, y: 60, w: 600, h: 48 } },
        ],
        fragments: [frag('Mission', 0, white, { block: 0 }), space(0), frag('Why it matters', 0, white, { block: 1 })],
      }),
      meta
    );
    expect(s.runs.map((r) => [r.text, r.block])).toEqual([
      ['Mission', 0],
      ['Why it matters', 1],
    ]);
  });
});

describe('buildSnapshot: Sections', () => {
  const sections: RawCapture['sections'] = [
    { name: 'Header', grouped: true, box: { x: 0, y: 0, w: 1440, h: 96 } },
    { name: 'Project Row', grouped: false, box: { x: 0, y: 1112, w: 1440, h: 745 } },
    { name: 'Project Row', grouped: false, box: { x: 0, y: 1857, w: 1440, h: 797 } },
    { name: 'Project Hero', grouped: true, box: { x: 0, y: 0, w: 1440, h: 350 } },
    { name: 'Project Hero', grouped: true, box: { x: 0, y: 0, w: 1440, h: 1170 } },
  ];

  it('names Sections by layer name, numbering repeats and merging fixed-name matches', () => {
    const s = buildSnapshot(raw({ sections }), meta);
    expect(s.sections).toEqual([
      { id: 'Header', name: 'Header', occurrence: 1, box: { x: 0, y: 0, w: 1440, h: 96 } },
      { id: 'Project Hero', name: 'Project Hero', occurrence: 1, box: { x: 0, y: 0, w: 1440, h: 1170 } },
      { id: 'Project Row', name: 'Project Row', occurrence: 1, box: { x: 0, y: 1112, w: 1440, h: 745 } },
      { id: 'Project Row 2', name: 'Project Row', occurrence: 2, box: { x: 0, y: 1857, w: 1440, h: 797 } },
    ]);
  });

  it('places runs and blocks in their Section with Section-relative positions', () => {
    const s = buildSnapshot(
      raw({
        sections,
        blocks: [
          { tag: 'P', section: 2, box: { x: 48, y: 1900, w: 600, h: 22 } },
          { tag: 'P', section: null, box: { x: 48, y: 5000, w: 600, h: 22 } },
        ],
        fragments: [
          frag('MOS Urban', 0, white, { block: 0, rects: [{ x: 307, y: 1907.25, w: 90, h: 22 }] }),
          frag('Orphan', 0, white, { block: 1, rects: [{ x: 48, y: 5000, w: 60, h: 22 }] }),
        ],
      }),
      meta
    );
    expect(s.runs[0]).toMatchObject({ section: 'Project Row 2', local: { x: 307, y: 50.3 } });
    expect(s.blocks[0]).toMatchObject({ section: 'Project Row 2', local: { x: 48, y: 43 } });
    expect(s.runs[1]).toMatchObject({ section: null, local: null });
  });
});

describe('buildSnapshot: links and media', () => {
  const sections: RawCapture['sections'] = [{ name: 'Section UX', grouped: false, box: { x: 0, y: 6412, w: 1440, h: 874 } }];

  it('gives same-origin links a path and leaves external ones absolute only', () => {
    const s = buildSnapshot(
      raw({
        sections,
        links: [
          {
            text: 'Next project',
            href: 'https://designbyalex.dev/mosurban?ref=1#top',
            target: null,
            rel: null,
            section: 0,
            box: { x: 720, y: 6500, w: 200, h: 24 },
          },
          {
            text: "Let's talk",
            href: 'mailto:hello@designbyalex.dev',
            target: '_blank',
            rel: 'noopener',
            section: null,
            box: { x: 1200, y: 28, w: 90, h: 40 },
          },
        ],
      }),
      meta
    );
    expect(s.links[0]).toEqual({
      text: 'Next project',
      href: 'https://designbyalex.dev/mosurban?ref=1#top',
      path: '/mosurban?ref=1#top',
      target: null,
      rel: null,
      section: 'Section UX',
      box: { x: 720, y: 6500, w: 200, h: 24 },
      local: { x: 720, y: 88 },
    });
    expect(s.links[1]).toMatchObject({ path: null, target: '_blank', section: null, local: null });
  });

  it('records each media item with its source host and playback state', () => {
    const video = { autoplay: true, muted: true, controls: false, loop: true, playsInline: true, poster: null, pausedAfterView: false };
    const s = buildSnapshot(
      raw({
        sections,
        media: [
          {
            kind: 'video',
            src: 'https://framerusercontent.com/assets/ux.mp4',
            alt: null,
            section: 0,
            box: { x: 720, y: 6600, w: 672, h: 420 },
            natural: { w: 1920, h: 1200 },
            fit: 'cover',
            radius: 12,
            video,
          },
          {
            kind: 'image',
            src: 'data:image/svg+xml;base64,AAAA',
            alt: '',
            section: null,
            box: { x: 0, y: 0, w: 10, h: 10 },
            natural: null,
            fit: 'fill',
            radius: 0,
            video: null,
          },
        ],
      }),
      meta
    );
    expect(s.media[0]).toEqual({
      kind: 'video',
      src: 'https://framerusercontent.com/assets/ux.mp4',
      host: 'framerusercontent.com',
      alt: null,
      section: 'Section UX',
      box: { x: 720, y: 6600, w: 672, h: 420 },
      local: { x: 720, y: 188 },
      natural: { w: 1920, h: 1200 },
      fit: 'cover',
      radius: 12,
      video,
    });
    expect(s.media[1]).toMatchObject({ host: null, section: null });
  });
});
