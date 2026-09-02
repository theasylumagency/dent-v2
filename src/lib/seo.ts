import type { Locale } from "@/i18n/config";
import type { CategorySlug } from "./services-shared";
import { cms } from "./cms";

/**
 * Page titles and meta descriptions, read from Payload's `seo` global.
 *
 * Like `clinic-info`, this global was defined, migrated and seeded but never
 * read — every `generateMetadata` took its strings straight from the
 * dictionary, so the fields in the admin did nothing. Meta text is the one
 * kind of copy a clinic genuinely does want to iterate on without a deploy:
 * it is what a patient sees in search results, and it gets rewritten far
 * more often than the page it describes.
 *
 * Every field is optional and falls back to the dictionary. An editor who
 * clears a box gets the shipped copy back, not an empty `<title>`.
 *
 * Posts are absent on purpose: they are documents with their own URL, so
 * their meta belongs on the document, and `lib/news.ts` already reads it.
 */

/** Keys match the field names in `globals/Seo.ts`. */
export type SeoRoute =
  | "home"
  | "about"
  | "services"
  | "cases"
  | "technology"
  | "news"
  | "contact";

/**
 * Category groups are camelCased in the CMS because Payload field names
 * cannot contain hyphens. Mapping here rather than at the call site keeps
 * every caller working in slugs.
 */
const categoryField: Record<CategorySlug, string> = {
  "diagnostics-planning": "diagnosticsPlanning",
  "therapy-prevention": "therapyPrevention",
  "surgery-implantation": "surgeryImplantation",
  orthodontics: "orthodontics",
  aesthetic: "aesthetic",
};

export type Meta = { title: string; description: string };

type MetaGroup = { title?: string | null; description?: string | null } | null | undefined;

type SeoDoc = Partial<Record<SeoRoute, MetaGroup>> & {
  categories?: Record<string, MetaGroup> | null;
};

function resolve(group: MetaGroup, fallback: Meta): Meta {
  const title = typeof group?.title === "string" ? group.title.trim() : "";
  const description = typeof group?.description === "string" ? group.description.trim() : "";
  return {
    title: title || fallback.title,
    description: description || fallback.description,
  };
}

async function seoDoc(lang: Locale): Promise<SeoDoc> {
  const payload = await cms();
  /* Through `unknown`, as in `lib/clinic.ts`: an unsaved global comes back
     empty regardless of what the generated type promises, and `categories`
     is read by key rather than by field name. */
  return (await payload.findGlobal({ slug: "seo", locale: lang, depth: 0 })) as unknown as SeoDoc;
}

export async function getSeo(route: SeoRoute, lang: Locale, fallback: Meta): Promise<Meta> {
  const doc = await seoDoc(lang);
  return resolve(doc[route], fallback);
}

export async function getCategorySeo(
  slug: CategorySlug,
  lang: Locale,
  fallback: Meta,
): Promise<Meta> {
  const doc = await seoDoc(lang);
  return resolve(doc.categories?.[categoryField[slug]], fallback);
}
