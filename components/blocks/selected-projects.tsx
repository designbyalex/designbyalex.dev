'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowUpRight } from 'lucide-react';
import { PageBlocksSelectedProjects } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TransitionLink as Link } from '../motion-primitives/route-transitions';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  shipped: 'Shipped',
  'in-development': 'In-development',
  concept: 'Concept',
};

// Status accent mirrors the case-study pages: green for shipped, orange for in-development.
const statusDotClasses: Record<string, string> = {
  'in-development': 'bg-status-in-development',
};

/**
 * Curated project rows for the homepage, laid out as the Reference site does:
 * a "Works Header" row (heading left, years right, same size), then one
 * full-width row per project whose card is a fixed-aspect flex column (the
 * thumbnail takes what the title and tagline leave). Cards alternate between
 * the left and the right edge of the row at desktop and tablet widths; on
 * phones they fill the row. The status pill sits inside the thumbnail, and
 * hovering reveals a green arrow circle top-right while the image zooms 2%.
 * Each row is one link to the case study. The section is anchored as `#works`
 * so the hero's "See Selected Projects" action can jump here.
 *
 * Breakpoints follow Framer's variants: phone to 1023, tablet 1024–1279 (`lg`),
 * desktop from 1280 (`xl`).
 */
export const SelectedProjects = ({ data }: { data: PageBlocksSelectedProjects }) => {
  // A row is a link to a case study; one without an href has nowhere to go, so it isn't rendered.
  const projects = (data.projects ?? []).filter(
    (p): p is NonNullable<typeof p> & { href: string } => Boolean(p?.href)
  );

  return (
    <Section background={data.background!} id='works' className='max-w-none p-0 scroll-mt-20'>
      {(data.heading || data.years) && (
        <ScrollReveal
          sectionId='works-header'
          className='mx-auto flex max-w-[1440px] items-start px-4 pt-8 pb-16 lg:px-6 lg:pt-25 xl:gap-10 xl:px-12'
        >
          {data.heading && (
            <h2 className='min-w-0 flex-1 font-display text-heading' data-tina-field={tinaField(data, 'heading')}>
              {data.heading}
            </h2>
          )}
          {data.years && (
            <p
              className='shrink-0 text-right font-display text-heading text-muted-foreground xl:flex-1'
              data-tina-field={tinaField(data, 'years')}
            >
              {data.years}
            </p>
          )}
        </ScrollReveal>
      )}

      <ul>
        {projects.map((project, i) => {
          const status = project!.status ?? '';
          const last = i === projects.length - 1;
          return (
            <li
              key={i}
              data-section='project-row'
              data-tina-field={tinaField(project!)}
              className={cn(
                'mx-auto flex max-w-[1440px] flex-col px-4 lg:px-6 xl:pr-24 xl:pl-12',
                // Rows alternate edges; the last row carries the section's extra bottom space.
                i % 2 ? 'items-end' : 'items-start',
                last ? 'pb-[150px]' : 'pb-[100px]'
              )}
            >
              <ScrollReveal amount={0.2} scale={0.92} className='w-full lg:w-[90%] xl:w-[80%]'>
                <Link
                  href={project.href}
                  className='group flex aspect-square w-full flex-col gap-[15px] rounded-[20px] lg:aspect-[1.50633] xl:aspect-[1.60627]'
                >
                  <div className='relative min-h-0 flex-1 rounded-[20px]'>
                    {project!.image?.src && (
                      <div
                        className='absolute inset-0 overflow-hidden rounded-[20px] bg-card transition-transform duration-300 ease-out group-hover:scale-[1.02]'
                        data-tina-field={tinaField(project!.image, 'src')}
                      >
                        <Image
                          src={project!.image.src}
                          alt={project!.image.alt || ''}
                          fill
                          sizes='(min-width: 1280px) calc((min(100vw, 1440px) - 144px) * 0.8), (min-width: 1024px) calc((100vw - 48px) * 0.9), calc(100vw - 32px)'
                          className='rounded-[20px] object-cover'
                        />
                      </div>
                    )}

                    {status && (
                      // Over the image in both themes, so it uses the on-image tokens rather than the page's. The dark fill
                      // (Framer's is white at 15%) keeps the label at AA over a light photo (#67).
                      <span
                        className='absolute top-4 left-4 z-10 inline-flex h-[30px] items-center gap-2 rounded-full border border-on-image/25 bg-scrim/60 px-[13px] font-mono text-mono uppercase text-on-image'
                        data-tina-field={tinaField(project!, 'status')}
                      >
                        <span aria-hidden className={cn('size-2 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                        {statusLabels[status] ?? status}
                      </span>
                    )}

                    <span
                      aria-hidden
                      className='absolute top-6 right-12 z-10 flex size-16 items-center justify-center rounded-full bg-primary text-foreground opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100'
                    >
                      <ArrowUpRight className='size-6' />
                    </span>
                  </div>

                  <div className='w-full pt-1'>
                    {project!.title && (
                      <h3 className='text-body text-foreground' data-tina-field={tinaField(project!, 'title')}>
                        {project!.title}
                      </h3>
                    )}
                    {project!.tagline && (
                      <p className='text-body text-muted-foreground' data-tina-field={tinaField(project!, 'tagline')}>
                        {project!.tagline}
                      </p>
                    )}
                  </div>
                </Link>
              </ScrollReveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

export const selectedProjectsBlockSchema: Template = {
  name: 'selectedProjects',
  label: 'Selected projects',
  ui: {
    previewSrc: '/blocks/features.png',
    defaultItem: {
      heading: 'Selected projects',
      projects: [{ status: 'shipped', title: 'Project title', tagline: 'One-line summary.', href: '/acacia' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Heading', name: 'heading' },
    {
      type: 'string',
      label: 'Years',
      name: 'years',
      description: 'Shown right of the heading at the same size, in grey, e.g. ’23 – ’25.',
    },
    {
      type: 'object',
      label: 'Projects',
      name: 'projects',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.title || 'Project' }),
        defaultItem: { status: 'shipped', title: 'Project title', tagline: 'One-line summary.', href: '/' },
      },
      fields: [
        {
          type: 'string',
          label: 'Status',
          name: 'status',
          options: [
            { label: 'Shipped', value: 'shipped' },
            { label: 'In development', value: 'in-development' },
            { label: 'Concept', value: 'concept' },
          ],
        },
        { type: 'string', label: 'Title', name: 'title' },
        { type: 'string', label: 'Tagline', name: 'tagline', ui: { component: 'textarea' } },
        {
          type: 'string',
          label: 'Link',
          name: 'href',
          description: 'Path to the case study, e.g. /acacia.',
        },
        {
          type: 'object',
          label: 'Thumbnail',
          name: 'image',
          fields: [
            {
              type: 'image',
              label: 'Image',
              name: 'src',
              // @ts-ignore - uploadDir is supported at runtime
              uploadDir: () => 'home',
            },
            { type: 'string', label: 'Alt text', name: 'alt' },
          ],
        },
      ],
    },
  ],
};
