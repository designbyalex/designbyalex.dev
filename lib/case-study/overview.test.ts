import { describe, expect, it } from 'vitest';
import { buildOverviewRows, collaboratorLines, roleSentence, splitTrailingNote } from './overview';

describe('splitTrailingNote', () => {
  it('splits a trailing parenthetical into a muted note', () => {
    expect(splitTrailingNote('Brand strategy platform (purpose, values, tone of voice)')).toEqual({
      text: 'Brand strategy platform',
      note: '(purpose, values, tone of voice)',
    });
  });

  it('leaves text without a trailing parenthetical whole', () => {
    expect(splitTrailingNote('Information architecture & user flows')).toEqual({ text: 'Information architecture & user flows' });
    expect(splitTrailingNote('Responsive (mobile) website')).toEqual({ text: 'Responsive (mobile) website' });
  });

  it('keeps a value that is only a parenthetical, and trims whitespace', () => {
    expect(splitTrailingNote('(WCAG AA)')).toEqual({ text: '(WCAG AA)' });
    expect(splitTrailingNote('  SEO and accessibility implementation (WCAG AA)  ')).toEqual({
      text: 'SEO and accessibility implementation',
      note: '(WCAG AA)',
    });
  });
});

describe('roleSentence', () => {
  it('joins the role and its description into one sentence', () => {
    expect(roleSentence(['Product Designer'], 'Worked closely with CEO.')).toBe('Product Designer. Worked closely with CEO.');
  });

  it('does not double the full stop and handles missing parts', () => {
    expect(roleSentence(['Product Designer.'], 'Worked closely with CEO.')).toBe('Product Designer. Worked closely with CEO.');
    expect(roleSentence(['Product Designer'], '  ')).toBe('Product Designer');
    expect(roleSentence(['Lead', 'Researcher'], null)).toBe('Lead, Researcher');
    expect(roleSentence([], 'Description only')).toBe('Description only');
  });
});

describe('collaboratorLines', () => {
  it('formats "Name (Role)" one per line and skips nameless entries', () => {
    expect(
      collaboratorLines([
        { name: 'Anil Sagaram', role: 'Founder & CEO' },
        { name: 'Pat Abadilla', role: 'Software Engineer' },
        { name: null, role: 'Ghost' },
        { name: 'Solo' },
        null,
      ])
    ).toEqual([{ text: 'Anil Sagaram (Founder & CEO)' }, { text: 'Pat Abadilla (Software Engineer)' }, { text: 'Solo' }]);
  });
});

describe('buildOverviewRows', () => {
  it('builds the Acacia rows in the Reference order', () => {
    const rows = buildOverviewRows({
      typology: ['Fintech & Sustainability'],
      product: 'B2B2C SaaS Platform',
      role: ['Product Designer'],
      roleDescription: 'Worked closely with CEO across UX & business strategy.',
      timeline: 'Q3 2023 – Q2 2025',
      collaborators: [{ name: 'Anil Sagaram', role: 'Founder & CEO' }],
    });
    expect(rows.map((r) => r.label)).toEqual(['Typology', 'Product', 'Role', 'Timeline', 'Collaborators']);
    expect(rows[2].lines).toEqual([{ text: 'Product Designer. Worked closely with CEO across UX & business strategy.' }]);
  });

  it('builds the MOS Urban rows with tools and noted deliverables', () => {
    const rows = buildOverviewRows({
      typology: ['Furniture Manufacturing'],
      role: ['Full-Stack Designer'],
      roleDescription: 'Leading end-to-end strategy.',
      timeline: 'Q3 2024 – Q4 2025',
      tools: ['Figma', 'Webflow CMS', null, ''],
      deliverables: ['Brand strategy platform (purpose, values, tone of voice)', 'Information architecture & user flows'],
    });
    expect(rows.map((r) => r.key)).toEqual(['typology', 'role', 'timeline', 'tools', 'deliverables']);
    expect(rows[3].lines).toEqual([{ text: 'Figma, Webflow CMS' }]);
    expect(rows[4].lines).toEqual([
      { text: 'Brand strategy platform', note: '(purpose, values, tone of voice)' },
      { text: 'Information architecture & user flows' },
    ]);
  });

  it('omits empty rows entirely', () => {
    expect(buildOverviewRows({})).toEqual([]);
    expect(buildOverviewRows({ typology: [null, ' '], collaborators: [{ role: 'x' }], deliverables: [] })).toEqual([]);
  });
});
