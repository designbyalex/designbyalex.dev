// The Baseline ratchet (pure): (committed Baseline of Gap counts per page, Section, width and Dimension,
// the new counts, the ticket's Parity scope) → pass/fail, the new Baseline and the reason. PRD #46, ADR 0002.
//
// A ticket must clear every Gap its Parity scope names. Everywhere else a count may stay or go down, never
// rise. A Section the Baseline has never seen starts at its first count. On a pass the new counts become the
// Baseline, committed with the change (parity/baseline.json). A Section the run no longer has stays in it at
// 0, so the Baseline never loses a key and the loop can check a committed Baseline with baselineRaised.
import { DIMENSIONS, type Dimension } from './checks.ts';
import type { Comparison } from './compare.ts';
import { fail, num, obj, oneOf, type ShapeCheck, str } from './validate.ts';

/** One `page · Section · Dimensions` line of a ticket's `## Parity scope`. */
export interface ScopeLine {
  /** The line as written, for messages. */
  text: string;
  /** Build paths (`/acacia`), Reference page keys (`acacia`) or `404`; `all` for every page. */
  pages: string[] | 'all';
  /** Reference Section names (`Project Hero`, `Mission` for `Section Mission`); `all` for every Section. */
  sections: string[] | 'all';
  dimensions: Dimension[];
}

const ALL = 'all';
const list = (part: string) =>
  part
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * The lines of the ticket body's `## Parity scope` section, or none when it has none. Throws, naming the
 * line, on a line that isn't `page · Section · Dimensions` or names a Dimension the gate doesn't check.
 */
export function parseParityScope(body: string): ScopeLine[] {
  const section = body.match(/^##\s+Parity scope[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!section) return [];
  return [...section[1].matchAll(/^\s*[-*]\s+(.+?)\s*$/gm)].map(([, text]) => {
    const parts = text.split(/\s+[·|]\s+/);
    if (parts.length !== 3) throw new Error(`Parity scope line "${text}": expected "page · Section · Dimensions"`);
    const [pages, sections, dimensions] = parts.map(list);
    const all = (names: string[]) => (names.length === 1 && names[0].toLowerCase() === ALL ? ALL : names);
    return { text, pages: all(pages), sections: all(sections), dimensions: parseDimensions(text, parts[2]) };
  });
}

function parseDimensions(line: string, part: string): Dimension[] {
  // A note in parentheses, e.g. "Layout (light vs dark)", qualifies the Dimension and isn't part of it.
  const names = list(part.replace(/\([^)]*\)/g, ''));
  if (names.length === 1 && names[0].toLowerCase() === ALL) return [...DIMENSIONS];
  return names.map((name) => {
    const dimension = DIMENSIONS.find((d) => d.toLowerCase() === name.toLowerCase());
    if (!dimension) throw new Error(`Parity scope line "${line}": unknown Dimension "${name}" (the gate checks ${DIMENSIONS.join(', ')})`);
    return dimension;
  });
}

// ---- The ratchet -----------------------------------------------------------------------------------

export type DimensionCounts = Record<Dimension, number>;

/** Gap counts of one compared route: its Reference page key and, per Section and width, per Dimension. */
export interface PageCounts {
  page: string;
  sections: Record<string, Record<string, DimensionCounts>>;
}

/** Build path (`/acacia`) → its Gap counts. Every Section compared is listed, at 0 when it has no Gaps. */
export type Counts = Record<string, PageCounts>;

export interface Failure {
  /**
   * `scoped`: a Section in the Parity scope still has Gaps. `rose`: an unscoped count is above the Baseline.
   * `not-compared`: the run left out a page and width the Baseline has. `scope-unmatched`: a Parity scope
   * line names nothing the run compared.
   */
  kind: 'scoped' | 'rose' | 'not-compared' | 'scope-unmatched';
  path: string | null;
  section: string | null;
  width: number | null;
  dimension: Dimension | null;
  baseline: number | null;
  count: number | null;
  /** The Parity scope line, for `scope-unmatched`. */
  line?: string;
}

export interface RatchetInput {
  /** The committed Baseline, or null before the first one. */
  baseline: Counts | null;
  counts: Counts;
  scope: ScopeLine[];
}

export interface RatchetResult {
  pass: boolean;
  /** The counts on a pass, plus at 0 any Section the run no longer has; the Baseline unchanged on a failure. */
  baseline: Counts | null;
  /** One line per failure, or a summary of the change on a pass. */
  reason: string;
  failures: Failure[];
}

/**
 * Comparisons → Gap counts. `sectionsOf` lists the Sections each Comparison covered (its Reference Sections),
 * so a Section with no Gaps is recorded at 0 and a later rise there is caught; Build-only Sections enter
 * through their Gaps.
 */
export function countGaps(comparisons: Comparison[], sectionsOf: (c: Comparison) => string[]): Counts {
  const out: Counts = {};
  for (const c of comparisons) {
    const page = (out[c.path] ??= { page: c.page, sections: {} });
    const at = (section: string) => {
      const widths = (page.sections[section] ??= {});
      return (widths[c.width] ??= { Copy: 0, Media: 0, Layout: 0, Type: 0 });
    };
    for (const s of sectionsOf(c)) at(s);
    for (const g of c.gaps) at(g.section)[g.dimension]++;
  }
  return out;
}

// ---- The committed Baseline file (parity/baseline.json) ---------------------------------------------

export const BASELINE_FORMAT = 1;

/** The Baseline file's JSON, one line per Section and width so a ticket's diff shows what moved. */
export function formatBaseline(counts: Counts): string {
  const q = JSON.stringify;
  const pages = Object.entries(counts).map(([path, p]) => {
    const sections = Object.entries(p.sections).map(([section, widths]) => {
      const lines = Object.entries(widths).map(([w, c]) => `          ${q(w)}: { ${DIMENSIONS.map((d) => `${q(d)}: ${c[d]}`).join(', ')} }`);
      return `        ${q(section)}: {\n${lines.join(',\n')}\n        }`;
    });
    return `    ${q(path)}: {\n      "page": ${q(p.page)},\n      "sections": {\n${sections.join(',\n')}\n      }\n    }`;
  });
  return `{\n  "format": ${BASELINE_FORMAT},\n  "counts": {\n${pages.join(',\n')}\n  }\n}\n`;
}

const record =
  (c: ShapeCheck): ShapeCheck =>
  (v, p) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(p, 'an object');
    for (const [k, x] of Object.entries(v as object)) c(x, `${p}.${k}`);
  };
const baselineFile = obj({
  format: oneOf(BASELINE_FORMAT),
  counts: record(obj({ page: str, sections: record(record(obj(Object.fromEntries(DIMENSIONS.map((d) => [d, num]))))) })),
});

/** Throws, naming the first bad field, unless `json` is a Baseline file; returns its counts. */
export function parseBaseline(json: unknown): Counts {
  baselineFile(json, '');
  return (json as { counts: Counts }).counts;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const total = (c: DimensionCounts | undefined) => (c ? DIMENSIONS.reduce((n, d) => n + c[d], 0) : 0);

const pageMatches = (token: string, path: string, page: string) => {
  const t = token.length > 1 ? token.replace(/\/$/, '') : token;
  return t === path || t === page || (t === '404' && page === 'not-found');
};

/** `Overview` names `Section Overview`, `Project Row` names `Project Row 2`, `Hero` names `Hero Content`. */
const sectionMatches = (name: string, id: string) => {
  const n = name.toLowerCase();
  const base = id.replace(/ \d+$/, '').toLowerCase();
  return id.toLowerCase() === n || base === n || base === `section ${n}` || base.startsWith(`${n} `);
};

const inScope = (line: ScopeLine, path: string, page: string, section: string) =>
  (line.pages === 'all' || line.pages.some((t) => pageMatches(t, path, page))) &&
  (line.sections === 'all' || line.sections.some((s) => sectionMatches(s, section)));

export function ratchet({ baseline, counts, scope }: RatchetInput): RatchetResult {
  const failures: Failure[] = [];
  let lower = 0;
  const fresh = new Set<string>();
  const vanished: [path: string, section: string, width: string][] = [];

  for (const line of scope) {
    const hit = Object.entries(counts).some(([path, p]) => Object.keys(p.sections).some((s) => inScope(line, path, p.page, s)));
    if (!hit) failures.push({ kind: 'scope-unmatched', path: null, section: null, width: null, dimension: null, baseline: null, count: null, line: line.text });
  }

  for (const [path, p] of Object.entries(counts)) {
    for (const [section, widths] of Object.entries(p.sections)) {
      for (const [w, now] of Object.entries(widths)) {
        const width = Number(w);
        const before = baseline?.[path]?.sections[section]?.[w];
        if (!before) fresh.add(`${path}\u0000${section}`);
        for (const dimension of DIMENSIONS) {
          const count = now[dimension];
          const allowed = before ? before[dimension] : count;
          if (scope.some((l) => l.dimensions.includes(dimension) && inScope(l, path, p.page, section))) {
            if (count > 0) failures.push({ kind: 'scoped', path, section, width, dimension, baseline: before?.[dimension] ?? null, count });
          } else if (count > allowed) {
            failures.push({ kind: 'rose', path, section, width, dimension, baseline: allowed, count });
          }
          if (before && count < before[dimension]) lower++;
        }
      }
    }
  }

  // A Section the run no longer has went down to 0, unless its whole page and width wasn't compared.
  for (const [path, p] of Object.entries(baseline ?? {})) {
    const widths = new Set(Object.values(p.sections).flatMap((s) => Object.keys(s)));
    for (const w of widths) {
      const was = Object.values(p.sections).reduce((n, s) => n + total(s[w]), 0);
      const compared = Object.values(counts[path]?.sections ?? {}).some((s) => s[w]);
      if (!compared) {
        failures.push({ kind: 'not-compared', path, section: null, width: Number(w), dimension: null, baseline: was, count: null });
        continue;
      }
      for (const [section, s] of Object.entries(p.sections))
        if (s[w] && !counts[path].sections[section]?.[w]) {
          lower += DIMENSIONS.filter((d) => s[w][d] > 0).length;
          vanished.push([path, section, w]);
        }
    }
  }

  if (failures.length > 0) return { pass: false, baseline, reason: failures.map(describeFailure).join('\n'), failures };

  const sum = (c: Counts | null) =>
    Object.values(c ?? {}).reduce((n, p) => n + Object.values(p.sections).reduce((m, s) => m + Object.values(s).reduce((k, d) => k + total(d), 0), 0), 0);
  const news = baseline ? fresh.size : 0;
  const reason = `Baseline held: ${lower > 0 ? `${plural(lower, 'count')} lower` : 'none lower'} (${sum(baseline)} → ${sum(counts)} Gaps), none rose${
    news > 0 ? `, ${plural(news, 'new Section')}` : ''
  }`;
  const next = structuredClone(counts);
  for (const [path, section, w] of vanished) (next[path].sections[section] ??= {})[w] = { Copy: 0, Media: 0, Layout: 0, Type: 0 };
  return { pass: true, baseline: next, reason, failures };
}

/** A count a committed Baseline raised, or a Section and width it dropped (`dimension` and `after` null). */
export interface RaisedCount {
  path: string;
  section: string;
  width: number;
  dimension: Dimension | null;
  before: number;
  after: number | null;
}

/**
 * Where `after` is above `before`: a raised count, or a page, Section or width `before` has and `after` lacks.
 * A key only `after` has is a new Section at its first count. The loop runs it on the Baseline committed at a
 * ticket's start and at its end, so an agent can't make room in the ratchet by editing the Baseline.
 */
export function baselineRaised(before: Counts | null, after: Counts): RaisedCount[] {
  const raised: RaisedCount[] = [];
  for (const [path, p] of Object.entries(before ?? {}))
    for (const [section, widths] of Object.entries(p.sections))
      for (const [w, b] of Object.entries(widths)) {
        const a = after[path]?.sections[section]?.[w];
        if (!a) raised.push({ path, section, width: Number(w), dimension: null, before: total(b), after: null });
        else for (const d of DIMENSIONS) if (a[d] > b[d]) raised.push({ path, section, width: Number(w), dimension: d, before: b[d], after: a[d] });
      }
  return raised;
}

export function describeFailure(f: Failure): string {
  const where = `${f.path} ${f.section} @${f.width} ${f.dimension}`;
  switch (f.kind) {
    case 'scoped':
      return `${where}: ${plural(f.count ?? 0, 'Gap')} left, the Parity scope needs 0`;
    case 'rose':
      return `${where}: ${plural(f.count ?? 0, 'Gap')}, the Baseline allows ${f.baseline}`;
    case 'not-compared':
      return `${f.path} @${f.width}: not compared, but the Baseline has ${plural(f.baseline ?? 0, 'Gap')} there`;
    case 'scope-unmatched':
      return `Parity scope line "${f.line}" matches no compared page and Section`;
  }
}
