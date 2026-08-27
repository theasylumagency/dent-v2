import type { CollectionConfig } from "payload";

import { auditLogs as t, groups } from "@/admin/labels";
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

  labels: { singular: t.singular, plural: t.plural },

  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },

  admin: {
    group: groups.settings,
    useAsTitle: "target",
    defaultColumns: ["createdAt", "user", "action", "target"],
    description: t.description,
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
      label: t.user,
      relationTo: "users",
      admin: { readOnly: true },
    },
    {
      name: "action",
      type: "select",
      label: t.action,
      required: true,
      options: [
        { label: t.actionCreate, value: "create" },
        { label: t.actionUpdate, value: "update" },
        { label: t.actionDelete, value: "delete" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "targetType",
      type: "select",
      label: t.targetType,
      required: true,
      options: [
        { label: t.targetTypeCollection, value: "collection" },
        { label: t.targetTypeGlobal, value: "global" },
      ],
      admin: { readOnly: true },
    },
    {
      name: "target",
      type: "text",
      label: t.target,
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: "documentId",
      type: "text",
      label: t.documentId,
      admin: { readOnly: true },
    },
    {
      name: "changes",
      type: "json",
      label: t.changes,
      required: true,
      admin: {
        readOnly: true,
        description: t.changesHelp,
      },
    },
  ],
};
