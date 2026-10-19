import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPageMetadata, buildProjectMetadata } from './metadata';

/**
 * `siteDefaults` reads `NEXT_PUBLIC_SITE_URL` at module load, so each test
 * imports a fresh copy after (un)stubbing the environment.
 */
async function loadSiteDefaults() {
  vi.resetModules();
  return (await import('./site')).siteDefaults;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('siteDefaults', () => {
  it('reproduces the live <head> title and description verbatim', async () => {
    const defaults = await loadSiteDefaults();
    // Values copied from designbyalex.dev's <title> / <meta name="description"> (curly apostrophe included).
    expect(defaults.siteTitle).toBe('Alexander Blum | UX • Product Design');
    expect(defaults.defaultDescription).toBe(
      'Alex is a Sydney-based product designer with 3+ years’ experience crafting human-centred products.'
    );
  });

  it('points the share image at a committed file under public/', async () => {
    const defaults = await loadSiteDefaults();
    expect(defaults.defaultImage).toMatch(/^\/uploads\//);
    const onDisk = fileURLToPath(new URL(`../../public${defaults.defaultImage}`, import.meta.url));
    expect(existsSync(onDisk)).toBe(true);
  });

  it('defaults the origin to the production domain', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const defaults = await loadSiteDefaults();
    expect(defaults.baseUrl).toBe('https://designbyalex.dev');
  });

  it('lets NEXT_PUBLIC_SITE_URL point canonical and OG URLs at a preview deployment', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://portfolio-git-afk.vercel.app');
    const defaults = await loadSiteDefaults();
    expect(defaults.baseUrl).toBe('https://portfolio-git-afk.vercel.app');

    const meta = buildProjectMetadata({ title: 'Acacia Money', slug: 'acacia' }, defaults);
    expect(meta.alternates?.canonical).toBe('https://portfolio-git-afk.vercel.app/acacia');
  });
});

describe('siteDefaults through the metadata builders', () => {
  it('gives the homepage the live title, root canonical and absolute share image', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const defaults = await loadSiteDefaults();
    const meta = buildPageMetadata({ title: 'Home', slug: 'home' }, defaults);

    expect(meta.title).toBe('Alexander Blum | UX • Product Design');
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/');
    expect(meta.openGraph?.siteName).toBe('Alexander Blum');
    const ogImages = meta.openGraph?.images as { url: string }[];
    expect(ogImages[0].url).toBe('https://designbyalex.dev/uploads/home/og.png');
    expect(meta.twitter?.images).toEqual(['https://designbyalex.dev/uploads/home/og.png']);
  });

  it('templates a case study title and gives it its own canonical', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const defaults = await loadSiteDefaults();
    const meta = buildProjectMetadata(
      { title: 'MOS evolution', tagline: 'From manufacturing strength to brand strength.', slug: 'mosurban' },
      defaults
    );

    expect(meta.title).toBe('MOS evolution · Alexander Blum');
    expect(meta.description).toBe('From manufacturing strength to brand strength.');
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/mosurban');
  });
});
