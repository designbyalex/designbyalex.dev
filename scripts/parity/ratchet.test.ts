import { describe, expect, it } from 'vitest';
import { type Dimension, zeroCounts } from './checks';
import type { Comparison, Gap } from './compare';
import { type Counts, baselineRaised, countGaps, formatBaseline, parseBaseline, parseParityScope, ratchet } from './ratchet';

const ticket = (scope: string) => `## What to build

Make it match.

## Parity scope

${scope}

## Acceptance criteria

- [ ] It matches (see / · Hero · Type in the notes)
`;

describe('parseParityScope', () => {
  it('reads page · Section · Dimensions lines, with comma lists', () => {
    expect(parseParityScope(ticket('- /acacia · Project Hero, Overview · Layout, Type'))).toEqual([
      { text: '/acacia · Project Hero, Overview · Layout, Type', pages: ['/acacia'], sections: ['Project Hero', 'Overview'], dimensions: ['Layout', 'Type'] },
    ]);
  });

  it('reads `all` for the page, the Section or the Dimensions', () => {
    expect(parseParityScope(ticket('- all · all · all'))).toEqual([
      { text: 'all · all · all', pages: 'all', sections: 'all', dimensions: ['Copy', 'Media', 'Layout', 'Type', 'Theme', 'Contrast'] },
    ]);
  });

  it('reads every line, and nothing outside the section', () => {
    const scope = parseParityScope(ticket('- /acacia · CTA · Copy\n- /mosurban · CTA · Copy'));
    expect(scope.map((l) => l.pages)).toEqual([['/acacia'], ['/mosurban']]);
  });

  it('returns no lines when the ticket has no Parity scope', () => {
    expect(parseParityScope('## What to build\n\n- / · Hero · Type\n')).toEqual([]);
  });

  it('matches Dimension names in any case', () => {
    expect(parseParityScope(ticket('- 404 · all · copy, MEDIA'))[0].dimensions).toEqual(['Copy', 'Media']);
  });

  it('rejects a line without three parts', () => {
    expect(() => parseParityScope(ticket('- /acacia · Layout'))).toThrow(/"\/acacia · Layout": expected "page · Section · Dimensions"/);
  });

  it('rejects a Dimension the gate does not check', () => {
    expect(() => parseParityScope(ticket('- all · all · Layout, motion'))).toThrow(
      /unknown Dimension "motion" \(the gate checks Copy, Media, Layout, Type, Theme, Contrast\)/
    );
  });

  it('reads the Net-new theme Dimensions', () => {
    expect(parseParityScope(ticket('- all · all · Theme (light vs dark), contrast'))[0].dimensions).toEqual(['Theme', 'Contrast']);
  });
});

type Row = [path: string, section: string, width: number, counts: Partial<Record<Dimension, number>>];
const PAGES: Record<string, string> = { '/': 'home', '/acacia': 'acacia', '/about': 'not-found', '/parity-reference-missing-page': 'not-found' };

/** Gap counts from rows; a Dimension a row leaves out is 0. */
const counts = (...rows: Row[]): Counts => {
  const out: Counts = {};
  for (const [path, section, width, c] of rows) {
    const page = (out[path] ??= { page: PAGES[path], sections: {} });
    (page.sections[section] ??= {})[width] = { ...zeroCounts(), ...c };
  }
  return out;
};
const scope = (...lines: string[]) => parseParityScope(ticket(lines.map((l) => `- ${l}`).join('\n')));

describe('ratchet', () => {
  const baseline = counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);

  it('fails while a scoped Section still has Gaps', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, { Type: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);
    const result = ratchet({ baseline, counts: now, scope: scope('/acacia · Mission · Type, Copy') });
    expect(result.pass).toBe(false);
    expect(result.failures).toEqual([{ kind: 'scoped', path: '/acacia', section: 'Section Mission', width: 1440, dimension: 'Type', baseline: 3, count: 1 }]);
    expect(result.reason).toContain('/acacia Section Mission @1440 Type: 1 Gap left, the Parity scope needs 0');
    expect(result.baseline).toBe(baseline);
  });

  it('fails when an unscoped count rose', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, {}], ['/acacia', 'Section Trust', 1440, { Layout: 3 }]);
    const result = ratchet({ baseline, counts: now, scope: scope('/acacia · Mission · all') });
    expect(result.pass).toBe(false);
    expect(result.failures).toEqual([{ kind: 'rose', path: '/acacia', section: 'Section Trust', width: 1440, dimension: 'Layout', baseline: 2, count: 3 }]);
    expect(result.reason).toContain('/acacia Section Trust @1440 Layout: 3 Gaps, the Baseline allows 2');
  });

  it('counts a Dimension the Baseline had at 0 as a rise', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1, Media: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);
    expect(ratchet({ baseline, counts: now, scope: [] }).failures).toMatchObject([{ kind: 'rose', dimension: 'Media', baseline: 0, count: 1 }]);
  });

  it('passes on equal or lower counts and yields them as the new Baseline', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, { Type: 2, Copy: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);
    const result = ratchet({ baseline, counts: now, scope: [] });
    expect(result).toMatchObject({ pass: true, failures: [] });
    expect(result.baseline).toEqual(now);
    expect(result.reason).toBe('Baseline held: 1 count lower (6 → 5 Gaps), none rose');
  });

  it('passes a scoped Section that reached 0', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, {}], ['/acacia', 'Section Trust', 1440, { Layout: 1 }]);
    const result = ratchet({ baseline, counts: now, scope: scope('/acacia · Mission · all') });
    expect(result.pass).toBe(true);
    expect(result.baseline).toEqual(now);
  });

  it('starts a Section the Baseline has never seen at its first count', () => {
    const now = counts(
      ['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }],
      ['/acacia', 'Section Trust', 1440, { Layout: 2 }],
      ['/acacia', 'case-study-section', 1440, { Layout: 1 }]
    );
    const result = ratchet({ baseline, counts: now, scope: [] });
    expect(result.pass).toBe(true);
    expect(result.baseline).toEqual(now);
    expect(result.reason).toBe('Baseline held: none lower (6 → 7 Gaps), none rose, 1 new Section');
  });

  it('keeps a Section the run no longer has in the new Baseline, at 0', () => {
    const now = counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }]);
    const result = ratchet({ baseline, counts: now, scope: [] });
    expect(result.pass).toBe(true);
    expect(result.baseline).toEqual(counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }], ['/acacia', 'Section Trust', 1440, {}]));
    expect(result.reason).toBe('Baseline held: 1 count lower (6 → 4 Gaps), none rose');
  });

  it('passes on a first run with no Baseline, taking the counts as the Baseline', () => {
    const result = ratchet({ baseline: null, counts: baseline, scope: [] });
    expect(result.pass).toBe(true);
    expect(result.baseline).toEqual(baseline);
  });

  it('still holds a new Section in the Parity scope to 0', () => {
    const now = counts(['/', 'Hero Content', 390, { Type: 1 }]);
    expect(ratchet({ baseline: null, counts: now, scope: scope('/ · Hero · Type') }).failures).toMatchObject([{ kind: 'scoped' }]);
  });

  it('fails when a page and width in the Baseline was not compared', () => {
    const now = counts(['/acacia', 'Section Mission', 390, { Type: 3, Copy: 1 }]);
    expect(ratchet({ baseline, counts: now, scope: [] }).failures).toEqual([
      { kind: 'not-compared', path: '/acacia', section: null, width: 1440, dimension: null, baseline: 6, count: null },
    ]);
  });

  it('fails a Parity scope line that names no Section the run compared', () => {
    const result = ratchet({ baseline, counts: baseline, scope: scope('/acacia · Mision · Type') });
    expect(result.pass).toBe(false);
    expect(result.reason).toContain('Parity scope line "/acacia · Mision · Type" matches no compared page and Section');
  });

  describe('Parity scope matching', () => {
    const now = counts(
      ['/', 'Hero Content', 1440, { Type: 1 }],
      ['/', 'Project Row', 1440, { Type: 1 }],
      ['/', 'Project Row 2', 1440, { Type: 1 }],
      ['/acacia', 'Section Overview', 1440, { Type: 1 }],
      ['/acacia', '(page)', 1440, { Copy: 1 }],
      ['/about', '(page)', 1440, { Copy: 1 }],
      ['/parity-reference-missing-page', '(none)', 1440, { Copy: 1 }]
    );
    const scoped = (...lines: string[]) =>
      ratchet({ baseline: null, counts: now, scope: scope(...lines) })
        .failures.filter((f) => f.kind === 'scoped')
        .map((f) => `${f.path} ${f.section}`);

    it('matches a Section by its name without the "Section " prefix', () => {
      expect(scoped('/acacia · Overview · Type')).toEqual(['/acacia Section Overview']);
    });

    it('matches every repeat of a Section name', () => {
      expect(scoped('/ · Project Row · Type')).toEqual(['/ Project Row', '/ Project Row 2']);
    });

    it('matches a Section by the first words of its name', () => {
      expect(scoped('/ · Hero · Type')).toEqual(['/ Hero Content']);
    });

    it('matches a page by its Reference key, and 404 to every route compared with the 404', () => {
      expect(scoped('acacia · all · Copy')).toEqual(['/acacia (page)']);
      expect(scoped('404 · all · Copy')).toEqual(['/about (page)', '/parity-reference-missing-page (none)']);
    });

    it('matches only the scoped Dimensions', () => {
      expect(scoped('all · all · Copy')).toEqual(['/acacia (page)', '/about (page)', '/parity-reference-missing-page (none)']);
    });
  });
});

describe('countGaps', () => {
  const gap = (section: string, dimension: Gap['dimension']): Gap =>
    ({ page: 'acacia', path: '/acacia', width: 1440, section, dimension, check: 'font-size', anchor: 'x', expected: null, actual: null, message: '' }) as Gap;
  const comparison = (gaps: Gap[]): Comparison => ({ page: 'acacia', path: '/acacia', width: 1440, gaps, suppressed: [], matched: { runs: 0, of: 0 } });

  it('counts Gaps per path, Section, width and Dimension, and lists compared Sections without Gaps at 0', () => {
    const c = comparison([gap('Section Mission', 'Type'), gap('Section Mission', 'Type'), gap('text 3', 'Layout')]);
    expect(countGaps([c], () => ['Section Mission', 'Section Trust'])).toEqual(
      counts(['/acacia', 'Section Mission', 1440, { Type: 2 }], ['/acacia', 'Section Trust', 1440, {}], ['/acacia', 'text 3', 1440, { Layout: 1 }])
    );
  });
});

describe('Baseline file', () => {
  it('round-trips the counts', () => {
    const c = counts(['/', 'Hero Content', 390, { Type: 2 }], ['/', 'Hero Content', 1440, { Copy: 1 }]);
    expect(parseBaseline(JSON.parse(formatBaseline(c)))).toEqual(c);
  });

  it('rejects a malformed file, naming the field', () => {
    expect(() => parseBaseline({ format: 1, counts: { '/': { page: 'home', sections: { Hero: { 390: { Copy: 'x' } } } } } })).toThrow(
      /counts\.\/\.sections\.Hero\.390\.Copy: expected a number/
    );
  });
});

describe('baselineRaised', () => {
  const before = counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);

  it('lists a count the new Baseline raised', () => {
    const after = counts(['/acacia', 'Section Mission', 1440, { Type: 4, Copy: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);
    expect(baselineRaised(before, after)).toEqual([{ path: '/acacia', section: 'Section Mission', width: 1440, dimension: 'Type', before: 3, after: 4 }]);
  });

  it('accepts lower and equal counts', () => {
    const after = counts(['/acacia', 'Section Mission', 1440, { Type: 1 }], ['/acacia', 'Section Trust', 1440, { Layout: 2 }]);
    expect(baselineRaised(before, after)).toEqual([]);
  });

  it('lists a page, Section or width the new Baseline removed', () => {
    const after = counts(['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }]);
    expect(baselineRaised(before, after)).toEqual([{ path: '/acacia', section: 'Section Trust', width: 1440, dimension: null, before: 2, after: null }]);
  });

  it('accepts a new Section at its first count', () => {
    const after = counts(
      ['/acacia', 'Section Mission', 1440, { Type: 3, Copy: 1 }],
      ['/acacia', 'Section Trust', 1440, { Layout: 2 }],
      ['/acacia', 'case-study-section', 1440, { Layout: 5 }]
    );
    expect(baselineRaised(before, after)).toEqual([]);
  });

  it('accepts any first Baseline', () => {
    expect(baselineRaised(null, before)).toEqual([]);
  });
});
