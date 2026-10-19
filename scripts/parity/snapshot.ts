// The parity snapshot format: what the extractor returns for one page at one Checkpoint width.
// The frozen Reference snapshot (parity/reference/) and every Build snapshot the Fidelity gate takes
// share this shape, so the comparator (#49) and the gate (#50) read it as their contract.
// Field-by-field reference: parity/reference/README.md. Bump SNAPSHOT_FORMAT on any breaking change.

export const SNAPSHOT_FORMAT = 1;

export const CHECKPOINT_WIDTHS = [390, 768, 1440] as const;
export type CheckpointWidth = (typeof CHECKPOINT_WIDTHS)[number];

// Viewport height per Checkpoint width (the audit's devices). Full-viewport sections depend on it.
export const VIEWPORT_HEIGHT: Record<CheckpointWidth, number> = { 390: 844, 768: 1024, 1440: 900 };

/** CSS px in page coordinates, measured with the page scrolled to the top. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Position relative to the top-left of the containing Section's box. */
export interface Local {
  x: number;
  y: number;
}

export interface TextStyle {
  /** First family in the computed font-family stack, unquoted. */
  family: string;
  /** px */
  size: number;
  /** px, or null when the computed value is `normal`. */
  lineHeight: number | null;
  weight: number;
  /** letter-spacing in px (`normal` is 0). */
  tracking: number;
  /** Computed colour as the browser serialises it, e.g. `rgb(166, 166, 166)`. */
  color: string;
  /** CSS text-transform. Run text is the DOM text, before the transform. */
  transform: string;
  /** CSS font-style. */
  fontStyle: string;
}

export interface Section {
  /** Unique within the snapshot: the name, plus ` 2`, ` 3`… for repeated names. */
  id: string;
  /** The Section's name: Framer's layer name on the Reference site, `data-section` on the Build. */
  name: string;
  /** 1-based among Sections sharing this name, in page order. */
  occurrence: number;
  box: Box;
}

/** One leaf text run: contiguous text inside one block with one computed style. */
export interface TextRun {
  /** DOM text with whitespace collapsed, before text-transform. */
  text: string;
  /** Index into `blocks`. */
  block: number;
  /** Section id, or null when the run sits in no Section. */
  section: string | null;
  box: Box;
  local: Local | null;
  /** Number of line boxes the run wraps onto. */
  lines: number;
  style: TextStyle;
  /** Effective opacity (product over ancestors). Text at opacity 0 is not visible and is left out. */
  opacity: number;
  /** Index into `links` when the run is inside a link. */
  link: number | null;
}

/** The nearest block-level box around one or more runs, e.g. a paragraph whose phrases are coloured. */
export interface TextBlock {
  /** All of the block's runs joined, whitespace collapsed. */
  text: string;
  tag: string;
  section: string | null;
  box: Box;
  local: Local | null;
}

export interface Link {
  /** textContent with whitespace collapsed, falling back to aria-label. */
  text: string;
  /** Absolute URL. */
  href: string;
  /** pathname + search + hash when the link stays on the page's origin, else null. */
  path: string | null;
  target: string | null;
  rel: string | null;
  section: string | null;
  box: Box;
  local: Local | null;
}

export interface VideoPlayback {
  autoplay: boolean;
  muted: boolean;
  controls: boolean;
  loop: boolean;
  playsInline: boolean;
  poster: string | null;
  /** `video.paused` after the video was scrolled into view and given time to start. */
  pausedAfterView: boolean;
}

export type MediaKind = 'image' | 'video' | 'background' | 'iframe';

export interface Media {
  kind: MediaKind;
  /** Absolute URL of the resource actually loaded (currentSrc where the element has one). */
  src: string;
  /** Hostname of `src`, or null for data: URLs. */
  host: string | null;
  alt: string | null;
  section: string | null;
  /** Rendered size and position. */
  box: Box;
  local: Local | null;
  /** Intrinsic size, when the browser knows it. */
  natural: { w: number; h: number } | null;
  /** CSS object-fit (or background-size for backgrounds). */
  fit: string;
  /** Largest corner radius in px on the element or a clipping wrapper of the same size. */
  radius: number;
  video: VideoPlayback | null;
}

export interface PageSnapshot {
  format: typeof SNAPSHOT_FORMAT;
  /** URL requested. */
  url: string;
  /** URL after redirects. */
  finalUrl: string;
  origin: string;
  path: string;
  width: number;
  viewport: { w: number; h: number };
  /** documentElement.clientWidth; less than `width` if a scrollbar took space. */
  clientWidth: number;
  colorScheme: 'dark' | 'light';
  reducedMotion: 'reduce';
  status: number;
  title: string;
  /** `<meta name="generator">`, e.g. "Framer 1a2b3c4"; null when absent. */
  generator: string | null;
  /** documentElement.scrollHeight after the scroll-through. */
  pageHeight: number;
  /** Font families that finished loading, sorted. */
  fonts: string[];
  capturedAt: string;
  /** Browser name and version that rendered the page. */
  browser: string;
  sections: Section[];
  blocks: TextBlock[];
  runs: TextRun[];
  links: Link[];
  media: Media[];
}
