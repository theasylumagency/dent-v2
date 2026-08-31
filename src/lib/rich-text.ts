import type { Locale } from "@/i18n/config";

/**
 * The shape the pages render rich text as.
 *
 * Client-safe by construction — types and one pure helper, no import of
 * `cms.ts` and nothing that reaches Payload. The same rule that governs
 * `news-shared.ts` applies here: `DeviceCard` and the profile components
 * are client components, and an import that drags the Payload SDK into the
 * browser build fails on `fs`.
 *
 * **Why a shape of our own rather than Payload's `RichText` converter.**
 * Every heading on this site is sized and spaced by the page it sits on,
 * and the outline is load-bearing: an editor writing a subheading inside a
 * doctor's bio must not produce a tag that outranks the doctor's own name.
 * Converting to this intermediate shape lets `RichText` decide the actual
 * tag from context, which the official converter cannot do — it emits the
 * tag the editor picked, wherever the field happens to be rendered.
 */

/** Lexical's format bitmask. Only the two we render are named. */
export const FORMAT_BOLD = 1;
export const FORMAT_ITALIC = 2;

export type Inline =
  | { kind: "text"; text: string; bold?: true; italic?: true }
  | { kind: "link"; text: string; href: string; external?: true };

/**
 * `h2` and `h3` are the editor's own choice, not the tag that gets
 * rendered. `RichText` shifts them to sit under whatever heading the
 * surrounding page already has — see `baseLevel` there.
 *
 * The editor is restricted to these two in `payload.config.ts`. Anything
 * outside the range is clamped rather than dropped, so rich text written
 * before that restriction still renders.
 */
export type TextBlock = { type: "p" | "h2" | "h3"; content: Inline[] };
export type ListBlock = { type: "ul" | "ol"; items: Inline[][] };
export type Block = TextBlock | ListBlock;

export function isList(block: Block): block is ListBlock {
  return block.type === "ul" || block.type === "ol";
}

/** Flattens a block back to plain text — for excerpts, alt text and keys. */
export function blockText(block: Block): string {
  const runs: Inline[] = isList(block) ? block.items.flat() : block.content;
  return runs.map((run) => run.text).join("");
}

/**
 * An internal link's destination.
 *
 * Payload stores internal links as a relationship, so the URL has to be
 * rebuilt from the collection and the document's slug. Only the two
 * collections with a public URL of their own are resolvable; a link to
 * anything else has nowhere to point and is rendered as plain text rather
 * than as an anchor to a page that does not exist.
 */
export function internalHref(
  relationTo: string,
  slug: string,
  lang: Locale,
): string | null {
  if (relationTo === "posts") return `/${lang}/news/${slug}`;
  if (relationTo === "doctors") return `/${lang}/about/${slug}`;
  return null;
}

/* --------------------------------------------------------------------------
   Lexical → blocks

   Converting here rather than teaching every component to walk a Lexical
   tree keeps the rich text format an implementation detail of the CMS
   layer — if Payload's editor changes shape, this function changes and
   nothing else does.

   **This used to lose most of what an editor typed.** It recognised
   `heading` and `paragraph` only, flattened every heading to one level
   regardless of the size chosen, and returned plain strings. So a bulleted
   list, a link or a bold phrase was saved, shown in the editor's preview,
   and then silently absent from the page — the worst kind of CMS bug,
   because nothing anywhere reports it. Lists, links and bold/italic now
   survive, and a heading keeps the level it was given.

   The editor is restricted to exactly what this function handles
   (`payload.config.ts`). That pairing is the point: a button in the toolbar
   is a promise that the thing appears on the page, so the toolbar must not
   offer anything this function would drop. Adding a feature there means
   adding a case here, and the reverse.
   -------------------------------------------------------------------------- */

type LexicalNode = {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  listType?: string;
  children?: LexicalNode[];
  fields?: {
    linkType?: string;
    url?: string;
    newTab?: boolean;
    doc?: { relationTo?: string; value?: unknown } | null;
  };
};

/** Adjacent runs with identical formatting, merged — one `<strong>`, not five. */
function pushRun(runs: Inline[], run: Inline) {
  const last = runs[runs.length - 1];
  if (
    last &&
    last.kind === "text" &&
    run.kind === "text" &&
    last.bold === run.bold &&
    last.italic === run.italic
  ) {
    last.text += run.text;
    return;
  }
  runs.push(run);
}

/** A link's slug, whether Payload returned an id or a populated document. */
function docSlug(value: unknown): string | null {
  if (value && typeof value === "object" && "slug" in value) {
    const slug = (value as { slug?: unknown }).slug;
    return typeof slug === "string" && slug ? slug : null;
  }
  return null;
}

function collectInline(nodes: LexicalNode[], lang: Locale, into: Inline[] = []): Inline[] {
  for (const node of nodes) {
    if (node.type === "linebreak") {
      pushRun(into, { kind: "text", text: " " });
      continue;
    }

    if (node.type === "link" || node.type === "autolink") {
      const text = plainText(node);
      if (!text) continue;

      const fields = node.fields ?? {};
      let href: string | null = null;
      let external = false;

      if (fields.linkType === "internal" && fields.doc?.relationTo) {
        const slug = docSlug(fields.doc.value);
        href = slug ? internalHref(fields.doc.relationTo, slug, lang) : null;
      } else if (typeof fields.url === "string" && fields.url.trim()) {
        href = fields.url.trim();
        external = !href.startsWith("/") && !href.startsWith("#");
      }

      /* A link with nowhere to point keeps its words. Dropping the anchor
         costs a click; dropping the sentence costs the meaning. */
      if (!href) {
        pushRun(into, { kind: "text", text });
        continue;
      }

      into.push({ kind: "link", text, href, ...(external ? { external: true } : {}) });
      continue;
    }

    if (typeof node.text === "string") {
      if (!node.text) continue;
      const format = typeof node.format === "number" ? node.format : 0;
      pushRun(into, {
        kind: "text",
        text: node.text,
        ...(format & FORMAT_BOLD ? { bold: true as const } : {}),
        ...(format & FORMAT_ITALIC ? { italic: true as const } : {}),
      });
      continue;
    }

    if (node.children) collectInline(node.children, lang, into);
  }

  return into;
}

function plainText(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(plainText).join("");
}

/** Trims the leading and trailing whitespace of a run of inline nodes. */
function trimRuns(runs: Inline[]): Inline[] {
  const trimmed = runs.map((run) => ({ ...run }));
  const first = trimmed[0];
  if (first) first.text = first.text.replace(/^\s+/, "");
  const last = trimmed[trimmed.length - 1];
  if (last) last.text = last.text.replace(/\s+$/, "");
  return trimmed.filter((run) => run.text.length > 0);
}

/**
 * Lexical nests a list's items as `listitem` children, and a nested list as
 * a `list` inside a `listitem`. Only one level is rendered: the design has
 * no indented-list style, and a nested item read as a flat one is closer to
 * the author's meaning than an item that vanishes.
 */
function listItems(node: LexicalNode, lang: Locale): Inline[][] {
  return (node.children ?? [])
    .filter((child) => child.type === "listitem")
    .map((item) => trimRuns(collectInline(item.children ?? [], lang)))
    .filter((runs) => runs.length > 0);
}

export function toBlocks(richText: unknown, lang: Locale): Block[] {
  const root = (richText as { root?: LexicalNode } | null | undefined)?.root;
  if (!root?.children) return [];

  const blocks: Block[] = [];

  for (const node of root.children) {
    if (node.type === "list") {
      const items = listItems(node, lang);
      if (items.length) blocks.push({ type: node.listType === "number" ? "ol" : "ul", items });
      continue;
    }

    if (node.type === "heading" || node.type === "paragraph") {
      const content = trimRuns(collectInline(node.children ?? [], lang));
      if (!content.length) continue;

      if (node.type === "paragraph") {
        blocks.push({ type: "p", content });
        continue;
      }

      /* h1 is not offered in the editor — every page already carries
         exactly one, from its own template. Existing content that has one
         is clamped to h2 rather than dropped, and h4–h6 collapse to h3:
         the design has two subheading levels, and a third would render
         identically to the second while breaking the outline. */
      const deep = node.tag === "h3" || node.tag === "h4" || node.tag === "h5" || node.tag === "h6";
      blocks.push({ type: deep ? "h3" : "h2", content });
      continue;
    }

    /* Anything unrecognised is dropped rather than rendered raw. A stray
       node type should show up as missing text in review, not as
       `[object Object]` on a patient-facing page. */
  }

  return blocks;
}
