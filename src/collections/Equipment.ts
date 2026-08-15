import type { CollectionConfig } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/* The home page names every device, so it flushes with the technology page. */
const equipmentPaths = ["", "/technology"];

export const Equipment: CollectionConfig = {
    slug: "equipment",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "manufacturerName", "group", "order"],
        description:
            "Devices and systems in the clinic. Model names are NOT translated — 'Vatech EzRay Air' is what the manufacturer and the search index both use.",
    },

    defaultSort: "order",

    hooks: {
        afterChange: [afterChangeRevalidate(equipmentPaths)],
        afterDelete: [afterDeleteRevalidate(equipmentPaths)],
    },

    fields: [
        {
            name: "name",
            type: "text",
            required: true,
            /* Deliberately not localized. Transliterating a model number
               breaks the match a patient would search for, and the old site
               did exactly that ("КТ Vatech") — it reads as a typo. */
            admin: { description: "Model name as the manufacturer writes it. Same in all languages." },
        },
        {
            name: "slug",
            type: "text",
            required: true,
            unique: true,
            index: true,
            admin: { position: "sidebar" },
        },
        {
            name: "group",
            type: "select",
            required: true,
            admin: { position: "sidebar" },
            options: [
                { label: "Diagnostics and planning", value: "diagnostics" },
                { label: "Hygiene and prevention", value: "hygiene" },
                { label: "Smile aesthetics", value: "aesthetics" },
                { label: "Orthodontic systems", value: "orthodontics" },
            ],
        },
        {
            name: "order",
            type: "number",
            required: true,
            defaultValue: 0,
            admin: { position: "sidebar", description: "Lower first, within the group." },
        },
        {
            type: "row",
            fields: [
                { name: "manufacturerName", type: "text", required: true },
                {
                    name: "manufacturerUrl",
                    type: "text",
                    required: true,
                    admin: {
                        description:
                            "Official site. Published as sameAs in structured data, so it must be right.",
                    },
                },
            ],
        },
        {
            name: "photo",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "photoPending",
            type: "checkbox",
            defaultValue: true,
            admin: {
                position: "sidebar",
                description:
                    "On = the card shows a 'photo coming' badge. The images seeded initially are labelled stand-ins; untick this once a real photograph replaces one.",
            },
        },
        {
            name: "services",
            type: "relationship",
            relationTo: "services",
            hasMany: true,
            admin: {
                description:
                    "Where this device is actually used. Drives the cross-links from the device card into the service catalogue.",
            },
        },
        {
            name: "summary",
            type: "textarea",
            localized: true,
            required: true,
            admin: { description: "One sentence: what it does." },
        },
        {
            name: "body",
            type: "richText",
            localized: true,
            required: true,
        },
        {
            name: "highlights",
            type: "array",
            localized: true,
            labels: { singular: "Highlight", plural: "Highlights" },
            admin: { description: "Two or three short facts. These are what answer engines quote." },
            fields: [{ name: "text", type: "text", required: true }],
        },
    ],
};
