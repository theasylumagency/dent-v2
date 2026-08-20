import type { CollectionConfig } from "payload";

import { isAdmin } from "../access/roles";

/**
 * Immutable CMS mutation history.
 *
 * Entries are written only by server-side hooks with `overrideAccess`. Even an
 * administrator cannot create, edit, or delete them through REST, GraphQL, or
 * the Admin UI; the UI restrictions below are only a convenience on top of
 * the access rules.
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",

  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },

  admin: {
    group: "Settings",
    useAsTitle: "target",
    defaultColumns: ["createdAt", "user", "action", "target"],
    description:
      "Immutable history of CMS changes. Entries are created automatically and cannot be edited or deleted.",
    hideAPIURL: true,
    hidden: ({ user }) => !isAdmin(user as { role?: string | null }),
  },

  disableBulkDelete: true,
  disableBulkEdit: true,
  disableDuplicate: true,
  lockDocuments: false,

  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
    },
    {
      name: "action",
      type: "select",
      required: true,
      options: [
        { label: "Create", value: "create" },
        { label: "Update", value: "update" },
        { label: "Delete", value: "delete" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "targetType",
      type: "select",
      required: true,
      options: [
        { label: "Collection", value: "collection" },
        { label: "Global", value: "global" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "target",
      type: "text",
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: "documentId",
      type: "text",
      admin: { readOnly: true },
    },
    {
      name: "changes",
      type: "json",
      required: true,
      admin: {
        readOnly: true,
        description: "Only changed fields are included; sensitive field names are always removed.",
      },
    },
  ],
};
