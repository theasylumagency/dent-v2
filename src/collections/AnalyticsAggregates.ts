import type { CollectionConfig } from "payload";

import { analyticsAggregates as t, groups } from "@/admin/labels";
import { isAdmin } from "../access/roles";

/** One row per UTC day, event, and route. The public endpoint atomically
 * increments `count`, so traffic volume does not translate into unbounded
 * row growth and no visitor identifier is needed. */
export const AnalyticsAggregates: CollectionConfig = {
  slug: "analytics-aggregates",

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },

  admin: {
    group: groups.marketing,
    useAsTitle: "route",
    defaultColumns: ["bucket", "event", "route", "count"],
    description: t.description,
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
      label: t.bucket,
      required: true,
      admin: { readOnly: true, description: t.bucketHelp },
    },
    {
      name: "event",
      type: "select",
      label: t.event,
      required: true,
      options: [
        { label: t.eventPageView, value: "page_view" },
        { label: t.eventBookingOpen, value: "booking_open" },
        { label: t.eventBookingComplete, value: "booking_complete" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "route",
      type: "text",
      label: t.route,
      required: true,
      defaultValue: "",
      admin: { readOnly: true, description: t.routeHelp },
    },
    {
      name: "count",
      type: "number",
      label: t.count,
      required: true,
      min: 0,
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
};
