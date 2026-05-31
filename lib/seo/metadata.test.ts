import { describe, expect, it } from 'vitest';
import { buildProjectMetadata } from './metadata';

const defaults = {
  siteName: 'designbyalex.dev',
  titleTemplate: '%s · Alexander Blum',
  defaultDescription: 'Sydney-based product designer.',
  baseUrl: 'https://designbyalex.dev',
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

  it('resolves a relative cover image to an absolute OG/Twitter image', () => {
    const meta = buildProjectMetadata(
      { title: 'Acacia', coverImage: '/uploads/projects/acacia.png', slug: 'acacia' },
      defaults
    );
    const ogImages = meta.openGraph?.images as { url: string }[];
    expect(ogImages[0].url).toBe('https://designbyalex.dev/uploads/projects/acacia.png');
    expect(meta.twitter?.images).toEqual(['https://designbyalex.dev/uploads/projects/acacia.png']);
    expect(meta.alternates?.canonical).toBe('https://designbyalex.dev/acacia');
  });

  it('leaves absolute image URLs untouched', () => {
    const meta = buildProjectMetadata(
      { title: 'Acacia', coverImage: 'https://cdn.example.com/a.png' },
      defaults
    );
    const ogImages = meta.openGraph?.images as { url: string }[];
    expect(ogImages[0].url).toBe('https://cdn.example.com/a.png');
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
});
