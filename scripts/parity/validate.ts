// Runtime checks that JSON read from disk has the snapshot types' shape (scripts/parity/snapshot.ts),
// so the comparator never runs on a malformed or stale-format snapshot. Errors name the offending path.
import { type PageSnapshot, SNAPSHOT_FORMAT } from './snapshot.ts';

type Check = (v: unknown, path: string) => void;

const fail = (path: string, what: string): never => {
  throw new Error(`${path}: expected ${what}`);
};
const num: Check = (v, p) => (typeof v === 'number' && Number.isFinite(v) ? undefined : fail(p, 'a number'));
const str: Check = (v, p) => (typeof v === 'string' ? undefined : fail(p, 'a string'));
const bool: Check = (v, p) => (typeof v === 'boolean' ? undefined : fail(p, 'a boolean'));
const nullable =
  (c: Check): Check =>
  (v, p) =>
    v === null ? undefined : c(v, p);
const oneOf =
  (...values: unknown[]): Check =>
  (v, p) =>
    values.includes(v) ? undefined : fail(p, `one of ${values.map((x) => JSON.stringify(x)).join(', ')}`);
const arr =
  (c: Check): Check =>
  (v, p) => {
    if (!Array.isArray(v)) fail(p, 'an array');
    (v as unknown[]).forEach((x, i) => c(x, `${p}[${i}]`));
  };
const obj =
  (shape: Record<string, Check>): Check =>
  (v, p) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(p, 'an object');
    for (const [k, c] of Object.entries(shape)) c((v as Record<string, unknown>)[k], p ? `${p}.${k}` : k);
  };

const box = obj({ x: num, y: num, w: num, h: num });
const local = nullable(obj({ x: num, y: num }));
const section = nullable(str);

const pageSnapshot = obj({
  format: oneOf(SNAPSHOT_FORMAT),
  url: str,
  finalUrl: str,
  origin: str,
  path: str,
  width: num,
  viewport: obj({ w: num, h: num }),
  clientWidth: num,
  colorScheme: oneOf('dark', 'light'),
  reducedMotion: oneOf('reduce'),
  status: num,
  title: str,
  generator: nullable(str),
  pageHeight: num,
  fonts: arr(str),
  capturedAt: str,
  browser: str,
  sections: arr(obj({ id: str, name: str, occurrence: num, box })),
  blocks: arr(obj({ text: str, tag: str, section, box, local })),
  runs: arr(
    obj({
      text: str,
      block: num,
      section,
      box,
      local,
      lines: num,
      style: obj({ family: str, size: num, lineHeight: nullable(num), weight: num, tracking: num, color: str, transform: str, fontStyle: str }),
      opacity: num,
      link: nullable(num),
    })
  ),
  links: arr(obj({ text: str, href: str, path: nullable(str), target: nullable(str), rel: nullable(str), section, box, local })),
  media: arr(
    obj({
      kind: oneOf('image', 'video', 'background', 'iframe'),
      src: str,
      host: nullable(str),
      alt: nullable(str),
      section,
      box,
      local,
      natural: nullable(obj({ w: num, h: num })),
      fit: str,
      radius: num,
      video: nullable(obj({ autoplay: bool, muted: bool, controls: bool, loop: bool, playsInline: bool, poster: nullable(str), pausedAfterView: bool })),
    })
  ),
});

/** Throws, naming the first bad field, unless `json` is a PageSnapshot of the current format. */
export function parsePageSnapshot(json: unknown): PageSnapshot {
  pageSnapshot(json, '');
  return json as PageSnapshot;
}

/** parity/reference/manifest.json, written by capture-reference.ts. */
export interface ReferenceManifest {
  format: typeof SNAPSHOT_FORMAT;
  origin: string;
  capturedAt: string;
  browser: string;
  captures: {
    /** Page key, e.g. `acacia`; Gaps and Deviations name pages by it. */
    page: string;
    path: string;
    width: number;
    snapshot: string;
    screenshot: string;
    screenshotScale: number;
    status: number;
    pageHeight: number;
    sections: string[];
  }[];
}

const manifest = obj({
  format: oneOf(SNAPSHOT_FORMAT),
  origin: str,
  capturedAt: str,
  browser: str,
  captures: arr(
    obj({ page: str, path: str, width: num, snapshot: str, screenshot: str, screenshotScale: num, status: num, pageHeight: num, sections: arr(str) })
  ),
});

export function parseManifest(json: unknown): ReferenceManifest {
  manifest(json, '');
  return json as ReferenceManifest;
}

export { arr, bool, fail, num, obj, oneOf, str, type Check as ShapeCheck };
