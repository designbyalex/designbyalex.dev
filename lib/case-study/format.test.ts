import { describe, expect, it } from 'vitest';
import { formatMetric, formatMonthYear, formatTimelineRange } from './format';

describe('formatMetric', () => {
  it('formats percentages', () => {
    expect(formatMetric({ value: 40, kind: 'percentage' })).toBe('40%');
    expect(formatMetric({ value: 99, kind: 'percentage' })).toBe('99%');
  });

  it('formats signed deltas with typographic signs', () => {
    expect(formatMetric({ value: 40, kind: 'delta' })).toBe('+40%');
    expect(formatMetric({ value: -32, kind: 'delta' })).toBe('−32%');
    expect(formatMetric({ value: 0, kind: 'delta' })).toBe('0%');
  });

  it('formats multipliers with a multiplication sign', () => {
    expect(formatMetric({ value: 2, kind: 'multiplier' })).toBe('2×');
    expect(formatMetric({ value: 1.5, kind: 'multiplier' })).toBe('1.5×');
  });

  it('formats counts with an optional suffix and thousands separators', () => {
    expect(formatMetric({ value: 40, kind: 'count', suffix: '+' })).toBe('40+');
    expect(formatMetric({ value: 1200, kind: 'count' })).toBe('1,200');
    expect(formatMetric({ value: 200, kind: 'count', suffix: '+' })).toBe('200+');
  });

  it('formats transitions with a from/to arrow', () => {
    expect(formatMetric({ value: 6, kind: 'transition', to: 1 })).toBe('6 → 1');
  });

  it('falls back to a plain number when transition has no target', () => {
    expect(formatMetric({ value: 6, kind: 'transition' })).toBe('6');
  });

  it('defaults to a plain formatted number for missing/unknown kinds', () => {
    expect(formatMetric({ value: 1200 })).toBe('1,200');
    expect(formatMetric({ value: 1200, kind: 'plain' })).toBe('1,200');
  });

  it('returns an empty string for non-finite values', () => {
    expect(formatMetric({ value: Number.NaN, kind: 'percentage' })).toBe('');
    expect(formatMetric({ value: Number.POSITIVE_INFINITY })).toBe('');
  });
});

describe('formatMonthYear', () => {
  it('formats a Date as "MMM yyyy"', () => {
    expect(formatMonthYear(new Date(2023, 2, 15))).toBe('Mar 2023');
  });

  it('parses ISO strings', () => {
    expect(formatMonthYear('2024-12-01')).toBe('Dec 2024');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatMonthYear(null)).toBe('');
    expect(formatMonthYear('not-a-date')).toBe('');
  });
});

describe('formatTimelineRange', () => {
  it('joins two bounds with an en dash', () => {
    expect(formatTimelineRange('2023-03-01', '2024-12-01')).toBe('Mar 2023 – Dec 2024');
  });

  it('shows "Present" for an open-ended range when requested', () => {
    expect(formatTimelineRange('2023-03-01', null, { present: true })).toBe('Mar 2023 – Present');
  });

  it('returns just the start when open-ended and present is not requested', () => {
    expect(formatTimelineRange('2023-03-01')).toBe('Mar 2023');
  });

  it('returns the end alone when start is missing', () => {
    expect(formatTimelineRange(null, '2024-12-01')).toBe('Dec 2024');
  });
});
