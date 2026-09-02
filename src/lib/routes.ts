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
  /* A doctor's own page, under the about page rather than beside it: the
     about page *is* the team index — it lists every doctor — so there is no
     second index to build and the breadcrumb reads as the hierarchy it
     actually is. The anchors it used to be (`/ka/about#archil-apkhadze`)
     still exist and still work; the page is what a search for a doctor by
     name can land on, which an anchor cannot be. */
  doctor: true,
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
  /* The clinical-cases page.

     **This is the launch switch, and it is the only one.** The page, the
     collection, the home page teaser and the header entry are all built and
     tested; the clinic has not supplied the cases yet, so nothing about them
     is shown. Flipping this to `true` restores, in one word:

       - the header nav entry            (`nav.ts` drops unready routes)
       - the home page teaser section    (`app/[lang]/(site)/page.tsx`)
       - the `/cases` URL in the sitemap (`app/sitemap.ts`)
       - and every `route(lang, "cases")` link, which until then resolves
         to `#cases` rather than to a 404

     The page itself stays reachable at `/ka/cases` while this is `false`, so
     it can be looked at — it is simply unlinked and, per its own
     `generateMetadata`, `noindex` until this flips. Commented-out code was
     the alternative and it is worse: five edits to undo instead of one, and
     four of them easy to forget. */
  cases: false,
  news: true,
  contact: true,
} as const;

const homeAnchor = {
  about: "#about",
  doctor: "#team",
  services: "#services",
  serviceCategory: "#services",
  serviceDetail: "#services",
  technology: "#technology",
  cases: "#cases",
  /* No news section on the home page. If the route were ever switched off
     the anchor would land at the top, which is the least wrong option. */
  news: "",
  contact: "#contact",
} as const;

const realPath = {
  about: "about",
  doctor: "about",
  services: "services",
  serviceCategory: "services",
  serviceDetail: "services",
  technology: "technology",
  cases: "cases",
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
