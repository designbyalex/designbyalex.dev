import type { MetadataRoute } from 'next';
import client from '@/tina/__generated__/client';
import { collectBreadcrumbs } from '@/lib/tina/collect-breadcrumbs';
import { buildSitemap } from '@/lib/seo/sitemap';
import { siteDefaults } from '@/lib/seo/site';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectCrumbs = await collectBreadcrumbs(async (after) => {
    const res = await client.queries.projectConnection({ after });
    return res.data.projectConnection;
  });
  return buildSitemap(
    siteDefaults.baseUrl,
    projectCrumbs.map((crumbs) => crumbs.join('/'))
  );
}
