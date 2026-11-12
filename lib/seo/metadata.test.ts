import { describe, expect, it } from 'vitest';
import { buildPageMetadata, buildProjectMetadata } from './metadata';

const defaults = {
  siteName: 'designbyalex.dev',
  titleTemplate: '%s · Alexander Blum',
  defaultDescription: 'Sydney-based product designer.',
  baseUrl: 'https://designbyalex.dev',
};

const withSiteImage = {
  ...defaults,
  siteTitle: 'Alexander Blum | UX • Product Design',
  defaultImage: '/uploads/home/og.jpg',
};

describe('buildProjectMetadata', () => {
  it('applies the title template and uses the tagline as description', () => {
    const meta = buildProjectMetadata(
      { title: 'Acacia', tagline: 'One system, every surface.', slug: 'acacia' },
      defaults
    );
    expect(meta.title).toBe('Acacia · Alexander Blum');
    expect(meta.description).toBe('One system, every surface.');
    expect(meta.openGraph?.title).toBe('Acacia · Alexander Blum');
    expect((meta.openGraph as { type?: string }).type).toBe('article');
  });

  it('points OG and Twitter at the project’s generated share card, with size and alt', () => {
    const meta = buildProjectMetadata({ title: 'Acacia', slug: 'acacia' }, defaults);
    const card = {
      url: 'https://designbyalex.dev/og/acacia.jpg',
      alt: 'Acacia · Alexander Blum',
      width: 1200,
      height: 630,
    };
    expect(meta.openGraph?.images).toEqual([card]);
    expect(meta.twitter?.images).toEqual([card]);
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/acacia');
  });

  it('falls back to site defaults when fields are missing', () => {
    const meta = buildProjectMetadata({}, defaults);
    expect(meta.title).toBe('designbyalex.dev · Alexander Blum');
    expect(meta.description).toBe('Sydney-based product designer.');
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it('omits URL fields when no baseUrl is configured', () => {
    const meta = buildProjectMetadata(
      { title: 'Acacia', slug: 'acacia' },
      { siteName: 'X', defaultDescription: 'd' }
    );
    expect(meta.openGraph?.title).toBe('Acacia');
    expect(meta.alternates).toBeUndefined();
  });

  it('falls back to the site share image only when there is no slug', () => {
    const meta = buildProjectMetadata({ title: 'Acacia' }, withSiteImage);
    const ogImages = meta.openGraph?.images as { url: string }[];
    expect(ogImages[0].url).toBe('https://designbyalex.dev/uploads/home/og.jpg');
    expect(meta.twitter?.images).toEqual(['https://designbyalex.dev/uploads/home/og.jpg']);
  });
});

describe('buildPageMetadata', () => {
  it('gives the homepage the verbatim site title and the root canonical', () => {
    const meta = buildPageMetadata({ title: 'Home', slug: 'home' }, withSiteImage);
    expect(meta.title).toBe('Alexander Blum | UX • Product Design');
    expect(meta.description).toBe('Sydney-based product designer.');
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/');
    expect((meta.openGraph as { type?: string }).type).toBe('website');
    expect(meta.openGraph?.url).toBe('https://designbyalex.dev/');
  });

  it('treats an empty slug as the homepage', () => {
    const meta = buildPageMetadata({ title: 'Home' }, withSiteImage);
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/');
  });

  it('templates other pages and uses their own description', () => {
    const meta = buildPageMetadata({ title: 'About', description: 'Who I am.', slug: 'about' }, withSiteImage);
    expect(meta.title).toBe('About · Alexander Blum');
    expect(meta.description).toBe('Who I am.');
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/about');
  });

  it('resolves the site share image for OG and Twitter', () => {
    const meta = buildPageMetadata({ title: 'Home', slug: 'home' }, withSiteImage);
    const ogImages = meta.openGraph?.images as { url: string; alt: string }[];
    expect(ogImages[0].url).toBe('https://designbyalex.dev/uploads/home/og.jpg');
    expect(ogImages[0].alt).toBe('Alexander Blum | UX • Product Design');
    expect(meta.twitter?.images).toEqual(['https://designbyalex.dev/uploads/home/og.jpg']);
  });

  it('falls back to the site name as title when no site title is set', () => {
    const meta = buildPageMetadata({ slug: 'home' }, defaults);
    expect(meta.title).toBe('designbyalex.dev');
    expect(meta.openGraph?.images).toBeUndefined();
  });
});
