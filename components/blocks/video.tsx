'use client';
import React from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'motion/react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import type { PageBlocksVideo } from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { autoplayMotion } from '@/lib/motion/reduced-motion';
import { carouselNav } from '@/lib/case-study/carousel';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { useHydrated } from '../motion-primitives/use-hydrated';

/**
 * A muted, looping clip, as Framer plays the MOS Urban videos (docs/parity-audit.md M4–M6). The files
 * are committed under public/uploads (ADR 0001) and played by a native <video>: muted, inline, looping,
 * no controls. Autoplay goes through `autoplayMotion`, so under `prefers-reduced-motion` the clip waits
 * on its first frame and a play button takes the place of autoplay.
 *
 * Boxes are Framer's. Plain: the "Image Wrapper" of a case-study column, 532px at most (500 at lg, the
 * 16px-gutter width under it), 1.67419 ratio at xl (1.6729 under), 20px corners, the video at 101%
 * inside so the clip itself carries no radius. Framed: the frame image at 780px at most, the video in a
 * mask 16/780 of the width in from the left, right and top at a 1.78351 ratio, which is the Studio
 * Display component's "Mask". Slide: the framed clip on a single slide of Framer's carousel ("Carousel
 * Wrapper" on /mosurban): 720px tall at xl on the card colour with 20px corners and 24px padding, the
 * 780×453 Studio Display box bottom-right so the slide clips the monitor's stand. One slide has nowhere
 * to go, so it carries no arrows or dots.
 *
 * `PlainClip`, `FramedClip` and `SlideChrome` are shared with the case-study section block (#65), which
 * places the plain clip in a section's right column and the framed clips on the UX section's carousel.
 * `SlideChrome` is that carousel's navigation: a 56×47 pill with a 10×16 chevron centred at the right
 * edge (Next) and, past the first slide, its mirror at the left (Back), and a pagination dot per slide
 * at the bottom.
 */

/** Framer's chevron: a CSS background on the pill's arrow, as the Reference records it. It points left (Back); Next turns it round. */
const CHEVRON =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9.42 16' overflow='visible'><path d='M 8 16 L 0 8 L 8 0 L 9.42 1.42 L 2.84 8 L 9.42 14.58 Z' fill='white'/></svg>\")";

interface SlideChromeProps {
  /** The slide showing, from 0. */
  index: number;
  count: number;
  /** Asks for a slide, from 0. */
  onSelect: (index: number) => void;
}

/** The carousel's Back and Next pills and its pagination, positioned over the slide. Nothing for a single slide. */
export const SlideChrome = ({ index, count, onSelect }: SlideChromeProps) => {
  const { hasPrev, hasNext } = carouselNav(index, count);
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const refocus = React.useRef<'prev' | 'next' | null>(null);

  // The pill just pressed goes away at either end; hand focus to the other one so a keyboard user isn't
  // dropped back to the top of the page.
  React.useEffect(() => {
    const target = refocus.current === 'prev' ? prevRef.current : refocus.current === 'next' ? nextRef.current : null;
    refocus.current = null;
    target?.focus();
  }, [index]);

  if (count < 2) {
    return null;
  }

  const step = (delta: 1 | -1) => {
    const target = index + delta;
    if (delta > 0 && target >= count - 1) refocus.current = 'prev';
    if (delta < 0 && target <= 0) refocus.current = 'next';
    onSelect(target);
  };

  return (
    <>
      {hasPrev && <SlideArrow buttonRef={prevRef} direction='prev' onClick={() => step(-1)} />}
      {hasNext && <SlideArrow buttonRef={nextRef} direction='next' onClick={() => step(1)} />}
      <div className='absolute inset-x-0 bottom-0 z-[1] flex justify-center p-4'>
        <div className='flex overflow-hidden rounded-full bg-scrim/20 backdrop-blur-[2px]'>
          {Array.from({ length: count }, (_, i) => (
            // The ring goes on the dot: the pill clips anything drawn outside the button.
            <button
              key={i}
              type='button'
              onClick={() => onSelect(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'group cursor-pointer py-2.5 outline-none',
                i === 0 ? 'pr-[5px] pl-2.5' : i === count - 1 ? 'pr-2.5 pl-[5px]' : 'px-[5px]',
              )}
            >
              <div
                className={cn(
                  'size-2.5 rounded-[5px] bg-on-image group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring',
                  i !== index && 'opacity-50',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

/** One 56×47 pill, vertically centred 24px in from its edge. */
const SlideArrow = ({ buttonRef, direction, onClick }: { buttonRef: React.Ref<HTMLButtonElement>; direction: 'prev' | 'next'; onClick: () => void }) => (
  <button
    ref={buttonRef}
    type='button'
    onClick={onClick}
    aria-label={direction === 'next' ? 'Next slide' : 'Previous slide'}
    className={cn(
      'absolute top-1/2 z-[1] flex h-[47px] w-14 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-scrim/40 backdrop-blur-[2px]',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      direction === 'next' ? 'right-6' : 'left-6',
    )}
  >
    <div className={direction === 'next' ? 'pl-px' : 'pr-px'}>
      <div className={cn('h-4 w-[10px] bg-[length:100%_100%] bg-no-repeat', direction === 'next' && 'rotate-180')} style={{ backgroundImage: CHEVRON }} />
    </div>
  </button>
);

interface ClipOptions {
  src: string;
  autoPlay?: boolean | null;
  loop?: boolean | null;
}

/** Whether the clip plays on its own: the block's Auto Play through the reduced-motion selector. */
const usePlayback = (autoPlay?: boolean | null) => {
  const hydrated = useHydrated();
  const prefersReducedMotion = useReducedMotion() ?? false;
  // The server can't read the media query, so until hydration the client renders what the server did
  // (the `autoplay` attribute from the block) and the preference takes over on the next render.
  const reducedMotion = hydrated && prefersReducedMotion;
  return { reducedMotion, playing: autoplayMotion(reducedMotion, autoPlay ?? true) };
};

/** The case-study column's "Image Wrapper": a 20px-cornered box with the clip at 101% inside (so the clip carries no radius). */
export const PlainClip = ({ src, autoPlay, loop, className, field }: ClipOptions & { className?: string; field?: string }) => {
  const { playing, reducedMotion } = usePlayback(autoPlay);
  return (
    <div className={cn('relative aspect-[1.6729] overflow-clip rounded-[20px] bg-card xl:aspect-[1.67419]', className)} data-tina-field={field}>
      <Clip
        src={src}
        playing={playing}
        loop={loop ?? true}
        reducedMotion={reducedMotion}
        className='absolute top-[-0.5%] left-[-0.5%] h-[101%] w-[101%]'
      />
    </div>
  );
};

/** The Studio Display frame at 780px at most, the clip in its screen mask. */
export const FramedClip = ({
  src,
  frame,
  autoPlay,
  loop,
  frameField,
  urlField,
}: ClipOptions & { frame: string; frameField?: string; urlField?: string }) => {
  const { playing, reducedMotion } = usePlayback(autoPlay);
  return (
    <div className='relative' data-tina-field={frameField}>
      <Image src={frame} alt='' width={2048} height={1570} sizes='(min-width: 1280px) 780px, 100vw' className='h-auto w-full' />
      <div className='absolute inset-x-[2.0513%] top-[2.6756%] aspect-[1.78351] overflow-clip' data-tina-field={urlField}>
        <Clip src={src} playing={playing} loop={loop ?? true} reducedMotion={reducedMotion} className='h-full w-full' />
      </div>
    </div>
  );
};

export const Video = ({ data }: { data: PageBlocksVideo }) => {
  if (!data.url) {
    return null;
  }
  const framed = data.frame ? (
    <FramedClip
      src={data.url}
      frame={data.frame}
      autoPlay={data.autoPlay}
      loop={data.loop}
      frameField={tinaField(data, 'frame')}
      urlField={tinaField(data, 'url')}
    />
  ) : null;

  return (
    <Section
      sectionId='video'
      background={data.background!}
      rootClassName={cn(data.desktopOnly && 'hidden xl:block')}
      className='px-4 lg:px-6'
    >
      {framed && data.slide ? (
        <ScrollReveal>
          {/* `overflow-clip`, not `hidden`: the monitor's stand overflows the slide, and a scroll container would scroll when the clip is scrolled into view. */}
          <div className='relative overflow-clip rounded-[20px] bg-card p-6 xl:h-[720px]' data-tina-field={tinaField(data, 'slide')}>
            <div className='flex h-full items-end justify-end'>
              <div className='w-full max-w-[780px] xl:h-[453px]'>{framed}</div>
            </div>
          </div>
        </ScrollReveal>
      ) : framed ? (
        <ScrollReveal className='mx-auto w-full max-w-[780px]'>{framed}</ScrollReveal>
      ) : (
        <ScrollReveal className='mx-auto w-full max-w-[500px] xl:max-w-[532px]'>
          <PlainClip src={data.url} autoPlay={data.autoPlay} loop={data.loop} field={tinaField(data, 'url')} />
        </ScrollReveal>
      )}
    </Section>
  );
};

interface ClipProps {
  src: string;
  playing: boolean;
  loop: boolean;
  reducedMotion: boolean;
  className?: string;
}

/** The <video> itself, driven from `playing`; under reduced motion a play/pause button sits over it. */
const Clip = ({ src, playing, loop, reducedMotion, className }: ClipProps) => {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // React sets `muted` as a property, not an attribute, so make sure of it before asking to play.
    el.muted = true;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  return (
    <>
      <video
        ref={ref}
        src={src}
        muted
        loop={loop}
        playsInline
        autoPlay={playing}
        preload='metadata'
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className={cn('block object-cover', className)}
      />
      {/* `reducedMotion` is false until hydration (usePlayback), so the server never renders the button. */}
      {reducedMotion && (
        <button
          type='button'
          onClick={toggle}
          aria-label={paused ? 'Play video' : 'Pause video'}
          className='absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full border border-border bg-foreground/15 text-foreground backdrop-blur-[7px] hover:bg-foreground/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
        >
          <svg viewBox='0 0 24 24' className='size-5' fill='currentColor' aria-hidden='true'>
            {paused ? <path d='M8 5v14l11-7z' /> : <path d='M6 5h4v14H6zM14 5h4v14h-4z' />}
          </svg>
        </button>
      )}
    </>
  );
};

export const videoBlockSchema: Template = {
  name: 'video',
  label: 'Video',
  ui: {
    previewSrc: '/blocks/video.png',
    defaultItem: {
      autoPlay: true,
      loop: true,
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Video file',
      name: 'url',
      description:
        'A committed mp4 under /uploads (ADR 0001), e.g. /uploads/projects/mosurban/brand-identity.mp4, or a direct video URL. It plays muted and inline, with no controls.',
    },
    {
      type: 'boolean',
      label: 'Auto play',
      name: 'autoPlay',
      description: 'Starts on its own. Under reduced motion it waits on its first frame with a play button instead.',
    },
    {
      type: 'boolean',
      label: 'Loop',
      name: 'loop',
    },
    {
      type: 'image',
      label: 'Device frame',
      name: 'frame',
      // @ts-ignore - uploadDir is supported at runtime
      uploadDir: () => 'projects',
      description:
        'Optional frame image the video plays inside, at the Studio Display proportions: the screen starts 2% of the width in from the left, right and top. The frame renders 780px wide at most.',
    },
    {
      type: 'boolean',
      label: 'Carousel slide',
      name: 'slide',
      description:
        'With a device frame: present the clip on a single slide of Framer’s carousel, a dark 720px card with 20px corners and the frame bottom-right with the monitor’s stand clipped. One slide has no arrows or dots; for a carousel of several, use a case-study section’s Carousel slides.',
    },
    {
      type: 'boolean',
      label: 'Desktop only',
      name: 'desktopOnly',
      description: 'Show from 1280px up only, as Framer hides the framed carousel slide on tablets and phones.',
    },
  ],
};
