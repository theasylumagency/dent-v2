import type { CollectionConfig } from "payload";

import { cases as t, groups, services as serviceLabels } from "@/admin/labels";
import { autoSlug } from "./hooks/auto-slug";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/* Cases render as anchored blocks on one page, so every change touches that
   page and nothing else. The home page teases the *idea* of a case, never a
   case itself, which is why "" is deliberately absent from this list. */
const casePaths = ["/cases"];

/**
 * Treated cases — the before/after page.
 *
 * **Two switches, and one of them is a gate.** `published` is the usual
 * "is this live" box; `consent` records that the patient signed off on their
 * photographs being shown. Publishing without consent is not a matter of
 * process discipline here — the validator refuses the save, in Georgian, on
 * the field the editor just ticked. A clinic employee cannot get a patient's
 * mouth onto the public internet by forgetting a step.
 *
 * `consent` is also why this collection carries no patient name, age or
 * diagnosis field. What is published is a treatment and two photographs; the
 * identifiable material is exactly what a consent form is worst at covering,
 * so there is nowhere in this form to type it.
 *
 * **Cases are anchors, not pages** — `/ka/cases#slug`. Three or four cases
 * would make three or four thin pages competing with each other for the same
 * queries, which is the reasoning `lib/routes.ts` already sets out for
 * individual services. `seoBlock` is therefore absent for the same stated
 * reason it is absent from services and equipment: a `<title>` belongs to a
 * page, and the page these live on has one of its own.
 */
export const Cases: CollectionConfig = {
  slug: "cases",

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: () => true,
  },

  admin: {
    group: groups.content,
    useAsTitle: "title",
    defaultColumns: ["title", "direction", "consent", "published", "order"],
    description: t.description,
  },

  defaultSort: "order",

  hooks: {
    beforeValidate: [autoSlug({ collection: "cases", source: "title" })],
    afterChange: [auditCollection(), afterChangeRevalidate(casePaths)],
    afterDelete: [auditCollectionDelete(), afterDeleteRevalidate(casePaths)],
  },

  fields: [
    /* ---------------------------------------------------------- sidebar */

    {
      name: "consent",
      type: "checkbox",
      label: t.consent,
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: t.consentHelp,
        components: { Cell: "/components/admin/YesNoCell#YesNoCell" },
      },
    },
    {
      name: "published",
      type: "checkbox",
      label: t.published,
      defaultValue: false,
      /* The gate. Declared on `published` rather than as a collection-level
         hook so the message lands on the box the editor just ticked, instead
         of arriving as a banner above a form of forty fields. */
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
        const consented = Boolean((siblingData as { consent?: unknown } | undefined)?.consent);
        if (value && !consented) return t.consentRequired;
        return true;
      },
      admin: {
        position: "sidebar",
        description: t.publishedHelp,
        components: { Cell: "/components/admin/YesNoCell#YesNoCell" },
      },
    },
    {
      name: "order",
      type: "number",
      label: t.order,
      required: true,
      defaultValue: 0,
      admin: { position: "sidebar", description: t.orderHelp },
    },
    {
      name: "slug",
      type: "text",
      label: t.slug,
      /* Required in the database too: the hook fills it before validation
         runs, so the editor never meets the error, but a case without an
         anchor cannot be linked to. Not localized — one anchor per case
         across all three languages, as with posts and doctors. */
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar", description: t.slugHelp },
    },

    /* ----------------------------------------------------- main column */

    {
      name: "title",
      type: "text",
      label: t.title,
      localized: true,
      required: true,
      admin: { description: t.titleHelp },
    },
    {
      name: "direction",
      type: "select",
      label: t.direction,
      required: true,
      /* The same five options as `Services.category`, from the same labels,
         so a case and a service name their direction identically. The list
         itself lives in `lib/services-shared.ts`: five directions are the
         site's information architecture, not CMS data. */
      options: [
        { label: serviceLabels.catDiagnostics, value: "diagnostics-planning" },
        { label: serviceLabels.catTherapy, value: "therapy-prevention" },
        { label: serviceLabels.catSurgery, value: "surgery-implantation" },
        { label: serviceLabels.catOrthodontics, value: "orthodontics" },
        { label: serviceLabels.catAesthetic, value: "aesthetic" },
      ],
      admin: { description: t.directionHelp },
    },

    /* The pair. Grouped so the two uploads sit together with one shared
       instruction — the note about matching angle and lighting applies to
       both, and repeating it twice reads as two different rules. */
    {
      type: "collapsible",
      label: t.images,
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "beforeImage",
              type: "upload",
              label: t.beforeImage,
              relationTo: "media",
              required: true,
              admin: { width: "50%" },
            },
            {
              name: "afterImage",
              type: "upload",
              label: t.afterImage,
              relationTo: "media",
              required: true,
              admin: { width: "50%", description: t.imagesHelp },
            },
          ],
        },
      ],
    },

    {
      name: "summary",
      type: "textarea",
      label: t.summary,
      localized: true,
      required: true,
      admin: { description: t.summaryHelp },
    },
    {
      type: "row",
      fields: [
        {
          name: "duration",
          type: "text",
          label: t.duration,
          localized: true,
          admin: { width: "50%", description: t.durationHelp },
        },
        {
          name: "doctor",
          type: "relationship",
          label: t.doctor,
          relationTo: "doctors",
          admin: { width: "50%", description: t.doctorHelp },
        },
      ],
    },
    {
      type: "collapsible",
      label: t.details,
      admin: { initCollapsed: true },
      fields: [
        {
          name: "details",
          type: "richText",
          label: t.details,
          localized: true,
          admin: { description: t.detailsHelp },
        },
      ],
    },
  ],
};
