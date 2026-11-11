'use client';
import { cn } from '@/lib/utils';
import type { ProjectQuery } from '@/tina/__generated__/types';
import Image from 'next/image';
import React from 'react';
import { tinaField } from 'tinacms/dist/react';
import { Section } from '../layout/section';
import { HeroImageAppear, HeroMaskReveal, MaskedAppear } from '../motion-primitives/masked-appear';
import { ScrollHeroPin, ScrollHeroZoom } from '../motion-primitives/scroll-hero';

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
 * zoomed to 120% (Framer's scroll zoom at rest). The scroll-linked mask expansion (#69) rides
 * the ScrollHero primitives: at xl the image pins to the viewport inside the section's clip
 * (Framer's fixed layer at parallax speed 140 plus the page-long −800px drift), under xl the
 * 120% crop relaxes as the box scrolls out. At rest, and under reduced motion, both render
 * exactly the static boxes above.
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
          {/* Case-study entrance (#68): pill, title and tagline rise out of their
              clipped boxes at constant opacity on load and on every navigation
              here (Framer's appear: y 60/60/80, 1s, no delay — the stagger is
              the distance). The clip wrappers are Framer's own padded boxes. */}
          <div className='flex w-full flex-col items-start xl:min-w-0 xl:flex-1'>
            {status && (
              <div className='overflow-clip pt-[7px]'>
                <MaskedAppear>
                  <p
                    className='inline-flex h-[30px] items-center gap-2 rounded-full border border-border bg-foreground/15 px-[13px] font-mono text-mono uppercase text-foreground'
                    data-tina-field={tinaField(project, 'status')}
                  >
                    <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                    {statusLabels[status] ?? status}
                  </p>
                </MaskedAppear>
              </div>
            )}
            <h1 className='overflow-clip pt-4 font-display text-h1'>
              <MaskedAppear as='span' className='block'>
                <span data-tina-field={tinaField(project, 'title')}>{project.title}</span>
              </MaskedAppear>
            </h1>
          </div>

          {project.tagline && (
            <div className='flex w-full flex-col overflow-clip pt-4 xl:h-[83px] xl:min-w-0 xl:flex-1 xl:justify-center xl:pb-2'>
              <MaskedAppear y={80}>
                <p className='font-display text-lead text-muted-foreground' data-tina-field={tinaField(project, 'tagline')}>
                  {project.tagline}
                </p>
              </MaskedAppear>
            </div>
          )}
        </div>
      </div>

      {project.coverImage && (
        <div
          className='relative aspect-[26/29] w-full overflow-hidden xl:absolute xl:inset-0 xl:aspect-auto'
          data-tina-field={tinaField(project, 'coverImage')}
        >
          {/* Scroll-linked mask expansion (#69, audit A2). Desktop: the pin
              variable holds the image to the viewport inside this clipped box,
              so the visible band grows to the full viewport as the headline
              scrolls away, then the next section's edge scrolls over it.
              Under xl the image is in flow, so the zoom variable relaxes the
              120% crop instead as the box scrolls out. Both rest at identity,
              and only one applies per breakpoint via the CSS transforms below. */}
          <ScrollHeroPin className='absolute inset-0 xl:[transform:translateY(var(--scroll-hero-pin,0px))]'>
            <ScrollHeroZoom className='absolute inset-0 max-xl:[transform:scale(var(--scroll-hero-zoom,1))]'>
              {/* Entrance under xl (#68): the Reference's phone hero has no mask
                  layer, so the image itself fades in rising 60px; at xl it holds
                  still while the mask below slides off. Both variables rest at
                  identity, so the resting render is the same either way. */}
              <HeroImageAppear className='absolute inset-0 max-xl:[opacity:var(--hero-appear-opacity,1)] max-xl:[transform:translateY(var(--hero-appear-y,0px))]'>
                <Image
                  src={project.coverImage}
                  alt={project.coverImageAlt || ''}
                  fill
                  priority
                  sizes='(min-width: 1280px) 100vw, 120vw'
                  className='scale-[1.2] object-cover xl:scale-100'
                />
              </HeroImageAppear>
            </ScrollHeroZoom>
          </ScrollHeroPin>
          {/* Entrance at xl (#68): the page-coloured layer starts exactly over
              the band (from the headline row's 350px edge down) and slides its
              own height down past the section's clip, opening the image from
              the horizontal line under the title — Framer's "Hero Image Mask". */}
          <HeroMaskReveal className='pointer-events-none absolute left-0 top-[350px] hidden h-full w-full bg-background xl:block' />
        </div>
      )}
    </Section>
  );
};
