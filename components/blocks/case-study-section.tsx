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
  ProjectBlocksCaseStudySectionBlocksVideo,
} from '@/tina/__generated__/types';
import { cn } from '@/lib/utils';
import { formatMetric, type MetricKind } from '@/lib/case-study/format';
import { metricFields } from '@/tina/fields/metric';
import { components } from '../mdx-components';
import { Section, sectionBlockSchemaField } from '../layout/section';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';
import { FeatureIcon, featureIconOptions } from './case-study-icons';
import { CaseStudyCarousel, type CarouselSlide } from './case-study-carousel';
import { PlainClip } from './video';

/**
 * One case-study section, as the Reference composes them (#60, docs/parity-audit.md §2.4): the heading
 * (white) with its grey subheading on the next line in the left column, a column of nested blocks on
 * the right (body copy, statements, labelled lists, the Mission logo card, images, videos), and below
 * both an optional carousel of slides, full-width image, two-up image grid, row of metric cards (#61) or
 * hatched placeholder panel (#65). A hairline runs above the columns, so sections read as separated.
 *
 * Boxes are Framer's. Section: 1440px max, padded 48/48/100 at xl (24/24/64 at lg, 32/16/64 under
 * it, where it is a 532px-max column), children 60px apart. Columns: the left one flexes and holds
 * the heading in 80% of its width; the right one is 47% wide and at most 532px. Framer's two section
 * variants differ in the row (`rhythm`): "stacked" (Acacia; MOS Urban's Pitch, Vision, Users and
 * Brand) is at least 605px tall at every width, its row padded 10px at the top with the columns 60px
 * apart at xl, 40 at lg, and stacked 32px apart under a 16px top padding below; "uniform" (MOS Urban's
 * other sections) keeps the 10px padding and the 60px gap at every width and is only at least 605px
 * tall on phones. The right column's blocks are 60px apart unless the section says otherwise
 * (`columnGap`: Framer's Vision and Users columns are 16 and 20). Under lg a statement flagged "lead
 * on phones" moves above the body, as the Reference's phone variant does, and an image so flagged
 * stays above it.
 */

type SectionData = ProjectBlocksCaseStudySection;
type ColumnBlock = NonNullable<NonNullable<SectionData['blocks']>[number]>;
type GridImage = NonNullable<NonNullable<SectionData['imageGrid']>[number]>;
type Metric = NonNullable<NonNullable<SectionData['metrics']>[number]>;

const HAIRLINE_BELOW = 'shadow-[0_1px_0_0_var(--color-border)]';

/** The right column's block spacing (Framer's column `gap`), by the `columnGap` option. */
const COLUMN_GAP: Record<string, string> = {
  '60': 'gap-[60px]',
  '20': 'gap-4 xl:gap-5',
  '16': 'gap-4',
};

/** The nested template name from a generated `__typename` (…BlocksStatement → Statement). */
const kindOf = (block: { __typename?: string | null }) => block.__typename?.replace(/^.*Blocks/, '') ?? '';

export const CaseStudySection = ({ data }: { data: SectionData }) => {
  const blocks = (data.blocks?.filter(Boolean) ?? []) as ColumnBlock[];
  const grid = (data.imageGrid?.filter((item) => item?.src) ?? []) as GridImage[];
  const metrics = (data.metrics?.filter(Boolean) ?? []) as Metric[];
  const statementHeading = data.headingSize === 'statement';
  const uniform = data.rhythm === 'uniform';
  const cardImage = data.imageStyle === 'card';
  const cardGrid = data.imageGridStyle === 'cards';
  const slides = (data.carouselSlides?.filter((item) => item?.video && item.frame) ?? []) as CarouselSlide[];

  return (
    <Section
      sectionId={data.sectionId || 'case-study-section'}
      background={data.background!}
      rootClassName='mx-auto w-full max-w-[532px] lg:max-w-[1440px]'
      className={cn(
        'flex max-w-none flex-col gap-[60px] px-4 pt-8 pb-16 lg:px-6 lg:pt-6 xl:px-12 xl:pt-12 xl:pb-[100px]',
        uniform ? 'max-lg:min-h-[605px]' : 'min-h-[605px]',
      )}
    >
      <div
        className={cn(
          'flex flex-col shadow-[0_-1px_0_0_var(--color-border)] lg:flex-row lg:items-start',
          uniform ? 'gap-[60px] pt-[10px]' : 'gap-8 pt-4 lg:gap-10 lg:pt-[10px] xl:gap-[60px]',
        )}
      >
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
          <div className={cn('flex w-full flex-col lg:w-[47%] lg:max-w-[532px] lg:shrink-0', COLUMN_GAP[data.columnGap ?? '60'] ?? COLUMN_GAP['60'])}>
            {blocks.map((block, i) => (
              <ColumnBlockView key={i} block={block} index={i} />
            ))}
          </div>
        )}
      </div>

      {slides.length > 0 && <CaseStudyCarousel slides={slides} label={data.heading || 'Carousel'} />}

      {data.image?.src && (
        <ScrollReveal className='w-full'>
          {/*
           * Framer's "Image Full". Wide (Acacia): the content width at a 1.78065 ratio at every width,
           * corners via clip-path, because the Reference snapshot reads that page's radius as 0 (see the
           * #59 notes). Card (MOS Urban): 1.78065 at lg+, 1.6729 under it, 20px border-radius, which the
           * Reference reads as 20 there.
           */}
          <div
            className={cn(
              'relative w-full',
              cardImage ? 'aspect-[1.6729] overflow-clip rounded-[20px] lg:aspect-[1.78065]' : 'aspect-[1.78065] [clip-path:inset(0_round_20px)]',
            )}
            data-tina-field={tinaField(data.image, 'src')}
          >
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

      {grid.length > 0 && cardGrid && (
        <ScrollReveal className='w-full'>
          {/*
           * Framer's "Image Grid" of cards (MOS Urban's typography pages): two 1.71613-ratio cards 8px apart
           * at lg+, stacked in order at 1.6729 under it; 20px corners on the card with the image at 101%
           * inside, so the image itself carries no radius (as the Reference reads it).
           */}
          <div className='flex w-full flex-col gap-2 lg:flex-row'>
            {grid.map((item, i) => (
              <div
                key={i}
                className='relative aspect-[1.6729] w-full overflow-clip rounded-[20px] lg:aspect-[1.71613] lg:min-w-0 lg:flex-1'
                data-tina-field={tinaField(item, 'src')}
              >
                <div className='absolute top-[-0.5%] left-[-0.5%] h-[101%] w-[101%]'>
                  <Image
                    src={item.src!}
                    alt={item.alt || ''}
                    fill
                    sizes='(min-width: 1280px) min(50vw - 52px, 668px), (min-width: 1024px) calc(50vw - 28px), min(100vw - 32px, 500px)'
                    className='object-cover'
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {grid.length > 0 && !cardGrid && (
        <ScrollReveal className='w-full'>
          {/*
           * Framer's "Image Grid" of phones (Acacia's onboarding): a 3.56129-ratio row of equal cards 8px
           * apart at desktop; on phones a 0.838408-ratio column with the second image on top (its wrappers
           * swap `order`), each card taking half the height. Corners 20px via clip-path, as the full-width image.
           */}
          <div className='flex aspect-[0.838408] w-full flex-col-reverse gap-2 lg:aspect-[3.56129] lg:flex-row'>
            {grid.map((item, i) => (
              <div key={i} className='relative min-h-0 flex-1 [clip-path:inset(0_round_20px)]' data-tina-field={tinaField(item, 'src')}>
                <Image
                  src={item.src!}
                  alt={item.alt || ''}
                  fill
                  sizes='(min-width: 1280px) min(50vw - 52px, 668px), (min-width: 1024px) calc(50vw - 28px), min(100vw - 32px, 500px)'
                  className='object-cover'
                />
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      {metrics.length > 0 && (
        <ul className='grid w-full grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-4'>
          {metrics.map((metric, i) => (
            <li key={i} className='min-w-0' data-tina-field={tinaField(metric)}>
              {/*
               * Framer's "Number Counter" card: #131313, 20px corners, 32px padding, content at the bottom.
               * Desktop: four across (8px apart), 310px tall, number 16px above the caption. Phones: one
               * per row, as tall as its content, 8px between number and caption, caption 90% wide.
               */}
              <ScrollReveal
                delay={Math.min(i, 4) * 0.06}
                className='flex h-full flex-col items-start justify-end gap-2 rounded-[20px] bg-card p-8 xl:h-[310px] xl:gap-4'
              >
                <p className='font-display text-metric text-foreground' data-tina-field={tinaField(metric, 'value')}>
                  {formatMetric({
                    value: metric.value ?? Number.NaN,
                    kind: metric.kind as MetricKind | null,
                    to: metric.to,
                    suffix: metric.suffix,
                  })}
                </p>
                <p className='w-[90%] text-caption text-muted-foreground xl:w-full' data-tina-field={tinaField(metric, 'label')}>
                  {metric.label}
                </p>
              </ScrollReveal>
            </li>
          ))}
        </ul>
      )}

      {data.placeholderPattern && (
        <ScrollReveal className='w-full'>
          {/*
           * Framer's hatched placeholder ("What's next for Mos?"): the "Image Full" card box (1.78065 at lg+,
           * 1.6729 under, 20px corners) filled with a 126px SVG tile repeated at 64px from the top-left.
           */}
          <div
            aria-hidden='true'
            className='aspect-[1.6729] w-full rounded-[20px] bg-repeat [background-position:left_top] [background-size:64px_auto] lg:aspect-[1.78065]'
            style={{ backgroundImage: `url(${data.placeholderPattern})` }}
            data-tina-field={tinaField(data, 'placeholderPattern')}
          />
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
    // Large white text with a green ending (or a green opening, as the Outcome statement) and no quote
    // glyphs; grey when it stands in for content ("Coming Soon…"). pre-wrap as Framer's text containers:
    // the space between the parts belongs to whichever string carries it, and a space that hangs at the
    // end of a line keeps its box, which is where the Fidelity gate measures the run from.
    return (
      <ScrollReveal
        as='p'
        delay={delay}
        className={cn(
          'w-full whitespace-pre-wrap font-display text-statement',
          statement.muted ? 'text-muted-foreground' : 'text-foreground',
          statement.leadOnPhone && 'max-lg:-order-1',
        )}
      >
        <span data-tina-field={tinaField(statement)}>
          {statement.lead && <span className='text-emphasis'>{statement.lead}</span>}
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
    // Rows are near-white (#f7f7f7); Framer sets the UX section's key features in pure white.
    const bright = list.tone === 'bright';
    return (
      <ScrollReveal delay={delay} className='w-full'>
        {list.label && <ListLabel text={list.label} field={tinaField(list, 'label')} />}
        <ul>
          {items.map((item, i) => (
            // Framer's rows: 14px above and below, a 30px icon column (the glyph top-left, 2px in) 8px before
            // the text, a hairline under each.
            <li key={i} className={cn('flex w-full items-center gap-2 py-3.5', HAIRLINE_BELOW)} data-tina-field={tinaField(item!)}>
              <span aria-hidden className='flex w-[30px] shrink-0 items-start self-stretch pl-0.5 text-foreground'>
                <FeatureIcon name={item!.icon} />
              </span>
              <p className={cn('min-w-0 flex-1 text-caption', bright ? 'text-foreground' : 'text-foreground-soft')}>{item!.text}</p>
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
          role={card.alt ? 'img' : undefined}
          aria-label={card.alt || undefined}
          aria-hidden={card.alt ? undefined : true}
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
    const natural = image.ratio === 'natural';
    const tall = image.ratio === 'tall';
    // Framer's "Image Right": the column's width at a 0.837097 ratio, cover, 20px corners (clip-path, as
    // the Reference snapshot reads the radius as 0); the tall card (MOS Urban's pitch illustration) at a
    // 0.855738 ratio at xl and 425px tall under it, with 16px border-radius (which the Reference reads);
    // or the image at its own ratio. "Lead on phones" keeps it above a statement that leads there.
    return (
      <ScrollReveal delay={delay} className={cn('w-full', image.leadOnPhone && 'max-lg:-order-2')}>
        <div
          className={cn(
            'relative w-full',
            tall ? 'overflow-clip rounded-[16px] max-xl:h-[425px] xl:aspect-[0.855738]' : '[clip-path:inset(0_round_20px)]',
            !natural && !tall && 'aspect-[0.837097]',
          )}
          data-tina-field={tinaField(image, 'src')}
        >
          {natural ? (
            <Image src={image.src} alt={image.alt || ''} width={1600} height={1200} className='h-auto w-full' />
          ) : (
            <Image
              src={image.src}
              alt={image.alt || ''}
              fill
              sizes='(min-width: 1024px) min(47vw, 532px), min(100vw - 32px, 500px)'
              className='object-cover'
            />
          )}
        </div>
      </ScrollReveal>
    );
  }

  if (kind === 'Video') {
    const video = block as ProjectBlocksCaseStudySectionBlocksVideo;
    if (!video.url) return null;
    // Framer's column "Image Wrapper" with the muted loop inside (the Identity and Years clips).
    return (
      <ScrollReveal delay={delay} className='w-full'>
        <PlainClip src={video.url} autoPlay={video.autoPlay} loop={video.loop} field={tinaField(video, 'url')} />
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
      name: 'lead',
      label: 'Green opening',
      description: 'Optional: shown in the brand green before the text (the Outcome statement opens in green). Spaces are kept as typed: end with a space.',
    },
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
      name: 'muted',
      label: 'Grey text',
      description: 'Set the text in the muted grey instead of white, as a placeholder ("Coming Soon…") reads on the Reference.',
    },
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
      type: 'string',
      name: 'tone',
      label: 'Row text',
      options: [
        { label: 'Near-white (most lists)', value: 'soft' },
        { label: 'White (the MOS Urban key features)', value: 'bright' },
      ],
    },
    {
      type: 'object',
      list: true,
      name: 'items',
      label: 'Items',
      ui: { itemProps: (item) => ({ label: item?.text || 'Item' }), defaultItem: { text: 'Feature', icon: 'module' } },
      fields: [
        { type: 'string', name: 'icon', label: 'Icon', options: featureIconOptions, description: 'The glyph in the 30px column before the text.' },
        { type: 'string', name: 'text', label: 'Text' },
      ],
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
  ui: { itemProps: (item) => ({ label: item?.alt || 'Image' }), defaultItem: { ratio: 'portrait' } },
  fields: [
    projectImageField('src', 'Image'),
    altField,
    {
      type: 'string',
      name: 'ratio',
      label: 'Shape',
      options: [
        { label: 'Portrait card (column width at 0.837, cropped)', value: 'portrait' },
        { label: 'Tall card (column width at 0.856 on desktop, 425px tall under it, 16px corners)', value: 'tall' },
        { label: 'Natural (the image’s own ratio)', value: 'natural' },
      ],
    },
    {
      type: 'boolean',
      name: 'leadOnPhone',
      label: 'Lead on phones',
      description: 'Under 1024px, keep this image first in the column, above a statement that leads there (the MOS Urban pitch illustration).',
    },
  ],
};

const columnVideoTemplate: Template = {
  name: 'video',
  label: 'Video',
  ui: {
    itemProps: (item) => ({ label: item?.url ? `Video: ${String(item.url).split('/').pop()}` : 'Video' }),
    defaultItem: { autoPlay: true, loop: true },
  },
  fields: [
    {
      type: 'string',
      name: 'url',
      label: 'Video file',
      description: 'A committed mp4 under /uploads (ADR 0001), e.g. /uploads/projects/mosurban/brand-identity.mp4. Plays muted and inline in the column’s 20px-cornered box, with no controls.',
    },
    {
      type: 'boolean',
      name: 'autoPlay',
      label: 'Auto play',
      description: 'Starts on its own. Under reduced motion it waits on its first frame with a play button instead.',
    },
    { type: 'boolean', name: 'loop', label: 'Loop' },
  ],
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
        'Stable id for the Fidelity gate (rendered as data-section), from the Section map in parity/gate-config.json: mission, credibility, trust, engagement, solution, pitch, vision, users, clients, ux, brand, identity, assets, years, outcome, whats-next…',
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
      type: 'string',
      name: 'rhythm',
      label: 'Row spacing',
      description:
        'Framer’s two section variants. Stacked: at least 605px tall at every width; under 1024px the heading sits 16px under the hairline and the columns stack 32px apart (40 on tablets). Uniform: 10px under the hairline and 60px apart at every width, at least 605px tall on phones only (MOS Urban’s Clients, UX, Identity, Assets, Years, Outcome and What’s next).',
      options: [
        { label: 'Stacked (default)', value: 'stacked' },
        { label: 'Uniform', value: 'uniform' },
      ],
    },
    {
      type: 'string',
      name: 'columnGap',
      label: 'Right-column spacing',
      description: 'Space between the right column’s blocks: 60px on most sections; Framer’s MOS Urban Vision column uses 16 and Users 20 (16 on phones).',
      options: [
        { label: '60px (default)', value: '60' },
        { label: '20px, 16 on phones', value: '20' },
        { label: '16px', value: '16' },
      ],
    },
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Right column',
      description: 'Body copy, statements, lists and media in the right column, in order.',
      templates: [bodyTemplate, statementTemplate, insightsTemplate, iconListTemplate, logoCardTemplate, columnImageTemplate, columnVideoTemplate],
    },
    {
      type: 'object',
      list: true,
      name: 'carouselSlides',
      label: 'Carousel slides',
      description:
        'Desktop only (from 1280px): Framer’s carousel below the columns, a 720px card showing one slide at a time with its caption top-left, a large faint step numeral bottom-left and its clip inside the device frame bottom-right. Next and Back pills and a dot per slide change slide in place; the first slide has no Back, the last no Next.',
      ui: {
        itemProps: (item) => ({ label: [item?.number, item?.quote].filter(Boolean).join(' · ') || 'Slide' }),
        defaultItem: { frame: '/uploads/projects/mosurban/studio-display.png', autoPlay: true },
      },
      fields: [
        { type: 'string', name: 'quote', label: 'Caption', ui: { component: 'textarea' }, description: 'White, 32px, in the top-left 70% of the slide.' },
        { type: 'string', name: 'number', label: 'Step numeral', description: 'The 232px faint numeral bottom-left, e.g. 01.' },
        {
          type: 'string',
          name: 'video',
          label: 'Video file',
          description: 'A committed mp4 under /uploads (ADR 0001). Plays muted, inline and looping inside the frame while its slide shows.',
        },
        { ...projectImageField('frame', 'Device frame'), description: 'The Studio Display frame image (2048×1570) the clip plays inside, 780px wide on the slide.' },
        {
          type: 'boolean',
          name: 'autoPlay',
          label: 'Auto play',
          description: 'Starts on its own. Under reduced motion it waits on its first frame with a play button instead.',
        },
      ],
    },
    {
      type: 'object',
      name: 'image',
      label: 'Full-width image',
      description: 'Runs the full content width below the columns, at a 16:9 ratio with 20px corners.',
      fields: [projectImageField('src', 'Image'), altField],
    },
    {
      type: 'string',
      name: 'imageStyle',
      label: 'Full-width image shape',
      description:
        'Framer’s two "Image Full" variants. Wide: 16:9 at every width, corners cut with clip-path (the Acacia images, which the Reference reads as square). Card: 16:9 from 1024px, 1.67:1 under it, 20px border-radius (the MOS Urban images, which the Reference reads as rounded).',
      options: [
        { label: 'Wide (default)', value: 'wide' },
        { label: 'Card', value: 'card' },
      ],
    },
    {
      type: 'object',
      list: true,
      name: 'imageGrid',
      label: 'Image grid',
      description: 'Two images side by side across the full content width below the columns, 20px corners.',
      ui: { itemProps: (item) => ({ label: item?.alt || 'Image' }) },
      fields: [projectImageField('src', 'Image'), altField],
    },
    {
      type: 'string',
      name: 'imageGridStyle',
      label: 'Image grid shape',
      description:
        'Phones: one 3.56:1 row at 1024px and up, a 0.84:1 column with the second image on top under it (the Acacia onboarding phones). Cards: two 1.72:1 cards from 1024px, stacked in order at 1.67:1 under it (the MOS Urban typography pages).',
      options: [
        { label: 'Phones (default)', value: 'phones' },
        { label: 'Cards', value: 'cards' },
      ],
    },
    {
      type: 'object',
      list: true,
      name: 'metrics',
      label: 'Metric cards',
      description: 'Raised rounded cards across the full content width below the columns: four per row at desktop, one per row on phones; the number bottom-left with its caption under it.',
      ui: {
        itemProps: (item) => ({ label: `${item?.value ?? ''} ${item?.label ?? ''}`.trim() || 'Metric' }),
        defaultItem: { value: 40, kind: 'percentage', label: 'Caption under the number' },
      },
      fields: metricFields,
    },
    {
      ...projectImageField('placeholderPattern', 'Placeholder pattern'),
      description:
        'A tile (an SVG, as the hatch in public/uploads/projects/mosurban/placeholder-hatch.svg) repeated at 64px across a full-width 16:9 panel with 20px corners below the columns: Framer’s "What’s next for Mos?" placeholder. Leave empty for no panel.',
    },
  ],
};
