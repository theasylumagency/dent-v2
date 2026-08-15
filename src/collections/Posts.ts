import type { CollectionConfig } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/** Every route a post appears on. The list page shows all of them. */
const postPaths = (doc: Record<string, unknown>) => ["/news", `/news/${doc.slug as string}`];

export const Posts: CollectionConfig = {
    slug: "posts",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "category", "publishedAt", "_status"],
        description:
            "News and articles. Georgian is the source language — a post left untranslated falls back to Georgian rather than disappearing.",
    },

    /* Drafts, so a half-written article is never live. `_status` also gives
       the editor a preview before publishing. */
    versions: {
        drafts: true,
    },

    hooks: {
        afterChange: [afterChangeRevalidate(postPaths)],
        afterDelete: [afterDeleteRevalidate(postPaths)],
    },

    fields: [
        {
            name: "title",
            type: "text",
            localized: true,
            required: true,
        },
        {
            name: "slug",
            type: "text",
            required: true,
            unique: true,
            index: true,
            /* Not localized on purpose: one URL per post across all three
               languages keeps `hreflang` simple and stops the same article
               competing with itself. */
            admin: {
                position: "sidebar",
                description: "URL segment, Latin letters and hyphens. Shared by all three languages.",
            },
        },
        {
            name: "category",
            type: "select",
            required: true,
            defaultValue: "guide",
            admin: { position: "sidebar" },
            options: [
                { label: "Clinic news", value: "clinic" },
                { label: "Article", value: "guide" },
            ],
        },
        {
            name: "publishedAt",
            type: "date",
            required: true,
            admin: {
                position: "sidebar",
                date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" },
            },
        },
        {
            name: "cover",
            type: "upload",
            relationTo: "media",
            required: true,
        },
        {
            name: "excerpt",
            type: "textarea",
            localized: true,
            required: true,
            admin: {
                description:
                    "One or two sentences. Used on the card, in the meta description and in search results.",
            },
        },
        {
            name: "body",
            type: "richText",
            localized: true,
            required: true,
        },
        {
            type: "collapsible",
            label: "Search engine listing",
            admin: {
                description:
                    "Leave both empty and the title and excerpt above are used, which is usually right. Fill them in when the headline reads well on the page but poorly in a list of search results.",
            },
            fields: [
                {
                    name: "metaTitle",
                    type: "text",
                    localized: true,
                    maxLength: 65,
                    admin: { description: "Up to about 60 characters." },
                },
                {
                    name: "metaDescription",
                    type: "textarea",
                    localized: true,
                    maxLength: 175,
                    admin: { description: "Up to about 155 characters." },
                },
            ],
        },
    ],
};
