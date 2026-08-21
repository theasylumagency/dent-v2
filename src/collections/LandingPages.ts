import type { CollectionBeforeChangeHook, CollectionConfig, Field } from "payload";

import { afterChangeRevalidate, afterDeleteRevalidate } from "./hooks/revalidate";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function relationId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id?: unknown }).id ?? "");
  }
  return "";
}

/**
 * Redirect destinations are CMS relationships rather than free-form URLs.
 * This hook adds the checks the relationship field cannot express: no draft
 * targets, no self redirects, and no redirect chains that eventually point
 * back to this document.
 */
const validateArchivedRedirect: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const status = String(data.status ?? originalDoc?.status ?? "draft");
  const behavior = String(
    data.archivedBehavior ?? originalDoc?.archivedBehavior ?? "keep-public",
  );

  if (status !== "archived") return data;

  if (behavior === "ended-page") {
    const ended = (data.ended ?? originalDoc?.ended) as
      | { title?: unknown; text?: unknown }
      | null
      | undefined;
    if (!String(ended?.title ?? "").trim() || !String(ended?.text ?? "").trim()) {
      throw new Error("Campaign-ended title and text are required for the ended-page behavior.");
    }
    return data;
  }

  if (behavior !== "redirect") return data;

  const firstTargetId = relationId(data.redirectTarget ?? originalDoc?.redirectTarget);
  if (!firstTargetId) throw new Error("Choose a redirect target for an archived campaign.");

  const currentId = relationId(originalDoc?.id);
  if (currentId && firstTargetId === currentId) {
    throw new Error("A landing page cannot redirect to itself.");
  }

  const visited = new Set<string>(currentId ? [currentId] : []);
  let targetId = firstTargetId;

  for (let depth = 0; depth < 12; depth += 1) {
    if (visited.has(targetId)) throw new Error("This redirect would create a redirect loop.");
    visited.add(targetId);

    const target = await req.payload.findByID({
      collection: "landing-pages",
      id: targetId,
      depth: 0,
      overrideAccess: true,
    });

    if (target.status === "draft") {
      throw new Error("An archived campaign cannot redirect to a draft landing page.");
    }

    if (target.status !== "archived" || target.archivedBehavior !== "redirect") return data;

    targetId = relationId(target.redirectTarget);
    if (!targetId) {
      throw new Error("The selected target has an incomplete archived redirect.");
    }
  }

  throw new Error("The selected redirect chain is too long. Choose a direct public target.");
};

const localizedText = (
  name: string,
  options: { required?: boolean; textarea?: boolean; description?: string } = {},
): Field => {
  const common = {
    name,
    localized: true,
    required: options.required,
    admin: options.description ? { description: options.description } : undefined,
  };

  return options.textarea
    ? { ...common, type: "textarea" }
    : { ...common, type: "text" };
};

export const LandingPages: CollectionConfig = {
  slug: "landing-pages",

  access: {
    read: ({ req }) => (req.user ? true : { status: { not_equals: "draft" } }),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  admin: {
    useAsTitle: "campaignName",
    defaultColumns: ["campaignName", "slug", "status", "startsAt", "endsAt"],
    description:
      "Controlled, campaign-specific landing pages. Keep old campaign documents and slugs for history; archive them instead of reusing a URL for an unrelated campaign.",
  },

  hooks: {
    beforeChange: [validateArchivedRedirect],
    afterChange: [afterChangeRevalidate((doc) => [`/lp/${String(doc.slug ?? "")}`])],
    afterDelete: [afterDeleteRevalidate((doc) => [`/lp/${String(doc.slug ?? "")}`])],
  },

  fields: [
    {
      name: "campaignName",
      type: "text",
      required: true,
      admin: {
        description: "Internal name shown in the admin, e.g. Veneers — Summer 2026.",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      maxLength: 120,
      validate: (value: unknown) => {
        const raw = typeof value === "string" ? value : "";
        const slug = raw.trim();
        if (!slug) return "A slug is required.";
        if (slug !== raw) return "Remove leading or trailing spaces from the slug.";
        return SLUG_PATTERN.test(slug)
          ? true
          : "Use lowercase letters, numbers and single hyphens only.";
      },
      admin: {
        position: "sidebar",
        description:
          "Permanent campaign URL segment, e.g. veneers-summer-2026. Do not reuse an old slug for a different campaign.",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      admin: { position: "sidebar" },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      name: "startsAt",
      type: "date",
      admin: {
        position: "sidebar",
        description: "Optional campaign reference date. Status remains the publishing control.",
      },
    },
    {
      name: "endsAt",
      type: "date",
      admin: {
        position: "sidebar",
        description: "Optional campaign reference date. It does not archive the page automatically.",
      },
    },
    {
      name: "archivedBehavior",
      type: "select",
      required: true,
      defaultValue: "keep-public",
      admin: {
        position: "sidebar",
        condition: (_, siblingData) => siblingData.status === "archived",
      },
      options: [
        { label: "Keep the old page public", value: "keep-public" },
        { label: "Show campaign ended page", value: "ended-page" },
        { label: "Redirect to another campaign", value: "redirect" },
      ],
    },
    {
      name: "redirectTarget",
      type: "relationship",
      relationTo: "landing-pages",
      admin: {
        position: "sidebar",
        condition: (_, siblingData) =>
          siblingData.status === "archived" && siblingData.archivedBehavior === "redirect",
        description: "Only a CMS landing page can be selected; draft and looping targets are rejected.",
      },
    },
    {
      name: "indexable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Off by default for paid-campaign destinations. Only active, indexable pages enter the sitemap.",
      },
    },
    {
      name: "header",
      type: "group",
      fields: [
        {
          name: "preset",
          type: "select",
          required: true,
          defaultValue: "minimal",
          options: [
            { label: "Minimal — logo, phone, CTA", value: "minimal" },
            { label: "Brand — trust message, phone, CTA", value: "brand" },
            { label: "Ultra minimal — logo and CTA", value: "ultra-minimal" },
          ],
        },
        localizedText("trustText", { description: "Used by the Brand preset only." }),
        {
          name: "showPhone",
          type: "checkbox",
          defaultValue: true,
        },
        localizedText("ctaLabel", { required: true }),
      ],
    },
    {
      name: "hero",
      type: "group",
      fields: [
        {
          name: "layout",
          type: "select",
          required: true,
          defaultValue: "image-right",
          options: [
            { label: "Copy only", value: "copy-only" },
            { label: "Image right", value: "image-right" },
            { label: "Image left", value: "image-left" },
            { label: "Full bleed", value: "full-bleed" },
            { label: "Centered editorial", value: "centered-editorial" },
          ],
        },
        localizedText("eyebrow"),
        localizedText("headline", { required: true }),
        localizedText("subheadline", { textarea: true }),
        localizedText("ctaLabel", { required: true }),
        {
          name: "desktopImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "Recommended desktop hero: 1920 × 1200 px, 16:10. Upload WebP, JPEG or PNG; Payload will optimize it. Keep the original reasonably compressed, ideally under 2 MB. Keep important subjects away from extreme edges because responsive cropping may occur.",
          },
        },
        {
          name: "mobileImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description:
              "Optional dedicated mobile crop. Recommended: 1080 × 1350 px, 4:5. If omitted, the desktop image is reused and cropped responsively using its focal point.",
          },
        },
      ],
    },
    {
      name: "reasons",
      type: "array",
      required: true,
      minRows: 2,
      maxRows: 4,
      labels: { singular: "Reason", plural: "Why leave your number?" },
      fields: [
        localizedText("title", { required: true }),
        localizedText("text", { required: true, textarea: true }),
      ],
    },
    {
      name: "problemSolution",
      type: "group",
      label: "Problem → Solution",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        localizedText("eyebrow"),
        localizedText("title"),
        localizedText("body", { textarea: true }),
      ],
    },
    {
      name: "doctor",
      type: "group",
      label: "Doctor / clinical trust",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        localizedText("heading"),
        localizedText("intro", { textarea: true }),
        {
          name: "practitioner",
          type: "relationship",
          relationTo: "doctors",
          admin: {
            description: "Uses the selected doctor's existing name, role, photo and credentials.",
          },
        },
      ],
    },
    {
      name: "stepsHeading",
      type: "text",
      localized: true,
      required: true,
      label: "What happens next? — heading",
    },
    {
      name: "stepsIntro",
      type: "textarea",
      localized: true,
      label: "What happens next? — intro",
      admin: {
        description: "Make clear that sending the form is not a confirmed appointment.",
      },
    },
    {
      name: "steps",
      type: "array",
      required: true,
      minRows: 3,
      maxRows: 3,
      labels: { singular: "Step", plural: "Exactly three next steps" },
      fields: [
        localizedText("title", { required: true }),
        localizedText("text", { required: true, textarea: true }),
      ],
    },
    {
      name: "testimonials",
      type: "group",
      label: "Social proof",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        localizedText("heading"),
        {
          name: "items",
          type: "array",
          maxRows: 3,
          admin: { description: "Only publish reviews the clinic can substantiate." },
          fields: [
            localizedText("quote", { required: true, textarea: true }),
            localizedText("displayName", { required: true }),
            localizedText("sourceLabel"),
          ],
        },
      ],
    },
    {
      name: "clinicSection",
      type: "group",
      label: "Clinic / environment",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: false },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        localizedText("title"),
        localizedText("text", { textarea: true }),
      ],
    },
    {
      name: "form",
      type: "group",
      label: "Lead form",
      fields: [
        { name: "showService", type: "checkbox", defaultValue: false },
        { name: "showPreferredTime", type: "checkbox", defaultValue: false },
        { name: "showEmail", type: "checkbox", defaultValue: false },
        { name: "showMessage", type: "checkbox", defaultValue: false },
        {
          name: "defaultService",
          type: "relationship",
          relationTo: "services",
          admin: {
            description: "Optional campaign service, submitted even when the service selector is hidden.",
          },
        },
        localizedText("title", { required: true }),
        localizedText("intro", { textarea: true }),
        localizedText("submitLabel", { required: true }),
        localizedText("successTitle", { required: true }),
        localizedText("successText", { required: true, textarea: true }),
      ],
    },
    {
      name: "finalCta",
      type: "group",
      label: "Final CTA",
      fields: [
        localizedText("title", { required: true }),
        localizedText("text", { textarea: true }),
        localizedText("buttonLabel", { required: true }),
      ],
    },
    {
      name: "ended",
      type: "group",
      label: "Campaign ended state",
      fields: [
        localizedText("title"),
        localizedText("text", { textarea: true }),
        localizedText("ctaLabel"),
      ],
    },
    {
      name: "seo",
      type: "group",
      label: "SEO and sharing",
      fields: [
        localizedText("metaTitle", {
          description: "Falls back to the campaign hero headline when empty.",
        }),
        localizedText("metaDescription", {
          textarea: true,
          description: "Falls back to the hero subheadline when empty.",
        }),
        {
          name: "socialImage",
          type: "upload",
          relationTo: "media",
          admin: {
            description: "Optional sharing image. Falls back to the desktop hero, then the site image.",
          },
        },
      ],
    },
  ],
};
