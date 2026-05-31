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

const Page: Collection = {
  label: 'Pages',
  name: 'page',
  path: 'content/pages',
  format: 'mdx',
  ui: {
    router: ({ document }) => {
      const filepath = document._sys.breadcrumbs.join('/');
      if (filepath === 'home') {
        return '/';
      }
      return `/${filepath}`;
    },
  },
  fields: [
    {
      type: 'string',
      label: 'Title',
      name: 'title',
      isTitle: true,
      required: true,
      description: 'Used for the editor list and document metadata.',
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

export default Page;
