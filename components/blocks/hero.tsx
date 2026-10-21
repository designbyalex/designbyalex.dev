'use client';
import Image from 'next/image';
import * as React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowDown } from 'lucide-react';
import { PageBlocksHero } from '../../tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TextReveal } from '../motion-primitives/text-reveal';

/** The Reference's "Scroll Overlay": a page-coloured wave parked just under the fold (see below). */
const SCROLL_OVERLAY = '/uploads/home/hero-scroll-overlay.svg';

/**
 * Homepage hero, faithful to the Reference (`docs/parity-audit.md` H1–H6): a
 * full-viewport section with the teal→green gradient behind everything, the
 * chrome mark render overlay-blended onto it so it reads as green glass, the
 * headline top-left, the tagline bottom-left (desktop only) and "See Selected
 * Projects ↓" as a text link on a hairline bottom-right. Under 1024px the
 * headline sits on top and the mark is large and cropped below it.
 *
 * Box as measured on the Reference: the section is 100vh under the transparent
 * header; the text wrapper pads 160/64/64 at desktop (120/16/32 on phones);
 * the headline is 55% wide at desktop (max 450px below); the bottom row is
 * two equal columns 40px apart, the tagline 80% of its column, closed by a 1px
 * hairline 20px below the text.
 *
 * Entrance (Framer's appear animations): the gradient settles from a 1.5× zoom
 * in 1s, the mark fades in over 1.5s, the headline reveals per character, and
 * the tagline and link rise 60px after a 1s delay. Everything routes through
 * the motion primitives, so `prefers-reduced-motion` renders it at rest, and
 * the headline is plain text in the server-rendered HTML.
 */
export const Hero = ({ data }: { data: PageBlocksHero }) => {
  const actions = (data.actions ?? []).filter((a): a is NonNullable<typeof a> & { link: string } => Boolean(a?.link));

  return (
    <Section
      sectionId="hero"
      background={data.background!}
      // The header overlays the hero as on the Reference: pull the block up by `main`'s header offset (layout.tsx).
      rootClassName="-mt-22 lg:-mt-24"
      className="relative flex h-svh max-w-none flex-col items-center overflow-hidden p-0"
    >
      {/* Background Colour: the gradient fills the viewport at 90% opacity. */}
      {data.gradient?.src && (
        <ScrollReveal y={0} scale={1.5} duration={1} amount={0} className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-90" data-tina-field={tinaField(data.gradient, 'src')}>
            <Image src={data.gradient.src} alt={data.gradient.alt || ''} fill priority sizes="100vw" className="object-cover" />
          </div>
        </ScrollReveal>
      )}

      {/* Logo Image: 65% × 90% top-right at desktop; 840–1218px wide, cropped by the fold, below 1024. */}
      {data.mark?.src && (
        <ScrollReveal
          y={0}
          duration={1.5}
          amount={0}
          className="absolute -left-20 -right-[370px] top-[110px] z-0 h-[1055px] mix-blend-overlay lg:-right-[60px] lg:-top-[100px] lg:left-auto lg:h-[90vh] lg:w-[65%] xl:h-[90%]"
        >
          <div className="absolute inset-0" data-tina-field={tinaField(data.mark, 'src')}>
            <Image
              src={data.mark.src}
              alt={data.mark.alt || ''}
              fill
              priority
              sizes="(min-width: 1024px) 65vw, 1218px"
              className="object-cover"
            />
          </div>
        </ScrollReveal>
      )}

      {/*
       * Scrims under the text, not on the Reference: white on the bright gradient is about 1.7:1, so the
       * headline's side (on phones, the band under the header, which stays on the bright gradient) and the bottom row sit on darkened gradient, enough for WCAG AA
       * in both themes (#67: 3:1 for the headline, 4.5:1 for the tagline and the link).
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_bottom,transparent_88px,color-mix(in_srgb,var(--scrim)_45%,transparent)_130px,color-mix(in_srgb,var(--scrim)_30%,transparent)_35%,transparent_60%)] lg:bg-[linear-gradient(to_right,color-mix(in_srgb,var(--scrim)_45%,transparent),color-mix(in_srgb,var(--scrim)_35%,transparent)_55%,transparent_80%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-t from-scrim/60 via-scrim/45 via-20% to-transparent to-45%" />

      {/* Text Wrapper → Container: headline at the top, the bottom row pushed to the fold. */}
      <div className="relative z-10 flex w-full max-w-[1920px] flex-1 flex-col items-center overflow-hidden px-4 pb-8 pt-30 lg:px-6 lg:pb-16 lg:pt-40 xl:px-16">
        <div className="flex w-full max-w-[1440px] flex-1 flex-col items-start justify-between">
          {data.headline && (
            <div className="w-full max-w-[450px] lg:w-[55%] lg:max-w-none" data-tina-field={tinaField(data, 'headline')}>
              <TextReveal as="h1" per="char" stagger={0.012} className="font-display text-display text-on-image">
                {data.headline}
              </TextReveal>
            </div>
          )}

          <div className="flex w-full flex-col items-start gap-16 border-b border-on-image/50 pb-[19px] lg:flex-row lg:items-end lg:gap-10">
            {data.tagline && (
              <div className="hidden min-w-0 flex-1 lg:block" data-tina-field={tinaField(data, 'tagline')}>
                <TextReveal as="p" per="word" stagger={0.02} delay={1} className="w-[70%] text-body text-on-image xl:w-[80%]">
                  {data.tagline}
                </TextReveal>
              </div>
            )}

            {actions.length > 0 && (
              <ScrollReveal y={60} delay={1} duration={1.2} amount={0} className="flex w-full flex-col items-end gap-4 lg:w-auto lg:flex-1">
                {actions.map((action) => (
                  <a
                    key={action.link}
                    href={action.link}
                    className="group inline-flex items-center gap-2 text-body text-on-image"
                    data-tina-field={tinaField(action)}
                  >
                    <span>{action.label}</span>
                    {/* Reference hover: the arrow rolls down out of view as a second one enters from above. */}
                    <span aria-hidden className="relative size-5 shrink-0 overflow-hidden">
                      <span className="flex -translate-y-5 flex-col transition-transform duration-300 ease-out group-hover:translate-y-0">
                        <ArrowDown strokeWidth={2} className="size-5 shrink-0" />
                        <ArrowDown strokeWidth={2} className="size-5 shrink-0" />
                      </span>
                    </span>
                  </a>
                ))}
              </ScrollReveal>
            )}
          </div>
        </div>
      </div>

      {/*
       * Scroll Overlay: the Reference parks a page-coloured wave (3000×2575 at desktop, 1350×1159 at
       * tablet, 1200×1030 on phones) 10px under the fold, clipped by the section, for its scroll
       * choreography. Reproduced at rest so the Build's media inventory matches; the scroll motion is
       * not reproduced.
       */}
      <div aria-hidden className="relative z-10 flex h-px w-full shrink-0 justify-center">
        <div
          className="mt-2.5 h-[1030px] w-[1200px] shrink-0 lg:h-[1159px] lg:w-[1350px] xl:h-[2575px] xl:w-[3000px]"
          style={{ backgroundImage: `url(${SCROLL_OVERLAY})`, backgroundSize: '100% 100%' }}
        />
      </div>
    </Section>
  );
};

const imageFields = (uploadDir: string) => [
  {
    name: 'src',
    label: 'Image Source',
    type: 'image',
    // @ts-ignore - uploadDir is supported at runtime
    uploadDir: () => uploadDir,
  },
  {
    name: 'alt',
    label: 'Alt Text',
    type: 'string',
    description: 'Leave empty when the image is decorative.',
  },
];

export const heroBlockSchema: Template = {
  name: 'hero',
  label: 'Hero',
  ui: {
    previewSrc: '/blocks/hero.png',
    defaultItem: {
      headline: 'I’m a digital product designer committed to my constant evolution.',
      tagline: 'Leveraging AI-workflows, I design beautiful digital products for fast moving product teams.',
      actions: [{ label: 'See Selected Projects', link: '#works' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Headline',
      name: 'headline',
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      label: 'Tagline',
      name: 'tagline',
      description: 'Shown bottom-left from 1024px wide; hidden on phones and tablets, as on the Reference.',
      ui: { component: 'textarea' },
    },
    {
      label: 'Actions',
      name: 'actions',
      type: 'object',
      list: true,
      description: 'Text links with a down arrow, bottom-right on the hairline.',
      ui: {
        defaultItem: {
          label: 'Action Label',
          link: '/',
        },
        itemProps: (item) => ({ label: item.label }),
      },
      fields: [
        {
          label: 'Label',
          name: 'label',
          type: 'string',
        },
        {
          label: 'Link',
          name: 'link',
          type: 'string',
          description: 'A path (/acacia), an anchor (#works) or a full URL.',
        },
      ],
    },
    {
      type: 'object',
      label: 'Background',
      name: 'gradient',
      description: 'Fills the whole viewport behind the hero (the teal → green gradient).',
      fields: imageFields('home') as any,
    },
    {
      type: 'object',
      label: 'Mark',
      name: 'mark',
      description: 'The mark render, overlay-blended onto the background so chrome reads as green glass.',
      fields: imageFields('home') as any,
    },
  ],
};
