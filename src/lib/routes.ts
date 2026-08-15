/**
 * Route readiness lives in its own module so that both `nav.ts` and
 * `services.ts` can resolve hrefs without importing each other.
 *
 * Sub-pages are not built yet. While a page is `false` its links resolve to
 * the matching section on the home page, so nothing 404s. Flip a flag to
 * `true` the moment the real route lands — every link in the header, mega
 * menu, drawer, home page and footer updates from here.
 */
const routeReady = {
  /* `clinic` and `team` used to be two planned pages. They landed as one:
     a clinic page without its doctors is a mission statement with nobody
     behind it, and a doctors page without the clinic is five portraits
     with no reason to trust them. One `about` page carries both, and the
     nav went from five items to four. */
  about: true,
  services: true,
  serviceCategory: true,
  /* Individual services do not get their own URL. Sixteen thin pages built
     from one lead paragraph and five bullets would compete with each other
     for the same queries; the copy lives on the category page instead and
     `serviceHref` in `services.ts` links to the anchor there. Flip this to
     `true` only once a service has enough of its own content to stand as a
     page. */
  serviceDetail: false,
  technology: true,
  news: true,
  contact: true,
} as const;

const homeAnchor = {
  about: "#about",
  services: "#services",
  serviceCategory: "#services",
  serviceDetail: "#services",
  technology: "#technology",
  /* No news section on the home page. If the route were ever switched off
     the anchor would land at the top, which is the least wrong option. */
  news: "",
  contact: "#contact",
} as const;

const realPath = {
  about: "about",
  services: "services",
  serviceCategory: "services",
  serviceDetail: "services",
  technology: "technology",
  news: "news",
  contact: "contact",
} as const;

export type RouteKey = keyof typeof routeReady;

/** Exposed so callers can pick a fallback target rather than guess one. */
export function isRouteReady(key: RouteKey): boolean {
  return routeReady[key];
}

export function route(lang: string, key: RouteKey, slug?: string): string {
  if (!routeReady[key]) return `/${lang}${homeAnchor[key]}`;
  const base = `/${lang}/${realPath[key]}`;
  return slug ? `${base}/${slug}` : base;
}

export function homeHref(lang: string): string {
  return `/${lang}`;
}
