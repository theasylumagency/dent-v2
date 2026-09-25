import { isRouteReady, route } from "./routes";

/**
 * The parts of the service module that are safe in a client bundle.
 *
 * Same split, same reason as `news-shared.ts`: `BookingForm` is a client
 * component and needs `categoryOrder` to build its subject dropdown. If that
 * comes from `lib/services.ts` — which imports the Payload client — the
 * bundler follows the module graph and drags the server SDK into the browser
 * build, where it fails on `fs`.
 *
 * Note that a `import type { ... }` is fine either way, because TypeScript
 * erases it entirely and no module edge survives. It is the *value* imports
 * that have to come from here.
 */

/**
 * The five clinical directions.
 *
 * Declared in code rather than in the CMS on purpose. They are the site's
 * information architecture — each has a URL, an icon and a page layout — so
 * adding a sixth means a slug that matches an icon and a category page that
 * knows about it. That is a commit, not a button in the admin panel. The
 * services inside them, which are what actually change, live in Payload.
 */
export const categoryOrder = [
  "diagnostics-planning",
  "therapy-prevention",
  "surgery-implantation",
  "orthodontics",
  "aesthetic",
] as const;

export type CategorySlug = (typeof categoryOrder)[number];

export function isCategorySlug(value: string): value is CategorySlug {
  return (categoryOrder as readonly string[]).includes(value);
}

export type Service = {
  slug: string;
  category: CategorySlug;
  title: string;
  blurb: string;
  lead: string;
  whatsIncluded: string[];
  href: string;
};

export type ServiceCategory = {
  slug: CategorySlug;
  title: string;
  blurb: string;
  lead: string;
  href: string;
  items: Service[];
};

/**
 * Where a single service points.
 *
 * Individual services have no URL of their own — sixteen thin pages built
 * from one paragraph would compete with each other for the same queries — so
 * the link goes to the anchor on its category page.
 */
export function serviceHref(lang: string, slug: string, category: CategorySlug): string {
  if (isRouteReady("serviceCategory")) {
    return `${route(lang, "serviceCategory", category)}#${slug}`;
  }
  return route(lang, "services");
}
