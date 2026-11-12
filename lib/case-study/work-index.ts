/**
 * Pure Work-index builder (#125) — no React/Tina imports so it can be
 * unit-tested in a plain Node environment, like the other case-study helpers.
 *
 * /work lists every Project document in the order the next-project resolver
 * walks them (`order` ascending, ties by title, no order last), each marked as
 * a case study or a story. The Tina `format` field is optional: a project that
 * predates it (Acacia, MOS Urban) counts as a case study.
 */

import { sortProjects, type ProjectCardRef } from './next-project';

/** How /work labels a project: the Tina `format` field's two values. */
export type WorkFormat = 'case-study' | 'story';

/** A project as the Work index reads it: a card ref plus the optional Tina format. */
export interface WorkProjectRef extends ProjectCardRef {
  format?: string | null;
}

/** One /work entry: the card fields, the resolved format and the page it links to. */
export interface WorkIndexEntry extends ProjectCardRef {
  format: WorkFormat;
  href: string;
}

/** Normalise the optional Tina field: anything but an explicit `story` is a case study. */
export function resolveWorkFormat(format: string | null | undefined): WorkFormat {
  return format === 'story' ? 'story' : 'case-study';
}

/**
 * Every project in display order, formats resolved, each linked to its page.
 * A project without a slug has no page to link to and is skipped.
 */
export function buildWorkIndex(projects: readonly WorkProjectRef[]): WorkIndexEntry[] {
  return sortProjects(projects.filter((p) => p.slug)).map(({ format, ...card }) => ({
    ...card,
    format: resolveWorkFormat(format),
    href: `/${card.slug}`,
  }));
}
