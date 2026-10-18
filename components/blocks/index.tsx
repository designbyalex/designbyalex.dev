import type { ComponentType } from "react";
import { tinaField } from "tinacms/dist/react";
import { Hero } from "./hero";
import { Text } from "./text";
import { ImageBlock } from "./image";
import { Gallery } from "./gallery";
import { Video } from "./video";
import { FeatureDeepDive } from "./feature-deep-dive";
import { Metrics } from "./metrics";
import { Quote } from "./quote";
import { CallToAction } from "./call-to-action";
import { resolveBlockComponent } from "./resolve";

/**
 * Registry keyed by Tina template name (the suffix of `__typename`). Shared by
 * every collection that uses the blocks body — currently `page` and `project` —
 * so `PageBlocksHero` and `ProjectBlocksHero` both resolve to `Hero`.
 */
export const blockComponents: Record<string, ComponentType<{ data: any }>> = {
  Hero,
  Text,
  Image: ImageBlock,
  Gallery,
  Video,
  FeatureDeepDive,
  Metrics,
  Quote,
  Cta: CallToAction,
};

type BlockData = {
  __typename?: string | null;
  [key: string]: unknown;
};

export const Blocks = (props: { blocks?: (BlockData | null)[] | null }) => {
  if (!props.blocks) return null;
  return (
    <>
      {props.blocks.map((block, i) => {
        if (!block) return null;
        const Component = resolveBlockComponent(block.__typename, blockComponents);
        // Unknown/malformed block types are safely ignored.
        if (!Component) return null;
        return (
          <div key={i} data-tina-field={tinaField(block as object)}>
            <Component data={block} />
          </div>
        );
      })}
    </>
  );
};
