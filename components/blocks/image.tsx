'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksImage } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { cn } from '@/lib/utils';

const widthClasses: Record<string, string> = {
  contained: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-none',
};

export const ImageBlock = ({ data }: { data: PageBlocksImage }) => {
  if (!data.src) return null;
  const width = data.width || 'wide';

  return (
    <Section background={data.background!}>
      <ScrollReveal>
        <figure className={cn('mx-auto', widthClasses[width] ?? widthClasses.wide)}>
          <div
            className="overflow-hidden rounded-2xl border border-border bg-background"
            data-tina-field={tinaField(data, 'src')}
          >
            <Image
              src={data.src}
              alt={data.alt || ''}
              width={2400}
              height={1600}
              className="h-auto w-full"
            />
          </div>
          {data.caption && (
            <figcaption
              className="mt-3 text-center text-sm text-muted-foreground"
              data-tina-field={tinaField(data, 'caption')}
            >
              {data.caption}
            </figcaption>
          )}
        </figure>
      </ScrollReveal>
    </Section>
  );
};

export const imageBlockSchema: Template = {
  name: 'image',
  label: 'Image',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      width: 'wide',
      alt: 'Describe the image',
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'image',
      label: 'Image',
      name: 'src',
      // @ts-ignore - uploadDir is supported at runtime
      uploadDir: () => 'projects',
    },
    {
      type: 'string',
      label: 'Alt text',
      name: 'alt',
      description: 'Describe the image for screen readers and SEO.',
    },
    {
      type: 'string',
      label: 'Caption',
      name: 'caption',
    },
    {
      type: 'string',
      label: 'Width',
      name: 'width',
      options: [
        { label: 'Contained', value: 'contained' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full', value: 'full' },
      ],
    },
  ],
};
