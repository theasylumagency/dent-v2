import type { Field, GlobalConfig } from "payload";

import { groups, seo as t } from "@/admin/labels";
import { safeRevalidate } from "@/collections/hooks/revalidate";
import { focusKeyword } from "@/collections/fields/seo";
import { locales } from "@/i18n/config";
import { auditGlobalAll } from "@/lib/audit/logger";

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
 *
 * **One heading per page, not two.** Each route used to be a named `group`
 * (rendering its own heading) wrapping a `collapsible` (rendering a second
 * one), so the screen read "Home" above "Home page", eleven times over. The
 * group is what the database needs — `home_title`, `home_description` — so
 * it stays; the collapsible was pure decoration and is gone. The two tabs
 * below replace the scrolling it used to take to reach the category pages.
 */

/** The two fields every route has. No wrapper — the group above is the label. */
const metaFields = (): Field[] => [
    {
        type: "row",
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
                type: "text",
                label: t.title,
                localized: true,
                maxLength: 90,
                admin: { description: t.titleHelp },
            },
            {
                name: "description",
                type: "textarea",
                label: t.description_,
                localized: true,
                maxLength: 320,
                admin: { description: t.descriptionHelp },
            },
        ],
    },

    /* The editorial note, on its own line rather than in the row above:
       it is not a third column of the same thing. The two fields above are
       published; this one never leaves the admin. */
    focusKeyword(),
];

/** One route: the named group the database needs, labelled for a human. */
const page = (name: string, label: string): Field => ({
    name,
    type: "group",
    label,
    fields: metaFields(),
});

export const Seo: GlobalConfig = {
    slug: "seo",

    label: t.label,

    access: {
        read: () => true,
    },

    admin: {
        group: groups.marketing,
        description: t.description,
    },

    hooks: {
        afterChange: [
            auditGlobalAll(),
            /* `safeRevalidate`, not `revalidatePath` — as in `ClinicInfo`.
               `revalidatePath` needs Next's static-generation store, which
               does not exist when Payload is driven from a CLI script; a
               bare call threw `Invariant: static generation store missing`
               and took `npm run seed` down with it the moment the seed
               touched this global. Outside the server there is also nothing
               to revalidate, so swallowing is correct rather than merely
               convenient. */
            () => {
                for (const locale of locales) safeRevalidate(`/${locale}`, "layout");
            },
        ],
    },

    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "გვერდები",
                    description: "საიტის ძირითადი გვერდები.",
                    fields: [
                        page("home", t.home),
                        page("about", t.about),
                        page("services", t.services),
                        page("cases", t.cases),
                        page("technology", t.technology),
                        page("news", t.news),
                        page("contact", t.contact),
                    ],
                },
                {
                    label: "მიმართულებები",
                    description: "სერვისების ხუთი მიმართულების გვერდი.",
                    fields: [
                        {
                            name: "categories",
                            type: "group",
                            label: t.categories,
                            fields: [
                                page("diagnosticsPlanning", t.catDiagnostics),
                                page("therapyPrevention", t.catTherapy),
                                page("surgeryImplantation", t.catSurgery),
                                page("orthodontics", t.catOrthodontics),
                                page("aesthetic", t.catAesthetic),
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
