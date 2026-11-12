import { describe, expect, it } from 'vitest';
import { buildWorkIndex, resolveWorkFormat } from './work-index';

const slugs = (entries: ReturnType<typeof buildWorkIndex>) => entries.map((e) => e.slug);

describe('buildWorkIndex', () => {
  it('lists every project by order ascending', () => {
    const entries = buildWorkIndex([
      { slug: 'mosurban', title: 'MOS evolution', order: 2 },
      { slug: 'acacia', title: 'Acacia', order: 1 },
      { slug: 'welcomemat', title: 'WelcomeMat', order: 3 },
    ]);
    expect(slugs(entries)).toEqual(['acacia', 'mosurban', 'welcomemat']);
  });

  it('breaks order ties alphabetically by title', () => {
    const entries = buildWorkIndex([
      { slug: 'zeta', title: 'Zeta', order: 1 },
      { slug: 'alpha', title: 'Alpha', order: 1 },
    ]);
    expect(slugs(entries)).toEqual(['alpha', 'zeta']);
  });

  it('sinks projects without an order to the end', () => {
    const entries = buildWorkIndex([
      { slug: 'unordered', title: 'A unordered', order: null },
      { slug: 'ordered', title: 'Z ordered', order: 5 },
    ]);
    expect(slugs(entries)).toEqual(['ordered', 'unordered']);
  });

  it('marks a project with the field unset as a case study', () => {
    const [entry] = buildWorkIndex([{ slug: 'acacia', title: 'Acacia' }]);
    expect(entry.format).toBe('case-study');
  });

  it('keeps an explicit story a story and anything unknown a case study', () => {
    const entries = buildWorkIndex([
      { slug: 'a', title: 'A', order: 1, format: 'story' },
      { slug: 'b', title: 'B', order: 2, format: 'case-study' },
      { slug: 'c', title: 'C', order: 3, format: 'poem' },
    ]);
    expect(entries.map((e) => e.format)).toEqual(['story', 'case-study', 'case-study']);
  });

  it('links every entry to its page', () => {
    const entries = buildWorkIndex([{ slug: 'acacia', title: 'Acacia', order: 1 }]);
    expect(entries[0].href).toBe('/acacia');
  });

  it('skips a project with no slug — it has no page to link to', () => {
    const entries = buildWorkIndex([
      { slug: '', title: 'Draft', order: 1 },
      { slug: 'acacia', title: 'Acacia', order: 2 },
    ]);
    expect(slugs(entries)).toEqual(['acacia']);
  });

  it('returns an empty list for an empty collection', () => {
    expect(buildWorkIndex([])).toEqual([]);
  });

  it('carries the card fields through untouched', () => {
    const [entry] = buildWorkIndex([
      {
        slug: 'acacia',
        title: 'Acacia',
        order: 1,
        status: 'shipped',
        tagline: 'One-line summary.',
        thumbnail: '/uploads/projects/acacia/thumb.png',
        thumbnailAlt: 'The Acacia app.',
      },
    ]);
    expect(entry).toMatchObject({
      status: 'shipped',
      tagline: 'One-line summary.',
      thumbnail: '/uploads/projects/acacia/thumb.png',
      thumbnailAlt: 'The Acacia app.',
    });
  });
});

describe('resolveWorkFormat', () => {
  it('defaults unset, null and unknown values to case study', () => {
    expect(resolveWorkFormat(undefined)).toBe('case-study');
    expect(resolveWorkFormat(null)).toBe('case-study');
    expect(resolveWorkFormat('')).toBe('case-study');
    expect(resolveWorkFormat('novel')).toBe('case-study');
    expect(resolveWorkFormat('story')).toBe('story');
  });
});
