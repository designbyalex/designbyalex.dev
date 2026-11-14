import type { Template } from 'tinacms';
import { iconSchema } from '@/tina/fields/icon';

/**
 * The CTA block's Tina template. It lives apart from the component (call-to-action.tsx) because its icon
 * field brings Tina's editor UI (`tina/fields/icon.tsx` imports `tinacms` itself, and with it slate, plate
 * and mermaid). Exported from the component, it shipped in every page's client bundle through the block
 * registry (#176). Only the Tina schema (tina/collection/page.ts) imports this file.
 */
export const ctaBlockSchema: Template = {
    name: "cta",
    label: "CTA",
    ui: {
        previewSrc: "/blocks/cta.png",
        defaultItem: {
            title: "Start Building",
            description: "Get started with TinaCMS today and take your content management to the next level.",
            actions: [
                {
                    label: 'Get Started',
                    type: 'button',
                    link: '/',
                },
                {
                    label: 'Book Demo',
                    type: 'link',
                    link: '/',
                },
            ],
        },
    },
    fields: [
        {
            type: "string",
            label: "Title",
            name: "title",
        },
        {
            type: "string",
            label: "Description",
            name: "description",
            ui: {
                component: "textarea",
            },
        },
        {
            label: 'Actions',
            name: 'actions',
            type: 'object',
            list: true,
            ui: {
                defaultItem: {
                    label: 'Action Label',
                    type: 'button',
                    icon: {
                        name: "Tina",
                        color: "white",
                        style: "float",
                    },
                    link: '/',
                },
                itemProps: (item) => ({ label: item.label }),
            },
            fields: [
                {
                    label: 'Label',
                    name: 'label',
                    type: 'string',
                },
                {
                    label: 'Type',
                    name: 'type',
                    type: 'string',
                    options: [
                        { label: 'Button', value: 'button' },
                        { label: 'Link', value: 'link' },
                    ],
                },
                iconSchema as any,
                {
                    label: 'Link',
                    name: 'link',
                    type: 'string',
                },
            ],
        },
    ],
};
