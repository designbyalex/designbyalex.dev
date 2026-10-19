'use client';
import React from 'react';
import Link from 'next/link';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { PageBlocksContact } from '@/tina/__generated__/types';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { TextReveal } from '../motion-primitives/text-reveal';
import { Button } from '../ui/button';

/**
 * Contact entry points: a display-size invitation, an email button and a row
 * of secondary links (LinkedIn, CV). The contact flow stays mailto-based.
 */
export const Contact = ({ data }: { data: PageBlocksContact }) => {
  const links = data.links?.filter(Boolean) ?? [];
  const isExternal = (href: string) => /^(https?:|mailto:)/.test(href);

  return (
    <Section background={data.background!} className='py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        {data.heading && (
          <div data-tina-field={tinaField(data, 'heading')}>
            <TextReveal
              as='h2'
              per='word'
              className='text-balance text-[2.75rem] font-medium leading-[1.1] tracking-[-0.02em] sm:text-[3.625rem] lg:text-[4.5rem]'
            >
              {data.heading}
            </TextReveal>
          </div>
        )}
        {data.description && (
          <ScrollReveal delay={0.1}>
            <p className='mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl' data-tina-field={tinaField(data, 'description')}>
              {data.description}
            </p>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.2} className='mt-10 flex flex-wrap items-center gap-x-8 gap-y-4'>
          {data.email && (
            <Button asChild size='lg' className='rounded-full px-6 text-base'>
              <Link href={`mailto:${data.email}`} data-tina-field={tinaField(data, 'emailLabel')}>
                <Mail aria-hidden className='size-4' />
                <span className='text-nowrap'>{data.emailLabel || 'Get in touch'}</span>
              </Link>
            </Button>
          )}
          {links.map((link, i) =>
            link!.href && link!.label ? (
              <Link
                key={i}
                href={link!.href}
                target={isExternal(link!.href) && !link!.href.startsWith('mailto:') ? '_blank' : undefined}
                rel={isExternal(link!.href) ? 'noopener noreferrer' : undefined}
                className='inline-flex items-center gap-1 text-base text-muted-foreground underline-offset-4 transition-colors hover:text-emphasis hover:underline'
                data-tina-field={tinaField(link!)}
              >
                {link!.label}
                <ArrowUpRight aria-hidden className='size-4' />
              </Link>
            ) : null
          )}
        </ScrollReveal>
      </div>
    </Section>
  );
};

export const contactBlockSchema: Template = {
  name: 'contact',
  label: 'Contact',
  ui: {
    previewSrc: '/blocks/cta.png',
    defaultItem: {
      heading: "Let's talk",
      email: 'ablumeinfeld@gmail.com',
      emailLabel: 'Get in touch',
      links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/alexanderblumeinfeld/' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    { type: 'string', label: 'Heading', name: 'heading' },
    { type: 'string', label: 'Description', name: 'description', ui: { component: 'textarea' } },
    { type: 'string', label: 'Email', name: 'email', description: 'Address behind the primary button (rendered as a mailto link).' },
    { type: 'string', label: 'Email button label', name: 'emailLabel' },
    {
      type: 'object',
      label: 'Links',
      name: 'links',
      list: true,
      description: 'Secondary links shown beside the button, e.g. LinkedIn and the full CV.',
      ui: {
        itemProps: (item) => ({ label: item?.label || 'Link' }),
        defaultItem: { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
      },
      fields: [
        { type: 'string', label: 'Label', name: 'label' },
        { type: 'string', label: 'Link', name: 'href' },
      ],
    },
  ],
};
