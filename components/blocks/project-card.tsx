import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { statusDotClasses, statusLabels } from '@/components/case-study/project-hero';
import { cn } from '@/lib/utils';
import { TransitionLink, type TransitionLinkProps } from '../motion-primitives/route-transitions';

/**
 * A project's status over its thumbnail. Over the image in both themes, so it uses the on-image tokens rather
 * than the page's. The dark fill (Framer's is white at 15%) keeps the label at AA over a light photo (#67); the
 * clear-glass rim and blur match the other pills (#91). The dot is green for shipped, orange for in-development.
 */
export function StatusPill({ status, tinaField }: { status: string; tinaField?: string }) {
  return (
    <span
      className='absolute top-4 left-4 z-10 inline-flex h-[30px] items-center gap-2 rounded-full border border-on-image/15 bg-scrim/60 px-[13px] font-mono text-mono uppercase text-on-image shadow-glass-photo glass-blur-photo'
      data-tina-field={tinaField}
    >
      <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
      {statusLabels[status] ?? status}
    </span>
  );
}

type ProjectCardProps = Omit<TransitionLinkProps, 'children' | 'className'> & {
  /** The card's aspect ratios per breakpoint, which differ by where it sits. */
  className: string;
  image?: { src?: string | null; alt?: string | null; sizes: string; priority?: boolean; tinaField?: string };
  /** Keep the empty `bg-card` panel when there is no image, as the Work index does. */
  showEmptyImagePanel?: boolean;
  status?: string | null;
  statusTinaField?: string;
  /** The title and tagline under the thumbnail. */
  children: React.ReactNode;
};

/**
 * One project as a link: a fixed-aspect flex column whose thumbnail takes what the title and tagline leave, 15px
 * above them. Reference hover (#90): the whole thumbnail (image, status pill and arrow) grows 2% as one box
 * (Framer's Image Wrapper at 102%), a 200ms tween, while the arrow (a black → on the brand green) fades in
 * top-right and slides left to right, 48px in to 24px.
 */
export function ProjectCard({ className, image, showEmptyImagePanel, status, statusTinaField, children, ...link }: ProjectCardProps) {
  return (
    <TransitionLink {...link} className={cn('group flex w-full flex-col gap-[15px] rounded-[20px]', className)}>
      <div className='relative min-h-0 w-full flex-1 rounded-[20px] transition-transform duration-200 ease-hover-card group-hover:scale-[1.02] group-focus-visible:scale-[1.02]'>
        {(image?.src || showEmptyImagePanel) && (
          <div className='absolute inset-0 overflow-hidden rounded-[20px] bg-card' data-tina-field={image?.tinaField}>
            {image?.src && (
              <Image
                src={image.src}
                alt={image.alt || ''}
                fill
                sizes={image.sizes}
                priority={image.priority}
                className='rounded-[20px] object-cover'
              />
            )}
          </div>
        )}

        {status && <StatusPill status={status} tinaField={statusTinaField} />}

        <span
          aria-hidden
          className='absolute top-6 right-12 z-10 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition-[opacity,translate] duration-200 ease-hover-card group-hover:translate-x-6 group-hover:opacity-100 group-focus-visible:translate-x-6 group-focus-visible:opacity-100'
        >
          <ArrowRight className='size-6' />
        </span>
      </div>

      <div className='w-full pt-1'>{children}</div>
    </TransitionLink>
  );
}
