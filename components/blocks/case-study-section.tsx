'use client';
import React from 'react';
import Image from 'next/image';
import type { Template } from 'tinacms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { tinaField } from 'tinacms/dist/react';
import type {
  ProjectBlocksCaseStudySection,
  ProjectBlocksCaseStudySectionBlocksBody,
  ProjectBlocksCaseStudySectionBlocksIconList,
  ProjectBlocksCaseStudySectionBlocksImage,
  ProjectBlocksCaseStudySectionBlocksInsights,
  ProjectBlocksCaseStudySectionBlocksLogoCard,
  ProjectBlocksCaseStudySectionBlocksStatement,
} from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { components } from '../mdx-components';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

/**
 * One case-study section, as the Reference composes them (#60, docs/parity-audit.md §2.4): the heading
 * (white) with its grey subheading on the next line in the left column, a column of nested blocks on
 * the right (body copy, statements, labelled lists, the Mission logo card, images), and an optional
 * full-width image below both. A hairline runs above the columns, so sections read as separated.
 *
 * Boxes are Framer's. Section: 1440px max, padded 48/48/100 at xl (24/24/64 at lg, 32/16/64 under
 * it, where it is a 532px-max column), at least 605px tall, children 60px apart. Columns: the row is
 * padded 10px at the top (16px under lg) with the hairline above it, 60px apart at xl (40 at lg, 32
 * stacked under it); the left column flexes and holds the heading in 80% of its width; the right one
 * is 47% wide and at most 532px, its blocks 60px apart. Under lg a statement flagged "lead on phones"
 * moves above the body, as the Reference's phone variant does.
 */

type SectionData = ProjectBlocksCaseStudySection;
type ColumnBlock = NonNullable<NonNullable<SectionData['blocks']>[number]>;

const HAIRLINE_BELOW = 'shadow-[0_1px_0_0_var(--color-border)]';

/** The nested template name from a generated `__typename` (…BlocksStatement → Statement). */
const kindOf = (block: { __typename?: string | null }) => block.__typename?.replace(/^.*Blocks/, '') ?? '';

export const CaseStudySection = ({ data }: { data: SectionData }) => {
  const blocks = (data.blocks?.filter(Boolean) ?? []) as ColumnBlock[];
  const statementHeading = data.headingSize === 'statement';

  return (
    <Section
      sectionId={data.sectionId || 'case-study-section'}
      background={data.background!}
      rootClassName='mx-auto w-full max-w-[532px] lg:max-w-[1440px]'
      className='flex min-h-[605px] max-w-none flex-col gap-[60px] px-4 pt-8 pb-16 lg:px-6 lg:pt-6 xl:px-12 xl:pt-12 xl:pb-[100px]'
    >
      <div className='flex flex-col gap-8 pt-4 shadow-[0_-1px_0_0_var(--color-border)] lg:flex-row lg:items-start lg:gap-10 lg:pt-[10px] xl:gap-[60px]'>
        <div className='w-full pb-px lg:min-w-0 lg:flex-1'>
          <ScrollReveal className='w-full xl:w-[80%]'>
            {/* One heading element with the subheading after a break, as Framer's h3: white line, then the grey one. */}
            <h2 className={cn('font-display', statementHeading ? 'text-statement' : 'text-heading')}>
              <span data-tina-field={tinaField(data, 'heading')}>{data.heading}</span>
              {data.subheading && (
                <>
                  <br />
                  <span className='text-muted-foreground' data-tina-field={tinaField(data, 'subheading')}>
                    {data.subheading}
                  </span>
                </>
              )}
            </h2>
          </ScrollReveal>
        </div>

        {blocks.length > 0 && (
          <div className='flex w-full flex-col gap-[60px] lg:w-[47%] lg:max-w-[532px] lg:shrink-0'>
            {blocks.map((block, i) => (
              <ColumnBlockView key={i} block={block} index={i} />
            ))}
          </div>
        )}
      </div>

      {data.image?.src && (
        <ScrollReveal className='w-full'>
          {/* Full content width at Framer's 1.78065 ratio; corners via clip-path (the Reference snapshot reads the radius as 0, see the #59 notes). */}
          <div className='relative aspect-[1.78065] w-full [clip-path:inset(0_round_20px)]' data-tina-field={tinaField(data.image, 'src')}>
            <Image
              src={data.image.src}
              alt={data.image.alt || ''}
              fill
              sizes='(min-width: 1280px) min(100vw - 96px, 1344px), (min-width: 1024px) calc(100vw - 48px), min(100vw - 32px, 500px)'
              className='object-cover'
            />
          </div>
        </ScrollReveal>
      )}
    </Section>
  );
};

const ColumnBlockView = ({ block, index }: { block: ColumnBlock; index: number }) => {
  const delay = Math.min(index, 4) * 0.06;
  const kind = kindOf(block);

  if (kind === 'Body') {
    const body = block as ProjectBlocksCaseStudySectionBlocksBody;
    // The Reference's body copy: 14px grey, paragraphs 20px apart, bold runs near-white at weight 400.
    return (
      <ScrollReveal delay={delay} className='w-full'>
        <div
          className='text-caption text-muted-foreground [&_a]:text-emphasis [&_a:hover]:underline [&_p+p]:mt-5 [&_strong]:font-normal [&_strong]:text-foreground-soft'
          data-tina-field={tinaField(body, 'body')}
        >
          <TinaMarkdown content={body.body} components={components} />
        </div>
      </ScrollReveal>
    );
  }

  if (kind === 'Statement') {
    const statement = block as ProjectBlocksCaseStudySectionBlocksStatement;
    // Large white text with a green ending and no quote glyphs. pre-wrap as Framer's text containers:
    // the space between the two parts belongs to whichever string carries it, and a space that hangs
    // at the end of a line keeps its box, which is where the Fidelity gate measures the run from.
    return (
      <ScrollReveal
        as='p'
        delay={delay}
        className={cn('w-full whitespace-pre-wrap font-display text-statement text-foreground', statement.leadOnPhone && 'max-lg:-order-1')}
      >
        <span data-tina-field={tinaField(statement)}>
          {statement.text}
          {statement.emphasis && <span className='text-emphasis'>{statement.emphasis}</span>}
        </span>
      </ScrollReveal>
    );
  }

  if (kind === 'Insights') {
    const list = block as ProjectBlocksCaseStudySectionBlocksInsights;
    const items = list.items?.filter(Boolean) ?? [];
    return (
      <ScrollReveal delay={delay} className='w-full'>
        {list.label && <ListLabel text={list.label} field={tinaField(list, 'label')} />}
        <ul>
          {items.map((item, i) => (
            // Framer's rows: 12px above, 14px below, 8px between title and text, a hairline under each.
            <li key={i} className={cn('flex w-full flex-col gap-2 pt-3 pb-3.5', HAIRLINE_BELOW)} data-tina-field={tinaField(item!)}>
              {item!.title && <p className='text-caption text-muted-foreground'>{item!.title}</p>}
              {item!.text && <p className='text-caption text-foreground-soft'>{item!.text}</p>}
            </li>
          ))}
        </ul>
      </ScrollReveal>
    );
  }

  if (kind === 'IconList') {
    const list = block as ProjectBlocksCaseStudySectionBlocksIconList;
    const items = list.items?.filter(Boolean) ?? [];
    return (
      <ScrollReveal delay={delay} className='w-full'>
        {list.label && <ListLabel text={list.label} field={tinaField(list, 'label')} />}
        <ul>
          {items.map((item, i) => (
            // Framer's rows: 14px above and below, a 30px icon column 8px before the text, a hairline under each.
            <li key={i} className={cn('flex w-full items-center gap-2 py-3.5', HAIRLINE_BELOW)} data-tina-field={tinaField(item!)}>
              {/* Icon slot; the icons themselves are #61's. */}
              <span aria-hidden className='w-[30px] shrink-0 self-stretch pl-0.5' />
              <p className='min-w-0 flex-1 text-caption text-foreground-soft'>{item!.text}</p>
            </li>
          ))}
        </ul>
      </ScrollReveal>
    );
  }

  if (kind === 'LogoCard') {
    const card = block as ProjectBlocksCaseStudySectionBlocksLogoCard;
    // The Mission card: a 435px bordered card with 16px corners clipping a 524×522 grid drawn from 43px
    // above its top edge (so the grid's frame line sits just inside the card), the logo centred over it.
    return (
      <ScrollReveal delay={delay} className='w-full'>
        <div
          role='img'
          aria-label={card.alt || undefined}
          className='relative h-[435px] w-full overflow-clip rounded-[16px] border border-primary/50'
          data-tina-field={tinaField(card, 'grid')}
        >
          {card.grid && (
            <span
              aria-hidden
              className='absolute -top-[43px] -left-px block h-[522px] w-[524px] bg-[length:100%_100%] bg-no-repeat'
              style={{ backgroundImage: `url(${card.grid})` }}
            />
          )}
          {card.logo && (
            // A mask filled with the foreground colour: white on the dark theme, as live; near-black on light.
            <span
              aria-hidden
              className='absolute top-[calc(50.1149%-55.5px)] left-[calc(50%-55.5px)] block size-[111px] bg-foreground'
              style={{
                maskImage: `url(${card.logo})`,
                WebkitMaskImage: `url(${card.logo})`,
                maskSize: '100% 100%',
                WebkitMaskSize: '100% 100%',
              }}
            />
          )}
        </div>
      </ScrollReveal>
    );
  }

  if (kind === 'Image') {
    const image = block as ProjectBlocksCaseStudySectionBlocksImage;
    if (!image.src) return null;
    return (
      <ScrollReveal delay={delay} className='w-full'>
        <div data-tina-field={tinaField(image, 'src')}>
          <Image src={image.src} alt={image.alt || ''} width={1600} height={1200} className='h-auto w-full' />
        </div>
      </ScrollReveal>
    );
  }

  return null;
};

/** The small green label row that opens a list ("Some user insights"): 8px padding and a hairline under it. */
const ListLabel = ({ text, field }: { text: string; field: string }) => (
  <p className={cn('w-full py-2 text-caption text-emphasis', HAIRLINE_BELOW)} data-tina-field={field}>
    {text}
  </p>
);

const projectImageField = (name: string, label: string) => ({
  type: 'image' as const,
  name,
  label,
  // @ts-ignore - uploadDir is supported at runtime
  uploadDir: () => 'projects',
});

const altField = { type: 'string' as const, name: 'alt', label: 'Alt text', description: 'Describe the image for screen readers.' };

const bodyTemplate: Template = {
  name: 'body',
  label: 'Body',
  ui: { defaultItem: { body: 'A paragraph of body copy.' } },
  fields: [
    {
      type: 'rich-text',
      name: 'body',
      label: 'Body',
      description: 'Paragraphs 20px apart. Highlight a phrase to set it in green; a line break (Shift+Enter) keeps text in one paragraph.',
    },
  ],
};

const statementTemplate: Template = {
  name: 'statement',
  label: 'Statement',
  ui: {
    itemProps: (item) => ({ label: item?.text ? `Statement: ${item.text}` : 'Statement' }),
    defaultItem: { text: 'A short statement that ends ', emphasis: 'in green.' },
  },
  fields: [
    {
      type: 'string',
      name: 'text',
      label: 'Text',
      ui: { component: 'textarea' },
      description: 'The white part. Spaces are kept as typed: end with a space when the green ending continues on the same line.',
    },
    { type: 'string', name: 'emphasis', label: 'Green ending', description: 'Shown in the brand green after the text.' },
    {
      type: 'boolean',
      name: 'leadOnPhone',
      label: 'Lead on phones',
      description: 'Under 1024px, show this statement first in the column, before the body, as the Reference does in most sections.',
    },
  ],
};

const insightsTemplate: Template = {
  name: 'insights',
  label: 'Insights',
  ui: { itemProps: (item) => ({ label: item?.label || 'Insights' }), defaultItem: { label: 'Some user insights' } },
  fields: [
    { type: 'string', name: 'label', label: 'Label', description: 'The small green label row above the list.' },
    {
      type: 'object',
      list: true,
      name: 'items',
      label: 'Insights',
      ui: { itemProps: (item) => ({ label: item?.title || 'Insight' }), defaultItem: { title: 'Insight', text: 'What we learned.' } },
      fields: [
        { type: 'string', name: 'title', label: 'Title', description: 'Grey, on its own line.' },
        { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
      ],
    },
  ],
};

const iconListTemplate: Template = {
  name: 'iconList',
  label: 'Icon list',
  ui: { itemProps: (item) => ({ label: item?.label || 'Icon list' }), defaultItem: { label: 'Some key features I designed' } },
  fields: [
    { type: 'string', name: 'label', label: 'Label', description: 'The small green label row above the list.' },
    {
      type: 'object',
      list: true,
      name: 'items',
      label: 'Items',
      ui: { itemProps: (item) => ({ label: item?.text || 'Item' }), defaultItem: { text: 'Feature' } },
      fields: [{ type: 'string', name: 'text', label: 'Text' }],
    },
  ],
};

const logoCardTemplate: Template = {
  name: 'logoCard',
  label: 'Logo card',
  ui: { itemProps: () => ({ label: 'Logo card' }) },
  fields: [
    { ...projectImageField('grid', 'Grid background'), description: 'A 524×522 drawing placed behind the logo (an SVG, as the Acacia grid).' },
    { ...projectImageField('logo', 'Logo'), description: 'An SVG silhouette, drawn 111px wide in the page foreground colour and centred.' },
    altField,
  ],
};

const columnImageTemplate: Template = {
  name: 'image',
  label: 'Image',
  ui: { itemProps: (item) => ({ label: item?.alt || 'Image' }) },
  fields: [projectImageField('src', 'Image'), altField],
};

export const caseStudySectionBlockSchema: Template = {
  name: 'caseStudySection',
  label: 'Case-study section',
  ui: {
    previewSrc: '/blocks/content.png',
    itemProps: (item) => ({ label: item?.heading ? `Section: ${item.heading}` : 'Case-study section' }),
    defaultItem: {
      sectionId: 'section',
      heading: 'Section heading',
      subheading: 'A grey subheading on its own line.',
      headingSize: 'heading',
      blocks: [{ _template: 'body', body: 'A paragraph of body copy.' }],
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'string',
      name: 'sectionId',
      label: 'Section id',
      required: true,
      description:
        'Stable id for the Fidelity gate (rendered as data-section), from the Section map in parity/gate-config.json: mission, credibility, trust, engagement, solution, whats-next…',
    },
    // Not `required`: the deep-dive block's optional `heading` shares the GraphQL union, and Tina's codegen rejects mixed nullability.
    { type: 'string', name: 'heading', label: 'Heading' },
    { type: 'string', name: 'subheading', label: 'Subheading', description: 'Grey, on its own line under the heading.' },
    {
      type: 'string',
      name: 'headingSize',
      label: 'Heading size',
      options: [
        { label: 'Section heading (40px)', value: 'heading' },
        { label: 'Statement (28px)', value: 'statement' },
      ],
    },
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Right column',
      description: 'Body copy, statements, lists and media in the right column, in order.',
      templates: [bodyTemplate, statementTemplate, insightsTemplate, iconListTemplate, logoCardTemplate, columnImageTemplate],
    },
    {
      type: 'object',
      name: 'image',
      label: 'Full-width image',
      description: 'Runs the full content width below the columns, at a 16:9 ratio with 20px corners.',
      fields: [projectImageField('src', 'Image'), altField],
    },
  ],
};
