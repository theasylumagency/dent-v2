import type { GlobalConfig } from "payload";
import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/config";

/**
 * Contact details, editable by the clinic.
 *
 * **One phone number field, not two.** The site needs it in two forms — the
 * readable `+995 511 21 16 16` and the diallable `995511211616` that `tel:`
 * and `wa.me` require, since neither accepts spaces. Asking an editor to
 * keep both in step guarantees they will drift, and the failure is silent:
 * the number on screen looks right while the call button quietly dials
 * something else. The digits are stripped in `lib/clinic.ts` instead.
 *
 * What deliberately stays in code (`lib/site.ts`): the domain, the site
 * name, and the map coordinates. Those are deployment configuration, not
 * content — changing them is a migration, not an edit.
 */
export const ClinicInfo: GlobalConfig = {
    slug: "clinic-info",

    access: {
        read: () => true,
    },

    admin: {
        description:
            "Phone numbers, email and address. These appear across the site and in the structured data search engines read, so a typo here is visible everywhere.",
    },

    hooks: {
        afterChange: [
            () => {
                /* Contact details are in the header, footer and mobile bar —
                   which is to say, on every page. */
                for (const locale of locales) revalidatePath(`/${locale}`, "layout");
                revalidatePath("/sitemap.xml");
            },
        ],
    },

    fields: [
        {
            type: "collapsible",
            label: "Phone",
            fields: [
                {
                    name: "phone",
                    type: "text",
                    required: true,
                    admin: {
                        description:
                            "The mobile line — the one on WhatsApp, and the one the mobile bar dials. Write it as a person reads it: +995 511 21 16 16. The dialling format is derived automatically.",
                    },
                },
                {
                    name: "phoneAlt",
                    type: "text",
                    admin: {
                        description: "Landline, shown as a secondary number. Leave empty to hide it.",
                    },
                },
                {
                    name: "whatsappSameAsPhone",
                    type: "checkbox",
                    defaultValue: true,
                    admin: {
                        description: "Untick only if WhatsApp is on a different number.",
                    },
                },
                {
                    name: "whatsapp",
                    type: "text",
                    admin: {
                        condition: (data) => !data?.whatsappSameAsPhone,
                        description: "The WhatsApp number, if it differs from the one above.",
                    },
                },
            ],
        },
        {
            type: "collapsible",
            label: "Address and email",
            fields: [
                { name: "email", type: "text", required: true },
                {
                    name: "address",
                    type: "text",
                    localized: true,
                    required: true,
                    admin: { description: "As shown on the contact page and in the footer." },
                },
                {
                    name: "mapsUrl",
                    type: "text",
                    admin: { description: "Google Maps share link for the 'directions' button." },
                },
                {
                    name: "hoursText",
                    type: "text",
                    localized: true,
                    admin: {
                        description:
                            "Opening hours as a sentence, e.g. 'ყოველდღე 9:00-დან 21:00-მდე'. The machine-readable version used by search engines is set in code — tell the developer if the actual hours change.",
                    },
                },
            ],
        },
        {
            type: "collapsible",
            label: "Consultation fees",
            fields: [
                {
                    type: "row",
                    fields: [
                        { name: "consultationFirst", type: "number", required: true },
                        { name: "consultationRepeat", type: "number", required: true },
                    ],
                },
            ],
            admin: {
                description:
                    "Published on the services and news pages, and in the structured data. If these change, check the FAQ answers too — one of them quotes the figure in prose.",
            },
        },
        {
            type: "collapsible",
            label: "Published figures",
            admin: {
                description:
                    "Both are optional and both are claims. Leave one empty and that counter simply does not appear — which is the right outcome if the number cannot be backed up. The other two figures on the page (how many specialists, how many services) are counted from the CMS and are not editable here.",
            },
            fields: [
                {
                    type: "row",
                    fields: [
                        {
                            name: "satisfiedPercent",
                            type: "number",
                            min: 0,
                            max: 100,
                            admin: {
                                description:
                                    "Percentage of satisfied patients. On a medical site an unsourced figure is a liability — publish it only if there is a survey behind it.",
                            },
                        },
                        {
                            name: "yearsOnMarket",
                            type: "number",
                            min: 0,
                            admin: { description: "Years the clinic has been operating." },
                        },
                    ],
                },
            ],
        },
        {
            type: "collapsible",
            label: "Social",
            fields: [
                { name: "facebook", type: "text" },
                { name: "instagram", type: "text" },
                {
                    name: "google",
                    type: "text",
                    admin: {
                        description:
                            "Google Business Profile URL. The single strongest trust link a local clinic can publish — it ties the site to the entity Google already ranks in Maps.",
                    },
                },
            ],
        },
    ],
};
