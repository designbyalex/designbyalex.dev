// What a Build comparison covers: every Reference page × Checkpoint width, plus the gate config's extra
// routes, each compared with its stand-in Reference page (e.g. `/about` with the 404).
import type { GateConfig } from './config.ts';
import type { ReferenceManifest } from './validate.ts';

export type Capture = ReferenceManifest['captures'][number];

export interface Target {
  /** The Reference capture this route is compared with. */
  capture: Capture;
  /** The Build path that is extracted. */
  path: string;
}

export interface TargetFilter {
  /** Reference page keys or Build paths; null for all. */
  pages?: string[] | null;
  widths?: number[] | null;
}

export function parityTargets(manifest: ReferenceManifest, config: GateConfig, filter: TargetFilter = {}): Target[] {
  const { pages, widths } = filter;
  return [
    ...manifest.captures.map((c) => ({ capture: c, path: c.path })),
    ...Object.entries(config.extraRoutes).flatMap(([path, page]) => manifest.captures.filter((c) => c.page === page).map((c) => ({ capture: c, path }))),
  ].filter(({ capture, path }) => (!pages || pages.includes(capture.page) || pages.includes(path)) && (!widths || widths.includes(capture.width)));
}

/** A file-name stem for a Build path: `home` for `/`, `parity-reference-missing-page` for the 404 route. */
export const pathSlug = (path: string) => path.replace(/^\/|\/$/g, '').replace(/\W+/g, '-') || 'home';
