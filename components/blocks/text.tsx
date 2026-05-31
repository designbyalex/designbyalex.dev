'use client';
import React from 'react';

import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { components } from '../mdx-components';
import type { Template } from 'tinacms';
import { PageBlocksText } from '../../tina/__generated__/types';
import { tinaField } from 'tinacms/dist/react';
import { Section } from '../layout/section';
import { Mermaid } from './mermaid';
import { sectionBlockSchemaField } from '../layout/section';
import { scriptCopyBlockSchema, ScriptCopyBtn } from '../magicui/script-copy-btn';
import { ScrollReveal } from '../motion-primitives/scroll-reveal';

export const Text = ({ data }: { data: PageBlocksText }) => {
  return (
    <Section background={data.background!} className="prose prose-lg dark:prose-invert" data-tina-field={tinaField(data, 'body')}>
      <ScrollReveal>
        <TinaMarkdown
          content={data.body}
          components={{
            ...components,
            mermaid: (props: any) => <Mermaid {...props} />,
            scriptCopyBlock: (props: any) => <ScriptCopyBtn {...props} />,
          }}
        />
      </ScrollReveal>
    </Section>
  );
};

export const textBlockSchema: Template = {
  name: 'text',
  label: 'Text',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      body: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Donec odio. Quisque volutpat mattis eros. Nullam malesuada erat ut turpis. Suspendisse urna nibh, viverra non, semper suscipit, posuere a, pede.',
    },
  },
  fields: [
    sectionBlockSchemaField as any,
    {
      type: 'rich-text',
      label: 'Body',
      name: 'body',
      templates: [scriptCopyBlockSchema],
    },
  ],
};
