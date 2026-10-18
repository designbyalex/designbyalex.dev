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
      type: 'string',
      label: 'Typology',
      name: 'typology',
      description: 'Project category / discipline (e.g. Product Design, Brand).',
      list: true,
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
      // @ts-ignore
      uploadDir: () => 'projects',
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
