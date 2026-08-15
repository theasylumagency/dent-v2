import type { Locale } from "@/i18n/config";
import { cms, toStrings } from "./cms";
import { route } from "./routes";
import {
  categoryOrder,
  serviceHref,
  type CategorySlug,
  type Service,
  type ServiceCategory,
} from "./services-shared";

/**
 * The service catalogue, read from Payload's `services` collection.
 *
 * Everything a client component might need — `categoryOrder`, the slug
 * guard, the types and `serviceHref` — lives in `services-shared.ts` and is
 * re-exported here so server callers keep one import. Client components must
 * import from `services-shared` directly; see the note at the top of it.
 */

export { categoryOrder, isCategorySlug, serviceHref } from "./services-shared";
export type { CategorySlug, Service, ServiceCategory } from "./services-shared";

type ServiceDoc = {
  slug: string;
  category: CategorySlug;
  title: string;
  blurb: string;
  lead?: string;
  whatsIncluded?: unknown;
};

export async function getServices(lang: Locale): Promise<Service[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "services",
    locale: lang,
    depth: 0,
    limit: 200,
    sort: "order",
  });

  return (result.docs as unknown as ServiceDoc[]).map((doc) => ({
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    blurb: doc.blurb,
    lead: doc.lead ?? "",
    whatsIncluded: toStrings(doc.whatsIncluded),
    href: serviceHref(lang, doc.slug, doc.category),
  }));
}

/**
 * `categoryCopy` comes from the dictionaries — the direction headings are UI
 * structure, not editable content.
 */
export async function getServiceCategories(
  categoryCopy: Record<CategorySlug, { title: string; blurb: string; lead: string }>,
  lang: Locale,
): Promise<ServiceCategory[]> {
  const services = await getServices(lang);

  return categoryOrder
    .map((slug) => ({
      slug,
      title: categoryCopy[slug].title,
      blurb: categoryCopy[slug].blurb,
      lead: categoryCopy[slug].lead,
      href: route(lang, "serviceCategory", slug),
      items: services.filter((service) => service.category === slug),
    }))
    /* A direction with no services left renders a heading over nothing. The
       list is an editor's now, so this is handled rather than asserted. */
    .filter((category) => category.items.length > 0);
}

export async function getServiceCount(): Promise<number> {
  const payload = await cms();
  const result = await payload.count({ collection: "services" });
  return result.totalDocs;
}
