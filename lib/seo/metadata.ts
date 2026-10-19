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

export interface PageSeoInput {
  title?: string | null;
  description?: string | null;
  /** Share image; falls back to the site default. */
  image?: string | null;
  /**
   * URL path, e.g. "about". The homepage is "" or "home" (its document is
   * `home.mdx` but it routes to `/`).
   */
  slug?: string | null;
}

export interface SiteSeoDefaults {
  siteName: string;
  /**
   * Full title for the homepage (and the <title> fallback), used verbatim
   * without the template, e.g. "Alexander Blum | UX • Product Design".
   */
  siteTitle?: string;
  /** Title template using `%s` as the page-title placeholder, e.g. "%s · Alex". */
  titleTemplate?: string;
  defaultDescription: string;
  /** Share image used when a document has none (absolute or site-relative). */
  defaultImage?: string;
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

const isHomeSlug = (slug: string | null | undefined) => !slug || slug === 'home';

interface ResolvedSeo {
  title: string;
  description: string;
  url?: string;
  image?: string;
  imageAlt: string;
}

/** Shared assembly: resolved strings → Next `Metadata` with OG/Twitter/canonical. */
function assemble(seo: ResolvedSeo, type: 'website' | 'article', defaults: SiteSeoDefaults): Metadata {
  const { title, description, url, image, imageAlt } = seo;
  const images = image ? [{ url: image, alt: imageAlt }] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type,
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
  const image = absoluteUrl(project.coverImage || defaults.defaultImage, defaults.baseUrl);

  return assemble({ title, description, url, image, imageAlt: baseTitle }, 'article', defaults);
}

/**
 * Build Next.js `Metadata` for a marketing page. The homepage (slug "" / "home")
 * uses the site title verbatim and the site root as its canonical URL; other
 * pages go through the title template like projects do.
 */
export function buildPageMetadata(page: PageSeoInput, defaults: SiteSeoDefaults): Metadata {
  const home = isHomeSlug(page.slug);
  const baseTitle = page.title?.trim() || defaults.siteName;
  const title = home ? defaults.siteTitle || baseTitle : applyTitleTemplate(baseTitle, defaults.titleTemplate);
  const description = page.description?.trim() || defaults.defaultDescription;

  let url: string | undefined;
  if (defaults.baseUrl) {
    url = home ? `${defaults.baseUrl.replace(/\/$/, '')}/` : absoluteUrl(page.slug, defaults.baseUrl);
  }
  const image = absoluteUrl(page.image || defaults.defaultImage, defaults.baseUrl);

  return assemble({ title, description, url, image, imageAlt: home ? title : baseTitle }, 'website', defaults);
}
