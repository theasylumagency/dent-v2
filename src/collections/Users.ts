import type { CollectionConfig } from "payload";

import { groups, users as t } from "@/admin/labels";
import { isAdmin } from "../access/roles";
import { auditCollection, auditCollectionDelete } from "@/lib/audit/logger";

/**
 * Admin accounts.
 *
 * This collection had no `access` block at all, which is not the same as
 * having no rules — Payload's default for an authenticated collection is "any
 * logged-in user". An editor could therefore create accounts, delete the
 * clinic owner's account and change their own role to `admin`. The `role`
 * field was decorative.
 *
 * The rules below are deliberately narrow. Everything about *content* stays
 * open to editors, because that is their job; only account management is
 * restricted, because that is the one thing whose failure is unrecoverable
 * from inside the admin panel.
 *
 * It now sits in the settings group rather than among the content
 * collections: an editor scanning the sidebar for something to maintain
 * should not find "accounts" between "doctors" and "photos".
 */

/** Someone editing their own account. Compared as strings — the id is a
    number on Postgres but arrives from the route as a string. */
const isSelf = (user: { id?: unknown } | null | undefined, id?: number | string) =>
  Boolean(user && id !== undefined && String(user.id) === String(id));

export const Users: CollectionConfig = {
    slug: "users",

    labels: { singular: t.singular, plural: t.plural },

    auth: true,

    access: {
        /* Colleagues' names and email addresses, visible to anyone already
           logged in. Restricting this to self would hide the team list for no
           security gain — the sensitive operations are below. */
        read: ({ req }) => Boolean(req.user),

        /**
         * Admins only — with one escape hatch.
         *
         * Payload's create-first-user screen bypasses access control, so a
         * fresh install can still be bootstrapped. The count below makes that
         * true independently of Payload's internals: if there is no session
         * *and* no user exists, this is the first account and it is allowed.
         * Without it, an admin-only rule plus a change in Payload's bootstrap
         * behaviour would mean a deployment nobody can log into.
         *
         * The query runs only for unauthenticated create attempts, which in
         * normal operation is never.
         */
        create: async ({ req }) => {
            if (isAdmin(req.user)) return true;
            if (req.user) return false;

            const { totalDocs } = await req.payload.count({ collection: "users" });
            return totalDocs === 0;
        },

        /* An editor can change their own name and password. They cannot
           change their role — see the field-level rule below. */
        update: ({ req, id }) => isAdmin(req.user) || isSelf(req.user, id),

        /* Admins only, and never the last one — see `beforeDelete`. */
        delete: ({ req }) => isAdmin(req.user),
    },

    admin: {
        group: groups.settings,
        useAsTitle: "email",
        defaultColumns: ["name", "email", "role"],
        description: t.description,
    },

    hooks: {
        /**
         * The bootstrap account is always an administrator.
         *
         * `role` defaults to `editor`, and the create-first-user screen
         * renders that select like any other field. Without this hook the
         * very first account could be saved as an editor — leaving an install
         * with a user who cannot create the admin that everything else here
         * requires, and no way out except SQL. What the form submits does not
         * matter: if the collection is empty, this is the owner.
         */
        beforeChange: [
            async ({ req, operation, data }) => {
                if (operation !== "create") return data;

                const { totalDocs } = await req.payload.count({ collection: "users" });
                return totalDocs === 0 ? { ...data, role: "admin" } : data;
            },
        ],

        /**
         * Deleting the last administrator locks everyone out of the admin
         * panel permanently — there is no recovery path that does not involve
         * SQL. An admin removing their own account while it is the only one
         * is an easy mistake to make and an expensive one to undo.
         */
        beforeDelete: [
            async ({ req, id }) => {
                const target = await req.payload.findByID({
                    collection: "users",
                    id,
                    depth: 0,
                    overrideAccess: true,
                });

                if ((target as { role?: string } | null)?.role !== "admin") return;

                const { totalDocs } = await req.payload.count({
                    collection: "users",
                    where: { role: { equals: "admin" } },
                });

                if (totalDocs <= 1) {
                    throw new Error(t.lastAdminError);
                }
            },
        ],

        /* Account changes are the ones an audit trail exists for. The password
           itself never reaches the entry — `logger.ts` strips any field whose
           name looks like a credential, before the diff is even built. */
        afterChange: [auditCollection()],
        afterDelete: [auditCollectionDelete()],
    },

    fields: [
        {
            name: "name",
            type: "text",
            label: t.name,
            required: true,
        },
        {
            name: "role",
            type: "select",
            label: t.role,
            required: true,
            defaultValue: "editor",
            /* The escalation guard. Without this an editor allowed to update
               their own record could simply set themselves to `admin`, which
               would make every rule above decorative again. */
            access: {
                create: ({ req }) => isAdmin(req.user) || !req.user,
                update: ({ req }) => isAdmin(req.user),
            },
            admin: {
                description: t.roleHelp,
            },
            options: [
                {
                    label: t.roleAdmin,
                    value: "admin",
                },
                {
                    label: t.roleEditor,
                    value: "editor",
                },
            ],
        },
    ],
};
