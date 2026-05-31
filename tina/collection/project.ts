import type { Collection } from 'tinacms';
import { heroBlockSchema } from '@/components/blocks/hero';
import { contentBlockSchema } from '@/components/blocks/content';
import { testimonialBlockSchema } from '@/components/blocks/testimonial';
import { featureBlockSchema } from '@/components/blocks/features';
import { videoBlockSchema } from '@/components/blocks/video';
import { calloutBlockSchema } from '@/components/blocks/callout';
import { statsBlockSchema } from '@/components/blocks/stats';
import { ctaBlockSchema } from '@/components/blocks/call-to-action';

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
      description: 'Headline outcomes (e.g. "+40% adoption").',
      list: true,
      ui: {
        itemProps: (item) => ({ label: `${item?.value ?? ''} ${item?.label ?? ''}`.trim() }),
        defaultItem: { label: 'Adoption', value: '+40%' },
      },
      fields: [
        { type: 'string', label: 'Value', name: 'value' },
        { type: 'string', label: 'Label', name: 'label' },
      ],
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
        calloutBlockSchema,
        featureBlockSchema,
        statsBlockSchema,
        ctaBlockSchema,
        contentBlockSchema,
        testimonialBlockSchema,
        videoBlockSchema,
      ],
    },
  ],
};

export default Project;
