'use client';
import Image from 'next/image';
import * as React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowDown } from 'lucide-react';
import { PageBlocksHero } from '../../tina/__generated__/types';
import { EASE_APPEAR } from '../../lib/motion/reduced-motion';
import { HERO_PIECE } from '../hero-piece/hero-piece-params';
import { HeroPieceVideo } from '../hero-piece/hero-piece-video';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollDrip } from '../motion-primitives/scroll-drip';
import { ScrollParallax } from '../motion-primitives/scroll-parallax';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { useAnchorGlide } from '../motion-primitives/smooth-scroll';
import { LineReveal } from '../motion-primitives/line-reveal';

/**
 * Homepage hero, faithful to the Reference (`docs/parity-audit.md` H1–H6): a
 * full-viewport section with the teal→green gradient behind everything, the
 * Hero piece (#146: the glass Brand mark rendered in Blender, full-bleed) over
 * it in place of the Reference's overlay-blended chrome mark, the headline top-left, the tagline bottom-left (desktop only) and "See Selected
 * Projects ↓" as a text link on a hairline bottom-right. Under 1024px the
 * headline sits on top and the mark is large and cropped below it.
 *
 * Box as measured on the Reference: the section is 100vh under the transparent
 * header; the text wrapper pads 160/64/64 at desktop (120/16/32 on phones);
 * the headline is 55% wide at desktop (max 450px below); the bottom row is
 * two equal columns 40px apart, the tagline 80% of its column, closed by a 1px
 * hairline 20px below the text.
 *
 * Entrance (Framer's appear animations, plus the #87 line-by-line direction):
 * the gradient settles from a 1.5× zoom in 1s, the mark fades in over 1.5s,
 * the headline rises into place line by line in rendered-wrap order (per line:
 * 60px rise + fade over 1s on the appear curve, lines staggered 0.25s), then
 * the tagline, the hairline divider and the link rise together as one group
 * (60px, 1s delay, 1.2s — the Reference's own tagline/link appear settings).
 * The hero renders identically in light and dark (owner's #89 review): its own
 * dark ground, the theme-independent `on-image`/`scrim` tokens, no light-only
 * layers. Only the Scroll Overlay below follows the theme, since it is the page
 * colour arriving. Everything routes through the motion primitives, so `prefers-reduced-motion`
 * renders it at rest, and the headline and tagline are plain text in the
 * server-rendered HTML, visible without JavaScript.
 */
export const Hero = ({ data }: { data: PageBlocksHero }) => {
  const actions = (data.actions ?? []).filter((a): a is NonNullable<typeof a> & { link: string } => Boolean(a?.link));
  // An in-page action ("See Selected Projects" → #works) glides there while smooth scrolling runs (#161).
  const glide = useAnchorGlide();

  return (
    <Section
      sectionId="hero"
      background={data.background!}
      // The header overlays the hero as on the Reference: pull the block up by `main`'s header offset (layout.tsx).
      rootClassName="-mt-22 lg:-mt-24"
      // `bg-hero-ground`: the hero is the same in both themes (owner's #89 review). The gradient sits on
      // the dark page colour at 90% and the mark overlay-blends onto it, so neither may see the light page through.
      className="relative flex h-svh max-w-none flex-col items-center overflow-hidden bg-hero-ground p-0"
    >
      {/* Background Colour: the gradient fills the viewport at 90% opacity. */}
      {data.gradient?.src && (
        <ScrollReveal y={0} scale={1.5} duration={1} amount={0} className="absolute inset-0 z-0">
          <div className="absolute inset-0 opacity-90" data-tina-field={tinaField(data.gradient, 'src')}>
            <Image src={data.gradient.src} alt={data.gradient.alt || ''} fill priority sizes="100vw" className="object-cover" />
          </div>
        </ScrollReveal>
      )}

      {/*
       * Hero piece (#146): Alex's Cycles glass Brand mark, full-bleed over the whole section, in place of
       * the overlay-blended chrome mark crop (the Tina `mark` field is no longer rendered). An opaque render
       * with its own grid and gradient, so it stays on a normal blend: overlay would tint it to the gradient
       * underneath and flatten the glass Alex approved. It fades in over the gradient as the mark did, in CSS
       * (`.hero-piece-in`, styles.css) so the server HTML is at rest: under reduced motion the still shows
       * from first paint, before hydration, and HeroPieceVideo never mounts a video.
       */}
      <div className="hero-piece-in absolute inset-0 z-0">
        <HeroPieceVideo piece={HERO_PIECE} />
      </div>

      {/*
       * Header scrim (#122): the fixed header's white chrome sits on the bright gradient with nothing
       * under it (light theme 2.41:1 at 1440, 2.23:1 at 390, against 4.5 needed). A top-anchored band —
       * `--scrim` at 70% → 60% → 0 over 150px (170px at lg), the values the Hero piece prototype's
       * contrast harness passed at 12.0+ for "Let's talk" — darkens the gradient and the mark under the
       * header in both themes. It lives inside the section, so it scrolls away with the hero and no
       * other page sees it, and it's a static layer: at rest from first paint, reduced motion or not.
       */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[150px] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--scrim)_70%,transparent),color-mix(in_srgb,var(--scrim)_60%,transparent),transparent)] lg:h-[170px]"
      />
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
      {/*
       * Lift over the Hero piece (#146, the prototype's `heroScrim=soft` that Alex reviewed full-bleed): the
       * same two shapes again at half strength, so the headline keeps 3:1 where it crosses the glass's
       * highlights. On phones it ramps in from the top rather than starting hard at 88px, which stacked on
       * the scrim above would read as a dark band across the render.
       */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-50">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--scrim)_15%,transparent),color-mix(in_srgb,var(--scrim)_40%,transparent)_150px,color-mix(in_srgb,var(--scrim)_25%,transparent)_40%,transparent_65%)] lg:bg-[linear-gradient(to_right,color-mix(in_srgb,var(--scrim)_45%,transparent),color-mix(in_srgb,var(--scrim)_35%,transparent)_55%,transparent_80%)]" />
        <div className="absolute inset-0 bg-linear-to-t from-scrim/60 via-scrim/45 via-20% to-transparent to-45%" />
      </div>
      {/* Text Wrapper → Container: headline at the top, the bottom row pushed to the fold. */}
      <div className="relative z-10 flex w-full max-w-[1920px] flex-1 flex-col items-center overflow-hidden px-4 pb-8 pt-30 lg:px-6 lg:pb-16 lg:pt-40 xl:px-16">
        <div className="flex w-full max-w-[1440px] flex-1 flex-col items-start justify-between">
          {data.headline && (
            <div className="w-full max-w-[450px] lg:w-[55%] lg:max-w-none" data-tina-field={tinaField(data, 'headline')}>
              {/* Rises line by line from the first paint, in CSS (#177): the server HTML is the animated
                  markup, so the painted headline is the LCP candidate rather than a post-hydration copy. */}
              <LineReveal as="h1" trigger="load" className="font-display text-display text-on-image">
                {data.headline}
              </LineReveal>
            </div>
          )}

          {/* Tagline, hairline and link appear together after the headline (owner's #87 direction). */}
          <ScrollReveal
            y={60}
            delay={1}
            duration={1.2}
            ease={EASE_APPEAR}
            amount={0}
            staticUntilHydrated
            className="flex w-full flex-col items-start gap-16 border-b border-on-image/50 pb-[19px] lg:flex-row lg:items-end lg:gap-10"
          >
            {data.tagline && (
              <div className="hidden min-w-0 flex-1 lg:block" data-tina-field={tinaField(data, 'tagline')}>
                <p className="w-[70%] text-body text-on-image xl:w-[80%]">{data.tagline}</p>
              </div>
            )}

            {actions.length > 0 && (
              <div className="flex w-full flex-col items-end gap-4 lg:w-auto lg:flex-1">
                {actions.map((action) => (
                  <a
                    key={action.link}
                    href={action.link}
                    onClick={action.link.startsWith('#') ? glide : undefined}
                    className="group inline-flex items-center gap-2 text-body text-on-image"
                    data-tina-field={tinaField(action)}
                  >
                    <span>{action.label}</span>
                    {/* Reference hover: the arrow rolls down out of view as a second one enters from above. */}
                    <span aria-hidden className="relative size-5 shrink-0 overflow-hidden">
                      <span className="flex -translate-y-5 flex-col transition-transform duration-500 ease-hover-link group-hover:translate-y-0 group-focus-visible:translate-y-0">
                        <ArrowDown strokeWidth={2} className="size-5 shrink-0" />
                        <ArrowDown strokeWidth={2} className="size-5 shrink-0" />
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </div>

      {/*
       * Scroll Overlay → Coalesce drip (#143): scrolling down, the page colour sweeps up over the hero
       * at 1.5× the page as blobs rise ahead of the edge, stretch with scroll speed and merge gooily
       * into the sheet — Alex's signed-off picks, from `docs/research/home-drip-coalesce-reference.md`.
       * `ScrollDrip` mounts the WebGL2 canvas client-only after first paint, reads its fill from the
       * `--background` token live (one code path for both themes) and gates everything through
       * `scrollDripMotion`. The row is 1px tall and z-10 after the text wrapper, so the drip rides over
       * everything in the hero but under the fixed header, exactly as the Reference stacks its wave;
       * the canvas hangs off the row's bottom edge (the hero's fold) and spans the hero, inside its clip.
       * At rest nothing of either layer is visible, so first paint is unchanged.
       *
       * The fallback inside `ScrollDrip` is the Reference's own wave (3000×2575 at desktop, 1350×1159
       * at tablet, 1200×1030 on phones), parked 10px under the fold on the same 1.5× parallax. It is
       * what no-WebGL2, a lost context, no JavaScript and reduced motion see — under reduced motion no
       * canvas mounts, no loop runs and the wave rests below the fold from first paint, as today. An
       * SVG file can't read the token, so each theme keeps its own copy (#080808 dark, #ffffff light).
       */}
      <div aria-hidden className="relative z-10 flex h-px w-full shrink-0 justify-center">
        <ScrollDrip canvasClassName="pointer-events-none absolute bottom-0 left-0 h-svh w-full">
          <ScrollParallax speed={150} className="flex shrink-0 justify-center pt-2.5">
            <div className="h-[1030px] w-[1200px] shrink-0 bg-[length:100%_100%] bg-[url(/uploads/home/hero-scroll-overlay-light.svg)] lg:h-[1159px] lg:w-[1350px] xl:h-[2575px] xl:w-[3000px] dark:bg-[url(/uploads/home/hero-scroll-overlay.svg)]" />
          </ScrollParallax>
        </ScrollDrip>
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
