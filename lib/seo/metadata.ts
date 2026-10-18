/**
 * Pure SEO metadata builder — no React/Next runtime imports (only the `Metadata`
 * type, which is erased at compile time), so it can be unit-tested in a plain Node
 * environment and reused by `generateMetadata`.
 */
import type { Metadata } from 'next';

export interface ProjectSeoInput {
  title?: string | null;
  tagline?: string | null;
  coverImage?: string | null;
  /** URL path segment, e.g. "acacia". */
  slug?: string | null;
}

export interface SiteSeoDefaults {
  siteName: string;
  /** Title template using `%s` as the page-title placeholder, e.g. "%s · Alex". */
  titleTemplate?: string;
  defaultDescription: string;
  /** Absolute origin (no trailing slash) used to resolve canonical/OG URLs. */
  baseUrl?: string;
}

/** Apply a "%s"-style template, falling back to the bare title when absent. */
function applyTitleTemplate(title: string, template?: string): string {
  if (!template) return title;
  return template.includes('%s') ? template.replace('%s', title) : `${title} ${template}`;
}

/** Resolve a possibly-relative asset/path into an absolute URL when a base is set. */
function absoluteUrl(path: string | null | undefined, baseUrl?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/**
 * Build Next.js `Metadata` for a project/case-study page, including Open Graph and
 * Twitter card tags. Missing fields fall back to the supplied site defaults.
 */
export function buildProjectMetadata(
  project: ProjectSeoInput,
  defaults: SiteSeoDefaults
): Metadata {
  const baseTitle = project.title?.trim() || defaults.siteName;
  const title = applyTitleTemplate(baseTitle, defaults.titleTemplate);
  const description = project.tagline?.trim() || defaults.defaultDescription;

  const url = project.slug && defaults.baseUrl ? absoluteUrl(project.slug, defaults.baseUrl) : undefined;
  const image = absoluteUrl(project.coverImage, defaults.baseUrl);
  const images = image ? [{ url: image, alt: baseTitle }] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: defaults.siteName,
      ...(url ? { url } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(url ? { alternates: { canonical: url } } : {}),
  };
}
