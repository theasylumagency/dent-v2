import type { GlobalConfig } from "payload";

import { bookingSettings as t, groups } from "@/admin/labels";
import { isAdmin } from "../access/roles";
import { auditGlobal } from "../lib/audit/logger";

export const BookingSettings: GlobalConfig = {
  slug: "booking-settings",

  label: t.label,

  access: {
    read: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
  },

  admin: {
    group: groups.settings,
    description: t.description,
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },

  hooks: {
    afterChange: [auditGlobal(["notificationEmail"])],
  },

  fields: [
    {
      name: "notificationEmail",
      label: t.notificationEmail,
      type: "email",
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value),
        ],
      },
      admin: {
        description: t.notificationEmailHelp,
      },
    },
  ],
};
