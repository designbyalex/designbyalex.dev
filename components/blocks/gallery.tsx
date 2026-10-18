'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksGallery } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { cn } from '@/lib/utils';

const columnClasses: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
};

export const Gallery = ({ data }: { data: PageBlocksGallery }) => {
  const items = data.items?.filter(Boolean) ?? [];
  if (!items.length) return null;
  const columns = data.columns || '2';

  return (
    <Section background={data.background!}>
      <div className="mx-auto max-w-6xl space-y-8">
        {data.title && (
          <h2
            className="text-3xl font-medium tracking-tight md:text-4xl"
            data-tina-field={tinaField(data, 'title')}
          >
            {data.title}
          </h2>
        )}
        <div className={cn('grid grid-cols-1 gap-4', columnClasses[columns] ?? columnClasses['2'])}>
          {items.map((item, i) =>
            item?.src ? (
              <ScrollReveal key={i} delay={i * 0.05} as="figure">
                <div
                  className="overflow-hidden rounded-xl border border-border bg-background"
                  data-tina-field={tinaField(item, 'src')}
                >
                  <Image
                    src={item.src}
                    alt={item.alt || ''}
                    width={1200}
                    height={900}
                    className="h-auto w-full"
                  />
                </div>
                {item.caption && (
                  <figcaption
                    className="mt-2 text-sm text-muted-foreground"
                    data-tina-field={tinaField(item, 'caption')}
                  >
                    {item.caption}
                  </figcaption>
                )}
              </ScrollReveal>
            ) : null
          )}
        </div>
      </div>
    </Section>
  );
};

export const galleryBlockSchema: Template = {
  name: 'gallery',
  label: 'Gallery',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      columns: '2',
      items: [
        { alt: 'First image' },
        { alt: 'Second image' },
      ],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Title',
      name: 'title',
    },
    {
      type: 'string',
      label: 'Columns',
      name: 'columns',
      options: [
        { label: 'Two', value: '2' },
        { label: 'Three', value: '3' },
      ],
    },
    {
      type: 'object',
      label: 'Images',
      name: 'items',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.alt || item?.caption || 'Image' }),
        defaultItem: { alt: 'Describe the image' },
      },
      fields: [
        {
          type: 'image',
          label: 'Image',
          name: 'src',
          // @ts-ignore - uploadDir is supported at runtime
          uploadDir: () => 'projects',
        },
        { type: 'string', label: 'Alt text', name: 'alt' },
        { type: 'string', label: 'Caption', name: 'caption' },
      ],
    },
  ],
};
