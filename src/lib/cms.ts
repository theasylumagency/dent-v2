import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";

/* The Lexical converter moved to `rich-text.ts` — it is pure, it has
   nothing to do with the Payload client, and keeping it out of a module
   that imports `server-only` is what makes it unit-testable. Re-exported
   here so the data modules keep importing it alongside `cms`. */
export { toBlocks } from "./rich-text";
export { mediaUrl } from "./media";

/**
 * The Payload client, shared by every data module.
 *
 * No caching layer is wrapped around this on purpose. Every page that reads
 * it is statically generated, so these queries run at build time and again
 * only when a collection hook calls `revalidatePath`. Adding `unstable_cache`
 * on top would be a second cache in front of a cache, with its own
 * invalidation to get wrong.
 */
export const cms = async () => getPayload({ config });

/** Payload array fields come back as rows; the pages want plain strings. */
export function toStrings(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => (row && typeof row === "object" ? String((row as { text?: unknown }).text ?? "") : ""))
    .filter(Boolean);
}

export function mediaAlt(value: unknown, fallback = ""): string {
  if (value && typeof value === "object" && "alt" in value) {
    return String((value as { alt?: unknown }).alt ?? fallback);
  }
  return fallback;
}
