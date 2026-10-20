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
 * Display component's "Mask".
 */
export const Video = ({ data }: { data: PageBlocksVideo }) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const playing = autoplayMotion(prefersReducedMotion, data.autoPlay ?? true);
  if (!data.url) {
    return null;
  }
  const clip = (
    <Clip
      src={data.url}
      playing={playing}
      loop={data.loop ?? true}
      reducedMotion={prefersReducedMotion}
      className={data.frame ? 'h-full w-full' : 'absolute top-[-0.5%] left-[-0.5%] h-[101%] w-[101%]'}
    />
  );

  return (
    <Section
      sectionId='video'
      background={data.background!}
      rootClassName={cn(data.desktopOnly && 'hidden xl:block')}
      className='px-4 lg:px-6'
    >
      {data.frame ? (
        <ScrollReveal className='mx-auto w-full max-w-[780px]'>
          <div className='relative' data-tina-field={tinaField(data, 'frame')}>
            <Image src={data.frame} alt='' width={2048} height={1570} sizes='(min-width: 1280px) 780px, 100vw' className='h-auto w-full' />
            <div className='absolute inset-x-[2.0513%] top-[2.6756%] aspect-[1.78351] overflow-hidden' data-tina-field={tinaField(data, 'url')}>
              {clip}
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal className='mx-auto w-full max-w-[500px] xl:max-w-[532px]'>
          <div
            className='relative aspect-[1.6729] overflow-hidden rounded-[20px] bg-card xl:aspect-[1.67419]'
            data-tina-field={tinaField(data, 'url')}
          >
            {clip}
          </div>
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
      label: 'Desktop only',
      name: 'desktopOnly',
      description: 'Show from 1280px up only, as Framer hides the framed carousel slide on tablets and phones.',
    },
  ],
};
