/**
 * Pure block-dispatch helpers — no React/Tina imports so they can be unit-tested
 * in a plain Node environment.
 *
 * Tina generates a distinct `__typename` per collection/template pair, e.g.
 * `PageBlocksHero` and `ProjectBlocksHero`. Both should map to the same `Hero`
 * component, so we key the registry by the trailing template name ("Hero") and
 * derive that name from the typename.
 */

/**
 * Extract the template key from a block `__typename`.
 *
 * `PageBlocksHero` -> `Hero`, `ProjectBlocksCallToAction` -> `CallToAction`.
 * Returns `null` for anything that isn't a recognisable block typename, which is
 * what lets the dispatcher safely ignore unknown/malformed blocks.
 */
export function blockTypeKey(typename?: string | null): string | null {
  if (typeof typename !== 'string') return null;
  const match = /Blocks([A-Za-z0-9]+)$/.exec(typename);
  return match ? match[1] : null;
}

/**
 * Resolve a block `__typename` to its registered value (component) using the
 * derived template key. Returns `null` when the typename is unknown/malformed or
 * has no entry in the registry — the dispatcher renders nothing in that case.
 */
export function resolveBlockComponent<T>(
  typename: string | null | undefined,
  registry: Record<string, T>
): T | null {
  const key = blockTypeKey(typename);
  if (key === null) return null;
  return Object.prototype.hasOwnProperty.call(registry, key) ? registry[key] : null;
}
