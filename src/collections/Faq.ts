import type { CollectionConfig } from "payload";

import { canManageContent, isClinicAdministrator } from "../access/roles";

import { faq as t, groups } from "@/admin/labels";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/* The FAQ block sits on the home page, immediately before the booking form. */
const faqPaths = [""];

export const Faq: CollectionConfig = {
    slug: "faq",

    labels: { singular: t.singular, plural: t.plural },

    access: {
        /* Public site reads remain public; a signed-in clinic administrator is
           intentionally denied this non-clinical resource. */
        read: ({ req }) => !isClinicAdministrator(req.user),
        create: ({ req }) => canManageContent(req.user),
        update: ({ req }) => canManageContent(req.user),
        delete: ({ req }) => canManageContent(req.user),
    },

    admin: {
        group: groups.content,
        hidden: ({ user }) => isClinicAdministrator(user as { role?: string | null }),
        useAsTitle: "question",
        defaultColumns: ["question", "order"],
        description: t.description,
    },

    defaultSort: "order",

    hooks: {
        afterChange: [auditCollection(), afterChangeRevalidate(faqPaths)],
        afterDelete: [auditCollectionDelete(), afterDeleteRevalidate(faqPaths)],
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
