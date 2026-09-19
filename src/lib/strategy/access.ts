import { createHash, randomBytes } from "node:crypto";
export const SESSION_COOKIE = "tcd-strategy";
export function newInvitationToken() { return randomBytes(32).toString("base64url"); }
export function validToken(token: unknown): token is string { return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token); }
export function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};
