import type { Locale } from "@/i18n/config";

/**
 * The parts of the news module that are safe in a client bundle: types, the
 * category list, and date formatting. No imports from `cms.ts`, and nothing
 * that reaches Payload.
 *
 * This split is not cosmetic. `NewsList` is a client component and renders
 * `PostCard`, which needs the `Post` type and `formatPostDate`. If those come
 * from `lib/news.ts` — which imports the Payload client — the bundler follows
 * the module graph and drags the whole server SDK into the browser build,
 * where it fails on `fs`. Types are erased at compile time; the import that
 * carried them is not.
 *
 * Rule of thumb for anything added here later: if a client component needs
 * it, it belongs in this file, not in the module that queries the CMS.
 */

export const postCategories = ["clinic", "guide"] as const;
export type PostCategory = (typeof postCategories)[number];

/* The rich text shape moved to `lib/rich-text.ts` — it is shared with
   doctors and equipment, which have nothing to do with news, and it grew
   past a one-line type. Re-exported here so the components that render a
   post keep importing everything from one place. */
import type { Block } from "./rich-text";
export type { Block, Inline } from "./rich-text";

export type Post = {
  slug: string;
  category: PostCategory;
  publishedAt: string;
  cover: string;
  coverAlt: string;
  href: string;
  title: string;
  excerpt: string;
  body: Block[];
  /**
   * The search listing, when the editor wants it to differ from the title
   * and excerpt above. Empty means "use those", which is usually right.
   */
  metaTitle: string;
  metaDescription: string;
  /** Last edit, for `<lastmod>` and `dateModified`. ISO 8601. */
  updatedAt: string;
  /** True when this locale has no translation and Georgian is being shown. */
  isFallback: boolean;
};

export function formatPostDate(iso: string, lang: Locale): string {
  const localeTag = { ka: "ka-GE", en: "en-GB", ru: "ru-RU" }[lang];
  return new Date(iso).toLocaleDateString(localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
