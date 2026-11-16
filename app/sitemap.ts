import type { MetadataRoute } from 'next';
import client from '@/tina/__generated__/client';
import { collectBreadcrumbs } from '@/lib/tina/collect-breadcrumbs';
import { gitLastModified } from '@/lib/seo/last-modified';
import { buildSitemap, type LastModifiedBySlug } from '@/lib/seo/sitemap';
import { siteDefaults } from '@/lib/seo/site';

// Built once per deploy: `lastmod` comes from git (#179), which only the build has. Every Tina content
// commit redeploys, so the sitemap never goes stale between builds.
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.projectConnection({ after });
    return res.data.projectConnection;
  });
  const pageCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.pageConnection({ after });
    return res.data.pageConnection;
  });
  const projectSlugs = projectCrumbs.map((crumbs) => crumbs.join('/'));
  const pageSlugs = pageCrumbs.map((crumbs) => crumbs.join('/'));

  // A slug that is both a project and a page routes to the project (see [...urlSegments]/page.tsx), so the
  // project's date wins.
  const lastModified: LastModifiedBySlug = {};
  for (const slug of pageSlugs) lastModified[slug] = gitLastModified(`content/pages/${slug}.mdx`);
  for (const slug of projectSlugs) lastModified[slug] = gitLastModified(`content/projects/${slug}.mdx`);

  return buildSitemap(siteDefaults.baseUrl, projectSlugs, pageSlugs, lastModified);
}
