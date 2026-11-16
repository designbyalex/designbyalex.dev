import React from 'react';
import { Components, TinaMarkdown, TinaMarkdownContent } from 'tinacms/dist/rich-text';
import Image from 'next/image';
import { Video } from './blocks/video';
import { PageBlocksVideo } from '@/tina/__generated__/types';

export const components: Components<{
  BlockQuote: {
    children: TinaMarkdownContent;
    authorName: string;
  };
  video: PageBlocksVideo;
}> = {
  // No content has code blocks, so a plain <pre> replaces the starter's Prism highlighter and Mermaid
  // renderer, which shipped prism-react-renderer and mermaid to every page (#176).
  code_block: (props) => {
    if (!props) {
      return <></>;
    }
    return (
      <pre>
        <code>{props.value}</code>
      </pre>
    );
  },
  BlockQuote: (props: {
    children: TinaMarkdownContent;
    authorName: string;
  }) => {
    return (
      <div>
        <blockquote>
          <TinaMarkdown content={props.children} />
          {props.authorName}
        </blockquote>
      </div>
    );
  },
  img: (props) => {
    if (!props) {
      return <></>;
    }
    return (
      <span className='flex items-center justify-center'>
        <Image src={props.url} alt={props.alt || ''} width={500} height={500} />
      </span>
    );
  },
  // Tina's own highlight mark (the editor's highlighter), rendered as the Reference's green key
  // phrases (#60): a span in the emphasis colour, no background. The highlighter's colour is ignored
  // so every highlight is the one brand green in both themes.
  highlight: (props: { children: React.ReactNode; color?: string } | undefined) => (
    <span className='text-emphasis'>{props?.children}</span>
  ),
  video: (props) => {
    return <Video data={props} />;
  },
};
