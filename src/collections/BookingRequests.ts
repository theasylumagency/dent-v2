import type { CollectionConfig } from "payload";

import { bookingRequests as t, groups } from "@/admin/labels";
import { isAdmin } from "../access/roles";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

const notificationOptions = [
  { label: t.notifyPending, value: "pending" },
  { label: t.notifySent, value: "sent" },
  { label: t.notifyFailed, value: "failed" },
  { label: t.notifySkipped, value: "skipped" },
];

const immutable = {
  access: { update: () => false },
  admin: { readOnly: true },
} as const;

/**
 * Patient booking requests, created only by the dedicated server route.
 *
 * This is the one screen the clinic opens every day, which is why it sits
 * alone at the top of the nav rather than eleventh among the content
 * collections. Everything the patient sent is read-only; the single field
 * staff change is the status, and the form is arranged so that is the only
 * thing they can reach without opening a block.
 */
export const BookingRequests: CollectionConfig = {
  slug: "booking-requests",

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },

  admin: {
    group: groups.daily,
    useAsTitle: "name",
    defaultColumns: ["createdAt", "name", "phone", "service", "status"],
    listSearchableFields: ["name", "phone", "email", "service"],
    description: t.description,
    hideAPIURL: true,
  },

  /* A request arriving from the site is created by the booking route with no
     signed-in user, and `auditCollection` skips those on purpose — otherwise
     the history would fill up with entries nobody performed. A receptionist
     moving one to "contacted" is a person acting, and is recorded. */
  hooks: {
    afterChange: [auditCollection()],
    afterDelete: [auditCollectionDelete()],
  },

  defaultSort: "-createdAt",
  disableDuplicate: true,
  lockDocuments: false,

  fields: [
    /* The workflow field first, and in the sidebar: it is the only thing
       anyone changes here, and burying it under seven read-only values meant
       scrolling past the whole request to reach it. */
    {
      name: "status",
      type: "select",
      label: t.status,
      required: true,
      defaultValue: "new",
      index: true,
      options: [
        { label: t.statusNew, value: "new" },
        { label: t.statusContacted, value: "contacted" },
        { label: t.statusConfirmed, value: "confirmed" },
        { label: t.statusClosed, value: "closed" },
        { label: t.statusSpam, value: "spam" },
      ],
      admin: {
        position: "sidebar",
        description: t.statusHelp,
      },
    },

    { name: "name", type: "text", label: t.name, required: true, ...immutable },
    { name: "phone", type: "text", label: t.phone, required: true, ...immutable },
    { name: "email", type: "email", label: t.email, ...immutable },
    { name: "service", type: "text", label: t.service, ...immutable },
    { name: "preferredTime", type: "text", label: t.preferredTime, ...immutable },
    { name: "message", type: "textarea", label: t.message, ...immutable },

    {
      type: "collapsible",
      label: t.attribution,
      admin: { initCollapsed: true, description: t.attributionHelp },
      fields: [
        { name: "landingSlug", type: "text", label: t.landingSlug, ...immutable },
        { name: "campaignName", type: "text", label: t.campaignName, ...immutable },
        { name: "utmSource", type: "text", label: t.utmSource, ...immutable },
        { name: "utmMedium", type: "text", label: t.utmMedium, ...immutable },
        { name: "utmCampaign", type: "text", label: t.utmCampaign, ...immutable },
        { name: "utmContent", type: "text", label: t.utmContent, ...immutable },
        { name: "utmTerm", type: "text", label: t.utmTerm, ...immutable },
      ],
    },
    {
      type: "collapsible",
      label: t.notifications,
      admin: {
        initCollapsed: true,
        description: t.notificationsHelp,
      },
      fields: [
        {
          name: "emailNotificationStatus",
          type: "select",
          label: t.emailStatus,
          required: true,
          defaultValue: "pending",
          options: notificationOptions,
          ...immutable,
        },
        {
          name: "emailNotificationError",
          type: "textarea",
          label: t.emailError,
          access: { update: () => false },
          admin: {
            readOnly: true,
            description: t.errorHelp,
          },
        },
        {
          name: "telegramNotificationStatus",
          type: "select",
          label: t.telegramStatus,
          required: true,
          defaultValue: "pending",
          options: notificationOptions,
          ...immutable,
        },
        {
          name: "telegramNotificationError",
          type: "textarea",
          label: t.telegramError,
          access: { update: () => false },
          admin: {
            readOnly: true,
            description: t.errorHelp,
          },
        },
      ],
    },
  ],
};
