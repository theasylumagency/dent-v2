import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";

import type { Block } from "./news-shared";

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

/* --------------------------------------------------------------------------
   Lexical → plain blocks

   The pages render a simple `{ type, text }[]`, which is all the current
   design needs: paragraphs and one level of heading. Converting here rather
   than teaching every component to walk a Lexical tree keeps the rich text
   format an implementation detail of the CMS layer — if Payload's editor
   changes shape, this function changes and nothing else does.

   Anything unrecognised is dropped rather than rendered raw. A stray node
   type should show up as missing text in review, not as `[object Object]`
   on a patient-facing page.
   -------------------------------------------------------------------------- */

type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
};

function textOf(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(textOf).join("");
}

export function toBlocks(richText: unknown): Block[] {
  const root = (richText as { root?: LexicalNode } | null | undefined)?.root;
  if (!root?.children) return [];

  return root.children
    .map((node): Block | null => {
      const text = textOf(node).trim();
      if (!text) return null;

      if (node.type === "heading") return { type: "h2", text };
      if (node.type === "paragraph") return { type: "p", text };
      return null;
    })
    .filter((block): block is Block => block !== null);
}

/** Payload array fields come back as rows; the pages want plain strings. */
export function toStrings(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => (row && typeof row === "object" ? String((row as { text?: unknown }).text ?? "") : ""))
    .filter(Boolean);
}

/**
 * An upload field is either an id or a populated document, depending on
 * depth. Callers want a URL either way, and a missing image should not throw
 * — the alternative is a page that fails to render because someone deleted a
 * photo in the admin.
 */
export function mediaUrl(value: unknown): string {
  if (value && typeof value === "object" && "url" in value) {
    return String((value as { url?: unknown }).url ?? "");
  }
  return "";
}

export function mediaAlt(value: unknown, fallback = ""): string {
  if (value && typeof value === "object" && "alt" in value) {
    return String((value as { alt?: unknown }).alt ?? fallback);
  }
  return fallback;
}
