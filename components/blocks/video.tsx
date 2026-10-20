'use client';
import React from 'react';
import Image from 'next/image';
import { useReducedMotion } from 'motion/react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import type { PageBlocksVideo } from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { autoplayMotion } from '@/lib/motion/reduced-motion';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

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
 * Display component's "Mask". Slide: the framed clip on Framer's carousel slide ("Carousel Wrapper" on
 * /mosurban): 720px tall at xl on the card colour with 20px corners and 24px padding, the 780×453
 * Studio Display box bottom-right so the slide clips the monitor's stand, a 56×47 Next pill with a
 * 10×16 chevron centred at the right edge and five pagination dots at the bottom. The chrome is
 * decorative: Framer's carousel has one page.
 *
 * `PlainClip`, `FramedClip` and `SlideChrome` are shared with the case-study section block (#65), which
 * places the plain clip in a section's right column and the framed clip on the UX section's slide.
 */

/** Framer's chevron: a CSS background on the pill's arrow, as the Reference records it. */
const CHEVRON =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9.42 16' overflow='visible'><path d='M 8 16 L 0 8 L 8 0 L 9.42 1.42 L 2.84 8 L 9.42 14.58 Z' fill='white'/></svg>\")";
const SLIDE_PAGES = 5;

/** The slide's Next pill and pagination, positioned over the slide. */
export const SlideChrome = () => (
  <div aria-hidden='true'>
    <div className='absolute top-1/2 right-6 z-[1] flex h-[47px] w-14 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-scrim/40 backdrop-blur-[2px]'>
      <div className='pl-px'>
        <div className='h-4 w-[10px] rotate-180 bg-[length:100%_100%] bg-no-repeat' style={{ backgroundImage: CHEVRON }} />
      </div>
    </div>
    <div className='absolute inset-x-0 bottom-0 z-[1] flex justify-center p-4'>
      <div className='flex overflow-hidden rounded-full bg-scrim/20 backdrop-blur-[2px]'>
        {Array.from({ length: SLIDE_PAGES }, (_, i) => (
          <div
            key={i}
            className={cn('py-2.5', i === 0 ? 'pr-[5px] pl-2.5' : i === SLIDE_PAGES - 1 ? 'pr-2.5 pl-[5px]' : 'px-[5px]')}
          >
            <div className={cn('size-2.5 rounded-[5px] bg-on-image', i > 0 && 'opacity-50')} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface ClipOptions {
  src: string;
  autoPlay?: boolean | null;
  loop?: boolean | null;
}

/** Whether the clip plays on its own: the block's Auto Play through the reduced-motion selector. */
const usePlayback = (autoPlay?: boolean | null) => {
  const reducedMotion = useReducedMotion() ?? false;
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
            <SlideChrome />
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
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
      {mounted && reducedMotion && (
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
        'With a device frame: present the clip on Framer’s carousel slide, a dark 720px card with 20px corners, the frame bottom-right with the monitor’s stand clipped, a Next pill at the right and pagination dots at the bottom. The chrome is decorative (one page).',
    },
    {
      type: 'boolean',
      label: 'Desktop only',
      name: 'desktopOnly',
      description: 'Show from 1280px up only, as Framer hides the framed carousel slide on tablets and phones.',
    },
  ],
};
