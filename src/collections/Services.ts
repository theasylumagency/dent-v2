import type { CollectionConfig } from "payload";

import { groups, services as t } from "@/admin/labels";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/* A service is shown on the home page, the services index and its own
   category page, so all three flush together. */
const servicePaths = (doc: Record<string, unknown>) => [
    "",
    "/services",
    `/services/${doc.category as string}`,
];

export const Services: CollectionConfig = {
    slug: "services",

    labels: { singular: t.singular, plural: t.plural },

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        useAsTitle: "title",
        defaultColumns: ["title", "category", "order"],
        description: t.description,
    },

    defaultSort: "order",

    hooks: {
        afterChange: [auditCollection(), afterChangeRevalidate(servicePaths)],
        afterDelete: [auditCollectionDelete(), afterDeleteRevalidate(servicePaths)],
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
            /* Deliberately not auto-generated, unlike every other slug here:
               `components/ui/ServiceIcons.tsx` picks the icon by this exact
               string. A generated slug would silently leave a service without
               its icon, which is why the description says to call first. */
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
            admin: { position: "sidebar" },
            options: [
                { label: t.catDiagnostics, value: "diagnostics-planning" },
                { label: t.catTherapy, value: "therapy-prevention" },
                { label: t.catSurgery, value: "surgery-implantation" },
                { label: t.catOrthodontics, value: "orthodontics" },
                { label: t.catAesthetic, value: "aesthetic" },
            ],
        },
        {
            name: "order",
            type: "number",
            label: t.order,
            required: true,
            defaultValue: 0,
            admin: {
                position: "sidebar",
                description: t.orderHelp,
            },
        },
        {
            name: "blurb",
            type: "textarea",
            label: t.blurb,
            localized: true,
            required: true,
            admin: { description: t.blurbHelp },
        },
        {
            name: "lead",
            type: "textarea",
            label: t.lead,
            localized: true,
            admin: { description: t.leadHelp },
        },
        {
            name: "whatsIncluded",
            type: "array",
            label: t.whatsIncluded,
            localized: true,
            labels: { singular: t.whatsIncludedItem, plural: t.whatsIncluded },
            fields: [{ name: "text", type: "text", label: t.whatsIncludedItem, required: true }],
        },
    ],
};
