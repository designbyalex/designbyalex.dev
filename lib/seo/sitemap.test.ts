import { describe, expect, it } from 'vitest';
import { buildRobots, buildSitemap } from './sitemap';

const urls = (baseUrl: string, slugs: string[], pageSlugs?: string[]) =>
  buildSitemap(baseUrl, slugs, pageSlugs).map((entry) => entry.url);

describe('buildSitemap', () => {
  it('lists the homepage, then each case study', () => {
    expect(urls('https://designbyalex.dev', ['mosurban', 'acacia'])).toEqual([
      'https://designbyalex.dev/',
      'https://designbyalex.dev/acacia',
      'https://designbyalex.dev/mosurban',
    ]);
  });

  it('serves the home document at / rather than /home', () => {
    expect(urls('https://designbyalex.dev', ['home', 'acacia'])).toEqual([
      'https://designbyalex.dev/',
      'https://designbyalex.dev/acacia',
    ]);
  });

  it('lists /work from the page collection, with the home document still served at /', () => {
    expect(urls('https://designbyalex.dev', ['mosurban', 'acacia'], ['home', 'work'])).toEqual([
      'https://designbyalex.dev/',
      'https://designbyalex.dev/acacia',
      'https://designbyalex.dev/mosurban',
      'https://designbyalex.dev/work',
    ]);
  });

  it('drops duplicate and empty slugs', () => {
    expect(urls('https://designbyalex.dev', ['acacia', 'acacia', ''])).toEqual([
      'https://designbyalex.dev/',
      'https://designbyalex.dev/acacia',
    ]);
  });

  it('still lists the homepage with no projects', () => {
    expect(urls('https://designbyalex.dev', [])).toEqual(['https://designbyalex.dev/']);
  });

  it('resolves against a preview origin, with or without a trailing slash', () => {
    for (const base of ['https://portfolio-git-afk.vercel.app', 'https://portfolio-git-afk.vercel.app/']) {
      expect(urls(base, ['acacia'])).toEqual([
        'https://portfolio-git-afk.vercel.app/',
        'https://portfolio-git-afk.vercel.app/acacia',
      ]);
    }
  });
});

describe('buildRobots', () => {
  it('matches Framer: allow all crawlers and point at the sitemap', () => {
    expect(buildRobots('https://designbyalex.dev')).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://designbyalex.dev/sitemap.xml',
    });
  });

  it('points a preview deployment at its own sitemap', () => {
    expect(buildRobots('https://portfolio-git-afk.vercel.app/').sitemap).toBe(
      'https://portfolio-git-afk.vercel.app/sitemap.xml'
    );
  });
});
