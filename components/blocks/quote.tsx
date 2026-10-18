'use client';
import React from 'react';
import Link from 'next/link';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksQuote } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

export const Quote = ({ data }: { data: PageBlocksQuote }) => {
  if (!data.quote) return null;

  return (
    <Section background={data.background!}>
      <ScrollReveal as="figure" className="mx-auto max-w-3xl text-center">
        <blockquote
          className="text-balance text-2xl font-medium leading-snug tracking-tight md:text-3xl"
          data-tina-field={tinaField(data, 'quote')}
        >
          <span aria-hidden className="text-primary">“</span>
          {data.quote}
          <span aria-hidden className="text-primary">”</span>
        </blockquote>
        {(data.attribution || data.role) && (
          <figcaption className="mt-6 text-sm text-muted-foreground">
            {data.attribution && (
              <span className="font-medium text-foreground" data-tina-field={tinaField(data, 'attribution')}>
                {data.url ? (
                  <Link href={data.url} className="hover:text-primary">
                    {data.attribution}
                  </Link>
                ) : (
                  data.attribution
                )}
              </span>
            )}
            {data.attribution && data.role ? ', ' : ''}
            {data.role && <span data-tina-field={tinaField(data, 'role')}>{data.role}</span>}
          </figcaption>
        )}
      </ScrollReveal>
    </Section>
  );
};

export const quoteBlockSchema: Template = {
  name: 'quote',
  label: 'Quote',
  ui: {
    previewSrc: '/blocks/testimonial.png',
    defaultItem: {
      quote: 'A short, memorable line that captures the impact of the work.',
      attribution: 'Jordan Lee',
      role: 'Staff Engineer',
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Quote', name: 'quote', ui: { component: 'textarea' } },
    { type: 'string', label: 'Attribution', name: 'attribution' },
    { type: 'string', label: 'Role', name: 'role' },
    { type: 'string', label: 'URL', name: 'url' },
  ],
};
