'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksFeatureDeepDive } from '@/tina/__generated__/types';
import { components } from '../mdx-components';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { cn } from '@/lib/utils';

export const FeatureDeepDive = ({ data }: { data: PageBlocksFeatureDeepDive }) => {
  const mediaRight = data.mediaSide !== 'left';

  return (
    <Section background={data.background!}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        <ScrollReveal className={cn('space-y-5', mediaRight ? 'md:order-1' : 'md:order-2')}>
          {data.eyebrow && (
            <p
              className="font-mono text-xs uppercase tracking-widest text-primary"
              data-tina-field={tinaField(data, 'eyebrow')}
            >
              {data.eyebrow}
            </p>
          )}
          {data.heading && (
            <h2
              className="text-3xl font-medium tracking-tight md:text-4xl"
              data-tina-field={tinaField(data, 'heading')}
            >
              {data.heading}
            </h2>
          )}
          {data.body && (
            <div className="prose prose-lg dark:prose-invert max-w-none" data-tina-field={tinaField(data, 'body')}>
              <TinaMarkdown content={data.body} components={components} />
            </div>
          )}
        </ScrollReveal>

        {data.image?.src && (
          <ScrollReveal
            className={cn(mediaRight ? 'md:order-2' : 'md:order-1')}
            delay={0.1}
          >
            <div
              className="overflow-hidden rounded-2xl border border-border bg-background"
              data-tina-field={tinaField(data.image, 'src')}
            >
              <Image
                src={data.image.src}
                alt={data.image.alt || ''}
                width={1600}
                height={1200}
                className="h-auto w-full"
              />
            </div>
          </ScrollReveal>
        )}
      </div>
    </Section>
  );
};

export const featureDeepDiveBlockSchema: Template = {
  name: 'featureDeepDive',
  label: 'Feature deep-dive',
  ui: {
    previewSrc: '/blocks/features.png',
    defaultItem: {
      eyebrow: 'Deep dive',
      heading: 'A closer look at the work',
      mediaSide: 'right',
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Eyebrow', name: 'eyebrow' },
    { type: 'string', label: 'Heading', name: 'heading' },
    { type: 'rich-text', label: 'Body', name: 'body' },
    {
      type: 'string',
      label: 'Media side',
      name: 'mediaSide',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
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
          uploadDir: () => 'projects',
        },
        { type: 'string', label: 'Alt text', name: 'alt' },
      ],
    },
  ],
};
