import { describe, expect, it } from 'vitest';
import type { GateConfig } from './config.ts';
import type { Media, PageSnapshot, TextRun, TextStyle } from './snapshot.ts';
import { applyDeviations, compareThemes, contrastGaps, contrastRatio, isLargeText, type RunContrast } from './theme.ts';

// Hand-built Build snapshots: the Reference only lends its Section names (Section Mission ↔ data-section="mission").

const body: TextStyle = {
  family: 'Inter',
  size: 14,
  lineHeight: 22.4,
  weight: 400,
  tracking: 0,
  color: 'rgb(102, 102, 102)',
  transform: 'none',
  fontStyle: 'normal',
};

interface Spec {
  scheme?: 'dark' | 'light';
  sections?: string[];
  runs?: { text: string; section?: string | null; at?: [number, number]; style?: Partial<TextStyle>; box?: [number, number] }[];
  media?: Partial<Media>[];
}

function snap({ scheme = 'dark', sections = ['mission'], runs = [], media = [] }: Spec): PageSnapshot {
  const boxes = sections.map((id, i) => ({ id, name: id, occurrence: 1, box: { x: 0, y: i * 1000, w: 1440, h: 800 } }));
  const sectionY = (id: string | null) => boxes.find((s) => s.id === id)?.box.y ?? 0;
  const textRuns: TextRun[] = runs.map((r, i) => {
    const section = r.section === undefined ? sections[0] : r.section;
    const [x, y] = r.at ?? [48, 100 + i * 40];
    const [w, h] = r.box ?? [300, 22];
    return {
      text: r.text,
      block: i,
      section,
      box: { x, y: sectionY(section) + y, w, h },
      local: section ? { x, y } : null,
      lines: 1,
      style: { ...body, ...r.style },
      opacity: 1,
      link: null,
    };
  });
  return {
    format: 1,
    url: 'http://localhost:3000/acacia',
    finalUrl: 'http://localhost:3000/acacia',
    origin: 'http://localhost:3000',
    path: '/acacia',
    width: 1440,
    viewport: { w: 1440, h: 900 },
    clientWidth: 1440,
    colorScheme: scheme,
    reducedMotion: 'reduce',
    status: 200,
    title: 'Acacia',
    generator: null,
    pageHeight: 5000,
    fonts: [],
    capturedAt: '2026-10-21T00:00:00.000Z',
    browser: 'Google Chrome 155',
    sections: boxes,
    blocks: textRuns.map((r) => ({ text: r.text, tag: 'p', section: r.section, box: r.box, local: r.local })),
    runs: textRuns,
    links: [],
    media: media.map((m) => ({
      kind: 'image',
      src: 'http://localhost:3000/uploads/mission.png',
      host: 'localhost',
      alt: null,
      section: sections[0],
      box: { x: 48, y: 300, w: 532, h: 400 },
      local: { x: 48, y: 300 },
      natural: null,
      fit: 'cover',
      radius: 20,
      video: null,
      ...m,
    })),
  };
}

const reference = { ...snap({ sections: [] }), sections: [{ id: 'Section Mission', name: 'Section Mission', occurrence: 1, box: { x: 0, y: 0, w: 1440, h: 800 } }] };

const config: GateConfig = {
  tolerances: {
    positionPx: 4,
    widthPx: 4,
    widthRatio: 0.05,
    lines: 0,
    fontSizePx: 0.5,
    lineHeightPx: 1,
    trackingPx: 0.1,
    fontWeight: 0,
    colorDeltaE: 2,
    opacity: 0.05,
    sectionSizePx: 8,
    sectionSizeRatio: 0.05,
    mediaSizePx: 4,
    mediaSizeRatio: 0.03,
    mediaRadiusPx: 1,
  },
  matching: { fuzzyCopy: 0.5, containMinChars: 12 },
  fontFamilyAliases: {},
  forbiddenMediaHosts: ['framerusercontent.com'],
  sectionMap: { 'Section Mission': 'mission' },
  extraRoutes: {},
};

describe('contrastRatio', () => {
  it('is 21:1 for white on black and 1:1 for a colour on itself', () => {
    expect(contrastRatio([1, 1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrastRatio([0.4, 0.4, 0.4, 1], [0.4, 0.4, 0.4])).toBeCloseTo(1, 5);
  });

  it('puts #767676 on white just over AA and #777777 just under', () => {
    expect(contrastRatio([0x76 / 255, 0x76 / 255, 0x76 / 255, 1], [1, 1, 1])).toBeGreaterThan(4.5);
    expect(contrastRatio([0x77 / 255, 0x77 / 255, 0x77 / 255, 1], [1, 1, 1])).toBeLessThan(4.5);
  });

  it('composites translucent text over the background first', () => {
    // Black at 50% on white renders as #808080 (in sRGB): about 3.9:1, not 21:1.
    expect(contrastRatio([0, 0, 0, 0.5], [1, 1, 1])).toBeCloseTo(contrastRatio([0.5, 0.5, 0.5, 1], [1, 1, 1]), 5);
  });
});

describe('isLargeText', () => {
  it('reads 24px, or 18.66px bold, as large', () => {
    expect(isLargeText({ size: 24, weight: 400 })).toBe(true);
    expect(isLargeText({ size: 19, weight: 700 })).toBe(true);
    expect(isLargeText({ size: 19, weight: 400 })).toBe(false);
    expect(isLargeText({ size: 14, weight: 700 })).toBe(false);
  });
});

describe('contrastGaps', () => {
  const at = (ratio: number): RunContrast => ({ ratio, background: '#ffffff' });
  const gaps = (light: PageSnapshot, contrast: (RunContrast | null)[]) => contrastGaps({ page: 'acacia', reference, light, config, contrast });

  it('reports body text under 4.5:1 under its Reference Section, with both colours', () => {
    const light = snap({ scheme: 'light', runs: [{ text: 'Making the transition frictionless.' }] });
    const [g, ...rest] = gaps(light, [at(3.2)]);
    expect(rest).toEqual([]);
    expect(g).toMatchObject({ section: 'Section Mission', dimension: 'Contrast', check: 'contrast', expected: '4.5:1', actual: '3.20:1' });
    expect(g.message).toBe('/acacia Section Mission @1440 light "Making the transition frictionless.": contrast 3.20:1 (text #666666 on #ffffff), AA needs 4.5:1');
  });

  it('holds large text to 3:1', () => {
    const light = snap({ scheme: 'light', runs: [{ text: 'Mission', style: { size: 32 } }, { text: 'Vision', style: { size: 32 } }] });
    expect(gaps(light, [at(3.2), at(2.9)]).map((g) => [g.anchor, g.expected])).toEqual([['Vision', '3:1']]);
  });

  it('skips runs with nothing sampled and visually hidden runs', () => {
    const light = snap({ scheme: 'light', runs: [{ text: 'Off the page' }, { text: 'Skip to content', box: [1, 1] }] });
    expect(gaps(light, [null, at(1.1)])).toEqual([]);
  });

  it('keeps a Build-only Section under its own id', () => {
    const light = snap({ scheme: 'light', sections: ['mission', 'text'], runs: [{ text: 'A note', section: 'text' }] });
    expect(gaps(light, [at(2)])[0].section).toBe('text');
  });
});

describe('compareThemes', () => {
  const themes = (dark: PageSnapshot, light: PageSnapshot) => compareThemes({ page: 'acacia', reference, dark, light, config });
  const runs = [{ text: 'What’s Acacia’s mission?' }, { text: 'Making the transition frictionless.' }];

  it('finds nothing when only the colours differ', () => {
    const light = snap({ scheme: 'light', runs: runs.map((r) => ({ ...r, style: { color: 'rgb(20, 20, 20)' } })), media: [{}] });
    expect(themes(snap({ runs, media: [{}] }), light)).toEqual([]);
  });

  it('reports a run that moved in light as Theme, the dark position expected', () => {
    const light = snap({ scheme: 'light', runs: [runs[0], { ...runs[1], at: [48, 160] }] });
    const [g, ...rest] = themes(snap({ runs }), light);
    expect(rest).toEqual([]);
    expect(g).toMatchObject({ section: 'Section Mission', dimension: 'Theme', check: 'theme-layout', expected: '48px, 140px', actual: '48px, 160px' });
    expect(g.message).toBe(
      '/acacia Section Mission @1440 light vs dark "Making the transition frictionless.": position 48px, 160px in Section, expected 48px, 140px'
    );
  });

  it('reports artwork missing or resized in light, and text shown in one theme only', () => {
    const dark = snap({ runs, media: [{}] });
    const light = snap({ scheme: 'light', runs: [runs[0]], media: [{ box: { x: 48, y: 300, w: 400, h: 300 } }] });
    expect(themes(dark, light).map((g) => g.check)).toEqual(['theme-copy', 'theme-media']);
  });
});

describe('applyDeviations', () => {
  it('suppresses the Gaps a Deviation names, by Dimension too', () => {
    const light = snap({ scheme: 'light', runs: [{ text: 'Mission' }, { text: 'Vision' }] });
    const all = contrastGaps({ page: 'acacia', reference, light, config, contrast: [{ ratio: 2, background: '#fff' }, { ratio: 2, background: '#fff' }] });
    const { open, suppressed } = applyDeviations(all, [{ id: 'x', page: 'acacia', section: '*', check: 'Contrast', anchor: 'vision', decision: 'test' }]);
    expect(open.map((g) => g.anchor)).toEqual(['Mission']);
    expect(suppressed.map((s) => [s.gap.anchor, s.deviation])).toEqual([['Vision', 'x']]);
  });
});
