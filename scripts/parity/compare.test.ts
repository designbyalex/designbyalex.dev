import { describe, expect, it } from 'vitest';
import { type CompareInput, compare } from './compare.ts';
import type { Deviation, GateConfig } from './config.ts';
import type { Box, Link, Media, PageSnapshot, Section, TextRun, TextStyle } from './snapshot.ts';

// Small hand-built snapshots. The Reference uses Framer layer names; the Build uses data-section ids.

const body: TextStyle = {
  family: 'Inter',
  size: 14,
  lineHeight: 22.4,
  weight: 400,
  tracking: -0.28,
  color: 'rgb(166, 166, 166)',
  transform: 'none',
  fontStyle: 'normal',
};
const green: TextStyle = { ...body, color: 'rgb(60, 218, 100)' };

interface RunSpec {
  text: string;
  section?: string | null;
  /** Section-relative position. */
  at?: [number, number];
  w?: number;
  lines?: number;
  style?: Partial<TextStyle>;
  /** Runs sharing a block index sit in one paragraph. Defaults to a block of their own. */
  block?: number;
  opacity?: number;
}

interface PageSpec {
  origin?: string;
  path?: string;
  width?: number;
  status?: number;
  title?: string;
  sections?: { id: string; y: number; h?: number }[];
  runs?: RunSpec[];
  links?: (Partial<Link> & { text: string; href: string })[];
  media?: (Partial<Media> & { src: string })[];
}

function page(spec: PageSpec): PageSnapshot {
  const origin = spec.origin ?? 'https://designbyalex.dev';
  const sections: Section[] = (spec.sections ?? []).map((s) => {
    const [name, n] = s.id.match(/^(.*?)(?: (\d+))?$/)!.slice(1);
    return { id: s.id, name, occurrence: n ? Number(n) : 1, box: { x: 0, y: s.y, w: 1440, h: s.h ?? 500 } };
  });
  const boxOf = (section: string | null | undefined, at: [number, number], w: number, h: number): { box: Box; local: TextRun['local'] } => {
    const s = sections.find((x) => x.id === section);
    return { box: { x: at[0], y: (s?.box.y ?? 0) + at[1], w, h }, local: s ? { x: at[0], y: at[1] } : null };
  };
  const runSpecs = spec.runs ?? [];
  const blockOf = runSpecs.map((r, i) => r.block ?? 1000 + i);
  const blockIds = [...new Set(blockOf)];
  const runs: TextRun[] = runSpecs.map((r, i) => {
    const section = r.section === undefined ? (sections[0]?.id ?? null) : r.section;
    return {
      text: r.text,
      block: blockIds.indexOf(blockOf[i]),
      section,
      ...boxOf(section, r.at ?? [48, 100 + i * 40], r.w ?? 300, 22),
      lines: r.lines ?? 1,
      style: { ...body, ...r.style },
      opacity: r.opacity ?? 1,
      link: null,
    };
  });
  const blocks = blockIds.map((b) => {
    const members = runs.filter((_, i) => blockOf[i] === b);
    return { text: members.map((r) => r.text).join(' '), tag: 'p', section: members[0].section, box: members[0].box, local: members[0].local };
  });
  const links: Link[] = (spec.links ?? []).map((l) => {
    const section = l.section === undefined ? (sections[0]?.id ?? null) : l.section;
    const href = new URL(l.href, origin);
    return {
      target: null,
      rel: null,
      ...boxOf(section, [0, 0], 100, 20),
      ...l,
      section,
      href: href.href,
      path: href.origin === origin ? href.pathname + href.search + href.hash : null,
    };
  });
  const media: Media[] = (spec.media ?? []).map((m) => {
    const section = m.section === undefined ? (sections[0]?.id ?? null) : m.section;
    return {
      kind: 'image',
      alt: null,
      natural: null,
      fit: 'cover',
      radius: 0,
      video: null,
      ...boxOf(section, [48, 0], 1036.8, 576),
      ...m,
      section,
      host: new URL(m.src).hostname,
    };
  });
  return {
    format: 1,
    url: origin + (spec.path ?? '/acacia'),
    finalUrl: origin + (spec.path ?? '/acacia'),
    origin,
    path: spec.path ?? '/acacia',
    width: spec.width ?? 1440,
    viewport: { w: spec.width ?? 1440, h: 900 },
    clientWidth: spec.width ?? 1440,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    status: spec.status ?? 200,
    title: spec.title ?? 'Alexander Blum | UX • Product Design',
    generator: null,
    pageHeight: 5000,
    fonts: [],
    capturedAt: '2026-10-19T00:00:00.000Z',
    browser: 'Google Chrome 155',
    sections,
    blocks,
    runs,
    links,
    media,
  };
}

const ref = (spec: PageSpec) => page(spec);
const build = (spec: PageSpec) => page({ origin: 'http://localhost:3000', ...spec });

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
  fontFamilyAliases: { 'Inter Display': 'Inter' },
  forbiddenMediaHosts: ['framerusercontent.com'],
  sectionMap: { 'Section Credibility': 'credibility', 'Section Trust': 'trust', Footer: 'footer', '(none)': 'not-found' },
  extraRoutes: {},
};

const run = (reference: PageSnapshot, buildSnap: PageSnapshot, over: Partial<CompareInput> = {}) =>
  compare({ page: 'acacia', reference, build: buildSnap, config, deviations: [], ...over });

const cred = [{ id: 'Section Credibility', y: 3000 }];
const credBuild = [{ id: 'credibility', y: 2400 }];

describe('compare: text runs', () => {
  it('finds no Gaps when the Build matches the Reference within its mapped Section', () => {
    const r = run(ref({ sections: cred, runs: [{ text: 'Building credibility' }] }), build({ sections: credBuild, runs: [{ text: 'Building credibility' }] }));
    expect(r.gaps).toEqual([]);
  });
});

const messages = (r: { gaps: { message: string }[] }) => r.gaps.map((g) => g.message);

describe('compare: normalised matching', () => {
  it('matches curly against straight quotes and reports the difference as punctuation, not missing copy', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Acacia’s “too hard basket.”' }] }),
      build({ sections: credBuild, runs: [{ text: `Acacia's "too hard basket."` }] })
    );
    expect(r.gaps.map((g) => [g.dimension, g.check])).toEqual([['Copy', 'punctuation']]);
    expect(messages(r)).toEqual([
      `/acacia Section Credibility @1440 "Acacia’s “too hard basket.”": punctuation "Acacia's "too hard basket."", expected "Acacia’s “too hard basket.”"`,
    ]);
  });

  it('matches across dash styles and spacing in a date range', () => {
    const r = run(ref({ sections: cred, runs: [{ text: 'Q3 2023 - Q2 2025' }] }), build({ sections: credBuild, runs: [{ text: 'Q3 2023 – Q2 2025' }] }));
    expect(r.gaps.map((g) => [g.check, g.expected, g.actual])).toEqual([['punctuation', 'Q3 2023 - Q2 2025', 'Q3 2023 – Q2 2025']]);
  });

  it('compares the text as rendered after CSS text-transform', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Shipped', style: { transform: 'uppercase' } }] }),
      build({ sections: credBuild, runs: [{ text: 'SHIPPED' }] })
    );
    expect(r.gaps).toEqual([]);
  });

  it('reports a case difference the CSS introduces separately from punctuation', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: '2025-Present' }] }),
      build({ sections: credBuild, runs: [{ text: '2025 – Present', style: { transform: 'uppercase' } }] })
    );
    expect(r.gaps.map((g) => [g.check, g.actual])).toEqual([
      ['punctuation', '2025 – PRESENT'],
      ['case', '2025 – PRESENT'],
    ]);
  });

  it('matches a phrase-coloured paragraph against one split differently and flags the colour, not the copy', () => {
    const r = run(
      ref({
        sections: cred,
        runs: [
          { text: 'Currently at SSW Sydney,', block: 1, style: green },
          { text: 'I work at the intersection of design and code.', block: 1, at: [48, 100] },
        ],
      }),
      build({ sections: credBuild, runs: [{ text: 'Currently at SSW Sydney, I work at the intersection of design and code.', block: 1 }] })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "Currently at SSW Sydney,": color #a6a6a6, expected #3cda64`]);
  });
});

describe('compare: Section-relative position', () => {
  it('ignores a different absolute y when the position inside the Section is the same', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Building credibility', at: [720, 64] }] }),
      build({ sections: [{ id: 'credibility', y: 9100 }], runs: [{ text: 'Building credibility', at: [720, 64] }] })
    );
    expect(r.gaps).toEqual([]);
  });

  it('flags a run that moved inside its Section beyond the tolerance', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Building credibility', at: [720, 64] }] }),
      build({ sections: credBuild, runs: [{ text: 'Building credibility', at: [48, 66] }] })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "Building credibility": position 48px, 66px in Section, expected 720px, 64px`]);
  });

  it('flags a run found in another Section than the mapped one', () => {
    const r = run(
      ref({ sections: [...cred, { id: 'Section Trust', y: 4000 }], runs: [{ text: 'Building credibility', section: 'Section Credibility' }] }),
      build({ sections: [...credBuild, { id: 'trust', y: 3000 }], runs: [{ text: 'Building credibility', section: 'trust' }] })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "Building credibility": in Section Section Trust, expected Section Credibility`]);
  });

  it('reports a Section the Build lacks once, and still compares the type of its text found elsewhere', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Building credibility', style: { size: 40 } }] }),
      build({ sections: [], runs: [{ text: 'Building credibility', section: null, style: { size: 30 } }] })
    );
    expect(messages(r)).toEqual([
      `/acacia Section Credibility @1440 "Section Credibility": Section missing: no Build Section data-section="credibility"`,
      `/acacia (none) @1440 "(none)": Build content outside any Section: add data-section to its block root`,
      `/acacia Section Credibility @1440 "Building credibility": font-size 30px, expected 40px`,
    ]);
  });
});

describe('compare: type', () => {
  const pairWith = (style: Partial<TextStyle>) =>
    run(
      ref({ sections: cred, runs: [{ text: 'Acacia’s credibility gap' }] }),
      build({ sections: credBuild, runs: [{ text: 'Acacia’s credibility gap', style }] })
    );

  it('gives size, line-height, weight and colour Gaps exact messages', () => {
    const r = pairWith({ size: 18, lineHeight: 32, weight: 700, color: 'rgb(255, 255, 255)' });
    expect(r.gaps.map((g) => g.dimension)).toEqual(['Type', 'Type', 'Type', 'Type']);
    expect(messages(r)).toEqual([
      `/acacia Section Credibility @1440 "Acacia’s credibility gap": font-size 18px, expected 14px`,
      `/acacia Section Credibility @1440 "Acacia’s credibility gap": line-height 32px, expected 22.4px`,
      `/acacia Section Credibility @1440 "Acacia’s credibility gap": font-weight 700, expected 400`,
      `/acacia Section Credibility @1440 "Acacia’s credibility gap": color #ffffff, expected #a6a6a6`,
    ]);
  });

  it('treats an oklch colour as equal to the rgb grey it renders as', () => {
    // oklch(0.7268 0 0) is sRGB #a6a6a6; oklch(0.628 0.2577 29.23) is #ff0000.
    expect(pairWith({ color: 'oklch(0.7268 0 0)' }).gaps).toEqual([]);
    expect(messages(pairWith({ color: 'oklch(0.628 0.2577 29.23)' }))).toEqual([
      `/acacia Section Credibility @1440 "Acacia’s credibility gap": color #ff0000, expected #a6a6a6`,
    ]);
  });

  it('stays quiet within the tolerances', () => {
    expect(pairWith({ size: 14.4, lineHeight: 23, tracking: -0.2 }).gaps).toEqual([]);
  });

  it('reads next/font family names and the configured family aliases', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'About', style: { family: 'Inter Display' } }, { text: 'Experience' }] }),
      build({
        sections: credBuild,
        runs: [
          { text: 'About', style: { family: '__Inter_5f3b2a' } },
          { text: 'Experience', style: { family: '__Inter_Tight_e8ce0c' } },
        ],
      })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "Experience": font-family Inter Tight, expected Inter`]);
  });
});

describe('compare: copy', () => {
  it('reports Reference text with no Build match as a Copy gap', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Making the case for care' }, { text: '01' }] }),
      build({ sections: credBuild, runs: [{ text: 'Making the case for care' }] })
    );
    expect(r.gaps.map((g) => [g.dimension, g.check])).toEqual([['Copy', 'copy-missing']]);
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "01": copy missing: no Build text matches`]);
  });

  it('pairs an edited sentence as changed copy instead of one missing and one extra', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'always in the their corner, delivering insights' }] }),
      build({ sections: credBuild, runs: [{ text: 'always in their corner, delivering insights' }] })
    );
    expect(r.gaps.map((g) => [g.check, g.expected, g.actual])).toEqual([
      ['copy-changed', 'always in the their corner, delivering insights', 'always in their corner, delivering insights'],
    ]);
  });

  it('reports Build text in a mapped Section that the Reference lacks', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Next project' }] }),
      build({ sections: credBuild, runs: [{ text: 'Next project' }, { text: 'Previous' }] })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "Previous": copy extra: not on the Reference site`]);
  });

  it('matches text one site keeps on one line and the other splits', () => {
    const r = run(
      ref({ sections: cred, runs: [{ text: 'Typology Residential energy' }] }),
      build({ sections: credBuild, runs: [{ text: 'Typology' }, { text: 'Residential energy' }] })
    );
    expect(r.gaps.map((g) => g.check)).toEqual(['copy-extra']);
  });
});

describe('compare: links', () => {
  const footer = [{ id: 'Footer', y: 5000 }];
  const footerBuild = [{ id: 'footer', y: 4000 }];

  it('pairs same-origin links by path across origins and flags a target mismatch', () => {
    const r = run(
      ref({
        sections: footer,
        links: [
          { text: 'Home', href: 'https://designbyalex.dev/' },
          { text: 'Linkedin', href: 'https://www.linkedin.com/in/x/', target: '_blank' },
        ],
      }),
      build({
        sections: footerBuild,
        links: [
          { text: 'Home', href: 'http://localhost:3000/' },
          { text: 'LinkedIn', href: 'https://www.linkedin.com/in/x' },
        ],
      })
    );
    expect(messages(r)).toEqual([`/acacia Footer @1440 "Linkedin": link → https://www.linkedin.com/in/x target none, expected _blank`]);
  });

  it('reports a Reference link the Build lacks, and a Build link the Reference lacks', () => {
    const r = run(
      ref({ sections: footer, links: [{ text: 'See full CV', href: 'https://drive.google.com/file/d/cv/view', target: '_blank' }] }),
      build({ sections: footerBuild, links: [{ text: 'Previous', href: 'http://localhost:3000/mosurban' }] })
    );
    expect(messages(r)).toEqual([
      `/acacia Footer @1440 "See full CV": link missing: expected → https://drive.google.com/file/d/cv/view (target _blank)`,
      `/acacia Footer @1440 "Previous": link extra: → /mosurban is not on the Reference site`,
    ]);
  });
});

describe('compare: media', () => {
  const ux = [{ id: 'Section Credibility', y: 3000 }];
  const video = { autoplay: true, muted: true, controls: false, loop: true, playsInline: true, poster: null, pausedAfterView: false };

  it('fails any Build media served from framerusercontent.com, subdomains included', () => {
    const r = run(
      ref({ sections: ux, media: [{ src: 'https://framerusercontent.com/images/a.png' }, { src: 'https://framerusercontent.com/images/b.png' }] }),
      build({
        sections: credBuild,
        media: [
          { src: 'https://framerusercontent.com/images/a.png' },
          { src: 'https://assets.framerusercontent.com/b.png' },
          { src: 'http://localhost:3000/uploads/c.png' },
        ],
      })
    );
    expect(r.gaps.map((g) => [g.dimension, g.check, g.anchor, g.actual])).toEqual([
      ['Media', 'media-host', 'image 1', 'framerusercontent.com'],
      ['Media', 'media-host', 'image 2', 'assets.framerusercontent.com'],
      ['Media', 'media-extra', 'image 3', 'c.png'],
    ]);
    expect(r.gaps[0].message).toBe(
      `/acacia Section Credibility @1440 "image 1": served from framerusercontent.com (https://framerusercontent.com/images/a.png): re-host it on the Build`
    );
  });

  it('flags a video that does not autoplay where the Reference does', () => {
    const r = run(
      ref({ sections: ux, media: [{ kind: 'video', src: 'https://framerusercontent.com/assets/v.mp4', video }] }),
      build({
        sections: credBuild,
        media: [{ kind: 'video', src: 'http://localhost:3000/videos/v.mp4', video: { ...video, autoplay: false, pausedAfterView: true, controls: true } }],
      })
    );
    expect(messages(r)).toEqual([
      `/acacia Section Credibility @1440 "video 1": no autoplay, paused after view, expected autoplay, playing`,
      `/acacia Section Credibility @1440 "video 1": controls true, expected controls false`,
    ]);
  });

  it('compares rendered size, radius and position inside the Section', () => {
    const r = run(
      ref({ sections: ux, media: [{ src: 'https://framerusercontent.com/a.png', radius: 20 }] }),
      build({ sections: credBuild, media: [{ src: 'http://localhost:3000/a.png', box: { x: 0, y: 2400, w: 1440, h: 810 }, local: { x: 0, y: 0 }, radius: 0 }] })
    );
    expect(messages(r)).toEqual([
      `/acacia Section Credibility @1440 "image 1": size 1440px×810px, expected 1036.8px×576px`,
      `/acacia Section Credibility @1440 "image 1": position 0px, 0px in Section, expected 48px, 0px`,
      `/acacia Section Credibility @1440 "image 1": radius 0px, expected 20px`,
    ]);
  });

  it('reports a Reference image the Build lacks', () => {
    const r = run(ref({ sections: ux, media: [{ src: 'https://framerusercontent.com/images/logos.png' }] }), build({ sections: credBuild }));
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "image 1": media missing: expected image 1036.8px×576px (logos.png)`]);
  });
});

describe('compare: route', () => {
  it('compares status and title for the page', () => {
    const r = compare({
      page: 'not-found',
      reference: ref({ path: '/parity-reference-missing-page', status: 404, title: 'Page Not Found | Framer' }),
      build: build({ path: '/about', status: 200, title: 'About' }),
      config,
      deviations: [],
    });
    expect(messages(r)).toEqual([
      `/about (page) @1440 "/about": status 200, expected 404`,
      `/about (page) @1440 "/about": title "About", expected "Page Not Found | Framer"`,
    ]);
  });
});

describe('compare: Deviations', () => {
  const footer = [{ id: 'Footer', y: 5000 }];
  const footerBuild = [{ id: 'footer', y: 4000 }];
  const year: Deviation = {
    id: 'dynamic-footer-year',
    page: '*',
    section: 'Footer',
    check: 'copy-changed',
    anchor: '2025 Alexander Blum',
    decision: 'The footer year is the current year (#46).',
  };
  const compareFooter = (deviations = [year], page = 'acacia') =>
    compare({
      page,
      reference: ref({ sections: footer, runs: [{ text: '2025 Alexander Blum' }, { text: '♥ Made with love ♥', style: { size: 11 } }] }),
      build: build({ sections: footerBuild, runs: [{ text: '2026 Alexander Blum' }, { text: '♥ Made with love ♥' }] }),
      config,
      deviations,
    });

  it('suppresses exactly the Gap a Deviation names and nothing else', () => {
    const r = compareFooter();
    expect(r.suppressed.map((s) => [s.deviation, s.gap.check, s.gap.anchor])).toEqual([['dynamic-footer-year', 'copy-changed', '2025 Alexander Blum']]);
    expect(messages(r)).toEqual([`/acacia Footer @1440 "♥ Made with love ♥": font-size 14px, expected 11px`]);
  });

  it('does not suppress a Gap that differs in page, Section, check or anchor', () => {
    for (const miss of [{ page: 'home' }, { section: 'Header' }, { check: 'copy-missing' }, { anchor: '2024 Alexander Blum' }]) {
      const r = compareFooter([{ ...year, ...miss }]);
      expect(r.suppressed).toEqual([]);
      expect(r.gaps.map((g) => g.check)).toEqual(['copy-changed', 'font-size']);
    }
  });

  it('matches a check by Dimension and a selector by list', () => {
    const r = compareFooter([{ ...year, check: 'Type', anchor: ['♥ Made with love ♥', 'other'] }]);
    expect(r.suppressed.map((s) => s.gap.check)).toEqual(['font-size']);
    expect(r.gaps.map((g) => g.check)).toEqual(['copy-changed']);
  });
});

describe('compare: media labels', () => {
  it('names an inline data: image by its type, not its whole URL', () => {
    const r = run(
      ref({ sections: cred, media: [{ kind: 'background', src: 'data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%203000%202575%22%3E' }] }),
      build({ sections: credBuild })
    );
    expect(messages(r)).toEqual([`/acacia Section Credibility @1440 "image 1": media missing: expected background 1036.8px×576px (data:image/svg+xml URL)`]);
  });
});

describe('compare: before the Build marks its Sections', () => {
  it('does not pair edited copy with unrelated text outside the mapped Section', () => {
    const r = run(
      ref({ sections: [{ id: 'Footer', y: 5000 }], runs: [{ text: '2025 Alexander Blum' }] }),
      build({ sections: [], runs: [{ text: 'Alexander Blum', section: null }] })
    );
    expect(r.gaps.map((g) => g.check)).toEqual(['section-missing', 'section-extra', 'copy-missing']);
  });
});
