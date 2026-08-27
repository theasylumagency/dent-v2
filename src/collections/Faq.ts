import type { CollectionConfig } from "payload";

import { faq as t, groups } from "@/admin/labels";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/* The FAQ block sits on the home page, immediately before the booking form. */
const faqPaths = [""];

export const Faq: CollectionConfig = {
    slug: "faq",

    labels: { singular: t.singular, plural: t.plural },

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        useAsTitle: "question",
        defaultColumns: ["question", "order"],
        description: t.description,
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
            label: t.question,
            localized: true,
            required: true,
        },
        {
            name: "answer",
            type: "textarea",
            label: t.answer,
            localized: true,
            required: true,
            admin: { description: t.answerHelp },
        },
        {
            name: "order",
            type: "number",
            label: t.order,
            required: true,
            defaultValue: 0,
            admin: { position: "sidebar", description: "რაც უფრო მცირე რიცხვია, მით ზემოთ." },
        },
    ],
};
