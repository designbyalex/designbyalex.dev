import type { Collection } from 'tinacms';
import { heroBlockSchema } from '@/components/blocks/hero';
import { textBlockSchema } from '@/components/blocks/text';
import { imageBlockSchema } from '@/components/blocks/image';
import { galleryBlockSchema } from '@/components/blocks/gallery';
import { videoBlockSchema } from '@/components/blocks/video';
import { featureDeepDiveBlockSchema } from '@/components/blocks/feature-deep-dive';
import { metricsBlockSchema } from '@/components/blocks/metrics';
import { quoteBlockSchema } from '@/components/blocks/quote';
import { ctaBlockSchema } from '@/components/blocks/call-to-action';
import { caseStudySectionBlockSchema } from '@/components/blocks/case-study-section';
import { metricFields } from '@/tina/fields/metric';

const Project: Collection = {
  label: 'Projects',
  name: 'project',
  path: 'content/projects',
  format: 'mdx',
  ui: {
    // Case studies live at the root slug (e.g. /acacia), matching the live site.
    router: ({ document }) => `/${document._sys.breadcrumbs.join('/')}`,
  },
  fields: [
    {
      type: 'string',
      label: 'Status',
      name: 'status',
      description: 'Lifecycle of the project — drives the status accent colour.',
      options: [
        { label: 'Shipped', value: 'shipped' },
        { label: 'In development', value: 'in-development' },
        { label: 'Concept', value: 'concept' },
      ],
    },
    {
      type: 'string',
      label: 'Title',
      name: 'title',
      isTitle: true,
      required: true,
    },
    {
      type: 'number',
      label: 'Order',
      name: 'order',
      description: 'Sort position for next/previous project navigation (lower shows first).',
    },
    {
      type: 'string',
      label: 'Tagline',
      name: 'tagline',
      description: 'One-line summary shown beneath the title.',
    },
    {
      type: 'rich-text',
      label: 'Intro',
      name: 'intro',
      description:
        'Lead paragraphs of the Overview, set as large white statements beside the metadata list. Highlight the green key phrases with the editor’s highlighter.',
    },
    {
      type: 'string',
      label: 'Overview spacing',
      name: 'overviewStyle',
      description:
        'Rhythm of the Overview. Compact (the default): each value straight under its label, paragraphs 30px apart on desktop. Relaxed: 4px between label and value, the Role set as a white paragraph with 4px below, paragraphs 40px apart on desktop.',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Relaxed', value: 'relaxed' },
      ],
    },
    {
      type: 'string',
      label: 'Typology',
      name: 'typology',
      description: 'Project category / discipline (e.g. Fintech & Sustainability). First row of the Overview list.',
      list: true,
    },
    {
      type: 'string',
      label: 'Product',
      name: 'product',
      description: 'What was built (e.g. B2B2C SaaS Platform). Its own Overview row, after Typology.',
    },
    {
      type: 'string',
      label: 'Role',
      name: 'role',
      description: 'Your role(s) on the project.',
      list: true,
    },
    {
      type: 'string',
      label: 'Role description',
      name: 'roleDescription',
      description: 'One or two sentences on what the role involved, shown under the role.',
      ui: { component: 'textarea' },
    },
    {
      type: 'string',
      label: 'Timeline',
      name: 'timeline',
      description: 'When the work happened (e.g. 2023–2024).',
    },
    {
      type: 'object',
      label: 'Collaborators',
      name: 'collaborators',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.name }),
        defaultItem: { name: 'Name', role: 'Role' },
      },
      fields: [
        { type: 'string', label: 'Name', name: 'name' },
        { type: 'string', label: 'Role', name: 'role' },
        { type: 'string', label: 'URL', name: 'url' },
      ],
    },
    {
      type: 'string',
      label: 'Tools',
      name: 'tools',
      description: 'Tools and platforms used (e.g. Figma, Webflow CMS).',
      list: true,
    },
    {
      type: 'string',
      label: 'Deliverables',
      name: 'deliverables',
      description: 'What was delivered, one item per entry. A trailing parenthetical, e.g. "(WCAG AA)", is set in grey after the item.',
      list: true,
    },
    {
      type: 'object',
      label: 'Metrics',
      name: 'metrics',
      description: 'Headline outcomes. The display string is derived from the value + kind.',
      list: true,
      ui: {
        itemProps: (item) => ({ label: `${item?.value ?? ''} ${item?.label ?? ''}`.trim() }),
        defaultItem: { value: 40, kind: 'delta', label: 'Adoption' },
      },
      fields: metricFields,
    },
    {
      type: 'image',
      label: 'Cover Image',
      name: 'coverImage',
      description: 'The full-bleed hero image under the title row; also the share image.',
      // @ts-ignore
      uploadDir: () => 'projects',
    },
    {
      type: 'string',
      label: 'Cover image alt text',
      name: 'coverImageAlt',
      description: 'Describe the hero image for screen readers.',
      ui: { component: 'textarea' },
    },
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Sections',
      ui: {
        visualSelector: true,
      },
      templates: [
        caseStudySectionBlockSchema,
        heroBlockSchema,
        textBlockSchema,
        imageBlockSchema,
        galleryBlockSchema,
        videoBlockSchema,
        featureDeepDiveBlockSchema,
        metricsBlockSchema,
        quoteBlockSchema,
        ctaBlockSchema,
      ],
    },
  ],
};

export default Project;
