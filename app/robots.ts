import type { MetadataRoute } from 'next';
import { buildRobots } from '@/lib/seo/sitemap';
import { siteDefaults } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  return buildRobots(siteDefaults.baseUrl);
}
