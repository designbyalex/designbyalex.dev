'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { ProjectBlocksCaseStudyCta } from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TransitionLink } from '../motion-primitives/route-transitions';
import { useNextProject } from '../case-study/next-project-context';
import { statusLabels } from '../case-study/project-hero';

// The pill's dot: green for shipped work, orange for in-development, as the case-study hero's.
const statusDotClasses: Record<string, string> = {
  'in-development': 'bg-status-in-development',
};

/** A textarea's line breaks as `<br>`s, so the text stays one run with Framer's `<br>` inside it. */
const withBreaks = (text: string) =>
  text.split(/\r?\n/).map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </React.Fragment>
  ));

/**
 * The case-study ending (`docs/parity-audit.md` A11, M12), one Section with two columns. Left: the
 * "Want the full story?" heading, the grey sub-line and the Calendly text link with its green arrow
 * circle. Right: the "Next project" heading and a card for the project the next-project resolver
 * names (thumbnail, status pill over it, title, tagline; a green arrow circle appears on hover and
 * the image zooms 2%). Only "next", never "previous", as the Reference.
 *
 * Boxes are Framer's. Section: 1440px max, padded 48/48/100 at xl (24/24/64 at lg, 32/16/64 under
 * it, where it is a 532px-max column), at least 605px tall. Columns: side by side at xl, the left
 * one 47% wide and at most 532px with its blocks 40px apart (heading and sub-line 20px apart), the
 * right one filling the rest with 30px between heading and card; stacked 100px apart under xl. The
 * sub-line has a phone wording and a desktop one with a hard break, as Framer's two variants, so the
 * block carries both. The link: text and a 40px circle 12px apart; on hover the circle grows and the
 * arrow rolls out to the right as a second one enters from the left (the header's treatment).
 * Card: a fixed-ratio flex column (1.37647 at xl, 1.79294 at lg, 0.842353 under it) whose thumbnail
 * takes what the title and tagline leave, 15px above them; the pill sits 16px in; the arrow circle
 * is 64px at 24px from the top and 48px from the right, moving to 24px on hover.
 */
export const CaseStudyCta = ({ data }: { data: ProjectBlocksCaseStudyCta }) => {
  const next = useNextProject();
  const status = next?.status ?? '';

  return (
    <Section
      sectionId='cta'
      background={data.background!}
      rootClassName='mx-auto w-full max-w-[532px] lg:max-w-[1440px]'
      className='flex min-h-[605px] max-w-none flex-col px-4 pt-8 pb-16 lg:px-6 lg:pt-6 xl:px-12 xl:pt-12 xl:pb-[100px]'
    >
      <div className='flex w-full flex-col gap-[100px] xl:flex-row xl:items-start xl:justify-between xl:gap-0'>
        <ScrollReveal className='flex w-full flex-col items-start gap-10 xl:w-[47%] xl:max-w-[532px]'>
          <div className='flex w-full flex-col gap-5'>
            {data.heading && (
              <h2 className='font-display text-heading text-foreground' data-tina-field={tinaField(data, 'heading')}>
                {data.heading}
              </h2>
            )}
            {data.description && (
              <p className='hidden text-body-lg text-muted-foreground lg:block' data-tina-field={tinaField(data, 'description')}>
                {withBreaks(data.description)}
              </p>
            )}
            {(data.descriptionPhone || data.description) && (
              <p
                className='w-[90%] text-body-lg text-muted-foreground lg:hidden'
                data-tina-field={tinaField(data, data.descriptionPhone ? 'descriptionPhone' : 'description')}
              >
                {data.descriptionPhone || withBreaks(data.description!)}
              </p>
            )}
          </div>

          {data.linkLabel && data.linkHref && (
            // Same tab, as the Reference's link (no target); `noopener` as it sets.
            <a href={data.linkHref} rel='noopener' className='group flex items-center gap-3 rounded-full' data-tina-field={tinaField(data, 'linkLabel')}>
              <span className='whitespace-nowrap text-body-lg text-foreground'>{data.linkLabel}</span>
              <span
                aria-hidden
                className='relative size-10 shrink-0 overflow-hidden rounded-full bg-primary text-foreground transition-transform duration-300 ease-out group-hover:scale-110'
              >
                <ArrowRight
                  strokeWidth={1.6}
                  className='absolute inset-0 m-auto size-6 transition-transform duration-300 ease-out group-hover:translate-x-10'
                />
                <ArrowRight
                  strokeWidth={1.6}
                  className='absolute inset-0 m-auto size-6 -translate-x-10 transition-transform duration-300 ease-out group-hover:translate-x-0'
                />
              </span>
            </a>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.06} className='flex w-full flex-col items-start gap-[30px] xl:min-w-0 xl:flex-1'>
          {data.nextHeading && (
            <h2 className='font-display text-heading text-foreground' data-tina-field={tinaField(data, 'nextHeading')}>
              {data.nextHeading}
            </h2>
          )}

          {next && (
            <TransitionLink
              href={`/${next.slug}`}
              className='group flex aspect-[0.842353] w-full flex-col justify-end gap-[15px] rounded-[20px] lg:aspect-[1.79294] xl:aspect-[1.37647]'
            >
              <div className='relative min-h-0 w-full flex-1 rounded-[20px]'>
                {next.thumbnail && (
                  <div className='absolute inset-0 overflow-hidden rounded-[20px] bg-card transition-transform duration-300 ease-out group-hover:scale-[1.02]'>
                    <Image
                      src={next.thumbnail}
                      alt={next.thumbnailAlt || ''}
                      fill
                      sizes='(min-width: 1280px) calc(min(100vw, 1440px) - 628px), (min-width: 1024px) calc(100vw - 48px), min(100vw - 32px, 500px)'
                      className='rounded-[20px] object-cover'
                    />
                  </div>
                )}

                {status && (
                  // Over the image in both themes, so it uses the on-image tokens rather than the page's.
                  <span className='absolute top-4 left-4 z-10 inline-flex h-[30px] items-center gap-2 rounded-full border border-on-image/25 bg-on-image/15 px-[13px] font-mono text-mono uppercase text-on-image'>
                    <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                    {statusLabels[status] ?? status}
                  </span>
                )}

                <span
                  aria-hidden
                  className='absolute top-6 right-12 z-10 flex size-16 items-center justify-center rounded-full bg-primary text-foreground opacity-0 transition-[opacity,translate] duration-300 ease-out group-hover:translate-x-6 group-hover:opacity-100 group-focus-visible:translate-x-6 group-focus-visible:opacity-100'
                >
                  <ArrowUpRight className='size-6' />
                </span>
              </div>

              <div className='w-full pt-1'>
                <p className='text-body text-foreground'>{next.title}</p>
                {next.tagline && <p className='text-body text-muted-foreground'>{next.tagline}</p>}
              </div>
            </TransitionLink>
          )}
        </ScrollReveal>
      </div>
    </Section>
  );
};

export const caseStudyCtaBlockSchema: Template = {
  name: 'caseStudyCta',
  label: 'Closing CTA + next project',
  ui: {
    previewSrc: '/blocks/cta.png',
    itemProps: () => ({ label: 'Closing CTA + next project' }),
    defaultItem: {
      heading: 'Want the full story?',
      description: 'There’s plenty more behind the scenes.\nLet’s grab a coffee and dive in.',
      descriptionPhone: 'There’s more behind the scenes. Let’s grab a coffee and dive in.',
      linkLabel: 'Go to Calendly',
      linkHref: 'https://calendly.com/ablumeinfeld/let-s-talk-design',
      nextHeading: 'Next project',
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', name: 'heading', label: 'Heading' },
    {
      type: 'string',
      name: 'description',
      label: 'Sub-line',
      ui: { component: 'textarea' },
      description: 'Grey, under the heading, from 1024px up. A line break is kept.',
    },
    {
      type: 'string',
      name: 'descriptionPhone',
      label: 'Sub-line on phones',
      ui: { component: 'textarea' },
      description: 'Shown under 1024px instead of the sub-line (the Reference words it more briefly there). Leave empty to reuse the sub-line.',
    },
    { type: 'string', name: 'linkLabel', label: 'Link label', description: 'The text before the green arrow circle.' },
    { type: 'string', name: 'linkHref', label: 'Link URL', description: 'Where the label and arrow go, e.g. the Calendly page.' },
    {
      type: 'string',
      name: 'nextHeading',
      label: 'Next project heading',
      description: 'Above the card. The card itself shows the project after this one in the Projects order (its Thumbnail, Status, Title and Tagline).',
    },
  ],
};
