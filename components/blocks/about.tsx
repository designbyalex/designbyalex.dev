'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksAbout } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

/**
 * Multi-part about section: a heading, a list of parts (each a green lead-in
 * followed by white body text, as on the live site) and a portrait. On desktop
 * the text column stays put while the portrait sits beside it.
 */
export const About = ({ data }: { data: PageBlocksAbout }) => {
  const parts = data.parts?.filter(Boolean) ?? [];
  const hasImage = Boolean(data.image?.src);

  return (
    // Gutter and text column follow the Reference (16px on phones; a 672px column at desktop) so the statements wrap alike.
    <Section sectionId="about" background={data.background!} className='px-4 sm:px-6'>
      <div className='mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-16 lg:grid-cols-[minmax(0,42rem)_1fr]'>
        <div className='space-y-8 md:sticky md:top-28 md:self-start'>
          {data.heading && (
            <ScrollReveal>
              <h2 className='font-display text-heading' data-tina-field={tinaField(data, 'heading')}>
                {data.heading}
              </h2>
            </ScrollReveal>
          )}
          {parts.map((part, i) => (
            <ScrollReveal key={i} delay={i * 0.06} as='p' className='font-display text-statement text-balance'>
              <span data-tina-field={tinaField(part!)}>
                {/* Reference: the lead-in is brand green, the continuation white. */}
                {part!.lead && <span className='text-emphasis'>{part!.lead}</span>}
                {part!.lead && part!.text ? ' ' : ''}
                {part!.text && <span className='text-foreground'>{part!.text}</span>}
              </span>
            </ScrollReveal>
          ))}
        </div>

        {hasImage && data.image?.src && (
          <ScrollReveal delay={0.1} className='overflow-hidden rounded-2xl border border-border bg-card'>
            <div className='relative aspect-[16/9] md:aspect-[4/5] lg:aspect-[4/3]' data-tina-field={tinaField(data.image, 'src')}>
              <Image
                src={data.image.src}
                alt={data.image.alt || ''}
                fill
                sizes='(min-width: 768px) 50vw, 100vw'
                className='object-cover object-[60%_center]'
              />
            </div>
          </ScrollReveal>
        )}
      </div>
    </Section>
  );
};

export const aboutBlockSchema: Template = {
  name: 'about',
  label: 'About',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      heading: 'About',
      parts: [{ lead: 'Currently,', text: 'a sentence about what you do now.' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Heading', name: 'heading' },
    {
      type: 'object',
      label: 'Parts',
      name: 'parts',
      list: true,
      description: 'Each part is a green lead-in followed by white body text.',
      ui: {
        itemProps: (item) => ({ label: item?.lead || item?.text || 'Part' }),
        defaultItem: { lead: 'Lead-in,', text: 'and the rest of the sentence.' },
      },
      fields: [
        { type: 'string', label: 'Lead-in', name: 'lead' },
        { type: 'string', label: 'Text', name: 'text', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      label: 'Image',
      name: 'image',
      fields: [
        {
          type: 'image',
          label: 'Image',
          name: 'src',
          // @ts-ignore - uploadDir is supported at runtime
          uploadDir: () => 'home',
        },
        { type: 'string', label: 'Alt text', name: 'alt' },
      ],
    },
  ],
};
