import type { GlobalConfig } from "payload";
import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/config";

/**
 * Page titles and meta descriptions, per route.
 *
 * Posts carry their own — they are documents with their own URL, so their
 * meta lives on the document. Everything else is a fixed route, and its meta
 * lives here.
 *
 * Services and equipment deliberately have no meta fields: they render as
 * anchors on a category or technology page rather than as pages of their
 * own, so there is nowhere for a title of theirs to go. A field that cannot
 * affect anything is worse than a missing one — an editor fills it in and
 * reasonably expects a result.
 */

const metaFields = (label: string, note?: string) => ({
    type: "collapsible" as const,
    label,
    admin: note ? { description: note } : undefined,
    fields: [
        {
            type: "row" as const,
            fields: [
                /* The caps are hard limits, not the recommendation. Google
                   truncates a long title or description for display; it does
                   not reject one, and the shipped Georgian copy already runs
                   past the advisory length in a couple of places. Encoding
                   the advice as a validation error would have meant either
                   rewriting the client's copy to satisfy a field or failing
                   the seed. The advice belongs in the description below,
                   where an editor reads it; `npm run check:i18n` reports
                   which strings are over. */
                {
                    name: "title",
                    type: "text" as const,
                    localized: true,
                    maxLength: 90,
                    admin: {
                        description:
                            "Aim for about 60 characters — longer and Google truncates it. Say what the page is, not what the clinic is called; the site name is appended automatically.",
                    },
                },
                {
                    name: "description",
                    type: "textarea" as const,
                    localized: true,
                    maxLength: 320,
                    admin: {
                        description:
                            "Aim for about 155 characters. This is the sentence under the link in search results — write it to be read by a patient, not to contain keywords.",
                    },
                },
            ],
        },
    ],
});

export const Seo: GlobalConfig = {
    slug: "seo",

    access: {
        read: () => true,
    },

    admin: {
        description:
            "What appears in the browser tab and in Google's results for each page. Leave a field empty and the built-in text is used.",
    },

    hooks: {
        afterChange: [
            () => {
                for (const locale of locales) revalidatePath(`/${locale}`, "layout");
            },
        ],
    },

    fields: [
        {
            name: "home",
            type: "group",
            fields: [metaFields("Home page")],
        },
        {
            name: "about",
            type: "group",
            fields: [metaFields("About us")],
        },
        {
            name: "services",
            type: "group",
            fields: [metaFields("Services index")],
        },
        {
            name: "technology",
            type: "group",
            fields: [metaFields("Technology")],
        },
        {
            name: "news",
            type: "group",
            fields: [metaFields("News index")],
        },
        {
            name: "contact",
            type: "group",
            fields: [metaFields("Contact")],
        },
        {
            name: "categories",
            type: "group",
            label: "Service category pages",
            fields: [
                { name: "diagnosticsPlanning", type: "group", fields: [metaFields("Diagnostics and planning")] },
                { name: "therapyPrevention", type: "group", fields: [metaFields("Therapy and prevention")] },
                { name: "surgeryImplantation", type: "group", fields: [metaFields("Surgery and implantation")] },
                { name: "orthodontics", type: "group", fields: [metaFields("Orthodontics")] },
                { name: "aesthetic", type: "group", fields: [metaFields("Aesthetic dentistry")] },
            ],
        },
    ],
};
