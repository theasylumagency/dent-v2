import type { Dictionary } from "@/i18n/dictionaries";
import { isRouteReady, route } from "./routes";

/** Order matches the service list on the current Total Charm site. */
export const serviceOrder = [
  "diagnostics",
  "therapy-adults",
  "therapy-children",
  "surgery",
  "implantation",
  "periodontology",
  "orthodontics",
  "aligners",
  "veneers",
  "digital-modelling",
  "forestadent",
  "damon",
  "whitening",
  "tomography",
  "restoration",
  "visiograph",
] as const;

export type ServiceSlug = (typeof serviceOrder)[number];

/* Icons are no longer file paths. Every slug below has a matching entry in
   `components/ui/ServiceIcons.tsx`, rendered inline so it can inherit
   colour from CSS — see the note at the top of that file for why the
   supplied illustration set was retired from this size. */

/* --------------------------------------------------------------------------
   Five clinical directions.

   The home page leads with these rather than all 16 services — the full list
   belongs on the services page. Every one of the 16 slugs above appears in
   exactly one category; `assertCategoriesCoverEveryService` below is what
   keeps that true if someone adds a service later.
   -------------------------------------------------------------------------- */

export const categoryOrder = [
  "diagnostics-planning",
  "therapy-prevention",
  "surgery-implantation",
  "orthodontics",
  "aesthetic",
] as const;

export type CategorySlug = (typeof categoryOrder)[number];

const categoryMembers: Record<CategorySlug, readonly ServiceSlug[]> = {
  "diagnostics-planning": ["diagnostics", "tomography", "visiograph", "digital-modelling"],
  "therapy-prevention": ["therapy-adults", "therapy-children", "periodontology"],
  "surgery-implantation": ["surgery", "implantation"],
  orthodontics: ["orthodontics", "aligners", "forestadent", "damon"],
  aesthetic: ["veneers", "restoration", "whitening"],
};

/**
 * Fails loudly at module load if a service is orphaned or double-counted,
 * so a new entry in `serviceOrder` can never silently vanish from the home
 * page and the mega menu.
 */
function assertCategoriesCoverEveryService() {
  const seen = new Set<ServiceSlug>();
  for (const slugs of Object.values(categoryMembers)) {
    for (const slug of slugs) {
      if (seen.has(slug)) throw new Error(`Service "${slug}" is in more than one category.`);
      seen.add(slug);
    }
  }
  const orphans = serviceOrder.filter((slug) => !seen.has(slug));
  if (orphans.length) {
    throw new Error(`Services missing from every category: ${orphans.join(", ")}`);
  }
}

assertCategoriesCoverEveryService();

/**
 * Reverse index, built once at module load. Safe to assert as total:
 * `assertCategoriesCoverEveryService` above has already thrown if any slug
 * were missing or duplicated, so by the time this runs every service has
 * exactly one category.
 */
const categoryOfService = (() => {
  const index = {} as Record<ServiceSlug, CategorySlug>;
  for (const category of categoryOrder) {
    for (const slug of categoryMembers[category]) index[slug] = category;
  }
  return index;
})();

export function categoryOf(slug: ServiceSlug): CategorySlug {
  return categoryOfService[slug];
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (categoryOrder as readonly string[]).includes(value);
}

/**
 * Where a single service points.
 *
 * While `serviceDetail` is unbuilt the copy for a service lives in the
 * `#slug` block of its category page, so the link goes there rather than
 * dumping the visitor at the top of a page and asking them to hunt. The
 * home-page anchor stays as the last resort for the same reason it always
 * did: nothing should 404.
 */
export function serviceHref(lang: string, slug: ServiceSlug): string {
  if (isRouteReady("serviceDetail")) return route(lang, "serviceDetail", slug);
  if (isRouteReady("serviceCategory")) {
    return `${route(lang, "serviceCategory", categoryOfService[slug])}#${slug}`;
  }
  return route(lang, "serviceDetail", slug);
}

export type Service = {
  slug: ServiceSlug;
  title: string;
  blurb: string;
  href: string;
};

export type ServiceCategory = {
  slug: CategorySlug;
  title: string;
  blurb: string;
  href: string;
  items: Service[];
};

export function getService(dict: Dictionary, lang: string, slug: ServiceSlug): Service {
  return {
    slug,
    title: dict.services.items[slug].title,
    blurb: dict.services.items[slug].blurb,
    href: serviceHref(lang, slug),
  };
}

export function getServiceCategory(
  dict: Dictionary,
  lang: string,
  slug: CategorySlug,
): ServiceCategory {
  return {
    slug,
    title: dict.services.categories[slug].title,
    blurb: dict.services.categories[slug].blurb,
    href: route(lang, "serviceCategory", slug),
    items: categoryMembers[slug].map((child) => getService(dict, lang, child)),
  };
}

export function getServiceCategories(dict: Dictionary, lang: string): ServiceCategory[] {
  return categoryOrder.map((slug) => getServiceCategory(dict, lang, slug));
}

export function getServices(dict: Dictionary, lang: string): Service[] {
  return serviceOrder.map((slug) => getService(dict, lang, slug));
}
