// The Parity comparator (pure): one page at one Checkpoint width, Reference snapshot vs Build snapshot →
// Gaps per Section. Text runs are matched by normalised text, then compared on Section-relative position,
// size and computed style; links, media and the route are compared per page. Approved Deviations are
// subtracted last. PRD #46 (Fidelity gate), ADR 0002. The gate (#50) runs it per page × width and feeds
// the Gap counts to the Baseline ratchet.
import { CHECKS, type Check, type Dimension } from './checks.ts';
import { colourDistance, formatColour, parseColour } from './colour.ts';
import { type Deviation, type GateConfig, NO_SECTION, PAGE_SECTION, type Selector } from './config.ts';
import { containsWords, copyDifference, copyKey, familyName, letterKey, rendered, wordKey, wordOverlap } from './normalise.ts';
import type { Link, Media, PageSnapshot, TextRun } from './snapshot.ts';

export { CHECKS, type Check, DIMENSIONS, type Dimension } from './checks.ts';

export interface Gap {
  /** Reference page key, e.g. `acacia` or `not-found`. */
  page: string;
  /** The Build path that was compared, e.g. `/acacia`. */
  path: string;
  width: number;
  /** Reference Section id; the Build Section id for Build-only content; `(page)` for status and title. */
  section: string;
  dimension: Dimension;
  check: Check;
  /** The element the Gap is about: Reference text (Build text for extras), a media label, a Section id or the path. */
  anchor: string;
  expected: string | null;
  actual: string | null;
  /** One line for an agent: page, Section, width, element text, expected vs actual. */
  message: string;
}

export interface SuppressedGap {
  gap: Gap;
  /** Id of the Deviation that suppressed it. */
  deviation: string;
}

export interface Comparison {
  page: string;
  path: string;
  width: number;
  /** Open Gaps, in page order. */
  gaps: Gap[];
  /** Gaps an approved Deviation accounts for. */
  suppressed: SuppressedGap[];
  /** Reference text runs that found a Build counterpart, of all Reference runs. */
  matched: { runs: number; of: number };
}

export interface CompareInput {
  /** Reference page key (the snapshot file prefix in parity/reference/). */
  page: string;
  reference: PageSnapshot;
  build: PageSnapshot;
  config: GateConfig;
  deviations: Deviation[];
}

const ANCHOR_CHARS = 60;
const short = (text: string) => (text.length > ANCHOR_CHARS ? `${text.slice(0, ANCHOR_CHARS - 1)}…` : text);
const px = (n: number) => `${Math.round(n * 10) / 10}px`;
const fmt = (n: number) => `${Math.round(n * 100) / 100}`;
const sectionOf = (s: string | null) => s ?? NO_SECTION;

export function compare(input: CompareInput): Comparison {
  const { page, reference: ref, build, config, deviations } = input;
  const tol = config.tolerances;
  const path = build.path;
  const width = ref.width;
  const gaps: Gap[] = [];

  const gap = (section: string, check: Check, anchor: string, expected: string | null, actual: string | null, detail: string) =>
    gaps.push({
      page,
      path,
      width,
      section,
      dimension: CHECKS[check],
      check,
      anchor,
      expected,
      actual,
      message: `${path} ${section} @${width} "${short(anchor)}": ${detail}`,
    });

  // ---- Sections ----------------------------------------------------------------------------------
  const refSectionIds = new Set<string>(ref.sections.map((s) => s.id));
  if ([...ref.runs, ...ref.links, ...ref.media].some((x) => x.section === null)) refSectionIds.add(NO_SECTION);
  const buildSectionIds = new Set<string>(build.sections.map((s) => s.id));
  if ([...build.runs, ...build.links, ...build.media].some((x) => x.section === null)) buildSectionIds.add(NO_SECTION);

  const mapped = (refSection: string): string | undefined => config.sectionMap[refSection];
  const expectedBuildSections = new Map<string, string>(); // Build id → Reference id, for Sections on this page
  for (const id of refSectionIds) {
    const b = mapped(id);
    if (b !== undefined) expectedBuildSections.set(b, id);
  }
  const present = (refSection: string) => {
    const b = mapped(refSection);
    return b !== undefined && buildSectionIds.has(b);
  };
  /** The Reference Section a Build item belongs to, or its own Build id when it has no counterpart. */
  const gapSectionOfBuild = (s: string | null) => expectedBuildSections.get(sectionOf(s)) ?? sectionOf(s);
  const inMappedSection = (s: string | null) => expectedBuildSections.has(sectionOf(s));

  for (const id of refSectionIds) {
    const b = mapped(id);
    if (b === undefined) gap(id, 'section-missing', id, null, null, 'Section missing: no entry in the Section map');
    else if (!buildSectionIds.has(b)) gap(id, 'section-missing', id, `data-section="${b}"`, null, `Section missing: no Build Section data-section="${b}"`);
  }
  for (const id of buildSectionIds) {
    if (expectedBuildSections.has(id)) continue;
    const detail =
      id === NO_SECTION
        ? 'Build content outside any Section: add data-section to its block root'
        : `Build Section data-section="${id}" has no Reference Section on this page`;
    gap(id, 'section-extra', id, null, id, detail);
  }
  for (const s of ref.sections) {
    const b = build.sections.find((x) => x.id === mapped(s.id));
    if (!b) continue;
    const off = (e: number, a: number) => Math.abs(a - e) > Math.max(tol.sectionSizePx, tol.sectionSizeRatio * e);
    if (off(s.box.w, b.box.w) || off(s.box.h, b.box.h)) {
      const e = `${px(s.box.w)}×${px(s.box.h)}`;
      const a = `${px(b.box.w)}×${px(b.box.h)}`;
      gap(s.id, 'section-size', s.id, e, a, `Section size ${a}, expected ${e}`);
    }
  }

  // ---- Text runs ---------------------------------------------------------------------------------
  const refText = ref.runs.map((r) => rendered(r.text, r.style.transform));
  const buildText = build.runs.map((r) => rendered(r.text, r.style.transform));
  const inScope = (refRun: TextRun, buildRun: TextRun) => mapped(sectionOf(refRun.section)) === sectionOf(buildRun.section);

  type Pair = { b: number; full: boolean };
  const pairs = new Map<number, Pair>();
  const claimed = new Set<number>();
  const copyChecked = new Set<number>(); // Reference runs whose copy was compared at block level

  const copyGaps = (section: string, expected: string, actual: string) => {
    const d = copyDifference(expected, actual);
    if (d.punctuation) gap(section, 'punctuation', expected, expected, actual, `punctuation "${short(actual)}", expected "${short(expected)}"`);
    if (d.case) gap(section, 'case', expected, expected, actual, `case "${short(actual)}", expected "${short(expected)}"`);
  };

  // Stage A: whole blocks (paragraphs) with the same letters. The two sites may split a paragraph into
  // phrase runs differently (a green lead-in), so runs are aligned inside the block by character offset.
  const blocksOf = (snap: PageSnapshot, texts: string[]) =>
    snap.blocks.map((_, i) => {
      const members = snap.runs.map((r, j) => ({ r, j })).filter(({ r }) => r.block === i);
      let offset = 0;
      const spans = members.map(({ j }) => {
        const len = letterKey(texts[j]).length;
        const span = { run: j, start: offset, end: offset + len };
        offset += len;
        return span;
      });
      return {
        index: i,
        section: snap.blocks[i].section,
        key: members.map(({ j }) => letterKey(texts[j])).join(''),
        spans,
        text: members.map(({ j }) => texts[j]).join(' '),
      };
    });
  const refBlocks = blocksOf(ref, refText).filter((b) => b.key.length > 0);
  const buildBlocks = blocksOf(build, buildText).filter((b) => b.key.length > 0);
  const pairedBuildBlocks = new Set<number>();
  for (const scope of ['section', 'page'] as const) {
    for (const rb of refBlocks) {
      if (rb.spans.some((s) => pairs.has(s.run))) continue;
      const bb = buildBlocks.find(
        (b) =>
          !pairedBuildBlocks.has(b.index) &&
          b.key === rb.key &&
          b.spans.every((s) => !claimed.has(s.run)) &&
          (scope === 'page' || mapped(sectionOf(rb.section)) === sectionOf(b.section))
      );
      if (!bb) continue;
      pairedBuildBlocks.add(bb.index);
      for (const s of bb.spans) claimed.add(s.run);
      const usedEmpty = new Set<number>();
      for (const s of rb.spans) {
        if (s.end === s.start) {
          // A run of punctuation only (a full stop in its own colour, an arrow glyph) has no letters to
          // align: pair it with the same glyph in the block, else with the run it sits against.
          const same = bb.spans.find((t) => !usedEmpty.has(t.run) && copyKey(buildText[t.run]) === copyKey(refText[s.run]));
          const near = same ?? bb.spans.find((t) => t.start <= s.start && s.start <= t.end);
          if (!near) continue;
          if (same) usedEmpty.add(same.run);
          pairs.set(s.run, { b: near.run, full: Boolean(same) });
          copyChecked.add(s.run);
          continue;
        }
        let best: { run: number; overlap: number } | null = null;
        for (const t of bb.spans) {
          const overlap = Math.min(s.end, t.end) - Math.max(s.start, t.start);
          if (overlap > 0 && (!best || overlap > best.overlap)) best = { run: t.run, overlap };
        }
        if (!best) continue;
        const t = bb.spans.find((x) => x.run === best.run)!;
        pairs.set(s.run, { b: best.run, full: t.start === s.start && t.end === s.end });
        copyChecked.add(s.run);
      }
      copyGaps(sectionOf(ref.runs[rb.spans[0].run].section), rb.text, bb.text);
    }
  }

  // Stage B: single runs, by exact text, then quote/dash/case-normalised text, then letters only:
  // inside the mapped Section first, then anywhere on the page.
  const tiers: ((t: string) => string)[] = [(t) => t, copyKey, letterKey];
  for (const scope of ['section', 'page'] as const) {
    for (const key of tiers) {
      ref.runs.forEach((r, i) => {
        if (pairs.has(i)) return;
        const k = key(refText[i]);
        if (k.length === 0) return;
        const j = build.runs.findIndex((b, jj) => !claimed.has(jj) && key(buildText[jj]) === k && (scope === 'page' || inScope(r, b)));
        if (j < 0) return;
        pairs.set(i, { b: j, full: true });
        claimed.add(j);
      });
    }
  }

  // Stage C: one site splits text across elements the other keeps together (company and role on one
  // line). Inside the mapped Section, a long enough text found within the other side's run pairs with it.
  ref.runs.forEach((r, i) => {
    if (pairs.has(i)) return;
    const j = build.runs.findIndex((b, jj) => {
      if (claimed.has(jj) || !inScope(r, b)) return false;
      const [long, shortText] = wordKey(refText[i]).length >= wordKey(buildText[jj]).length ? [refText[i], buildText[jj]] : [buildText[jj], refText[i]];
      return wordKey(shortText).length >= config.matching.containMinChars && containsWords(long, shortText);
    });
    if (j >= 0) pairs.set(i, { b: j, full: false });
  });
  for (const p of pairs.values()) claimed.add(p.b);

  // Stage D: changed copy. An unmatched Reference run and an unmatched Build run in one Section whose
  // words mostly agree are the same element with edited text. Like stage C it never looks outside the
  // mapped Section: page-wide, "2025 Alexander Blum" in the footer would pair with the header's logo text.
  const candidates: { i: number; j: number; score: number }[] = [];
  ref.runs.forEach((r, i) => {
    if (pairs.has(i)) return;
    build.runs.forEach((b, j) => {
      if (claimed.has(j) || !inScope(r, b)) return;
      const score = wordOverlap(refText[i], buildText[j]);
      if (score >= config.matching.fuzzyCopy) candidates.push({ i, j, score });
    });
  });
  candidates.sort((a, b) => b.score - a.score || a.i - b.i);
  for (const c of candidates) {
    if (pairs.has(c.i) || claimed.has(c.j)) continue;
    pairs.set(c.i, { b: c.j, full: false });
    claimed.add(c.j);
    copyChecked.add(c.i);
    gap(sectionOf(ref.runs[c.i].section), 'copy-changed', refText[c.i], refText[c.i], buildText[c.j], `copy changed to "${short(buildText[c.j])}"`);
  }

  // Compare every pair.
  const resolveFamily = (f: string) => {
    const name = familyName(f);
    return (config.fontFamilyAliases[name] ?? name).toLowerCase();
  };
  ref.runs.forEach((r, i) => {
    const section = sectionOf(r.section);
    const pair = pairs.get(i);
    if (!pair) {
      gap(section, 'copy-missing', refText[i], refText[i], null, 'copy missing: no Build text matches');
      return;
    }
    const b = build.runs[pair.b];
    const anchor = refText[i];
    if (pair.full && !copyChecked.has(i)) copyGaps(section, refText[i], buildText[pair.b]);

    const e = r.style;
    const a = b.style;
    if (resolveFamily(e.family) !== resolveFamily(a.family))
      gap(section, 'font-family', anchor, e.family, familyName(a.family), `font-family ${familyName(a.family)}, expected ${e.family}`);
    if (Math.abs(e.size - a.size) > tol.fontSizePx)
      gap(section, 'font-size', anchor, px(e.size), px(a.size), `font-size ${px(a.size)}, expected ${px(e.size)}`);
    const lh = (v: number | null) => (v === null ? 'normal' : px(v));
    if (
      (e.lineHeight === null) !== (a.lineHeight === null) ||
      (e.lineHeight !== null && a.lineHeight !== null && Math.abs(e.lineHeight - a.lineHeight) > tol.lineHeightPx)
    )
      gap(section, 'line-height', anchor, lh(e.lineHeight), lh(a.lineHeight), `line-height ${lh(a.lineHeight)}, expected ${lh(e.lineHeight)}`);
    if (Math.abs(e.weight - a.weight) > tol.fontWeight)
      gap(section, 'font-weight', anchor, `${e.weight}`, `${a.weight}`, `font-weight ${a.weight}, expected ${e.weight}`);
    if (Math.abs(e.tracking - a.tracking) > tol.trackingPx)
      gap(section, 'tracking', anchor, px(e.tracking), px(a.tracking), `tracking ${px(a.tracking)}, expected ${px(e.tracking)}`);
    const ec = parseColour(e.color);
    const ac = parseColour(a.color);
    if (ec && ac ? colourDistance(ec, ac) > tol.colorDeltaE : e.color !== a.color)
      gap(section, 'color', anchor, formatColour(e.color), formatColour(a.color), `color ${formatColour(a.color)}, expected ${formatColour(e.color)}`);
    if (e.fontStyle !== a.fontStyle) gap(section, 'font-style', anchor, e.fontStyle, a.fontStyle, `font-style ${a.fontStyle}, expected ${e.fontStyle}`);
    if (Math.abs(r.opacity - b.opacity) > tol.opacity)
      gap(section, 'opacity', anchor, fmt(r.opacity), fmt(b.opacity), `opacity ${fmt(b.opacity)}, expected ${fmt(r.opacity)}`);

    if (!present(section)) return; // the missing Section is the Gap; positions inside it can't be compared
    if (!inScope(r, b)) {
      const where = gapSectionOfBuild(b.section);
      gap(section, 'wrong-section', anchor, section, where, `in Section ${where}, expected ${section}`);
      return;
    }
    if (!pair.full || !r.local || !b.local) return;
    const dx = b.local.x - r.local.x;
    const dy = b.local.y - r.local.y;
    if (Math.abs(dx) > tol.positionPx || Math.abs(dy) > tol.positionPx) {
      const ep = `${px(r.local.x)}, ${px(r.local.y)}`;
      const ap = `${px(b.local.x)}, ${px(b.local.y)}`;
      gap(section, 'position', anchor, ep, ap, `position ${ap} in Section, expected ${ep}`);
    }
    if ((r.lines > 1 || b.lines > 1) && Math.abs(b.box.w - r.box.w) > Math.max(tol.widthPx, tol.widthRatio * r.box.w))
      gap(section, 'width', anchor, px(r.box.w), px(b.box.w), `width ${px(b.box.w)}, expected ${px(r.box.w)}`);
    if (Math.abs(b.lines - r.lines) > tol.lines) gap(section, 'lines', anchor, `${r.lines}`, `${b.lines}`, `wraps onto ${b.lines} lines, expected ${r.lines}`);
  });
  build.runs.forEach((b, j) => {
    if (claimed.has(j) || !inMappedSection(b.section)) return;
    gap(gapSectionOfBuild(b.section), 'copy-extra', buildText[j], null, buildText[j], 'copy extra: not on the Reference site');
  });

  // ---- Links -------------------------------------------------------------------------------------
  const destination = (l: Link, origin: string) => {
    let p = l.path;
    if (p === null) {
      const u = new URL(l.href);
      if (u.origin === ref.origin || u.origin === origin) p = u.pathname + u.search + u.hash;
      else return l.href.replace(/\/$/, '');
    }
    return p.length > 1 ? p.replace(/\/(?=$|[?#])/, '') : p;
  };
  const target = (t: string | null) => (t && t !== '_self' ? t : 'none');
  const linkLabel = (l: Link) => (l.text || l.href).replace(/\s+/g, ' ').trim();
  const claimedLinks = new Set<number>();
  const linkPairs = new Map<number, number>();
  for (const scope of ['section', 'page'] as const) {
    ref.links.forEach((l, i) => {
      if (linkPairs.has(i)) return;
      const dest = destination(l, ref.origin);
      const j = build.links.findIndex(
        (b, jj) => !claimedLinks.has(jj) && destination(b, build.origin) === dest && (scope === 'page' || mapped(sectionOf(l.section)) === sectionOf(b.section))
      );
      if (j < 0) return;
      linkPairs.set(i, j);
      claimedLinks.add(j);
    });
  }
  ref.links.forEach((l, i) => {
    const section = sectionOf(l.section);
    const j = linkPairs.get(i);
    const dest = destination(l, ref.origin);
    if (j === undefined) {
      gap(section, 'link-missing', linkLabel(l), `${dest} (target ${target(l.target)})`, null, `link missing: expected → ${dest} (target ${target(l.target)})`);
      return;
    }
    const b = build.links[j];
    if (target(l.target) !== target(b.target))
      gap(section, 'link-target', linkLabel(l), target(l.target), target(b.target), `link → ${dest} target ${target(b.target)}, expected ${target(l.target)}`);
  });
  build.links.forEach((b, j) => {
    if (claimedLinks.has(j) || !inMappedSection(b.section)) return;
    const dest = destination(b, build.origin);
    gap(gapSectionOfBuild(b.section), 'link-extra', linkLabel(b), null, dest, `link extra: → ${dest} is not on the Reference site`);
  });

  // ---- Media -------------------------------------------------------------------------------------
  const group = (m: Media) => (m.kind === 'video' ? 'video' : m.kind === 'iframe' ? 'iframe' : 'image');
  const file = (src: string) => {
    if (src.startsWith('data:')) return `${src.slice(0, src.search(/[;,]/))} URL`; // e.g. an inline SVG gradient
    try {
      return new URL(src).pathname.split('/').pop() || src;
    } catch {
      return src;
    }
  };
  const labels = (list: Media[]) => {
    const n = new Map<string, number>();
    return list.map((m) => {
      const k = `${sectionOf(m.section)}|${group(m)}`;
      n.set(k, (n.get(k) ?? 0) + 1);
      return `${group(m)} ${n.get(k)}`;
    });
  };
  const refLabels = labels(ref.media);
  const buildLabels = labels(build.media);
  const claimedMedia = new Set<number>();
  const mediaPairs = new Map<number, number>();
  // In page order of kind within the mapped Section. Media of a Section the Build lacks pair with Build
  // media outside every expected Section, so their size and playback are still compared.
  for (const sectionScoped of [true, false]) {
    ref.media.forEach((m, i) => {
      const section = sectionOf(m.section);
      if (mediaPairs.has(i) || present(section) !== sectionScoped) return;
      const j = build.media.findIndex(
        (b, jj) => !claimedMedia.has(jj) && group(b) === group(m) && (sectionScoped ? mapped(section) === sectionOf(b.section) : !inMappedSection(b.section))
      );
      if (j < 0) return;
      mediaPairs.set(i, j);
      claimedMedia.add(j);
    });
  }
  ref.media.forEach((m, i) => {
    const section = sectionOf(m.section);
    const label = refLabels[i];
    const j = mediaPairs.get(i);
    if (j === undefined) {
      gap(
        section,
        'media-missing',
        label,
        `${label} (${file(m.src)})`,
        null,
        `media missing: expected ${m.kind} ${px(m.box.w)}×${px(m.box.h)} (${file(m.src)})`
      );
      return;
    }
    const b = build.media[j];
    const off = (e: number, a: number) => Math.abs(a - e) > Math.max(tol.mediaSizePx, tol.mediaSizeRatio * e);
    if (off(m.box.w, b.box.w) || off(m.box.h, b.box.h)) {
      const e = `${px(m.box.w)}×${px(m.box.h)}`;
      const a = `${px(b.box.w)}×${px(b.box.h)}`;
      gap(section, 'media-size', label, e, a, `size ${a}, expected ${e}`);
    }
    if (present(section) && mapped(section) === sectionOf(b.section) && m.local && b.local) {
      if (Math.abs(b.local.x - m.local.x) > tol.positionPx || Math.abs(b.local.y - m.local.y) > tol.positionPx) {
        const e = `${px(m.local.x)}, ${px(m.local.y)}`;
        const a = `${px(b.local.x)}, ${px(b.local.y)}`;
        gap(section, 'media-position', label, e, a, `position ${a} in Section, expected ${e}`);
      }
    }
    if (Math.abs(b.radius - m.radius) > tol.mediaRadiusPx)
      gap(section, 'media-radius', label, px(m.radius), px(b.radius), `radius ${px(b.radius)}, expected ${px(m.radius)}`);
    if (m.kind === b.kind && m.fit !== b.fit) gap(section, 'media-fit', label, m.fit, b.fit, `fit ${b.fit}, expected ${m.fit}`);
    if (m.video && b.video) {
      const play = (v: NonNullable<Media['video']>) => `${v.autoplay ? 'autoplay' : 'no autoplay'}, ${v.pausedAfterView ? 'paused after view' : 'playing'}`;
      if (m.video.autoplay !== b.video.autoplay || m.video.pausedAfterView !== b.video.pausedAfterView)
        gap(section, 'video-autoplay', label, play(m.video), play(b.video), `${play(b.video)}, expected ${play(m.video)}`);
      const attrs = (['muted', 'controls', 'loop', 'playsInline'] as const).filter((k) => m.video![k] !== b.video![k]);
      if (attrs.length > 0) {
        const e = attrs.map((k) => `${k} ${m.video![k]}`).join(', ');
        const a = attrs.map((k) => `${k} ${b.video![k]}`).join(', ');
        gap(section, 'video-attributes', label, e, a, `${a}, expected ${e}`);
      }
    }
  });
  build.media.forEach((b, j) => {
    const section = gapSectionOfBuild(b.section);
    const forbidden = b.host !== null && config.forbiddenMediaHosts.find((h) => b.host === h || b.host!.endsWith(`.${h}`));
    if (forbidden) gap(section, 'media-host', buildLabels[j], `not ${forbidden}`, b.host, `served from ${b.host} (${b.src}): re-host it on the Build`);
    if (!claimedMedia.has(j) && inMappedSection(b.section))
      gap(section, 'media-extra', buildLabels[j], null, file(b.src), `media extra: ${b.kind} (${file(b.src)}) is not on the Reference site`);
  });

  // ---- Route -------------------------------------------------------------------------------------
  if (ref.status !== build.status) gap(PAGE_SECTION, 'status', path, `${ref.status}`, `${build.status}`, `status ${build.status}, expected ${ref.status}`);
  if (ref.title !== build.title) gap(PAGE_SECTION, 'title', path, ref.title, build.title, `title "${build.title}", expected "${ref.title}"`);

  // ---- Deviations --------------------------------------------------------------------------------
  const open: Gap[] = [];
  const suppressed: SuppressedGap[] = [];
  for (const g of gaps) {
    const d = deviations.find((dev) => deviationMatches(dev, g));
    if (d) suppressed.push({ gap: g, deviation: d.id });
    else open.push(g);
  }
  return { page, path, width, gaps: open, suppressed, matched: { runs: pairs.size, of: ref.runs.length } };
}

const select = (selector: Selector, values: string[], norm: (s: string) => string = (s) => s) => {
  const list = Array.isArray(selector) ? selector : [selector];
  return list.some((s) => s === '*' || values.some((v) => norm(v) === norm(s)));
};

/** True when the Deviation names this Gap: every selector matches. */
export function deviationMatches(d: Deviation, g: Gap): boolean {
  return select(d.page, [g.page]) && select(d.section, [g.section]) && select(d.check, [g.check, g.dimension]) && select(d.anchor, [g.anchor], copyKey);
}
