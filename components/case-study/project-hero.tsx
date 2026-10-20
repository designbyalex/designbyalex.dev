'use client';
import React from 'react';
import Image from 'next/image';
import { tinaField } from 'tinacms/dist/react';
import type { ProjectQuery } from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { Section } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

type Project = ProjectQuery['project'];

export const statusLabels: Record<string, string> = {
  shipped: 'Shipped',
  'in-development': 'In-development',
  concept: 'Concept',
};

// The pill's dot: the live site tags shipped work green and in-development work orange.
const statusDotClasses: Record<string, string> = {
  'in-development': 'bg-status-in-development',
};

/**
 * The case-study opening (`docs/parity-audit.md` A2, M1): the status pill and the title on the
 * left, the grey tagline in the right column, and the full-bleed hero image straight below the
 * title row. The block starts at the top of the page under the transparent header, as the
 * Reference's "Project Hero".
 *
 * Boxes, from Framer's CSS. Desktop (≥1280): the section is 130vh tall and clips; the headline
 * row is a 1400px-max container padded 0/48/40, 350px tall with its content bottom-aligned,
 * on the page colour; the image fills the whole section behind it (cover), so it shows from
 * 350px down. Under 1280 (Framer's phone variant): the headline block is 450px tall, padded
 * 0/24/32, content bottom-aligned; the image follows at the viewport width in a 26:29 box,
 * zoomed to 120% (Framer's scroll zoom at rest). The Reference's scroll-linked mask expansion
 * is not reproduced here: the image is static.
 *
 * Status pill: 30px, 14px side padding (13 + the 1px border), an 8px dot 8px before the mono
 * label; 7px above it. Title at the h1 tier 16px below; tagline at the lead tier in a column
 * padded 16/0/8 that is 83px tall at desktop with the text centred and clipped (Framer's box).
 */
export const ProjectHero = ({ project }: { project: Project }) => {
  const status = project.status ?? '';

  return (
    <Section
      sectionId='project-hero'
      // The header overlays the hero as on the Reference: pull the block up by `main`'s header offset (layout.tsx).
      rootClassName='-mt-22 lg:-mt-24'
      // `isolate`: the headline wrapper's z-index stays inside the hero, under the fixed Back pill.
      className='relative isolate max-w-none overflow-clip p-0 xl:h-[130vh]'
    >
      {/* Headline Wrapper: on the page colour, over the image at desktop. */}
      <div className='relative z-10 bg-background'>
        <div className='mx-auto flex h-[450px] w-full flex-col justify-end px-6 pb-8 xl:h-[350px] xl:max-w-[1400px] xl:flex-row xl:items-end xl:px-12 xl:pb-10'>
          <div className='flex w-full flex-col items-start xl:min-w-0 xl:flex-1'>
            {status && (
              <ScrollReveal className='pt-[7px]'>
                <p
                  className='inline-flex h-[30px] items-center gap-2 rounded-full border border-border bg-foreground/15 px-[13px] font-mono text-mono uppercase text-foreground'
                  data-tina-field={tinaField(project, 'status')}
                >
                  <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                  {statusLabels[status] ?? status}
                </p>
              </ScrollReveal>
            )}
            <ScrollReveal as='h1' delay={0.06} className='pt-4 font-display text-h1' >
              <span data-tina-field={tinaField(project, 'title')}>{project.title}</span>
            </ScrollReveal>
          </div>

          {project.tagline && (
            <ScrollReveal
              delay={0.12}
              className='flex w-full flex-col pt-4 xl:h-[83px] xl:min-w-0 xl:flex-1 xl:justify-center xl:overflow-hidden xl:pb-2'
            >
              <p className='font-display text-lead text-muted-foreground' data-tina-field={tinaField(project, 'tagline')}>
                {project.tagline}
              </p>
            </ScrollReveal>
          )}
        </div>
      </div>

      {project.coverImage && (
        <div
          className='relative aspect-[26/29] w-full overflow-hidden xl:absolute xl:inset-0 xl:aspect-auto'
          data-tina-field={tinaField(project, 'coverImage')}
        >
          <Image
            src={project.coverImage}
            alt={project.coverImageAlt || ''}
            fill
            priority
            sizes='(min-width: 1280px) 100vw, 120vw'
            className='scale-[1.2] object-cover xl:scale-100'
          />
        </div>
      )}
    </Section>
  );
};
