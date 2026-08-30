import type { GlobalConfig } from "payload";

import { clinicInfo as t, groups } from "@/admin/labels";
import { safeRevalidate } from "@/collections/hooks/revalidate";
import { auditGlobalAll } from "@/lib/audit/logger";

/**
 * Contact details, editable by the clinic.
 *
 * Grouped with the site content rather than with settings on purpose: fixing
 * a phone number is an ordinary editorial job, and an editor should not need
 * an administrator to do it.
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

    label: t.label,

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        description: t.description,
    },

    hooks: {
        afterChange: [
            auditGlobalAll(),
            () => {
                /* Clinic data is rendered by this shared layout and by campaign pages.
                   Route patterns refresh every locale; a CMS save must never rely on a PM2 restart. */
                safeRevalidate("/[lang]/(site)", "layout");
                safeRevalidate("/[lang]/[slug]", "page");
            },
        ],
    },

    fields: [
        {
            type: "collapsible",
            label: t.phoneBlock,
            fields: [
                {
                    name: "phone",
                    type: "text",
                    label: t.phone,
                    required: true,
                    admin: { description: t.phoneHelp },
                },
                {
                    name: "phoneAlt",
                    type: "text",
                    label: t.phoneAlt,
                    admin: { description: t.phoneAltHelp },
                },
                {
                    name: "whatsappSameAsPhone",
                    type: "checkbox",
                    label: t.whatsappSameAsPhone,
                    defaultValue: true,
                    admin: { description: t.whatsappSameAsPhoneHelp },
                },
                {
                    name: "whatsapp",
                    type: "text",
                    label: t.whatsapp,
                    admin: {
                        condition: (data) => !data?.whatsappSameAsPhone,
                    },
                },
            ],
        },
        {
            type: "collapsible",
            label: t.addressBlock,
            fields: [
                { name: "email", type: "text", label: t.email, required: true },
                {
                    name: "address",
                    type: "text",
                    label: t.address,
                    localized: true,
                    required: true,
                    admin: { description: t.addressHelp },
                },
                {
                    name: "mapsUrl",
                    type: "text",
                    label: t.mapsUrl,
                    admin: { description: t.mapsUrlHelp },
                },
                {
                    name: "hoursText",
                    type: "text",
                    label: t.hoursText,
                    localized: true,
                    admin: { description: t.hoursTextHelp },
                },
            ],
        },
        {
            type: "collapsible",
            label: t.feesBlock,
            admin: { description: t.feesHelp },
            fields: [
                {
                    type: "row",
                    fields: [
                        {
                            name: "consultationFirst",
                            type: "number",
                            label: t.consultationFirst,
                            required: true,
                        },
                        {
                            name: "consultationRepeat",
                            type: "number",
                            label: t.consultationRepeat,
                            required: true,
                        },
                    ],
                },
            ],
        },
        {
            type: "collapsible",
            label: t.figuresBlock,
            admin: {
                initCollapsed: true,
                description: t.figuresHelp,
            },
            fields: [
                {
                    type: "row",
                    fields: [
                        {
                            name: "satisfiedPercent",
                            type: "number",
                            label: t.satisfiedPercent,
                            min: 0,
                            max: 100,
                            admin: { description: t.satisfiedPercentHelp },
                        },
                        {
                            name: "yearsOnMarket",
                            type: "number",
                            label: t.yearsOnMarket,
                            min: 0,
                        },
                    ],
                },
            ],
        },
        {
            type: "collapsible",
            label: t.socialBlock,
            admin: { initCollapsed: true },
            fields: [
                { name: "facebook", type: "text", label: t.facebook },
                { name: "instagram", type: "text", label: t.instagram },
                {
                    name: "google",
                    type: "text",
                    label: t.google,
                    admin: { description: t.googleHelp },
                },
            ],
        },
    ],
};
