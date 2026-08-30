import type { CollectionConfig } from "payload";

import { equipment as t, groups } from "@/admin/labels";
import { autoSlug } from "./hooks/auto-slug";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/* The home page names every device, so it flushes with the technology page. */
const equipmentPaths = ["", "/technology"];

export const Equipment: CollectionConfig = {
    slug: "equipment",

    labels: { singular: t.singular, plural: t.plural },

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        useAsTitle: "name",
        defaultColumns: ["name", "manufacturerName", "group", "photoPending", "order"],
        description: t.description,
    },

    defaultSort: "order",

    hooks: {
        beforeValidate: [autoSlug({ collection: "equipment", source: "name" })],
        afterChange: [auditCollection(), afterChangeRevalidate(equipmentPaths)],
        afterDelete: [auditCollectionDelete(), afterDeleteRevalidate(equipmentPaths)],
    },

    fields: [
        /* ---------------------------------------------------------- sidebar */

        {
            name: "group",
            type: "select",
            label: t.group,
            required: true,
            admin: { position: "sidebar" },
            options: [
                { label: t.grpDiagnostics, value: "diagnostics" },
                { label: t.grpHygiene, value: "hygiene" },
                { label: t.grpAesthetics, value: "aesthetics" },
                { label: t.grpOrthodontics, value: "orthodontics" },
            ],
        },
        {
            name: "order",
            type: "number",
            label: t.order,
            required: true,
            defaultValue: 0,
            admin: { position: "sidebar", description: t.orderHelp },
        },
        {
            name: "photoPending",
            type: "checkbox",
            label: t.photoPending,
            defaultValue: true,
            admin: {
                position: "sidebar",
                description: t.photoPendingHelp,
                components: { Cell: "/components/admin/YesNoCell#YesNoCell" },
            },
        },
        {
            name: "slug",
            type: "text",
            label: t.slug,
            required: true,
            unique: true,
            index: true,
            admin: { position: "sidebar", description: t.slugHelp },
        },

        /* ------------------------------------------------------ main column */

        {
            name: "name",
            type: "text",
            label: t.name,
            required: true,
            /* Deliberately not localized. Transliterating a model number
               breaks the match a patient would search for, and the old site
               did exactly that ("КТ Vatech") — it reads as a typo. */
            admin: { description: t.nameHelp },
        },
        {
            type: "row",
            fields: [
                { name: "manufacturerName", type: "text", label: t.manufacturerName, required: true },
                {
                    name: "manufacturerUrl",
                    type: "text",
                    label: t.manufacturerUrl,
                    required: true,
                    admin: { description: t.manufacturerUrlHelp },
                },
            ],
        },
        {
            name: "photo",
            type: "upload",
            label: t.photo,
            relationTo: "media",
        },
        {
            name: "services",
            type: "relationship",
            label: t.services,
            relationTo: "services",
            hasMany: true,
            admin: { description: t.servicesHelp },
        },
        {
            name: "summary",
            type: "textarea",
            label: t.summary,
            localized: true,
            required: true,
            admin: { description: t.summaryHelp },
        },
        {
            name: "body",
            type: "richText",
            label: t.body,
            localized: true,
            required: true,
        },
        {
            name: "highlights",
            type: "array",
            label: t.highlights,
            localized: true,
            labels: { singular: t.highlightsItem, plural: t.highlights },
            admin: { description: t.highlightsHelp },
            fields: [{ name: "text", type: "text", label: t.highlightsItem, required: true }],
        },
    ],
};
