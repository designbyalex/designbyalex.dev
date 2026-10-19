'use client';
import React from 'react';
import Link from 'next/link';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { Download } from 'lucide-react';
import { PageBlocksExperience } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { Button } from '../ui/button';

/**
 * Chronological experience timeline: one hairline row per role (company, role,
 * period), revealed in sequence on scroll, with an optional CV download beneath.
 */
export const Experience = ({ data }: { data: PageBlocksExperience }) => {
  const items = data.items?.filter(Boolean) ?? [];
  const isExternal = (href: string) => /^https?:\/\//.test(href);

  return (
    <Section sectionId="experience" background={data.background!}>
      <div className='mx-auto max-w-5xl'>
        {data.heading && (
          <ScrollReveal>
            {/* Reference: "Experience" is a small green label, not a section heading. */}
            <h2 className='text-caption text-emphasis' data-tina-field={tinaField(data, 'heading')}>
              {data.heading}
            </h2>
          </ScrollReveal>
        )}

        {items.length > 0 && (
          <ol className='mt-8 border-t border-border'>
            {items.map((item, i) => (
              <ScrollReveal
                key={i}
                as='li'
                delay={i * 0.05}
                amount={0.5}
                className='grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-border py-5 sm:grid-cols-[1.2fr_1fr_auto]'
              >
                <span className='text-body-lg text-foreground' data-tina-field={tinaField(item!, 'company')}>
                  {item!.company}
                </span>
                <span className='order-last col-span-2 text-body-lg text-muted-foreground sm:order-none sm:col-span-1' data-tina-field={tinaField(item!, 'role')}>
                  {item!.role}
                </span>
                <span className='justify-self-end text-caption text-muted-foreground' data-tina-field={tinaField(item!, 'period')}>
                  {item!.period}
                </span>
              </ScrollReveal>
            ))}
          </ol>
        )}

        {data.cta?.label && data.cta?.href && (
          <ScrollReveal className='mt-8'>
            <Button asChild size='lg' variant='outline' className='rounded-full px-5 text-caption font-normal'>
              <Link
                href={data.cta.href}
                target={isExternal(data.cta.href) ? '_blank' : undefined}
                rel={isExternal(data.cta.href) ? 'noopener noreferrer' : undefined}
                data-tina-field={tinaField(data.cta, 'label')}
              >
                <Download aria-hidden className='size-4' />
                <span className='text-nowrap'>{data.cta.label}</span>
              </Link>
            </Button>
          </ScrollReveal>
        )}
      </div>
    </Section>
  );
};

export const experienceBlockSchema: Template = {
  name: 'experience',
  label: 'Experience timeline',
  ui: {
    previewSrc: '/blocks/stats.png',
    defaultItem: {
      heading: 'Experience',
      items: [{ company: 'Company', role: 'Role', period: '2025 – Present' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Heading', name: 'heading' },
    {
      type: 'object',
      label: 'Roles',
      name: 'items',
      list: true,
      description: 'Most recent first.',
      ui: {
        itemProps: (item) => ({ label: [item?.company, item?.role].filter(Boolean).join(' · ') || 'Role' }),
        defaultItem: { company: 'Company', role: 'Role', period: '2025 – Present' },
      },
      fields: [
        { type: 'string', label: 'Company', name: 'company' },
        { type: 'string', label: 'Role', name: 'role' },
        { type: 'string', label: 'Period', name: 'period', description: 'e.g. 2023 – Present' },
      ],
    },
    {
      type: 'object',
      label: 'Call to action',
      name: 'cta',
      description: 'Optional link beneath the timeline, e.g. the full CV.',
      fields: [
        { type: 'string', label: 'Label', name: 'label' },
        { type: 'string', label: 'Link', name: 'href' },
      ],
    },
  ],
};
