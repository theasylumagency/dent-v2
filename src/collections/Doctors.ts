import type { CollectionConfig } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/* Doctors appear on the home page and the about page. */
const doctorPaths = ["", "/about"];

/** Reused for the four credential lists, which have identical shapes. */
const credentialList = (name: string, plural: string, description: string) =>
    ({
        name,
        type: "array" as const,
        localized: true,
        labels: { singular: "Entry", plural },
        admin: { description },
        fields: [{ name: "text", type: "text" as const, required: true }],
    });

export const Doctors: CollectionConfig = {
    slug: "doctors",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "role", "isLead", "published"],
        description:
            "The clinical team. Leave 'Published profile' off while a doctor's credentials are still being confirmed — the page then shows a short honest note instead of empty headings.",
    },

    defaultSort: "order",

    hooks: {
        afterChange: [afterChangeRevalidate(doctorPaths)],
        afterDelete: [afterDeleteRevalidate(doctorPaths)],
    },

    fields: [
        {
            name: "name",
            type: "text",
            localized: true,
            required: true,
            /* Localized, unlike equipment model names: personal names are
               genuinely transliterated between scripts, and a Russian
               reader expects "Арчил Апхадзе". */
            admin: { description: "Transliterated per language." },
        },
        {
            name: "role",
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
                description: "Used as the anchor on the about page, e.g. /ka/about#nino-osadze",
            },
        },
        {
            name: "order",
            type: "number",
            required: true,
            defaultValue: 0,
            admin: { position: "sidebar" },
        },
        {
            name: "isLead",
            type: "checkbox",
            defaultValue: false,
            admin: {
                position: "sidebar",
                description: "The chief doctor gets the larger section at the top.",
            },
        },
        {
            name: "published",
            type: "checkbox",
            defaultValue: false,
            admin: {
                position: "sidebar",
                description: "Off = the profile renders as 'in preparation'.",
            },
        },
        {
            name: "photo",
            type: "upload",
            relationTo: "media",
            required: true,
        },
        {
            name: "focus",
            type: "text",
            localized: true,
            admin: { description: "Specialisation in a few words." },
        },
        {
            name: "bio",
            type: "richText",
            localized: true,
        },
        {
            name: "experienceYears",
            type: "text",
            admin: {
                description: "Shown as a large number on the lead doctor's block, e.g. '20+'.",
            },
        },
        credentialList(
            "tags",
            "Specialisation tags",
            "Two or three words each. Rendered as chips beside the portrait, not as sentences.",
        ),
        credentialList("education", "Education", "Newest or oldest first — whichever reads better."),
        credentialList("experience", "Experience", "Reverse chronological."),
        credentialList(
            "training",
            "Training and congresses",
            "Publish the strongest dozen rather than everything. A wall of sixty entries is read as noise and skipped.",
        ),
        credentialList("languages", "Languages", "Only languages the doctor has confirmed."),
    ],
};
