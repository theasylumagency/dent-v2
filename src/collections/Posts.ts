import type { CollectionConfig } from "payload";

import { groups, posts as t } from "@/admin/labels";
import { autoSlug } from "./hooks/auto-slug";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/** Every route a post appears on. The list page shows all of them. */
const postPaths = (doc: Record<string, unknown>) => ["/news", `/news/${doc.slug as string}`];

export const Posts: CollectionConfig = {
    slug: "posts",

    labels: { singular: t.singular, plural: t.plural },

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        useAsTitle: "title",
        defaultColumns: ["title", "category", "publishedAt", "_status"],
        description: t.description,
    },

    /* Drafts, so a half-written article is never live. `_status` also gives
       the editor a preview before publishing. */
    versions: {
        drafts: true,
    },

    hooks: {
        beforeValidate: [autoSlug({ collection: "posts", source: "title" })],
        afterChange: [auditCollection(), afterChangeRevalidate(postPaths)],
        afterDelete: [auditCollectionDelete(), afterDeleteRevalidate(postPaths)],
    },

    fields: [
        {
            name: "title",
            type: "text",
            label: t.title,
            localized: true,
            required: true,
        },
        {
            name: "slug",
            type: "text",
            label: t.slug,
            required: true,
            unique: true,
            index: true,
            /* Not localized on purpose: one URL per post across all three
               languages keeps `hreflang` simple and stops the same article
               competing with itself. */
            admin: {
                position: "sidebar",
                description: t.slugHelp,
            },
        },
        {
            name: "category",
            type: "select",
            label: t.category,
            required: true,
            defaultValue: "guide",
            admin: { position: "sidebar" },
            options: [
                { label: t.categoryClinic, value: "clinic" },
                { label: t.categoryGuide, value: "guide" },
            ],
        },
        {
            name: "publishedAt",
            type: "date",
            label: t.publishedAt,
            required: true,
            admin: {
                position: "sidebar",
                date: { pickerAppearance: "dayOnly", displayFormat: "d MMM yyyy" },
            },
        },
        {
            name: "cover",
            type: "upload",
            label: t.cover,
            relationTo: "media",
            required: true,
        },
        {
            name: "excerpt",
            type: "textarea",
            label: t.excerpt,
            localized: true,
            required: true,
            admin: { description: t.excerptHelp },
        },
        {
            name: "body",
            type: "richText",
            label: t.body,
            localized: true,
            required: true,
        },
        {
            type: "collapsible",
            label: t.seoBlock,
            admin: {
                initCollapsed: true,
                description: t.seoBlockHelp,
            },
            fields: [
                {
                    name: "metaTitle",
                    type: "text",
                    label: t.metaTitle,
                    localized: true,
                    maxLength: 65,
                    admin: { description: t.metaTitleHelp },
                },
                {
                    name: "metaDescription",
                    type: "textarea",
                    label: t.metaDescription,
                    localized: true,
                    maxLength: 175,
                    admin: { description: t.metaDescriptionHelp },
                },
            ],
        },
    ],
};
