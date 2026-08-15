import type { CollectionConfig } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/* A service is shown on the home page, the services index and its own
   category page, so all three flush together. */
const servicePaths = (doc: Record<string, unknown>) => [
    "",
    "/services",
    `/services/${doc.category as string}`,
];

export const Services: CollectionConfig = {
    slug: "services",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "category", "order"],
        description:
            "The 16 services, grouped into five clinical directions. Individual services do not get their own URL — they render as anchors on their category page.",
    },

    defaultSort: "order",

    hooks: {
        afterChange: [afterChangeRevalidate(servicePaths)],
        afterDelete: [afterDeleteRevalidate(servicePaths)],
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
            admin: {
                position: "sidebar",
                description:
                    "Must match an entry in components/ui/ServiceIcons.tsx — the icon is picked by slug.",
            },
        },
        {
            name: "category",
            type: "select",
            required: true,
            admin: { position: "sidebar" },
            options: [
                { label: "Diagnostics and planning", value: "diagnostics-planning" },
                { label: "Therapy and prevention", value: "therapy-prevention" },
                { label: "Surgery and implantation", value: "surgery-implantation" },
                { label: "Orthodontics", value: "orthodontics" },
                { label: "Aesthetic dentistry", value: "aesthetic" },
            ],
        },
        {
            name: "order",
            type: "number",
            required: true,
            defaultValue: 0,
            admin: {
                position: "sidebar",
                description: "Lower first, within the category.",
            },
        },
        {
            name: "blurb",
            type: "textarea",
            localized: true,
            required: true,
            admin: { description: "One sentence. Shown on cards and in the mega menu." },
        },
        {
            name: "lead",
            type: "textarea",
            localized: true,
            admin: { description: "Longer opening paragraph on the category page." },
        },
        {
            name: "whatsIncluded",
            type: "array",
            localized: true,
            labels: { singular: "Point", plural: "What's included" },
            fields: [{ name: "text", type: "text", required: true }],
        },
    ],
};
