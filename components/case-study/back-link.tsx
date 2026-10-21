'use client';
import React from 'react';
import { TransitionLink } from '../motion-primitives/route-transitions';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

/**
 * The case-study "← Back" pill (`docs/parity-audit.md` A1): fixed through the whole page,
 * linking home. Top-left at desktop (46px in, 106px down: 10px under the 96px header),
 * top-right under 1024 (15px in, 86px down), as the Reference's phone variant.
 *
 * Box as Framer's "Link Secondary": 49px tall, 20px side padding, the 20px Material Icons
 * `arrow_back` ligature 10px before an 18px "Back", on a translucent blurred pill with a
 * hairline. Hover rolls the label up and a second copy in from below (Framer's text roll),
 * a CSS transition, so the sitewide reduced-motion rule makes it instant. The pill's own
 * entrance goes through `ScrollReveal`.
 *
 * The root carries `data-section="back"`: the Fidelity gate's "Back" Section.
 */
export const BackLink = () => (
  <ScrollReveal className='fixed top-[86px] right-[15px] z-10 lg:top-[106px] lg:right-auto lg:left-6 xl:left-[46px]'>
    <TransitionLink
      href='/'
      data-section='back'
      className='group flex h-[49px] items-center gap-[10px] rounded-full border border-border bg-foreground/15 px-5 text-foreground-dim backdrop-blur-[7px]'
    >
      {/* The Reference draws the arrow with the Material Icons ligature font, as the CV link's download glyph. */}
      <span aria-hidden className='font-icons text-icon-lg'>
        arrow_back
      </span>
      <span className='flex h-[25px] flex-col overflow-hidden text-body'>
        <span className='transition-transform duration-300 ease-out group-hover:-translate-y-[25px]'>Back</span>
        <span aria-hidden className='transition-transform duration-300 ease-out group-hover:-translate-y-[25px]'>
          Back
        </span>
      </span>
    </TransitionLink>
  </ScrollReveal>
);
