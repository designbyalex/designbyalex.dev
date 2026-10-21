import type { Collection } from "tinacms";
import { ColorPickerInput } from "../fields/color";
import { iconSchema } from "../fields/icon";
import { icon } from "mermaid/dist/rendering-util/rendering-elements/shapes/icon.js";

const Global: Collection = {
  label: "Global",
  name: "global",
  path: "content/global",
  format: "json",
  ui: {
    global: true,
  },
  fields: [
    {
      type: "object",
      label: "Header",
      name: "header",
      fields: [
        iconSchema as any,
        {
          type: "string",
          label: "Color",
          name: "color",
          options: [
            { label: "Default", value: "default" },
            { label: "Primary", value: "primary" },
          ],
        },
        {
          type: "object",
          label: "Nav Links",
          name: "nav",
          list: true,
          ui: {
            itemProps: (item) => {
              return { label: item?.label };
            },
            defaultItem: {
              href: "home",
              label: "Home",
            },
          },
          fields: [
            {
              type: "string",
              label: "Link",
              name: "href",
            },
            {
              type: "string",
              label: "Label",
              name: "label",
            },
          ],
        },
      ],
    },
    {
      type: "object",
      label: "Footer",
      name: "footer",
      description: "Rendered on every page: the invitation, the text links and the bottom bar.",
      fields: [
        {
          type: "object",
          label: "Call to action",
          name: "cta",
          fields: [
            {
              type: "string",
              label: "Heading",
              name: "heading",
              description: "The invitation above the link, e.g. “Let's talk”.",
            },
            {
              type: "string",
              label: "Link label",
              name: "label",
              description: "The large link under the heading, e.g. “Get in touch”. Turns green on hover.",
            },
            {
              type: "string",
              label: "Link",
              name: "href",
              description: "Where the link goes, e.g. mailto:you@example.com.",
            },
          ],
        },
        {
          type: "object",
          label: "Links",
          name: "links",
          list: true,
          description: "Small text links beside the call to action. http(s) links open in a new tab.",
          ui: {
            itemProps: (item) => {
              return { label: item?.label || "Link" };
            },
            defaultItem: {
              label: "Home",
              href: "/",
            },
          },
          fields: [
            {
              type: "string",
              label: "Label",
              name: "label",
            },
            {
              type: "string",
              label: "Link",
              name: "href",
            },
          ],
        },
        {
          type: "string",
          label: "Name",
          name: "name",
          description: "Bottom bar, left: shown after the current year (“2026 Alexander Blum”).",
        },
        {
          type: "string",
          label: "Tagline",
          name: "tagline",
          description: "Bottom bar, right. Spaces are kept as typed (the live site has two either side of the words).",
        },
      ],
    },
    {
      type: "object",
      label: "Theme",
      name: "theme",
      // @ts-ignore
      fields: [
        {
          type: "string",
          label: "Primary Color",
          name: "color",
          ui: {
            component: ColorPickerInput,
          },
        },
        {
          type: "string",
          name: "font",
          label: "Font Family",
          options: [
            {
              label: "Inter (Sans)",
              value: "sans",
            },
            {
              label: "Space Mono",
              value: "mono",
            },
          ],
        },
        {
          type: "string",
          name: "darkMode",
          label: "Dark Mode",
          options: [
            {
              label: "System",
              value: "system",
            },
            {
              label: "Light",
              value: "light",
            },
            {
              label: "Dark",
              value: "dark",
            },
          ],
        },
      ],
    },
  ],
};

export default Global;
