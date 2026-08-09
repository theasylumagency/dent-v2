import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "./routes";

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

/** Icon artwork supplied by the client (line art on off-white). */
const icons: Record<ServiceSlug, string> = {
  diagnostics: "/services/Diagnostics.webp",
  "therapy-adults": "/services/Therapy-in-Adults.webp",
  "therapy-children": "/services/Therapy-for-Children.webp",
  surgery: "/services/Surgery.webp",
  implantation: "/services/Surgery-and-Same-Day-Implantation.webp",
  periodontology: "/services/Periodontology.webp",
  orthodontics: "/services/Orthodontics.webp",
  aligners: "/services/Aligners.webp",
  veneers: "/services/Ceramic-Veneers.webp",
  "digital-modelling": "/services/Digital-Modelling.webp",
  forestadent: "/services/FORESTADENT-Braces.webp",
  damon: "/services/Damon-Braces.webp",
  whitening: "/services/Teeth-Whitening.webp",
  tomography: "/services/Tomography.webp",
  restoration: "/services/Aesthetic-dental-restoration.webp",
  visiograph: "/services/Viziography.webp",
};

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

/** Category artwork, picked from the same line-art set. */
const categoryIcons: Record<CategorySlug, string> = {
  "diagnostics-planning": "/services/Diagnostics.webp",
  "therapy-prevention": "/services/Therapy-in-Adults.webp",
  "surgery-implantation": "/services/Implantology.webp",
  orthodontics: "/services/Orthodontics.webp",
  aesthetic: "/services/Aesthetic-Dentistry.webp",
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

export type ServiceCategory = {
  slug: CategorySlug;
  title: string;
  blurb: string;
  icon: string;
  href: string;
  items: { slug: ServiceSlug; title: string; href: string }[];
};

export function getServiceCategories(dict: Dictionary, lang: string): ServiceCategory[] {
  return categoryOrder.map((slug) => ({
    slug,
    title: dict.services.categories[slug].title,
    blurb: dict.services.categories[slug].blurb,
    icon: categoryIcons[slug],
    href: route(lang, "serviceCategory", slug),
    items: categoryMembers[slug].map((child) => ({
      slug: child,
      title: dict.services.items[child].title,
      href: route(lang, "serviceDetail", child),
    })),
  }));
}

export type Service = {
  slug: ServiceSlug;
  title: string;
  blurb: string;
  icon: string;
  href: string;
};

export function getServices(dict: Dictionary, lang: string): Service[] {
  return serviceOrder.map((slug) => ({
    slug,
    title: dict.services.items[slug].title,
    blurb: dict.services.items[slug].blurb,
    icon: icons[slug],
    href: route(lang, "serviceDetail", slug),
  }));
}

export function getService(dict: Dictionary, lang: string, slug: ServiceSlug): Service {
  return {
    slug,
    title: dict.services.items[slug].title,
    blurb: dict.services.items[slug].blurb,
    icon: icons[slug],
    href: route(lang, "serviceDetail", slug),
  };
}
