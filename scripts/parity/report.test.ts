import { describe, expect, it } from 'vitest';
import type { Comparison, Gap } from './compare.ts';
import { formatReport } from './report.ts';

const gap = (over: Partial<Gap>): Gap => ({
  page: 'acacia',
  path: '/acacia',
  width: 1440,
  section: 'Section Credibility',
  dimension: 'Type',
  check: 'font-size',
  anchor: 'Body',
  expected: '14px',
  actual: '18px',
  message: 'm',
  ...over,
});
const comparison = (width: number, gaps: Gap[], suppressed: Comparison['suppressed'] = []): Comparison => ({
  page: 'acacia',
  path: '/acacia',
  width,
  gaps,
  suppressed,
  matched: { runs: 1, of: 1 },
});

describe('formatReport', () => {
  it('groups Gaps by page, Section, width and Dimension, with punctuation-only differences listed apart', () => {
    const text = formatReport([
      comparison(1440, [
        gap({ message: 'size @1440' }),
        gap({ dimension: 'Copy', check: 'punctuation', message: 'quote @1440' }),
        gap({ section: 'Footer', dimension: 'Layout', check: 'position', message: 'footer @1440' }),
      ]),
      comparison(
        390,
        [gap({ width: 390, dimension: 'Copy', check: 'copy-missing', message: 'missing @390' })],
        [{ gap: gap({ width: 390 }), deviation: 'dynamic-footer-year' }]
      ),
    ]);
    expect(text).toBe(
      [
        '/acacia (acacia): 3 Gaps, 1 punctuation-only, 1 suppressed',
        '  Section Credibility',
        '    @1440 Type',
        '      size @1440',
        '    @390 Copy',
        '      missing @390',
        '  Footer',
        '    @1440 Layout',
        '      footer @1440',
        '  Punctuation only',
        '      quote @1440',
        '  Suppressed by Deviations: dynamic-footer-year ×1',
        '',
        'Total: 3 Gaps, 1 punctuation-only, 1 suppressed',
        '',
      ].join('\n')
    );
  });
});
