import { describe, expect, it } from 'vitest';
import {
  buildHomeStructuredData,
  buildProjectStructuredData,
  profileLinks,
  serializeJsonLd,
} from './structured-data';
import { siteDefaults } from './site';

const defaults = { ...siteDefaults, baseUrl: 'https://designbyalex.dev' };

describe('profileLinks', () => {
  it('keeps profile links and drops mail, documents and site paths', () => {
    expect(
      profileLinks([
        '/',
        'mailto:someone@example.com',
        'https://www.linkedin.com/in/someone/',
        'https://drive.google.com/file/d/abc/view',
        'https://www.linkedin.com/in/someone/',
        null,
        'not a url',
      ])
    ).toEqual(['https://www.linkedin.com/in/someone/']);
  });
});

describe('buildHomeStructuredData', () => {
  const graph = buildHomeStructuredData(
    { description: 'Home description.', links: ['https://www.linkedin.com/in/someone/', '/'] },
    defaults
  );
  const [website, person] = graph['@graph'];

  it('describes the WebSite, published by the Person', () => {
    expect(graph['@context']).toBe('https://schema.org');
    expect(website).toMatchObject({
      '@type': 'WebSite',
      name: 'Alexander Blum',
      url: 'https://designbyalex.dev/',
      description: 'Home description.',
      publisher: { '@id': 'https://designbyalex.dev/#person' },
    });
  });

  it('describes the Person with their profiles', () => {
    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': 'https://designbyalex.dev/#person',
      name: 'Alexander Blum',
      url: 'https://designbyalex.dev/',
      sameAs: ['https://www.linkedin.com/in/someone/'],
    });
  });

  it('falls back to the site description', () => {
    const [site] = buildHomeStructuredData({}, defaults)['@graph'];
    expect(site.description).toBe(defaults.defaultDescription);
  });
});

describe('buildProjectStructuredData', () => {
  it('describes a case study as a CreativeWork by the Person, with its share card', () => {
    const graph = buildProjectStructuredData({ title: 'Acacia', tagline: 'A tagline.', slug: 'acacia' }, defaults);
    expect(graph['@graph'][0]).toMatchObject({
      '@type': 'CreativeWork',
      name: 'Acacia',
      description: 'A tagline.',
      image: 'https://designbyalex.dev/og/acacia.jpg',
      url: 'https://designbyalex.dev/acacia',
      author: { '@id': 'https://designbyalex.dev/#person' },
    });
    expect(graph['@graph'][1]).toMatchObject({ '@type': 'Person', '@id': 'https://designbyalex.dev/#person' });
  });

  it('omits a missing tagline rather than inventing one', () => {
    const [work] = buildProjectStructuredData({ title: 'Acacia', slug: 'acacia' }, defaults)['@graph'];
    expect(work).not.toHaveProperty('description');
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so copy cannot close the script tag', () => {
    const graph = buildProjectStructuredData({ title: '</script><b>', slug: 'x' }, defaults);
    const json = serializeJsonLd(graph);
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><b>');
  });
});
