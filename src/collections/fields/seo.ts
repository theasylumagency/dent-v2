import type { Field } from "payload";

import { posts as postLabels, seoShared as t } from "@/admin/labels";

/**
 * The per-document search fields, shared by every collection whose
 * documents have a URL of their own.
 *
 * Services and equipment deliberately do not get these. They render as
 * anchors on a category or technology page rather than as pages of their
 * own, so there is nowhere for a title of theirs to go — a `<title>`
 * belongs to a page, and that page already has one. A field that cannot
 * affect anything is worse than a missing one: an editor fills it in and
 * reasonably expects a result. The same reasoning is set out at the top of
 * `globals/Seo.ts`, which is where the fixed routes are edited.
 */

/**
 * The editorial note. Never rendered — see `seoShared` in `admin/labels.ts`
 * for why a keywords meta tag would be worse than useless.
 */
export const focusKeyword = (): Field => ({
    name: "focusKeyword",
    type: "text",
    label: t.focusKeyword,
    /* Localized: the Georgian, English and Russian versions of a page are
       competing for three different searches, and the whole point of the
       note is to say which one. */
    localized: true,
    admin: { description: t.focusKeywordHelp },
});

/**
 * One collapsed block, matching the shape Posts already used — the fields
 * are optional refinements of copy the editor has entered above, so they
 * should not be the first thing on the form.
 */
export const seoBlock = (): Field => ({
    type: "collapsible",
    label: postLabels.seoBlock,
    admin: {
        initCollapsed: true,
        description: postLabels.seoBlockHelp,
    },
    fields: [
        {
            name: "metaTitle",
            type: "text",
            label: postLabels.metaTitle,
            localized: true,
            maxLength: 65,
            admin: { description: postLabels.metaTitleHelp },
        },
        {
            name: "metaDescription",
            type: "textarea",
            label: postLabels.metaDescription,
            localized: true,
            maxLength: 175,
            admin: { description: postLabels.metaDescriptionHelp },
        },
        focusKeyword(),
    ],
});
