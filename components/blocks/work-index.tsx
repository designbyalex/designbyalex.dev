'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowRight } from 'lucide-react';
import { PageBlocksWorkIndex } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TransitionLink as Link } from '../motion-primitives/route-transitions';
import { buildWorkIndex, type WorkFormat, type WorkProjectRef } from '@/lib/case-study/work-index';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  shipped: 'Shipped',
  'in-development': 'In-development',
  concept: 'Concept',
};

// Status accent mirrors the case-study pages: green for shipped, orange for in-development.
const statusDotClasses: Record<string, string> = {
  'in-development': 'bg-status-in-development',
};

const formatLabels: Record<WorkFormat, string> = {
  'case-study': 'Case study',
  story: 'Story',
};

/**
 * The /work route's projects, fetched server-side (the block's list comes from
 * the Project collection, not the Page document) and provided to {@link WorkIndex}
 * by the page route — the same hand-off `NextProjectProvider` makes for the
 * next-project card.
 */
const WorkProjectsContext = React.createContext<WorkProjectRef[]>([]);
export const WorkProjectsProvider = WorkProjectsContext.Provider;

/**
 * The Work index (#125): every case study and story on the Build, in Alex's
 * `order` (the next-project resolver's sort), each marked as a case study or a
 * story and linking to its page. Cards reuse the Selected projects row style —
 * alternating full-width rows, status pill over the thumbnail, hover grow with
 * the green arrow — plus a mono format label over the title. The look is
 * settled in P40; this block is the tracer.
 */
export const WorkIndex = ({ data }: { data: PageBlocksWorkIndex }) => {
  const entries = buildWorkIndex(React.useContext(WorkProjectsContext));

  return (
    <Section background={data.background!} sectionId='work-index' className='max-w-none p-0'>
      {data.heading && (
        // First block on the page: the top padding clears the fixed header (88/96px tall).
        <ScrollReveal
          sectionId='work-index-header'
          className='mx-auto max-w-[1440px] px-4 pt-[150px] pb-16 lg:px-6 lg:pt-[180px] xl:px-12'
        >
          <h1 className='font-display text-heading' data-tina-field={tinaField(data, 'heading')}>
            {data.heading}
          </h1>
        </ScrollReveal>
      )}

      <ul>
        {entries.map((entry, i) => {
          const status = entry.status ?? '';
          const last = i === entries.length - 1;
          return (
            <li
              key={entry.slug}
              data-section='work-row'
              className={cn(
                'mx-auto flex max-w-[1440px] flex-col px-4 lg:px-6 xl:pr-24 xl:pl-12',
                // Rows alternate edges; the last row carries the section's extra bottom space.
                i % 2 ? 'items-end' : 'items-start',
                last ? 'pb-[150px]' : 'pb-[100px]'
              )}
            >
              <ScrollReveal amount={0.2} scale={0.92} className='w-full lg:w-[90%] xl:w-[80%]'>
                <Link
                  href={entry.href}
                  className='group flex aspect-square w-full flex-col gap-[15px] rounded-[20px] lg:aspect-[1.50633] xl:aspect-[1.60627]'
                >
                  {/* Selected projects hover (#90): the whole thumbnail grows 2% as one box, a 200ms tween. */}
                  <div className='relative min-h-0 flex-1 rounded-[20px] transition-transform duration-200 ease-hover-card group-hover:scale-[1.02] group-focus-visible:scale-[1.02]'>
                    <div className='absolute inset-0 overflow-hidden rounded-[20px] bg-card'>
                      {entry.thumbnail && (
                        <Image
                          src={entry.thumbnail}
                          alt={entry.thumbnailAlt || ''}
                          fill
                          sizes='(min-width: 1280px) calc((min(100vw, 1440px) - 144px) * 0.8), (min-width: 1024px) calc((100vw - 48px) * 0.9), calc(100vw - 32px)'
                          className='rounded-[20px] object-cover'
                        />
                      )}
                    </div>

                    {status && (
                      // Over the image in both themes, so it uses the on-image tokens rather than the
                      // page's — the same pill as the Selected projects rows (#67, #91).
                      <span className='absolute top-4 left-4 z-10 inline-flex h-[30px] items-center gap-2 rounded-full border border-on-image/15 bg-scrim/60 px-[13px] font-mono text-mono uppercase text-on-image shadow-glass-photo glass-blur-photo'>
                        <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                        {statusLabels[status] ?? status}
                      </span>
                    )}

                    {/* The green arrow circle fades in top-right and slides left to right on hover. */}
                    <span
                      aria-hidden
                      className='absolute top-6 right-12 z-10 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-[opacity,translate] duration-200 ease-hover-card group-hover:translate-x-6 group-hover:opacity-100 group-focus-visible:translate-x-6 group-focus-visible:opacity-100'
                    >
                      <ArrowRight className='size-6' />
                    </span>
                  </div>

                  <div className='w-full pt-1'>
                    <p className='font-mono text-mono uppercase text-muted-foreground'>{formatLabels[entry.format]}</p>
                    <h2 className='text-body text-foreground'>{entry.title}</h2>
                    {entry.tagline && <p className='text-body text-muted-foreground'>{entry.tagline}</p>}
                  </div>
                </Link>
              </ScrollReveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

export const workIndexBlockSchema: Template = {
  name: 'workIndex',
  label: 'Work index',
  ui: {
    previewSrc: '/blocks/features.png',
    defaultItem: { heading: 'Work' },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Heading',
      name: 'heading',
      description: 'Page heading over the list. The list itself comes from the Project documents — mark each one case study or story there.',
    },
  ],
};
