import type { CollectionConfig } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/* The FAQ block sits on the home page, immediately before the booking form. */
const faqPaths = [""];

export const Faq: CollectionConfig = {
    slug: "faq",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "question",
        defaultColumns: ["question", "order"],
        description:
            "Answers published here are emitted as FAQPage structured data, so they can be quoted verbatim in search results and by AI assistants. Write them to be quoted.",
    },

    defaultSort: "order",

    hooks: {
        afterChange: [afterChangeRevalidate(faqPaths)],
        afterDelete: [afterDeleteRevalidate(faqPaths)],
    },

    fields: [
        {
            name: "question",
            type: "text",
            localized: true,
            required: true,
        },
        {
            name: "answer",
            type: "textarea",
            localized: true,
            required: true,
            admin: {
                description:
                    "Plain text, not rich text — structured data takes a string, and a self-contained first sentence is what gets quoted.",
            },
        },
        {
            name: "order",
            type: "number",
            required: true,
            defaultValue: 0,
            admin: { position: "sidebar" },
        },
    ],
};
