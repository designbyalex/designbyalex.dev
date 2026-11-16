/**
 * schema.org JSON-LD for the site (#179): `Person` and `WebSite` on the homepage, and a `CreativeWork` per
 * case study or story. Pure (no React/Next imports), so it unit-tests in plain Node. Every value comes from
 * content the site already shows; nothing here is written for search engines alone.
 */
import type { SiteSeoDefaults } from './metadata';

type JsonLdNode = Record<string, unknown>;
export type JsonLdGraph = { '@context': 'https://schema.org'; '@graph': JsonLdNode[] };

/** Hosts whose links in the footer are Alex's profiles, so they belong in `sameAs`. */
const PROFILE_HOSTS = [
  'linkedin.com',
  'github.com',
  'dribbble.com',
  'behance.net',
  'x.com',
  'twitter.com',
  'instagram.com',
  'medium.com',
  'read.cv',
];

const origin = (defaults: SiteSeoDefaults) => (defaults.baseUrl ?? '').replace(/\/$/, '');
const personId = (defaults: SiteSeoDefaults) => `${origin(defaults)}/#person`;
const websiteId = (defaults: SiteSeoDefaults) => `${origin(defaults)}/#website`;

/** The profile links among the footer's links (LinkedIn today), deduplicated. */
export function profileLinks(hrefs: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const href of hrefs) {
    if (!href) continue;
    let host: string;
    try {
      host = new URL(href).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }
    if (PROFILE_HOSTS.some((profile) => host === profile || host.endsWith(`.${profile}`))) out.add(href);
  }
  return [...out];
}

function person(defaults: SiteSeoDefaults, sameAs: string[] = []): JsonLdNode {
  return {
    '@type': 'Person',
    '@id': personId(defaults),
    name: defaults.siteName,
    url: `${origin(defaults)}/`,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export interface HomeStructuredDataInput {
  /** The home page's meta description, falling back to the site default. */
  description?: string | null;
  /** Footer link hrefs; the profile ones become the Person's `sameAs`. */
  links?: (string | null | undefined)[];
}

/** Homepage graph: the `WebSite` and the `Person` who makes it. */
export function buildHomeStructuredData(input: HomeStructuredDataInput, defaults: SiteSeoDefaults): JsonLdGraph {
  const description = input.description?.trim() || defaults.defaultDescription;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId(defaults),
        name: defaults.siteName,
        url: `${origin(defaults)}/`,
        description,
        publisher: { '@id': personId(defaults) },
        inLanguage: 'en',
      },
      { ...person(defaults, profileLinks(input.links ?? [])), description },
    ],
  };
}

export interface ProjectStructuredDataInput {
  title?: string | null;
  tagline?: string | null;
  slug: string;
}

/** A case study or story as a `CreativeWork`, authored by the site's `Person`, with its share card as image. */
export function buildProjectStructuredData(
  project: ProjectStructuredDataInput,
  defaults: SiteSeoDefaults
): JsonLdGraph {
  const url = `${origin(defaults)}/${project.slug}`;
  const description = project.tagline?.trim() || undefined;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${url}#work`,
        name: project.title?.trim() || defaults.siteName,
        ...(description ? { description } : {}),
        // The build-time share card (#111), the same image the page's Open Graph tags point at.
        image: `${origin(defaults)}/og/${project.slug}.jpg`,
        url,
        mainEntityOfPage: url,
        author: { '@id': personId(defaults) },
        inLanguage: 'en',
      },
      person(defaults),
    ],
  };
}

/**
 * Serialise for a `<script type="application/ld+json">`: `<` is escaped so copy containing `</script>`
 * can never close the tag early.
 */
export function serializeJsonLd(graph: JsonLdGraph): string {
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}
