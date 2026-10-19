'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowUpRight } from 'lucide-react';
import { PageBlocksSelectedProjects } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { HoverLift } from '../motion-primitives/hover-lift';
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
 * Curated project rows for the homepage: a big thumbnail, then the status pill,
 * title and tagline. Each row is one link to the case study. The section is
 * anchored as `#works` so the hero's "See Selected Projects" action can jump here.
 */
export const SelectedProjects = ({ data }: { data: PageBlocksSelectedProjects }) => {
  // A row is a link to a case study; one without an href has nowhere to go, so it isn't rendered.
  const projects = (data.projects ?? []).filter(
    (p): p is NonNullable<typeof p> & { href: string } => Boolean(p?.href)
  );

  return (
    <Section background={data.background!} id='works' className='scroll-mt-20'>
      <div className='mx-auto max-w-5xl space-y-10 md:space-y-14'>
        {(data.heading || data.years) && (
          <ScrollReveal sectionId='works-header' className='flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-6'>
            {data.heading && (
              <h2 className='text-2xl font-medium tracking-tight md:text-3xl' data-tina-field={tinaField(data, 'heading')}>
                {data.heading}
              </h2>
            )}
            {data.years && (
              <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground' data-tina-field={tinaField(data, 'years')}>
                {data.years}
              </p>
            )}
          </ScrollReveal>
        )}

        <ul className='space-y-16 md:space-y-24'>
          {projects.map((project, i) => {
            const status = project!.status ?? '';
            return (
              <li key={i} data-section='project-row' data-tina-field={tinaField(project!)}>
                <ScrollReveal amount={0.2}>
                  <Link href={project.href} className='group block rounded-2xl'>
                    {project!.image?.src && (
                      <HoverLift lift={4} scale={1.01} className='overflow-hidden rounded-2xl border border-border bg-card'>
                        <div className='relative aspect-[4/3]' data-tina-field={tinaField(project!.image, 'src')}>
                          <Image
                            src={project!.image.src}
                            alt={project!.image.alt || ''}
                            fill
                            sizes='(min-width: 1024px) 1024px, 100vw'
                            className='object-cover'
                          />
                        </div>
                      </HoverLift>
                    )}

                    <div className='mt-6 flex items-start justify-between gap-6'>
                      <div className='space-y-3'>
                        {status && (
                          <span
                            className='inline-flex items-center gap-2 rounded-full border border-border bg-foreground/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-foreground'
                            data-tina-field={tinaField(project!, 'status')}
                          >
                            <span aria-hidden className={cn('size-1.5 rounded-full', statusDotClasses[status] ?? 'bg-primary')} />
                            {statusLabels[status] ?? status}
                          </span>
                        )}
                        {project!.title && (
                          <h3
                            className='text-2xl font-medium tracking-tight group-hover:text-emphasis md:text-3xl'
                            data-tina-field={tinaField(project!, 'title')}
                          >
                            {project!.title}
                          </h3>
                        )}
                        {project!.tagline && (
                          <p className='max-w-2xl text-lg text-muted-foreground' data-tina-field={tinaField(project!, 'tagline')}>
                            {project!.tagline}
                          </p>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className='mt-1 hidden size-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors group-hover:border-emphasis group-hover:text-emphasis sm:inline-flex'
                      >
                        <ArrowUpRight className='size-5' />
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              </li>
            );
          })}
        </ul>
      </div>
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
    { type: 'string', label: 'Years', name: 'years', description: 'Small label beside the heading, e.g. ’23 – ’25.' },
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
