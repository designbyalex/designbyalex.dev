// Pure: turns the in-page collector's raw DOM facts into a PageSnapshot.
import type { RawCapture, RawFragment } from './raw.ts';
import { type Box, type Link, type Local, type Media, type PageSnapshot, type Section, SNAPSHOT_FORMAT, type TextBlock, type TextRun } from './snapshot.ts';

export interface SnapshotMeta {
  url: string;
  finalUrl: string;
  width: number;
  viewport: { w: number; h: number };
  colorScheme: 'dark' | 'light';
  status: number;
  capturedAt: string;
  browser: string;
}

const collapse = (s: string) => s.replace(/[ \t\n\r\f]+/g, ' ').trim();

// Geometry is kept to 0.1px: finer than any tolerance the gate uses, and it keeps the JSON small.
const round = (n: number) => Math.round(n * 10) / 10;
const roundBox = (b: Box): Box => ({ x: round(b.x), y: round(b.y), w: round(b.w), h: round(b.h) });

const union = (boxes: Box[]): Box => {
  const x = Math.min(...boxes.map((b) => b.x));
  const y = Math.min(...boxes.map((b) => b.y));
  const r = Math.max(...boxes.map((b) => b.x + b.w));
  const b = Math.max(...boxes.map((b) => b.y + b.h));
  return roundBox({ x, y, w: r - x, h: b - y });
};

// Rects whose tops are within 2px sit on the same line box.
const countLines = (rects: Box[]) => {
  const tops: number[] = [];
  for (const r of [...rects].sort((a, b) => a.y - b.y)) {
    if (!tops.length || r.y - tops[tops.length - 1] > 2) tops.push(r.y);
  }
  return tops.length;
};

const hostOf = (src: string): string | null => {
  try {
    return new URL(src).hostname || null;
  } catch {
    return null;
  }
};

interface Draft {
  text: string;
  block: number;
  link: number | null;
  styleKey: string;
  first: RawFragment;
  rects: Box[];
  opacity: number;
}

function mergeRuns(fragments: RawFragment[]): Draft[] {
  const drafts: Draft[] = [];
  let open: Draft | null = null;
  for (const f of fragments) {
    if (f.space) {
      if (open && open.block === f.block) open.text += f.text;
      continue;
    }
    const styleKey = JSON.stringify(f.style);
    if (open && open.block === f.block && open.link === f.link && open.styleKey === styleKey) {
      open.text += f.text;
      open.rects.push(...f.rects);
      open.opacity = Math.min(open.opacity, f.opacity);
      continue;
    }
    open = { text: f.text, block: f.block, link: f.link, styleKey, first: f, rects: [...f.rects], opacity: f.opacity };
    drafts.push(open);
  }
  return drafts;
}

// A fixed-name rule's matches merge into one Section; a named-by-attribute match is its own Section,
// numbered when its name repeats. Returns the Sections in page order and each raw index's Section id.
function resolveSections(raw: RawCapture['sections']): { sections: Section[]; idOf: (i: number | null) => string | null } {
  const groups: { name: string; boxes: Box[]; members: number[] }[] = [];
  raw.forEach((r, i) => {
    const group = r.grouped ? groups.find((g) => g.name === r.name && g.members.some((m) => raw[m].grouped)) : undefined;
    if (group) {
      group.boxes.push(r.box);
      group.members.push(i);
    } else groups.push({ name: r.name, boxes: [r.box], members: [i] });
  });
  const ordered = groups.map((g) => ({ ...g, box: union(g.boxes) })).sort((a, b) => a.box.y - b.box.y);
  const seen = new Map<string, number>();
  const ids = new Map<number, string>();
  const sections = ordered.map((g) => {
    const occurrence = (seen.get(g.name) ?? 0) + 1;
    seen.set(g.name, occurrence);
    const id = occurrence === 1 ? g.name : `${g.name} ${occurrence}`;
    for (const m of g.members) ids.set(m, id);
    return { id, name: g.name, occurrence, box: g.box };
  });
  return { sections, idOf: (i) => (i === null ? null : (ids.get(i) ?? null)) };
}

export function buildSnapshot(raw: RawCapture, meta: SnapshotMeta): PageSnapshot {
  const { sections, idOf } = resolveSections(raw.sections);
  const byId = new Map(sections.map((s) => [s.id, s]));
  const place = (sectionIndex: number | null, box: Box): { section: string | null; local: Local | null } => {
    const id = idOf(sectionIndex);
    const section = id === null ? undefined : byId.get(id);
    return section ? { section: section.id, local: { x: round(box.x - section.box.x), y: round(box.y - section.box.y) } } : { section: null, local: null };
  };
  const drafts = mergeRuns(raw.fragments);

  const runs: TextRun[] = drafts.map((d) => {
    const box = union(d.rects);
    return {
      text: collapse(d.text),
      block: d.block,
      ...place(raw.blocks[d.block]?.section ?? null, box),
      box,
      lines: countLines(d.rects),
      style: d.first.style,
      opacity: d.opacity,
      link: d.link,
    };
  });

  const blocks: TextBlock[] = raw.blocks.map((b, i) => ({
    text: collapse(
      raw.fragments
        .filter((f) => f.block === i)
        .map((f) => f.text)
        .join('')
    ),
    tag: b.tag.toLowerCase(),
    ...place(b.section, roundBox(b.box)),
    box: roundBox(b.box),
  }));

  const url = new URL(meta.url);
  const origin = new URL(meta.finalUrl).origin;

  const links: Link[] = raw.links.map((l) => {
    const box = roundBox(l.box);
    const href = new URL(l.href);
    return {
      text: l.text,
      href: l.href,
      path: href.origin === origin ? href.pathname + href.search + href.hash : null,
      target: l.target,
      rel: l.rel,
      ...place(l.section, box),
      box,
    };
  });

  const media: Media[] = raw.media.map((m) => {
    const box = roundBox(m.box);
    return {
      kind: m.kind,
      src: m.src,
      host: hostOf(m.src),
      alt: m.alt,
      ...place(m.section, box),
      box,
      natural: m.natural,
      fit: m.fit,
      radius: m.radius,
      video: m.video,
    };
  });
  return {
    format: SNAPSHOT_FORMAT,
    url: meta.url,
    finalUrl: meta.finalUrl,
    origin: url.origin,
    path: url.pathname,
    width: meta.width,
    viewport: meta.viewport,
    clientWidth: raw.clientWidth,
    colorScheme: meta.colorScheme,
    reducedMotion: 'reduce',
    status: meta.status,
    title: raw.title,
    generator: raw.generator,
    pageHeight: raw.pageHeight,
    fonts: raw.fonts,
    capturedAt: meta.capturedAt,
    browser: meta.browser,
    sections,
    blocks,
    runs,
    links,
    media,
  };
}
