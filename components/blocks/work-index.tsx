'use client';
import React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksWorkIndex } from '@/tina/__generated__/types';
import { Section } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { ProjectCard } from './project-card';
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
    <Section sectionId='work-index' className='max-w-none p-0 pt-[150px] lg:pt-[180px]'>
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
                <ProjectCard
                  href={entry.href}
                  data-format={entry.format}
                  className={cn('lg:aspect-[1.50633] xl:aspect-[1.60627]', story ? 'aspect-[1.25]' : 'aspect-square')}
                  image={{ src: entry.thumbnail, alt: entry.thumbnailAlt, sizes: thumbnailSizes[entry.format], priority: i === 0 }}
                  showEmptyImagePanel
                  status={entry.status}
                >
                  {/* The card's size tells the formats apart (#126); the label stays for screen readers. */}
                  <p className='sr-only'>{formatLabels[entry.format]}</p>
                  <h2 className='text-body text-foreground'>{entry.title}</h2>
                  {entry.tagline && <p className='text-body text-muted-foreground'>{entry.tagline}</p>}
                </ProjectCard>
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
