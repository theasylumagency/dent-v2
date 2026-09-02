import type { CollectionConfig, Field } from "payload";

import { doctors as t, groups } from "@/admin/labels";
import { autoSlug } from "./hooks/auto-slug";
import { seoBlock } from "./fields/seo";
import { afterChangeRevalidatePublicPages, afterDeleteRevalidatePublicPages } from "./hooks/revalidate";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/**
 * The clinical team.
 *
 * **The form is organised around how a profile is actually filled in.**
 * Everything a receptionist can answer without asking anyone — name, role,
 * photo, specialisation, a paragraph of bio — is in the main column, always
 * visible. The four credential lists are the part that arrives later, from
 * the doctor, on paper: they live in collapsed blocks so the form opens as
 * five fields rather than as forty rows of empty array.
 *
 * The sidebar holds exactly two switches, and both are questions a person can
 * answer: is this doctor on the site, and is this the chief doctor. Everything
 * technical either fills itself in (`slug`) or appears only when it can
 * matter (`experienceYears`, which renders on the lead doctor's block alone).
 */

/** The credential lists all have the same shape: one localized line per row. */
const credentialList = (
  name: string,
  label: string,
  description: string,
  itemLabel: string = t.listItem,
): Field => ({
  name,
  type: "array",
  label,
  localized: true,
  labels: { singular: itemLabel, plural: label },
  admin: { description },
  fields: [{ name: "text", type: "text", required: true, label: itemLabel }],
});

/** One collapsed block per list, so an empty profile is five fields, not forty rows. */
const credentialBlock = (name: string, label: string, description: string): Field => ({
  type: "collapsible",
  label,
  admin: { initCollapsed: true },
  fields: [credentialList(name, label, description)],
});

export const Doctors: CollectionConfig = {
  slug: "doctors",

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: () => true,
  },

  admin: {
    group: groups.content,
    useAsTitle: "name",
    defaultColumns: ["name", "role", "published", "isLead", "order"],
    description: t.description,
  },

  defaultSort: "order",

  hooks: {
    /* The editor types a name and gets `archil-apkhadze`. An existing slug is
       never rewritten — it is the anchor `/ka/about#archil-apkhadze`, and a
       link someone shared must keep working after a spelling correction. */
    beforeValidate: [autoSlug({ collection: "doctors", source: "name" })],
    afterChange: [auditCollection(), afterChangeRevalidatePublicPages],
    afterDelete: [auditCollectionDelete(), afterDeleteRevalidatePublicPages],
  },

  fields: [
    /* ---------------------------------------------------------- sidebar */

    {
      name: "published",
      type: "checkbox",
      label: t.published,
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: t.publishedHelp,
        components: { Cell: "/components/admin/YesNoCell#YesNoCell" },
      },
    },
    {
      name: "isLead",
      type: "checkbox",
      label: t.isLead,
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: t.isLeadHelp,
        components: { Cell: "/components/admin/YesNoCell#YesNoCell" },
      },
    },
    {
      name: "experienceYears",
      type: "text",
      label: t.experienceYears,
      admin: {
        position: "sidebar",
        description: t.experienceYearsHelp,
        /* Rendered only on the lead doctor's block, so it is only a question
           worth asking once that box is ticked. A field that cannot affect
           anything is worse than a missing one — an editor fills it in and
           reasonably expects a result. */
        condition: (data) => Boolean(data?.isLead),
      },
    },
    {
      name: "order",
      type: "number",
      label: t.order,
      required: true,
      defaultValue: 0,
      admin: { position: "sidebar", description: "რაც უფრო მცირე რიცხვია, მით ზემოთ დგას." },
    },
    {
      name: "slug",
      type: "text",
      label: t.slug,
      /* Required in the database as well: the hook above fills it before
         validation runs, so an editor never meets the error, but a doctor
         without an anchor cannot be linked to from anywhere. */
      required: true,
      unique: true,
      index: true,
      admin: { position: "sidebar", description: t.slugHelp },
    },

    /* ----------------------------------------------------- main column */

    {
      name: "name",
      type: "text",
      label: t.name,
      localized: true,
      required: true,
      /* Localized, unlike equipment model names: personal names are genuinely
         transliterated between scripts, and a Russian reader expects
         "Арчил Апхадзе". */
      admin: { description: t.nameHelp },
    },
    {
      name: "role",
      type: "text",
      label: t.role,
      localized: true,
      required: true,
      admin: { description: t.roleHelp },
    },
    {
      name: "photo",
      type: "upload",
      label: t.photo,
      relationTo: "media",
      required: true,
    },
    {
      name: "focus",
      type: "text",
      label: t.focus,
      localized: true,
      admin: { description: t.focusHelp },
    },
    credentialList("tags", t.tags, t.tagsHelp, t.tagsItem),
    {
      name: "bio",
      type: "richText",
      label: t.bio,
      localized: true,
      admin: { description: t.bioHelp },
    },

    /* ------------------------------------------------ credential blocks */

    credentialBlock("education", t.education, t.educationHelp),
    credentialBlock("experience", t.experience, t.experienceHelp),
    credentialBlock("training", t.training, t.trainingHelp),
    credentialBlock("languages", t.languages, t.languagesHelp),

    /* A doctor is a page now — `/ka/about/archil-apkhadze` — so meta text
       on this document has somewhere to go. It did not before, which is why
       these fields were absent rather than merely unwired. */
    seoBlock(),
  ],
};
