'use client';
import React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksMetrics } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { formatMetric, type MetricKind } from '@/lib/case-study/format';
import { metricFields } from '@/tina/fields/metric';

export const Metrics = ({ data }: { data: PageBlocksMetrics }) => {
  const metrics = data.metrics?.filter(Boolean) ?? [];

  return (
    <Section background={data.background!}>
      <div className="mx-auto max-w-5xl space-y-10">
        {(data.title || data.description) && (
          <ScrollReveal className="mx-auto max-w-2xl space-y-4 text-center">
            {data.title && (
              <h2
                className="text-3xl font-medium tracking-tight md:text-4xl"
                data-tina-field={tinaField(data, 'title')}
              >
                {data.title}
              </h2>
            )}
            {data.description && (
              <p className="text-muted-foreground" data-tina-field={tinaField(data, 'description')}>
                {data.description}
              </p>
            )}
          </ScrollReveal>
        )}

        {metrics.length > 0 && (
          <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-3">
            {metrics.map((metric, i) => (
              <ScrollReveal key={i} as="div" delay={i * 0.05} className="space-y-2">
                <dt
                  className="text-4xl font-semibold tracking-tight md:text-5xl"
                  data-tina-field={tinaField(metric!, 'value')}
                >
                  {formatMetric({
                    value: metric!.value ?? Number.NaN,
                    kind: metric!.kind as MetricKind | null,
                    to: metric!.to,
                    suffix: metric!.suffix,
                  })}
                </dt>
                <dd className="text-sm text-muted-foreground" data-tina-field={tinaField(metric!, 'label')}>
                  {metric!.label}
                </dd>
              </ScrollReveal>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
};

export const metricsBlockSchema: Template = {
  name: 'metrics',
  label: 'Metrics',
  ui: {
    previewSrc: '/blocks/stats.png',
    defaultItem: {
      title: 'Impact',
      description: 'Headline outcomes from the work.',
      metrics: [
        { value: 40, kind: 'count', suffix: '+', label: 'Teams onboarded' },
        { value: 32, kind: 'delta', label: 'UI bug reports' },
        { value: 99, kind: 'percentage', label: 'Token coverage' },
      ],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Title', name: 'title' },
    { type: 'string', label: 'Description', name: 'description' },
    {
      type: 'object',
      label: 'Metrics',
      name: 'metrics',
      list: true,
      ui: {
        itemProps: (item) => ({ label: `${item?.value ?? ''} ${item?.label ?? ''}`.trim() || 'Metric' }),
        defaultItem: { value: 40, kind: 'delta', label: 'Adoption' },
      },
      fields: metricFields,
    },
  ],
};
