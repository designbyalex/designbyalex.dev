// The Fidelity gate's owner-maintained inputs: the gate config (tolerances, matching thresholds, the
// Section map) and the Deviation list. Both are committed JSON under parity/ and only the site owner
// edits them (ADR 0002); the loop fails an unattended commit that touches them.
import { CHECKS, DIMENSIONS } from './checks.ts';
import { type ShapeCheck, arr, fail, num, obj, str } from './validate.ts';

/** Allowed differences between a Build value and its Reference value. */
export interface Tolerances {
  /** Section-relative x and y of a text run or media item, px. */
  positionPx: number;
  /** Width of a wrapping text run: allowed is max(widthPx, widthRatio × Reference width). */
  widthPx: number;
  widthRatio: number;
  /** Line boxes a run wraps onto. */
  lines: number;
  fontSizePx: number;
  lineHeightPx: number;
  trackingPx: number;
  fontWeight: number;
  /** Colour distance in OKLab × 100 (about 2 is a just-noticeable difference). */
  colorDeltaE: number;
  /** Effective opacity of a text run. */
  opacity: number;
  /** Section width and height: allowed is max(sectionSizePx, sectionSizeRatio × Reference size). */
  sectionSizePx: number;
  sectionSizeRatio: number;
  /** Rendered media width and height: allowed is max(mediaSizePx, mediaSizeRatio × Reference size). */
  mediaSizePx: number;
  mediaSizeRatio: number;
  mediaRadiusPx: number;
}

export interface Matching {
  /** Word-overlap (Dice) score at which an unmatched Reference run and Build run in one Section pair as changed copy. */
  fuzzyCopy: number;
  /** Shortest text, in characters, that may match inside a longer run when the two sites split text differently. */
  containMinChars: number;
}

/**
 * Reference Section id (Framer layer name, `Project Row 2` for repeats) → Build Section id (`data-section`,
 * with the same ` 2` suffix for repeats). `(none)` stands for text outside any Section.
 */
export type SectionMap = Record<string, string>;

export interface GateConfig {
  tolerances: Tolerances;
  matching: Matching;
  /** Reference family → the Build family that stands in for it (ADR 0003: Inter's optical size replaces Inter Display). */
  fontFamilyAliases: Record<string, string>;
  /** Media hosts the Build may not load from; subdomains count. */
  forbiddenMediaHosts: string[];
  sectionMap: SectionMap;
  /** Build routes with no Reference page of their own → the Reference page they must match (e.g. `/about` → `not-found`). */
  extraRoutes: Record<string, string>;
}

/** One value, a list of values, or `*` for any. */
export type Selector = string | string[];

/**
 * An approved Deviation: the Gaps it names stop counting. It matches a Gap when every selector matches:
 * `page` (Reference page key), `section` (Reference Section id, `(page)` for status and title), `check` (a
 * check name, or a Dimension for all of its checks) and `anchor` (the Gap's element text, compared after
 * quote/dash/case normalisation).
 */
export interface Deviation {
  id: string;
  page: Selector;
  section: Selector;
  check: Selector;
  anchor: Selector;
  /** The owner's decision this entry records, and where it was made. */
  decision: string;
}

export const NO_SECTION = '(none)';
/** The Section of page-level Gaps (status, title). */
export const PAGE_SECTION = '(page)';

// ---- Parsing the committed JSON ------------------------------------------------------------------

const record =
  (c: ShapeCheck): ShapeCheck =>
  (v, p) => {
    obj({})(v, p);
    for (const [k, x] of Object.entries(v as object)) c(x, `${p}.${k}`);
  };
const nonEmpty: ShapeCheck = (v, p) => (typeof v === 'string' && v.trim().length > 0 ? undefined : fail(p, 'a non-empty string'));
const selector: ShapeCheck = (v, p) => {
  if (Array.isArray(v)) {
    if (v.length === 0) fail(p, 'a non-empty list');
    arr(nonEmpty)(v, p);
  } else nonEmpty(v, p);
};

const TOLERANCE_KEYS: (keyof Tolerances)[] = [
  'positionPx',
  'widthPx',
  'widthRatio',
  'lines',
  'fontSizePx',
  'lineHeightPx',
  'trackingPx',
  'fontWeight',
  'colorDeltaE',
  'opacity',
  'sectionSizePx',
  'sectionSizeRatio',
  'mediaSizePx',
  'mediaSizeRatio',
  'mediaRadiusPx',
];

const gateConfig = obj({
  tolerances: obj(Object.fromEntries(TOLERANCE_KEYS.map((k) => [k, num]))),
  matching: obj({ fuzzyCopy: num, containMinChars: num }),
  fontFamilyAliases: record(str),
  forbiddenMediaHosts: arr(nonEmpty),
  sectionMap: record(nonEmpty),
  extraRoutes: record(nonEmpty),
});

/** Throws, naming the first bad field, unless `json` is a valid gate config. */
export function parseGateConfig(json: unknown): GateConfig {
  gateConfig(json, '');
  return json as GateConfig;
}

const KNOWN_CHECKS = new Set<string>([...Object.keys(CHECKS), ...DIMENSIONS, '*']);

/** Throws, naming the first bad entry, unless `json` is `{ deviations: Deviation[] }` with unique ids and known checks. */
export function parseDeviations(json: unknown): Deviation[] {
  obj({
    deviations: arr((v, p) => {
      obj({ id: nonEmpty, page: selector, section: selector, check: selector, anchor: selector, decision: nonEmpty })(v, p);
      const check = (v as Deviation).check;
      for (const c of Array.isArray(check) ? check : [check]) if (!KNOWN_CHECKS.has(c)) throw new Error(`${p}.check: unknown check "${c}"`);
    }),
  })(json, '');
  const list = (json as { deviations: Deviation[] }).deviations;
  const ids = list.map((d) => d.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`deviations: duplicate id "${dup}"`);
  return list;
}
