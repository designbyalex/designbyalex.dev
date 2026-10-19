'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { PageBlocksAbout } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

/**
 * The Reference's "Project Overview" Section as one block: About, Experience and the CV link.
 *
 * Left column: a sticky "About" heading under a hairline, at desktop widths only (the Reference never
 * shows it on phones or tablets; see the #59 notes). Right column: the statements (green lead-in,
 * white continuation), the portrait, then the small green "Experience" label with one hairline row per
 * role (company / role / period stacked, a decorative "+" on the right) and "DOWNLOAD FULL CV" with
 * the Material Icons download glyph, right-aligned.
 *
 * Boxes are Framer's: the section is padded 48/16/100 on phones (<lg), 48/24/100 at lg and 48/48/150
 * at xl; the columns are 60px apart, the right one 60% wide at lg and 50% at xl, and both start 120px
 * down. Statements are 40px apart with 100px below them (64px on phones), 10px to the portrait (aspect
 * 0.890323, 20px corners), 110px to the label; rows are 16px apart and padded 16px; the CV row is 40px
 * tall. On phones the column keeps the 84px the Reference's unseen heading occupies, so the statements
 * start at the same height.
 */
export const About = ({ data }: { data: PageBlocksAbout }) => {
  const parts = data.parts?.filter(Boolean) ?? [];
  const roles = data.roles?.filter(Boolean) ?? [];
  const cv = data.cv?.label && data.cv?.href ? data.cv : null;
  const cvIsExternal = cv ? /^https?:\/\//.test(cv.href!) : false;

  return (
    <Section sectionId='about' background={data.background!} className='max-w-none p-0' aria-label={data.heading ?? undefined}>
      <div className='mx-auto flex max-w-[1440px] flex-col px-4 pt-12 pb-[100px] lg:flex-row lg:items-start lg:gap-[60px] lg:px-6 xl:px-12 xl:pb-[150px]'>
        {data.heading && (
          // Sticky within the section, so it stays put while the right column scrolls past. Needs no
          // overflow-hidden ancestor, hence `overflow-x-clip` on <main>.
          <div className='hidden lg:sticky lg:top-0 lg:block lg:min-w-0 lg:flex-1 lg:pt-[120px] lg:pb-[150px]'>
            <ScrollReveal className='border-t border-border pt-[9px]'>
              <h2 className='font-display text-heading' data-tina-field={tinaField(data, 'heading')}>
                {data.heading}
              </h2>
            </ScrollReveal>
          </div>
        )}

        <div className='flex w-full flex-col gap-[10px] pt-[84px] pb-16 lg:w-[60%] lg:pt-[120px] lg:pb-0 xl:w-1/2'>
          {parts.length > 0 && (
            <div className='flex flex-col gap-10 pb-16 lg:pb-[100px]'>
              {parts.map((part, i) => (
                // pre-wrap as Framer's text containers: a space that hangs at the end of a line keeps its box.
                <ScrollReveal key={i} delay={i * 0.06} as='p' className='whitespace-pre-wrap font-display text-statement'>
                  <span data-tina-field={tinaField(part!)}>
                    {/*
                     * Reference: the lead-in is brand green, the continuation white. The space between them
                     * belongs to the continuation's text node, as in Framer's markup: when the continuation
                     * starts on a new line that space hangs at the end of the lead-in's line, which is where
                     * the Fidelity gate measures the run from.
                     */}
                    {part!.lead && <span className='text-emphasis'>{part!.lead}</span>}
                    {part!.text && <span className='text-foreground'>{part!.lead ? ` ${part!.text}` : part!.text}</span>}
                  </span>
                </ScrollReveal>
              ))}
            </div>
          )}

          {data.image?.src && (
            <ScrollReveal>
              {/* Corners via clip-path, not border-radius: the Reference snapshot reads the portrait's radius as 0 (#59 notes). */}
              <div className='relative aspect-[0.890323] w-full bg-card [clip-path:inset(0_round_20px)]' data-tina-field={tinaField(data.image, 'src')}>
                <Image
                  src={data.image.src}
                  alt={data.image.alt || ''}
                  fill
                  sizes='(min-width: 1280px) calc((min(100vw, 1440px) - 96px) / 2), (min-width: 1024px) calc((100vw - 48px) * 0.6), calc(100vw - 32px)'
                  className='object-cover'
                />
              </div>
            </ScrollReveal>
          )}

          {(data.experienceHeading || roles.length > 0 || cv) && (
            <div className='flex flex-col gap-4 pt-[100px]'>
              {data.experienceHeading && (
                <ScrollReveal as='h3' className='text-caption text-emphasis'>
                  <span data-tina-field={tinaField(data, 'experienceHeading')}>{data.experienceHeading}</span>
                </ScrollReveal>
              )}

              {roles.length > 0 && (
                <ul className='flex w-full flex-col gap-4'>
                  {roles.map((role, i) => (
                    <ScrollReveal
                      key={i}
                      as='li'
                      delay={i * 0.05}
                      amount={0.5}
                      className='flex w-full items-center justify-between py-4 shadow-[0_-1px_0_0_var(--color-border)]'
                    >
                      <div className='flex min-w-0 flex-1 flex-col'>
                        <span className='block h-7 text-body-lg text-foreground' data-tina-field={tinaField(role!, 'company')}>
                          {role!.company}
                        </span>
                        <span className='block h-7 text-body-lg text-muted-foreground' data-tina-field={tinaField(role!, 'role')}>
                          {role!.role}
                        </span>
                        <span className='block h-[22px] text-caption text-muted-foreground' data-tina-field={tinaField(role!, 'period')}>
                          {role!.period}
                        </span>
                      </div>
                      {/* Decorative "+", as on the Reference's rows (it opens nothing there either). */}
                      <span aria-hidden className='relative size-12 shrink-0'>
                        <span className='absolute top-1/2 left-3 h-0.5 w-6 -translate-y-1/2 rounded-full bg-foreground' />
                        <span className='absolute top-3 left-1/2 h-6 w-0.5 -translate-x-1/2 rounded-full bg-foreground' />
                      </span>
                    </ScrollReveal>
                  ))}
                </ul>
              )}

              {cv && (
                <ScrollReveal className='flex h-10 w-full items-center justify-end overflow-hidden'>
                  <a
                    href={cv.href!}
                    target={cvIsExternal ? '_blank' : undefined}
                    rel={cvIsExternal ? 'noopener' : undefined}
                    className='group flex items-center gap-2 rounded-sm text-foreground'
                    data-tina-field={tinaField(cv, 'label')}
                  >
                    {/* The Reference draws the icon with the Material Icons ligature font (docs/parity-audit.md H13). */}
                    <span aria-hidden className='font-icons text-icon'>
                      download
                    </span>
                    {/* Hover rolls the label up and a second copy in from below, as Framer's link variant does. */}
                    <span className='flex h-[22px] flex-col overflow-hidden text-caption uppercase'>
                      <span className='transition-transform duration-300 ease-out group-hover:-translate-y-[22px]'>{cv.label}</span>
                      <span aria-hidden className='transition-transform duration-300 ease-out group-hover:-translate-y-[22px]'>
                        {cv.label}
                      </span>
                    </span>
                  </a>
                </ScrollReveal>
              )}
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

export const aboutBlockSchema: Template = {
  name: 'about',
  label: 'About & experience',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      heading: 'About',
      parts: [{ lead: 'Currently,', text: 'a sentence about what you do now.' }],
      experienceHeading: 'Experience',
      roles: [{ company: 'Company', role: 'Role', period: '2025 – Present' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Heading',
      name: 'heading',
      description: 'Sticky beside the text at desktop widths. Not shown on phones and tablets, as on the live site.',
    },
    {
      type: 'object',
      label: 'Parts',
      name: 'parts',
      list: true,
      description: 'Each part is a green lead-in followed by white text. Leave the lead-in empty for an all-white paragraph.',
      ui: {
        itemProps: (item) => ({ label: item?.lead || item?.text || 'Part' }),
        defaultItem: { lead: 'Lead-in,', text: 'and the rest of the sentence.' },
      },
      fields: [
        { type: 'string', label: 'Lead-in', name: 'lead' },
        { type: 'string', label: 'Text', name: 'text', ui: { component: 'textarea' } },
      ],
    },
    {
      type: 'object',
      label: 'Image',
      name: 'image',
      description: 'Portrait under the text; cropped to a tall card.',
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
    {
      type: 'string',
      label: 'Experience label',
      name: 'experienceHeading',
      description: 'Small green label above the roles.',
    },
    {
      type: 'object',
      label: 'Roles',
      name: 'roles',
      list: true,
      description: 'Most recent first.',
      ui: {
        itemProps: (item) => ({ label: [item?.company, item?.role].filter(Boolean).join(' · ') || 'Role' }),
        defaultItem: { company: 'Company', role: 'Role', period: '2025 – Present' },
      },
      fields: [
        { type: 'string', label: 'Company', name: 'company' },
        { type: 'string', label: 'Role', name: 'role' },
        { type: 'string', label: 'Period', name: 'period', description: 'e.g. 2023 – Present' },
      ],
    },
    {
      type: 'object',
      label: 'CV link',
      name: 'cv',
      description: 'Small right-aligned link under the roles, with a download icon. Shown in capitals.',
      fields: [
        { type: 'string', label: 'Label', name: 'label' },
        { type: 'string', label: 'Link', name: 'href' },
      ],
    },
  ],
};
