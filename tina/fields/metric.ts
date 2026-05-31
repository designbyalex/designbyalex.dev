import type { TinaField } from 'tinacms';

/** Metric kinds mirror `MetricKind` in `lib/case-study/format.ts`. */
export const metricKindOptions = [
  { label: 'Percentage (40%)', value: 'percentage' },
  { label: 'Delta (+40% / −32%)', value: 'delta' },
  { label: 'Multiplier (2×)', value: 'multiplier' },
  { label: 'Count (40+)', value: 'count' },
  { label: 'Transition (6 → 1)', value: 'transition' },
  { label: 'Plain number', value: 'plain' },
];

/**
 * Field set for a structured metric. Shared by the `project` collection's headline
 * metrics and the `metrics` block so both feed the same `formatMetric` helper.
 */
export const metricFields: TinaField[] = [
  {
    type: 'number',
    label: 'Value',
    name: 'value',
    description: 'Raw number (e.g. 40). Formatting is applied based on the kind.',
  },
  {
    type: 'string',
    label: 'Kind',
    name: 'kind',
    options: metricKindOptions,
  },
  {
    type: 'number',
    label: 'To',
    name: 'to',
    description: 'Target value for a "Transition" metric (e.g. 6 → 1).',
  },
  {
    type: 'string',
    label: 'Suffix',
    name: 'suffix',
    description: 'Trailing text for a "Count" metric (e.g. "+").',
  },
  {
    type: 'string',
    label: 'Label',
    name: 'label',
    description: 'Caption shown beneath the value.',
  },
];
