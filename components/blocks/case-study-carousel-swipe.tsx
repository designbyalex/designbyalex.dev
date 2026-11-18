'use client';
import { clampSlide } from '@/lib/case-study/carousel';
import { useReducedMotion } from 'motion/react';
import React from 'react';
import { tinaField } from 'tinacms/dist/react';
import { SettleReveal } from '../motion-primitives/settle-reveal';
import type { CarouselSlide } from './case-study-carousel';
import { GlassArrow, PlainClip, useSlideArrows } from './video';

/**
 * The case-study carousel under 1280px (#171, Alex's picker picks of 2026-11-18): one slide at a time on a
 * native scroll-snap track, the clip edge to edge at 16:10 with its quote below, 24px on phones and 28px in
 * three-quarters of the width from 768px. A "01 / 04" counter and `SlideChrome`'s glass arrows sit under the track.
 *
 * The section is a centred 532px column under 1024px, so the carousel breaks out of it to the viewport's
 * width; `<main>` clips the overflow a classic scrollbar would add.
 *
 * Only the slide in view plays. Clips mount from 1 slide ahead of the furthest reached, and only under
 * 1280px, so the desktop page never fetches them. Off-screen slides are inert.
 */

const BELOW_XL = '(max-width: 79.99rem)';

const subscribeBelowXl = (onChange: () => void) => {
  const query = window.matchMedia(BELOW_XL);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const useBelowXl = () =>
  React.useSyncExternalStore(
    subscribeBelowXl,
    () => window.matchMedia(BELOW_XL).matches,
    () => false
  );

const pad = (value: number) => String(value).padStart(2, '0');

export const CaseStudySwipeCarousel = ({ slides, label }: { slides: CarouselSlide[]; label: string }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [furthest, setFurthest] = React.useState(0);
  const indexRef = React.useRef(0);
  // The slide an arrow asked for, while the track glides there past the slides between.
  const gliding = React.useRef<number | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const belowXl = useBelowXl();
  const count = slides.length;

  const show = (next: number) => {
    indexRef.current = next;
    setIndex(next);
    setFurthest((reached) => Math.max(reached, next));
  };

  const select = (next: number) => {
    const target = clampSlide(next, count);
    gliding.current = target;
    show(target);
    const track = trackRef.current;
    track?.scrollTo({ left: target * track.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track?.clientWidth) return;
    const nearest = clampSlide(Math.round(track.scrollLeft / track.clientWidth), count);
    if (gliding.current !== null) {
      if (nearest === gliding.current) gliding.current = null;
      return;
    }
    if (nearest !== indexRef.current) show(nearest);
  };

  const { hasPrev, hasNext, prevRef, nextRef, step } = useSlideArrows(index, count, select);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Lenis listens for the wheel on the window and cancels any gesture with vertical travel, which would
    // stall a sideways trackpad swipe. A mostly-sideways wheel stops here; vertical ones still reach it.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.stopPropagation();
    };
    // A rotation or resize changes every slide's width: stay on the slide showing.
    let width = track.clientWidth;
    const resize = new ResizeObserver(() => {
      if (track.clientWidth === width) return;
      width = track.clientWidth;
      track.scrollTo({ left: indexRef.current * width, behavior: 'instant' });
    });
    track.addEventListener('wheel', onWheel, { passive: true });
    resize.observe(track);
    return () => {
      track.removeEventListener('wheel', onWheel);
      resize.disconnect();
    };
  }, []);

  return (
    <SettleReveal className='ml-[calc(50%-50vw)] w-screen xl:hidden'>
      <div role='region' aria-roledescription='carousel' aria-label={label}>
        <p aria-live='polite' aria-atomic='true' className='sr-only'>
          {`${index + 1} of ${count}: ${slides[index]?.quote ?? ''}`}
        </p>
        <div
          ref={trackRef}
          role='group'
          aria-label={`${label} slides`}
          tabIndex={count > 1 ? 0 : undefined}
          onScroll={onScroll}
          onPointerDown={() => {
            gliding.current = null;
          }}
          onTouchStart={() => {
            gliding.current = null;
          }}
          className='flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-scrollbar]:hidden'
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              role='group'
              aria-roledescription='slide'
              aria-label={`${i + 1} of ${count}`}
              className='flex w-full shrink-0 snap-start snap-always flex-col gap-6'
              data-tina-field={tinaField(slide)}
              // Spread because this project's React types predate the `inert` prop that Next's bundled React renders.
              {...(i === index ? {} : { inert: true })}
            >
              <div className='aspect-[16/10] w-full overflow-clip bg-card'>
                {belowXl && i <= furthest + 1 && (
                  <div className='settle-target'>
                    <PlainClip
                      src={slide.video!}
                      autoPlay={slide.autoPlay}
                      loop
                      active={i === index}
                      label={slide.description || label}
                      className='aspect-[16/10] rounded-none xl:aspect-[16/10]'
                      field={tinaField(slide, 'video')}
                    />
                  </div>
                )}
              </div>
              <p
                className='whitespace-pre-wrap px-4 font-display text-slide-heading text-foreground max-md:text-[1.5rem] md:max-w-[75%] md:px-6 md:text-[1.75rem]'
                data-tina-field={tinaField(slide, 'quote')}
              >
                {slide.quote}
              </p>
            </div>
          ))}
        </div>
        {count > 1 && (
          <div className='flex items-center justify-between px-4 pt-6 md:px-6'>
            <p aria-hidden className='text-caption text-muted-foreground tabular-nums'>
              {`${pad(index + 1)} / ${pad(count)}`}
            </p>
            {/* A slot each, so an arrow stays under the thumb when its neighbour goes away at either end. */}
            <div className='flex gap-2'>
              <div className='size-[47px]'>{hasPrev && <GlassArrow buttonRef={prevRef} direction='prev' onClick={() => step(-1)} />}</div>
              <div className='size-[47px]'>{hasNext && <GlassArrow buttonRef={nextRef} direction='next' onClick={() => step(1)} />}</div>
            </div>
          </div>
        )}
      </div>
    </SettleReveal>
  );
};
