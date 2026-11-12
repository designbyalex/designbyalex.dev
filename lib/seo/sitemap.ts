import type { MetadataRoute } from 'next';

/** Tina's home page document, which the site serves at `/` rather than `/home`. */
const HOME_SLUG = 'home';

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * `/sitemap.xml` entries (#15, #125): the homepage first, then one per project
 * slug and one per page slug other than home (the home document is served at
 * `/`). Framer's sitemap listed only `/`; this adds the case studies — and now
 * /work — it never did.
 */
export function buildSitemap(baseUrl: string, projectSlugs: string[], pageSlugs: string[] = []): MetadataRoute.Sitemap {
  const slugs = [...new Set([...projectSlugs, ...pageSlugs])].filter((slug) => slug && slug !== HOME_SLUG).sort();
  return [joinUrl(baseUrl, '/'), ...slugs.map((slug) => joinUrl(baseUrl, slug))].map((url) => ({ url }));
}

/** `/robots.txt`, matching Framer's: allow everything, point at the sitemap. */
export function buildRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: joinUrl(baseUrl, 'sitemap.xml'),
  };
}
