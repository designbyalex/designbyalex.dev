'use client';
import React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksSelectedProjects } from '@/tina/__generated__/types';
import { Section } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { ProjectCard } from './project-card';
import { cn } from '@/lib/utils';

/**
 * Curated project rows for the homepage, laid out as the Reference site does:
 * a "Works Header" row (heading left, years right, same size), then one
 * full-width row per project whose card is a fixed-aspect flex column (the
 * thumbnail takes what the title and tagline leave). Cards alternate between
 * the left and the right edge of the row at desktop and tablet widths; on
 * phones they fill the row. The status pill sits inside the thumbnail, and
 * hovering grows the whole thumbnail (image, pill and all) 2% while a green
 * arrow circle fades in top-right and slides left to right.
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
    <Section id='works' className='max-w-none p-0 scroll-mt-20'>
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
                <ProjectCard
                  href={project.href}
                  // The block's rows carry no format; they are case studies (#211).
                  title={project.title ?? ''}
                  className='aspect-square lg:aspect-[1.50633] xl:aspect-[1.60627]'
                  image={
                    project!.image?.src
                      ? {
                          src: project!.image.src,
                          alt: project!.image.alt,
                          sizes: '(min-width: 1280px) calc((min(100vw, 1440px) - 144px) * 0.8), (min-width: 1024px) calc((100vw - 48px) * 0.9), calc(100vw - 32px)',
                          tinaField: tinaField(project!.image, 'src'),
                        }
                      : undefined
                  }
                  status={project!.status}
                  statusTinaField={tinaField(project!, 'status')}
                  tagline={project!.tagline}
                  taglineTinaField={tinaField(project!, 'tagline')}
                >
                  {project!.title && (
                    <h3 className='text-body text-foreground' data-tina-field={tinaField(project!, 'title')}>
                      {project!.title}
                    </h3>
                  )}
                </ProjectCard>
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
