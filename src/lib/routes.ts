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
  clinic: false,
  services: false,
  serviceCategory: false,
  serviceDetail: false,
  team: false,
  technology: false,
  contact: false,
} as const;

const homeAnchor = {
  clinic: "#clinic",
  services: "#services",
  serviceCategory: "#services",
  serviceDetail: "#services",
  team: "#team",
  technology: "#technology",
  contact: "#contact",
} as const;

const realPath = {
  clinic: "clinic",
  services: "services",
  serviceCategory: "services",
  serviceDetail: "services",
  team: "team",
  technology: "technology",
  contact: "contact",
} as const;

export type RouteKey = keyof typeof routeReady;

export function route(lang: string, key: RouteKey, slug?: string): string {
  if (!routeReady[key]) return `/${lang}${homeAnchor[key]}`;
  const base = `/${lang}/${realPath[key]}`;
  return slug ? `${base}/${slug}` : base;
}

export function homeHref(lang: string): string {
  return `/${lang}`;
}
