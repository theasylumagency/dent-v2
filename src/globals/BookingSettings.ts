import type { GlobalConfig } from "payload";

import { isAdmin } from "../access/roles";
import { auditGlobal } from "../lib/audit/logger";

export const BookingSettings: GlobalConfig = {
  slug: "booking-settings",
  label: "Booking Settings",
  access: {
    read: ({ req }) => isAdmin(req.user),
    update: ({ req }) => isAdmin(req.user),
  },
  admin: {
    group: "Settings",
    description:
      "Operational booking delivery settings. This recipient is separate from the public email in Clinic Info.",
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },
  hooks: {
    afterChange: [auditGlobal(["notificationEmail"])],
  },
  fields: [
    {
      name: "notificationEmail",
      label: "Notification email",
      type: "email",
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value),
        ],
      },
      admin: {
        description:
          "Private recipient for new booking alerts. When empty, BOOKING_INBOX is used as a backwards-compatible fallback.",
      },
    },
  ],
};
