'use client';
import { carouselNav, clampSlide } from '@/lib/case-study/carousel';
import { slideAppearMotion } from '@/lib/motion/reduced-motion';
import type { ProjectBlocksCaseStudySectionCarouselSlides } from '@/tina/__generated__/types';
import { motion, useReducedMotion } from 'motion/react';
import React from 'react';
import { tinaField } from 'tinacms/dist/react';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { FramedClip, SlideChrome } from './video';

/**
 * Framer's "Carousel Wrapper" (desktop only), the case-study section's slides: a 720px card on the card
 * colour with 20px corners and 24px padding showing one slide at a time, the caption top-left in a
 * 10px-padded row at 70% width, the step numeral bottom-left and the 780×453 Studio Display box
 * bottom-right (the card clips the monitor's stand). `SlideChrome` changes slide: Next at the right,
 * Back at the left past the first slide, a dot per slide. Like Framer's, it doesn't wrap, and the new
 * slide's content appears in place (Framer's appear effect, a fade-and-rise from 60px; instant under
 * reduced motion) rather than sliding along a track. Only the showing slide is mounted, so only its clip
 * plays. The server renders the first slide; the rest exist only once someone navigates.
 *
 * `overflow-clip`, as Framer's slide wrap: `hidden` would make the card a scroll container, and scrolling
 * the clip into view (as the Fidelity gate's extractor does) would scroll its content up by the stand's
 * overflow.
 */

export type CarouselSlide = ProjectBlocksCaseStudySectionCarouselSlides;

export const CaseStudyCarousel = ({ slides, label }: { slides: CarouselSlide[]; label: string }) => {
  const [requested, setRequested] = React.useState(0);
  // The first slide is there on load (the section's scroll reveal brings it in); only a change animates.
  const [navigated, setNavigated] = React.useState(false);
  const appear = slideAppearMotion(useReducedMotion() ?? false);
  const { index } = carouselNav(requested, slides.length);
  const slide = slides[index];

  const select = (next: number) => {
    setRequested(clampSlide(next, slides.length));
    setNavigated(true);
  };

  return (
    <ScrollReveal className='hidden w-full xl:block'>
      <div role='region' aria-roledescription='carousel' aria-label={label} className='relative h-[720px] overflow-clip rounded-[20px] bg-card p-6'>
        {/* Persistent, so the new slide is announced when it replaces the old one. */}
        <div aria-live='polite' className='h-full'>
          <motion.div
            key={index}
            role='group'
            aria-roledescription='slide'
            aria-label={`${index + 1} of ${slides.length}`}
            initial={navigated ? appear.initial : false}
            animate={appear.animate}
            transition={appear.transition}
            className='flex h-full flex-col justify-between'
            data-tina-field={tinaField(slide)}
          >
            <div className='w-full p-2.5'>
              <p className='w-[70%] whitespace-pre-wrap font-display text-slide-heading text-foreground' data-tina-field={tinaField(slide, 'quote')}>
                {slide.quote}
              </p>
            </div>
            <div className='flex min-h-0 w-full flex-1 items-end justify-between'>
              <p className='whitespace-pre font-display text-slide-number text-foreground-faint' data-tina-field={tinaField(slide, 'number')}>
                {slide.number}
              </p>
              <div className='h-[453px] w-[780px] shrink-0'>
                <FramedClip
                  src={slide.video!}
                  frame={slide.frame!}
                  autoPlay={slide.autoPlay}
                  loop
                  frameField={tinaField(slide, 'frame')}
                  urlField={tinaField(slide, 'video')}
                />
              </div>
            </div>
          </motion.div>
        </div>
        <SlideChrome index={index} count={slides.length} onSelect={select} />
      </div>
    </ScrollReveal>
  );
};
