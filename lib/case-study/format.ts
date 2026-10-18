/**
 * Pure case-study formatters — no React/DOM imports so they can be unit-tested in a
 * plain Node environment (same convention as `lib/motion/reduced-motion.ts`).
 *
 * Metrics are stored structurally (a number plus a `kind`) rather than as
 * pre-formatted strings, so the display string is derived here and stays consistent
 * everywhere a metric is shown.
 */
import { format, isValid, parseISO } from 'date-fns';

export type MetricKind =
  | 'percentage' // 40        -> "40%"
  | 'delta' // 40 / -32   -> "+40%" / "−32%"
  | 'multiplier' // 2         -> "2×"
  | 'count' // 40 (+ "+")  -> "40+"
  | 'transition' // 6 (to 1)   -> "6 → 1"
  | 'plain'; // 1200       -> "1,200"

export interface MetricInput {
  value: number;
  kind?: MetricKind | null;
  /** Target value for `transition` metrics (e.g. 6 → 1). */
  to?: number | null;
  /** Trailing string for `count` metrics (e.g. "+", "k"). */
  suffix?: string | null;
}

const MINUS = '−'; // typographic minus
const TIMES = '×'; // multiplication sign
const ARROW = '→'; // rightwards arrow
const EN_DASH = '–';

/** Locale-stable number formatting so tests are deterministic across environments. */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('en-US');
}

/**
 * Render a structured metric to its display string. Unknown/missing kinds fall back
 * to a plain formatted number, and non-finite values render as an empty string.
 */
export function formatMetric(metric: MetricInput): string {
  const { value, kind, to, suffix } = metric;
  if (!Number.isFinite(value)) return '';

  switch (kind) {
    case 'percentage':
      return `${formatNumber(value)}%`;
    case 'delta': {
      const sign = value > 0 ? '+' : value < 0 ? MINUS : '';
      return `${sign}${formatNumber(Math.abs(value))}%`;
    }
    case 'multiplier':
      return `${formatNumber(value)}${TIMES}`;
    case 'count':
      return `${formatNumber(value)}${suffix ?? ''}`;
    case 'transition':
      return Number.isFinite(to as number)
        ? `${formatNumber(value)} ${ARROW} ${formatNumber(to as number)}`
        : formatNumber(value);
    default:
      return formatNumber(value);
  }
}

/** Coerce a Date or ISO string into a valid Date, or null. */
function toDate(input: Date | string | null | undefined): Date | null {
  if (input == null) return null;
  const date = typeof input === 'string' ? parseISO(input) : input;
  return isValid(date) ? date : null;
}

/** Format a single date as "Mar 2023". Invalid input renders as an empty string. */
export function formatMonthYear(input: Date | string | null | undefined): string {
  const date = toDate(input);
  return date ? format(date, 'MMM yyyy') : '';
}

export interface TimelineRangeOptions {
  /** Show "Present" instead of an end date when `end` is omitted. */
  present?: boolean;
}

/**
 * Format a timeline range, e.g. "Mar 2023 – Dec 2024" or "Mar 2023 – Present".
 * Falls back gracefully when only one bound is provided.
 */
export function formatTimelineRange(
  start: Date | string | null | undefined,
  end?: Date | string | null,
  options: TimelineRangeOptions = {}
): string {
  const startLabel = formatMonthYear(start);
  const endLabel = formatMonthYear(end);

  if (startLabel && endLabel) return `${startLabel} ${EN_DASH} ${endLabel}`;
  if (startLabel && !endLabel) {
    return options.present ? `${startLabel} ${EN_DASH} Present` : startLabel;
  }
  return endLabel;
}
