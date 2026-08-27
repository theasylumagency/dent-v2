import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  Payload,
} from "payload";

import { groups, landingPages as t } from "@/admin/labels";
import { RESERVED_SLUGS, SLUG_PATTERN, slugify } from "@/lib/campaign-slug";
import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

/**
 * Campaign landing pages.
 *
 * The editing model is deliberately lopsided: a campaign can be published
 * with three things filled in — a name, a headline and the Active status —
 * and every other field is an optional override. Anything left blank is
 * rendered from `dict.landing` in the locale dictionaries, so a blank field
 * produces a finished page rather than a hole. See `src/lib/landing-copy.ts`,
 * which is the single place those fallbacks are resolved.
 *
 * That is the whole reason there are almost no `required: true` flags below.
 * A required field on a localized collection is required *three times* — once
 * per locale — and the previous version of this file had roughly twenty-five
 * of them, which is around seventy-five values before a page could be saved.
 */

const DEFAULT_LOCALE = "ka";

function relationId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  return "";
}

/**
 * Georgian is the source language, so it is the only locale a field can be
 * required in. Payload's own `required` runs against whichever locale is
 * being saved, which would mean an editor opening the English tab of a
 * finished campaign could no longer save it. Validation is keyed off
 * `req.locale` instead: fill Georgian, translate later or never.
 */
function requiredInGeorgian(message: string) {
  return (value: unknown, options?: { req?: { locale?: string } }) => {
    const locale = options?.req?.locale;
    if (locale && locale !== DEFAULT_LOCALE) return true;
    return String(value ?? "").trim().length > 0 ? true : message;
  };
}

type TextOptions = {
  label: string;
  description?: string;
  placeholder?: string;
  textarea?: boolean;
  requiredMessage?: string;
  condition?: (data: Record<string, unknown>, siblingData: Record<string, unknown>) => boolean;
};

/** One localized text or textarea field, with the admin chrome attached. */
function text(name: string, options: TextOptions): Field {
  const admin = {
    description: options.description,
    placeholder: options.placeholder,
    condition: options.condition,
  };

  if (options.textarea) {
    return {
      name,
      type: "textarea",
      label: options.label,
      localized: true,
      validate: options.requiredMessage ? requiredInGeorgian(options.requiredMessage) : undefined,
      admin,
    } as Field;
  }

  return {
    name,
    type: "text",
    label: options.label,
    localized: true,
    validate: options.requiredMessage ? requiredInGeorgian(options.requiredMessage) : undefined,
    admin,
  } as Field;
}

/** The `enabled` switch every optional section opens with. */
const enabledToggle = (description: string): Field => ({
  name: "enabled",
  type: "checkbox",
  label: "სექციის ჩვენება",
  defaultValue: false,
  admin: { description },
});

/** Hides a section's body until its own switch is on. */
const whenEnabled = (_: unknown, siblingData: Record<string, unknown>) =>
  Boolean(siblingData?.enabled);

/* ------------------------------------------------------------------ hooks */

/**
 * Give every campaign a URL without asking for one.
 *
 * The editor types a name in Georgian and gets `vinirebi-zafxuli-2026`; they
 * can still overwrite it, and an existing slug is never rewritten — a live ad
 * pointing at the old URL must not break because someone fixed a typo in the
 * campaign name.
 */
async function firstFreeSlug(payload: Payload, base: string, ownId?: string): Promise<string> {
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    if (RESERVED_SLUGS.has(candidate)) continue;

    const existing = await payload.find({
      collection: "landing-pages",
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      select: { slug: true },
      where: { slug: { equals: candidate } },
    });

    const taken = existing.docs.find((doc) => String(doc.id) !== String(ownId ?? ""));
    if (!taken) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

const autoSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;

  const typed = typeof data.slug === "string" ? data.slug.trim() : "";
  if (typed) {
    data.slug = typed;
    return data;
  }

  /* Clearing the field in the UI must not silently mint a new URL. */
  if (originalDoc?.slug) {
    data.slug = originalDoc.slug;
    return data;
  }

  const base = slugify(String(data.campaignName ?? ""));
  if (!base) return data;

  data.slug = await firstFreeSlug(req.payload, base, originalDoc?.id);
  return data;
};

/**
 * A redirect target is a CMS relationship rather than a free-form URL, so the
 * only checks left are the ones a relationship field cannot express: not
 * itself, not a draft, and not another redirect. Refusing to point at a
 * redirect is stricter than walking the chain and much easier to explain —
 * every archived campaign lands on a real page in exactly one hop.
 */
const validateArchivedRedirect: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const status = String(data.status ?? originalDoc?.status ?? "draft");
  const behavior = String(data.archivedBehavior ?? originalDoc?.archivedBehavior ?? "ended-page");
  if (status !== "archived" || behavior !== "redirect") return data;

  const targetId = relationId(data.redirectTarget ?? originalDoc?.redirectTarget);
  if (!targetId) {
    throw new Error("აირჩიეთ გვერდი, სადაც ვიზიტორი უნდა გადამისამართდეს.");
  }
  if (targetId === relationId(originalDoc?.id)) {
    throw new Error("გვერდი საკუთარ თავზე ვერ გადამისამართდება.");
  }

  const target = await req.payload.findByID({
    collection: "landing-pages",
    id: targetId,
    depth: 0,
    overrideAccess: true,
  });

  if (target.status === "draft") {
    throw new Error("არჩეული გვერდი ჯერ არ არის გამოქვეყნებული.");
  }
  if (target.status === "archived" && target.archivedBehavior === "redirect") {
    throw new Error("არჩეული გვერდი თავადაა გადამისამართებული — მიუთითეთ საბოლოო გვერდი.");
  }

  return data;
};

/* ------------------------------------------------------------- collection */

export const LandingPages: CollectionConfig = {
  slug: "landing-pages",

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: ({ req }) => (req.user ? true : { status: { not_equals: "draft" } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  admin: {
    group: groups.marketing,
    useAsTitle: "campaignName",
    defaultColumns: ["campaignName", "slug", "status", "updatedAt"],
    description:
      "სარეკლამო კამპანიის გვერდები. მისამართი: /ka/slug. სავალდებულოა მხოლოდ სახელი და სათაური — დანარჩენი ველები ცარიელი რომ დატოვოთ, ტექსტი ავტომატურად ჩაისმება.",
    preview: (doc, options) => {
      const slug = typeof doc?.slug === "string" ? doc.slug : "";
      if (!slug) return null;
      const locale = options?.locale && options.locale !== "all" ? options.locale : DEFAULT_LOCALE;
      return `/${locale}/${slug}`;
    },
  },

  hooks: {
    beforeValidate: [autoSlug],
    beforeChange: [validateArchivedRedirect],
    afterChange: [afterChangeRevalidate((doc) => [`/${String(doc.slug ?? "")}`])],
    afterDelete: [afterDeleteRevalidate((doc) => [`/${String(doc.slug ?? "")}`])],
  },

  fields: [
    /* --------------------------------------------------------- sidebar */
    {
      name: "status",
      type: "select",
      label: "სტატუსი",
      required: true,
      defaultValue: "draft",
      index: true,
      admin: {
        position: "sidebar",
        description: "მხოლოდ „აქტიური“ ჩანს ვიზიტორისთვის.",
      },
      options: [
        { label: "მუშავდება (არავინ ხედავს)", value: "draft" },
        { label: "აქტიური", value: "active" },
        { label: "დასრულებული", value: "archived" },
      ],
    },
    {
      name: "slug",
      type: "text",
      label: "მისამართი (slug)",
      /* Required at the database level as well: the hook below fills it in
         before validation runs, so an editor never meets the error, but a
         campaign row without a URL would be unreachable and invisible. */
      required: true,
      unique: true,
      index: true,
      maxLength: 120,
      validate: (value: unknown) => {
        const raw = typeof value === "string" ? value : "";
        const slug = raw.trim();
        if (!slug) return "მისამართი სავალდებულოა — ჩაწერეთ კამპანიის სახელი და ავტომატურად შეივსება.";
        if (slug !== raw) return "წაშალეთ ზედმეტი ჰარეები.";
        if (!SLUG_PATTERN.test(slug)) {
          return "დაშვებულია მხოლოდ პატარა ლათინური ასოები, ციფრები და დეფისი.";
        }
        if (RESERVED_SLUGS.has(slug)) {
          return `„${slug}“ დაკავებულია საიტის სხვა გვერდით. აირჩიეთ სხვა მისამართი.`;
        }
        return true;
      },
      admin: {
        position: "sidebar",
        description: "ავტომატურად ივსება სახელიდან. გვერდი გაიხსნება: /ka/slug",
      },
    },
    {
      name: "indexable",
      type: "checkbox",
      label: "Google-ში ჩანდეს",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "ფასიანი რეკლამის გვერდისთვის ჩვეულებრივ გამორთულია.",
      },
    },
    {
      name: "startsAt",
      type: "date",
      label: "დაწყება",
      admin: { position: "sidebar", description: "მხოლოდ შენიშვნა თქვენთვის." },
    },
    {
      name: "endsAt",
      type: "date",
      label: "დასრულება",
      admin: { position: "sidebar", description: "გვერდს ავტომატურად არ ხურავს." },
    },
    {
      name: "archivedBehavior",
      type: "select",
      label: "დასრულების შემდეგ",
      required: true,
      defaultValue: "ended-page",
      admin: {
        position: "sidebar",
        condition: (data) => data?.status === "archived",
      },
      options: [
        { label: "„კამპანია დასრულდა“ ეკრანი", value: "ended-page" },
        { label: "სხვა კამპანიაზე გადამისამართება", value: "redirect" },
        { label: "გვერდი ისევ ღიად დარჩეს", value: "keep-public" },
      ],
    },
    {
      name: "redirectTarget",
      type: "relationship",
      relationTo: "landing-pages",
      label: "გადამისამართება",
      admin: {
        position: "sidebar",
        condition: (data) => data?.status === "archived" && data?.archivedBehavior === "redirect",
      },
    },

    /* ------------------------------------------------------------ tabs */
    {
      type: "tabs",
      tabs: [
        {
          label: "მთავარი",
          description: "ის, რასაც ვიზიტორი პირველ ეკრანზე ხედავს.",
          fields: [
            {
              name: "campaignName",
              type: "text",
              label: "კამპანიის სახელი",
              required: true,
              admin: {
                description:
                  "მხოლოდ ადმინისთვის — ვიზიტორი ვერ ხედავს. მაგ.: ვინირები — ზაფხული 2026",
              },
            },
            {
              name: "hero",
              type: "group",
              label: "პირველი ეკრანი",
              fields: [
                text("headline", {
                  label: "მთავარი სათაური",
                  requiredMessage: "სათაური სავალდებულოა.",
                  placeholder: "ღიმილი, რომელსაც არ მალავთ",
                  description: "ერთადერთი ტექსტი, რომელიც აუცილებლად უნდა შეავსოთ.",
                }),
                text("subheadline", {
                  label: "აღწერა",
                  textarea: true,
                  placeholder: "ერთი-ორი წინადადება იმაზე, რას მიიღებს ვიზიტორი.",
                }),
                text("eyebrow", {
                  label: "პატარა წარწერა სათაურის ზემოთ",
                  placeholder: "მაგ.: ზაფხულის შეთავაზება",
                }),
                text("ctaLabel", {
                  label: "ღილაკის ტექსტი",
                  placeholder: "დატოვე ნომერი",
                  description: "ცარიელი დატოვეთ და ავტომატური ტექსტი ჩაისმება.",
                }),
                {
                  name: "layout",
                  type: "select",
                  label: "განლაგება",
                  required: true,
                  defaultValue: "image-right",
                  admin: {
                    description: "სურათის გარეშე ყველა ვარიანტი ერთნაირად, ტექსტად გამოჩნდება.",
                  },
                  options: [
                    { label: "სურათი მარჯვნივ", value: "image-right" },
                    { label: "სურათი მარცხნივ", value: "image-left" },
                    { label: "სურათი მთელ ეკრანზე (ყველაზე ეფექტური)", value: "full-bleed" },
                    { label: "ცენტრში, სურათი ქვემოთ", value: "centered-editorial" },
                    { label: "მხოლოდ ტექსტი", value: "copy-only" },
                  ],
                },
                {
                  name: "desktopImage",
                  type: "upload",
                  relationTo: "media",
                  label: "სურათი (კომპიუტერი)",
                  admin: {
                    description: "სასურველი ზომა 1920 × 1200 px. მნიშვნელოვანი ობიექტი ცენტრთან ახლოს დატოვეთ.",
                  },
                },
                {
                  name: "mobileImage",
                  type: "upload",
                  relationTo: "media",
                  label: "სურათი (მობილური)",
                  admin: {
                    description: "არასავალდებულო, 1080 × 1350 px. თუ ცარიელია, კომპიუტერის სურათი გამოიყენება.",
                  },
                },
              ],
            },
            {
              name: "reasons",
              type: "array",
              label: "რატომ დაგვიტოვოთ ნომერი",
              labels: { singular: "მიზეზი", plural: "მიზეზები" },
              maxRows: 4,
              admin: {
                description:
                  "2–4 მოკლე არგუმენტი. ცარიელი რომ დატოვოთ, კლინიკის სტანდარტული სამი არგუმენტი ჩაისმება.",
              },
              fields: [
                text("title", { label: "სათაური", placeholder: "უფასო კონსულტაცია" }),
                text("text", {
                  label: "ტექსტი",
                  textarea: true,
                  placeholder: "ერთი წინადადება.",
                }),
              ],
            },
          ],
        },

        {
          label: "სექციები",
          description: "ჩართეთ მხოლოდ ის, რაც ამ კამპანიას სჭირდება.",
          fields: [
            {
              name: "problemSolution",
              type: "group",
              label: "პრობლემა → გადაწყვეტა",
              fields: [
                enabledToggle("მუქი ბლოკი ერთი ძლიერი შეტყობინებით."),
                text("eyebrow", { label: "პატარა წარწერა", condition: whenEnabled }),
                text("title", { label: "სათაური", condition: whenEnabled }),
                text("body", { label: "ტექსტი", textarea: true, condition: whenEnabled }),
              ],
            },
            {
              name: "doctor",
              type: "group",
              label: "ექიმი",
              fields: [
                enabledToggle("იღებს ექიმის ფოტოს, როლს და კვალიფიკაციას „ექიმების“ განყოფილებიდან."),
                {
                  name: "practitioner",
                  type: "relationship",
                  relationTo: "doctors",
                  label: "ექიმი",
                  admin: { condition: whenEnabled },
                },
                text("heading", { label: "სათაური", condition: whenEnabled }),
                text("intro", { label: "ტექსტი", textarea: true, condition: whenEnabled }),
              ],
            },
            {
              name: "steps",
              type: "array",
              label: "რა ხდება შემდეგ",
              labels: { singular: "ნაბიჯი", plural: "ნაბიჯები" },
              maxRows: 4,
              admin: {
                description:
                  "ცარიელი რომ დატოვოთ, სტანდარტული სამი ნაბიჯი ჩაისმება (დარეკვა → დროის შეთანხმება → ვიზიტი).",
              },
              fields: [
                text("title", { label: "სათაური", placeholder: "დაგირეკავთ" }),
                text("text", { label: "ტექსტი", textarea: true }),
              ],
            },
            text("stepsHeading", {
              label: "„რა ხდება შემდეგ“ — სათაური",
              placeholder: "რა ხდება შემდეგ",
            }),
            text("stepsIntro", {
              label: "„რა ხდება შემდეგ“ — ტექსტი",
              textarea: true,
              placeholder: "ფორმის გაგზავნა ჯერ არ ნიშნავს დაჯავშნილ ვიზიტს.",
            }),
            {
              name: "testimonials",
              type: "group",
              label: "პაციენტების შეფასებები",
              fields: [
                enabledToggle("გამოაქვეყნეთ მხოლოდ ის შეფასებები, რომელთა დადასტურებაც კლინიკას შეუძლია."),
                text("heading", { label: "სათაური", condition: whenEnabled }),
                {
                  name: "items",
                  type: "array",
                  label: "შეფასებები",
                  labels: { singular: "შეფასება", plural: "შეფასებები" },
                  maxRows: 3,
                  admin: { condition: whenEnabled },
                  fields: [
                    text("quote", { label: "ციტატა", textarea: true }),
                    text("displayName", { label: "სახელი" }),
                    text("sourceLabel", { label: "წყარო", placeholder: "მაგ.: Google Reviews" }),
                  ],
                },
              ],
            },
            {
              name: "clinicSection",
              type: "group",
              label: "კლინიკა",
              fields: [
                enabledToggle("კლინიკის ფოტო, მისამართი და სამუშაო საათები."),
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "ფოტო",
                  admin: { condition: whenEnabled },
                },
                text("title", { label: "სათაური", condition: whenEnabled }),
                text("text", { label: "ტექსტი", textarea: true, condition: whenEnabled }),
              ],
            },
            {
              name: "finalCta",
              type: "group",
              label: "დამამთავრებელი მოწოდება",
              admin: { description: "მუქი ბლოკი გვერდის ბოლოს. ცარიელი ველები ავტომატურად ივსება." },
              fields: [
                text("title", { label: "სათაური", placeholder: "მზად ხართ პირველი ნაბიჯისთვის?" }),
                text("text", { label: "ტექსტი", textarea: true }),
                text("buttonLabel", { label: "ღილაკი", placeholder: "დატოვე ნომერი" }),
              ],
            },
            {
              name: "ended",
              type: "group",
              label: "„კამპანია დასრულდა“ ეკრანი",
              admin: {
                condition: (data) => data?.status === "archived",
                description: "ჩანს მხოლოდ დასრულებულ კამპანიაზე. ცარიელი ველები ავტომატურად ივსება.",
              },
              fields: [
                text("title", { label: "სათაური", placeholder: "კამპანია დასრულდა" }),
                text("text", { label: "ტექსტი", textarea: true }),
                text("ctaLabel", { label: "ღილაკი", placeholder: "მთავარ გვერდზე" }),
              ],
            },
          ],
        },

        {
          label: "ფორმა და ჰედერი",
          description: "რას ითხოვს ფორმა და რა ჩანს ზედა ზოლში.",
          fields: [
            {
              name: "form",
              type: "group",
              label: "ფორმა",
              fields: [
                text("title", { label: "სათაური", placeholder: "დატოვეთ ნომერი" }),
                text("intro", { label: "ტექსტი", textarea: true }),
                text("submitLabel", { label: "ღილაკი", placeholder: "გამოგზავნა" }),
                text("successTitle", { label: "მადლობის სათაური", placeholder: "მოთხოვნა მიღებულია" }),
                text("successText", {
                  label: "მადლობის ტექსტი",
                  textarea: true,
                  placeholder: "დაგირეკავთ სამუშაო საათებში.",
                }),
                {
                  name: "showService",
                  type: "checkbox",
                  label: "მიმართულების არჩევა",
                  defaultValue: false,
                  admin: {
                    description:
                      "სახელი და ტელეფონი ყოველთვის ჩანს. ყოველი დამატებული ველი ამცირებს შევსების ალბათობას.",
                  },
                },
                { name: "showPreferredTime", type: "checkbox", label: "სასურველი დრო", defaultValue: false },
                { name: "showEmail", type: "checkbox", label: "ელ. ფოსტა", defaultValue: false },
                { name: "showMessage", type: "checkbox", label: "შეტყობინება", defaultValue: false },
                {
                  name: "defaultService",
                  type: "relationship",
                  relationTo: "services",
                  label: "კამპანიის მიმართულება",
                  admin: {
                    description:
                      "იგზავნება განაცხადთან ერთად მაშინაც, როცა არჩევანის ველი გამორთულია.",
                  },
                },
              ],
            },
            {
              name: "header",
              type: "group",
              label: "ზედა ზოლი",
              fields: [
                {
                  name: "preset",
                  type: "select",
                  label: "ვარიანტი",
                  required: true,
                  defaultValue: "minimal",
                  options: [
                    { label: "ლოგო, ტელეფონი, ღილაკი", value: "minimal" },
                    { label: "ლოგო, ნდობის ტექსტი, ტელეფონი, ღილაკი", value: "brand" },
                    { label: "მხოლოდ ლოგო და ღილაკი", value: "ultra-minimal" },
                  ],
                },
                text("trustText", {
                  label: "ნდობის ტექსტი",
                  placeholder: "მაგ.: 12 წელი, 6000-ზე მეტი პაციენტი",
                  description: "ჩანს მხოლოდ მეორე ვარიანტში.",
                }),
                { name: "showPhone", type: "checkbox", label: "ტელეფონის ჩვენება", defaultValue: true },
                text("ctaLabel", { label: "ღილაკის ტექსტი", placeholder: "დატოვე ნომერი" }),
              ],
            },
          ],
        },

        {
          label: "SEO",
          description: "Google-სა და სოციალურ ქსელებში გაზიარებისთვის. ცარიელი ველები სათაურიდან ივსება.",
          fields: [
            {
              name: "seo",
              type: "group",
              label: "SEO",
              fields: [
                text("metaTitle", { label: "სათაური", description: "ცარიელია — გამოიყენება მთავარი სათაური." }),
                text("metaDescription", {
                  label: "აღწერა",
                  textarea: true,
                  description: "ცარიელია — გამოიყენება პირველი ეკრანის აღწერა.",
                }),
                {
                  name: "socialImage",
                  type: "upload",
                  relationTo: "media",
                  label: "გაზიარების სურათი",
                  admin: { description: "ცარიელია — გამოიყენება პირველი ეკრანის სურათი." },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
