import { revalidatePath } from "next/cache";
import type { GlobalConfig, TextFieldValidation } from "payload";

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
  label: "Analytics",

  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },

  admin: {
    group: "Settings",
    description:
      "Public provider IDs. A provider stays disabled when its ID is empty, and the website loads it only after visitor consent.",
  },

  hooks: {
    afterChange: [
      auditGlobal(["ga4MeasurementId", "metaPixelId"]),
      () => {
        for (const locale of locales) revalidatePath(`/${locale}`, "layout");
      },
    ],
  },

  fields: [
    {
      name: "ga4MeasurementId",
      label: "GA4 Measurement ID",
      type: "text",
      validate: optionalPattern(
        /^G-[A-Z0-9]{6,20}$/i,
        "Use a GA4 Measurement ID such as G-XXXXXXXXXX, or leave the field empty.",
      ),
      hooks: { beforeValidate: [trimUpper] },
      admin: {
        description: "Optional. GA4 is not loaded when this field is empty.",
        placeholder: "G-XXXXXXXXXX",
      },
    },
    {
      name: "metaPixelId",
      label: "Meta Pixel ID",
      type: "text",
      validate: optionalPattern(
        /^\d{5,20}$/,
        "Use a numeric Meta Pixel ID (5–20 digits), or leave the field empty.",
      ),
      hooks: { beforeValidate: [trim] },
      admin: {
        description: "Optional. Meta Pixel is not loaded when this field is empty.",
        placeholder: "123456789012345",
      },
    },
  ],
};
