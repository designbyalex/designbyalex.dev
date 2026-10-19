'use client';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowDown } from 'lucide-react';
import { PageBlocksHero } from '../../tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TextReveal } from '../motion-primitives/text-reveal';
import { Button } from '../ui/button';

/**
 * Homepage hero, faithful to designbyalex.dev: the teal logo-mark card settles
 * in with a slow zoom-out, then the headline arrives character by character,
 * the tagline word by word, and the action last. Every piece routes through the
 * motion primitives, so `prefers-reduced-motion` renders it at rest.
 */
export const Hero = ({ data }: { data: PageBlocksHero }) => {
  return (
    <Section background={data.background!} className='pt-4 md:pt-8'>
      <div className='mx-auto max-w-6xl'>
        {data.image?.src && (
          <div
            className='overflow-hidden rounded-2xl border border-border bg-card'
            data-tina-field={tinaField(data.image, 'src')}
          >
            {/* The zoom-out is clipped by the card, like Framer's scaled background layer. */}
            <ScrollReveal y={0} scale={1.08} duration={1.4} amount={0.1} className='relative h-[clamp(220px,48vh,600px)] w-full'>
              <Image
                src={data.image.src}
                alt={data.image.alt || ''}
                fill
                priority
                sizes='(min-width: 1280px) 1152px, 100vw'
                className='object-cover'
              />
            </ScrollReveal>
          </div>
        )}

        <div className='mt-10 max-w-4xl md:mt-14'>
          {data.headline && (
            <div data-tina-field={tinaField(data, 'headline')}>
              <TextReveal
                as='h1'
                per='char'
                stagger={0.012}
                delay={0.3}
                className='text-balance text-[2.75rem] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[3.5rem] lg:text-[4.5rem]'
              >
                {data.headline}
              </TextReveal>
            </div>
          )}
          {data.tagline && (
            <div data-tina-field={tinaField(data, 'tagline')}>
              <TextReveal
                as='p'
                per='word'
                stagger={0.02}
                delay={1.1}
                className='mt-8 max-w-3xl text-balance text-lg leading-[1.4] text-foreground md:text-xl'
              >
                {data.tagline}
              </TextReveal>
            </div>
          )}

          {data.actions && data.actions.length > 0 && (
            <ScrollReveal delay={1.6} className='mt-10 flex flex-wrap items-center gap-3'>
              {data.actions.map((action) => (
                <Button
                  key={action!.label}
                  asChild
                  size='lg'
                  variant={action!.type === 'link' ? 'ghost' : 'outline'}
                  className='rounded-full px-5 text-base'
                >
                  <Link href={action!.link!} data-tina-field={tinaField(action)}>
                    <span className='text-nowrap'>{action!.label}</span>
                    <ArrowDown aria-hidden className='size-4' />
                  </Link>
                </Button>
              ))}
            </ScrollReveal>
          )}
        </div>
      </div>
    </Section>
  );
};

export const heroBlockSchema: Template = {
  name: 'hero',
  label: 'Hero',
  ui: {
    previewSrc: '/blocks/hero.png',
    defaultItem: {
      headline: "I'm a digital product designer committed to my constant evolution.",
      tagline: 'Leveraging AI-workflows, I design beautiful digital products for fast moving product teams.',
      actions: [{ label: 'See Selected Projects', type: 'button', link: '#works' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      label: 'Headline',
      name: 'headline',
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      label: 'Tagline',
      name: 'tagline',
      ui: { component: 'textarea' },
    },
    {
      label: 'Actions',
      name: 'actions',
      type: 'object',
      list: true,
      ui: {
        defaultItem: {
          label: 'Action Label',
          type: 'button',
          link: '/',
        },
        itemProps: (item) => ({ label: item.label }),
      },
      fields: [
        {
          label: 'Label',
          name: 'label',
          type: 'string',
        },
        {
          label: 'Type',
          name: 'type',
          type: 'string',
          options: [
            { label: 'Button', value: 'button' },
            { label: 'Link', value: 'link' },
          ],
        },
        {
          label: 'Link',
          name: 'link',
          type: 'string',
          description: 'A path (/acacia), an anchor (#works) or a full URL.',
        },
      ],
    },
    {
      type: 'object',
      label: 'Image',
      name: 'image',
      fields: [
        {
          name: 'src',
          label: 'Image Source',
          type: 'image',
          // @ts-ignore - uploadDir is supported at runtime
          uploadDir: () => 'home',
        },
        {
          name: 'alt',
          label: 'Alt Text',
          type: 'string',
        },
      ],
    },
  ],
};
