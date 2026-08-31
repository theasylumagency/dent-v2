import type { GlobalConfig, TextFieldValidation } from "payload";

import { analyticsSettings as t, groups } from "@/admin/labels";
import { safeRevalidate } from "@/collections/hooks/revalidate";
import { isAdmin } from "../access/roles";
import { auditGlobal } from "../lib/audit/logger";
import { locales } from "../i18n/config";

const optionalPattern = (pattern: RegExp, message: string): TextFieldValidation =>
  (value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    return !normalized || pattern.test(normalized) || message;
  };

const trimUpper = (value: unknown) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;
const trim = (value: unknown) => (typeof value === "string" ? value.trim() : value);

export const AnalyticsSettings: GlobalConfig = {
  slug: "analytics-settings",

  label: t.label,

  access: {
    /* Public on purpose: the site reads these IDs while rendering, to decide
       whether an analytics script exists at all. Only saving is restricted. */
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },

  admin: {
    group: groups.settings,
    description: t.description,
    /**
     * Hidden from editors, like its two neighbours in this group.
     *
     * This was the one settings screen without the rule: `read` is public and
     * `update` is admin-only, so an editor saw it in the nav, opened it,
     * changed the GA4 field and met an error on Save — with nothing on the
     * screen having warned them. Read access is unchanged; only the nav entry
     * goes, which is what made it a dead end.
     */
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },

  hooks: {
    afterChange: [
      auditGlobal(["ga4MeasurementId", "metaPixelId"]),
      () => {
        /* `safeRevalidate`, not `revalidatePath` — same reason as in `Seo`
           and `ClinicInfo`: a bare call throws outside a Next request, which
           is exactly where a seed or migration script runs. */
        for (const locale of locales) safeRevalidate(`/${locale}`, "layout");
      },
    ],
  },

  fields: [
    {
      name: "ga4MeasurementId",
      label: t.ga4,
      type: "text",
      validate: optionalPattern(/^G-[A-Z0-9]{6,20}$/i, t.ga4Error),
      hooks: { beforeValidate: [trimUpper] },
      admin: {
        description: t.ga4Help,
        placeholder: "G-XXXXXXXXXX",
      },
    },
    {
      name: "metaPixelId",
      label: t.pixel,
      type: "text",
      validate: optionalPattern(/^\d{5,20}$/, t.pixelError),
      hooks: { beforeValidate: [trim] },
      admin: {
        description: t.pixelHelp,
        placeholder: "123456789012345",
      },
    },
  ],
};
