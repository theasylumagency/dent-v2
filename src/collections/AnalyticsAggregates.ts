import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";

/** One row per UTC day, event, and route. The public endpoint atomically
 * increments `count`, so traffic volume does not translate into unbounded
 * row growth and no visitor identifier is needed. */
export const AnalyticsAggregates: CollectionConfig = {
  slug: "analytics-aggregates",

  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },

  admin: {
    group: "Analytics",
    useAsTitle: "route",
    defaultColumns: ["bucket", "event", "route", "count"],
    description:
      "Anonymous daily totals. These rows contain no visitor, session, cookie, fingerprint, or IP data.",
    hideAPIURL: true,
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },

  defaultSort: "-bucket",

  disableBulkDelete: true,
  disableBulkEdit: true,
  disableDuplicate: true,
  lockDocuments: false,

  indexes: [{ fields: ["bucket", "event", "route"], unique: true }],

  fields: [
    {
      name: "bucket",
      type: "text",
      required: true,
      admin: { readOnly: true, description: "UTC calendar day (YYYY-MM-DD)." },
    },
    {
      name: "event",
      type: "select",
      required: true,
      options: [
        { label: "Page view", value: "page_view" },
        { label: "Booking opened", value: "booking_open" },
        { label: "Booking completed", value: "booking_complete" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "route",
      type: "text",
      required: true,
      defaultValue: "",
      admin: { readOnly: true, description: "Set only for page views." },
    },
    {
      name: "count",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
};
