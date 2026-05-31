/**
 * Pure next/previous-project resolver — no React/Tina imports so it can be
 * unit-tested in a plain Node environment.
 *
 * Projects are ordered by an explicit numeric `order` field (timeline is free-text
 * and not reliably sortable). Navigation wraps around cyclically so the last project
 * links back to the first.
 */

export interface ProjectRef {
  slug: string;
  title: string;
  order?: number | null;
}

export interface AdjacentProjects {
  next: ProjectRef | null;
  prev: ProjectRef | null;
}

/**
 * Sort projects by `order` ascending. Projects without an order sink to the end,
 * and ties break alphabetically by title so the result is fully deterministic.
 */
export function sortProjects<T extends ProjectRef>(projects: readonly T[]): T[] {
  return [...projects].sort((a, b) => {
    const ao = Number.isFinite(a.order as number) ? (a.order as number) : Number.POSITIVE_INFINITY;
    const bo = Number.isFinite(b.order as number) ? (b.order as number) : Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Resolve the projects immediately after and before `currentSlug` in sorted order,
 * wrapping cyclically. Returns `null` for both when the slug is unknown or when it is
 * the only project (no meaningful neighbour to link to).
 */
export function resolveAdjacentProjects<T extends ProjectRef>(
  projects: readonly T[],
  currentSlug: string
): { next: T | null; prev: T | null } {
  const sorted = sortProjects(projects);
  const index = sorted.findIndex((p) => p.slug === currentSlug);
  if (index === -1 || sorted.length < 2) return { next: null, prev: null };

  const next = sorted[(index + 1) % sorted.length];
  const prev = sorted[(index - 1 + sorted.length) % sorted.length];
  return { next, prev };
}
