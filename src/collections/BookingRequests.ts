import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";

const notificationOptions = [
  { label: "Pending", value: "pending" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
  { label: "Skipped", value: "skipped" },
];

const immutable = {
  access: { update: () => false },
  admin: { readOnly: true },
} as const;

/** Patient booking requests are created only by the dedicated server route. */
export const BookingRequests: CollectionConfig = {
  slug: "booking-requests",
  labels: {
    singular: "Booking Request",
    plural: "Booking Requests",
  },
  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  admin: {
    group: "Operations",
    useAsTitle: "name",
    defaultColumns: ["createdAt", "name", "phone", "service", "status"],
    listSearchableFields: ["name", "phone", "email", "service"],
    description:
      "Patient booking requests, newest first. Update the workflow status as each lead is contacted; notification failures remain visible for follow-up.",
    hideAPIURL: true,
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },
  defaultSort: "-createdAt",
  disableDuplicate: true,
  lockDocuments: false,
  fields: [
    { name: "name", type: "text", required: true, ...immutable },
    { name: "phone", type: "text", required: true, ...immutable },
    { name: "email", type: "email", ...immutable },
    { name: "service", type: "text", ...immutable },
    { name: "preferredTime", type: "text", label: "Preferred time", ...immutable },
    { name: "message", type: "textarea", ...immutable },
    {
      type: "collapsible",
      label: "Attribution",
      admin: { initCollapsed: true },
      fields: [
        { name: "landingSlug", type: "text", label: "Landing slug", ...immutable },
        { name: "campaignName", type: "text", label: "Campaign name", ...immutable },
        { name: "utmSource", type: "text", label: "UTM source", ...immutable },
        { name: "utmMedium", type: "text", label: "UTM medium", ...immutable },
        { name: "utmCampaign", type: "text", label: "UTM campaign", ...immutable },
        { name: "utmContent", type: "text", label: "UTM content", ...immutable },
        { name: "utmTerm", type: "text", label: "UTM term", ...immutable },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "new",
      index: true,
      options: [
        { label: "New", value: "new" },
        { label: "Contacted", value: "contacted" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Closed", value: "closed" },
        { label: "Spam", value: "spam" },
      ],
      admin: {
        description: "The workflow field administrators update during lead follow-up.",
      },
    },
    {
      type: "collapsible",
      label: "Notifications",
      admin: {
        description:
          "A failed channel never rejects or removes the booking. Pending means the status update itself may need investigation.",
      },
      fields: [
        {
          name: "emailNotificationStatus",
          type: "select",
          label: "Email status",
          required: true,
          defaultValue: "pending",
          options: notificationOptions,
          ...immutable,
        },
        {
          name: "emailNotificationError",
          type: "textarea",
          label: "Email error",
          access: { update: () => false },
          admin: {
            readOnly: true,
            description: "Safe provider summary only. Secrets and authorization data are never stored.",
          },
        },
        {
          name: "telegramNotificationStatus",
          type: "select",
          label: "Telegram status",
          required: true,
          defaultValue: "pending",
          options: notificationOptions,
          ...immutable,
        },
        {
          name: "telegramNotificationError",
          type: "textarea",
          label: "Telegram error",
          access: { update: () => false },
          admin: {
            readOnly: true,
            description: "Safe provider summary only. Secrets and authorization data are never stored.",
          },
        },
      ],
    },
  ],
};
