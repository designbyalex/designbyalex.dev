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
import { statusDotClasses, statusLabels } from '@/components/case-study/project-hero';
import { buildWorkIndex, type WorkFormat, type WorkProjectRef } from '@/lib/case-study/work-index';
import { cn } from '@/lib/utils';

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

// Thumbnail `sizes` per format: the card's width at each breakpoint (see the row classes below).
const thumbnailSizes: Record<WorkFormat, string> = {
  'case-study': '(min-width: 1280px) calc((min(100vw, 1440px) - 144px) * 0.8), (min-width: 1024px) calc((100vw - 48px) * 0.9), calc(100vw - 32px)',
  story: '(min-width: 1280px) calc((min(100vw, 1440px) - 144px) * 0.5), (min-width: 1024px) calc((100vw - 48px) * 0.6), calc(100vw - 32px)',
};

/**
 * The Work index (#125): every case study and story on the Build, in Alex's
 * `order` (the next-project resolver's sort), each linking to its page. Cards
 * reuse the Selected projects row style: alternating full-width rows, status
 * pill over the thumbnail, hover grow with the green arrow.
 *
 * P40 picks (Alex, 2026-11-12, #126): stories are the smaller card (50% of the
 * row at xl and 60% at lg against a case study's 80% and 90%; 1.25:1 on phones
 * against a square), so the two read apart without a label. The Case study /
 * Story label is for screen readers only. The optional intro sits right of the
 * heading from lg and stacks under it on phones. The header has no Work link.
 */
/** A row's entrance: CSS from the first paint for the first row (`.work-row-in` in styles.css), ScrollReveal for the rest. */
function RowReveal({ first, className, children }: { first: boolean; className: string; children: React.ReactNode }) {
  if (first) return <div className={cn('work-row-in', className)}>{children}</div>;
  return (
    <ScrollReveal amount={0.2} scale={0.92} className={className}>
      {children}
    </ScrollReveal>
  );
}

export const WorkIndex = ({ data }: { data: PageBlocksWorkIndex }) => {
  const entries = buildWorkIndex(React.useContext(WorkProjectsContext));

  return (
    // First block on the page: the top padding clears the fixed header (88/96px tall).
    // It lives on the Section, not the heading, so the first row stays clear of the
    // header even with the optional heading unset.
    <Section background={data.background!} sectionId='work-index' className='max-w-none p-0 pt-[150px] lg:pt-[180px]'>
      {(data.heading || data.intro) && (
        <ScrollReveal
          sectionId='work-index-header'
          className='mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pb-16 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-6 xl:px-12'
        >
          {data.heading && (
            <h1 className='font-display text-heading' data-tina-field={tinaField(data, 'heading')}>
              {data.heading}
            </h1>
          )}
          {data.intro && (
            <p className='max-w-md text-body-lg text-muted-foreground lg:ml-auto lg:text-right' data-tina-field={tinaField(data, 'intro')}>
              {data.intro}
            </p>
          )}
        </ScrollReveal>
      )}

      <ul>
        {entries.map((entry, i) => {
          const status = entry.status ?? '';
          const last = i === entries.length - 1;
          const story = entry.format === 'story';
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
              {/* The first row's image is the page's LCP element (#177): it enters in CSS from the first paint
                  (`.work-row-in`, ScrollReveal's fade, rise and settle) and loads at high priority; the rest reveal on scroll. */}
              <RowReveal first={i === 0} className={cn('w-full', story ? 'lg:w-[60%] xl:w-[50%]' : 'lg:w-[90%] xl:w-[80%]')}>
                <Link
                  href={entry.href}
                  data-format={entry.format}
                  className={cn(
                    'group flex w-full flex-col gap-[15px] rounded-[20px] lg:aspect-[1.50633] xl:aspect-[1.60627]',
                    story ? 'aspect-[1.25]' : 'aspect-square'
                  )}
                >
                  {/* Selected projects hover (#90): the whole thumbnail grows 2% as one box, a 200ms tween. */}
                  <div className='relative min-h-0 flex-1 rounded-[20px] transition-transform duration-200 ease-hover-card group-hover:scale-[1.02] group-focus-visible:scale-[1.02]'>
                    <div className='absolute inset-0 overflow-hidden rounded-[20px] bg-card'>
                      {entry.thumbnail && (
                        <Image
                          src={entry.thumbnail}
                          alt={entry.thumbnailAlt || ''}
                          fill
                          sizes={thumbnailSizes[entry.format]}
                          priority={i === 0}
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
                    {/* The card's size tells the formats apart (#126); the label stays for screen readers. */}
                    <p className='sr-only'>{formatLabels[entry.format]}</p>
                    <h2 className='text-body text-foreground'>{entry.title}</h2>
                    {entry.tagline && <p className='text-body text-muted-foreground'>{entry.tagline}</p>}
                  </div>
                </Link>
              </RowReveal>
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
    {
      type: 'string',
      label: 'Intro',
      name: 'intro',
      ui: { component: 'textarea' },
      description: 'Optional line shown right of the heading (under it on phones). Leave empty for none.',
    },
  ],
};
