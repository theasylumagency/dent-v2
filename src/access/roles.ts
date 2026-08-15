/**
 * Role helpers for access control.
 *
 * The `role` field on `users` existed for a while without anything reading it:
 * Payload's default access for an authenticated collection is "any logged-in
 * user", so an editor could create accounts, delete the owner's account and
 * promote themselves. The field described a permission model that was not
 * enforced anywhere.
 *
 * Kept in its own module because content collections will want `isAdmin` too
 * the first time something needs to be admin-only.
 */

/** Shaped by hand so this does not depend on generated types. */
export type MaybeUser = { role?: string | null } | null | undefined;

export function isAdmin(user: MaybeUser): boolean {
  return user?.role === "admin";
}
