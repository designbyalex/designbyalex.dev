import type { MetadataRoute } from 'next';

/** Tina's home page document, which the site serves at `/` rather than `/home`. */
const HOME_SLUG = 'home';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** A document's last-changed date by slug (`home` for `/`), as an ISO string or a Date. */
export type LastModifiedBySlug = Record<string, string | Date | undefined>;

/**
 * `/sitemap.xml` entries (#15, #125): the homepage first, then one per project
 * slug and one per page slug other than home (the home document is served at
 * `/`). Framer's sitemap listed only `/`; this adds the case studies — and now
 * /work — it never did. Each entry carries its document's `lastmod` when one is
 * known (#179).
 */
export function buildSitemap(
  baseUrl: string,
  projectSlugs: string[],
  pageSlugs: string[] = [],
  lastModified: LastModifiedBySlug = {}
): MetadataRoute.Sitemap {
  const slugs = [...new Set([...projectSlugs, ...pageSlugs])].filter((slug) => slug && slug !== HOME_SLUG).sort();
  return [
    { url: joinUrl(baseUrl, '/'), date: lastModified[HOME_SLUG] },
    ...slugs.map((slug) => ({ url: joinUrl(baseUrl, slug), date: lastModified[slug] })),
  ].map(({ url, date }) => (date ? { url, lastModified: date } : { url }));
}

/** `/robots.txt`, matching Framer's: allow everything, point at the sitemap. */
export function buildRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: joinUrl(baseUrl, 'sitemap.xml'),
  };
}
