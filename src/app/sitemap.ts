import type { MetadataRoute } from "next";

import { htmlLang, locales } from "@/i18n/config";
import { cms } from "@/lib/cms";
import { getPostIndex } from "@/lib/news";
import { getDoctorIndex } from "@/lib/team";
import { getIndexableLandingPages } from "@/lib/landing-pages";
import { categoryOrder } from "@/lib/services-shared";
import { site } from "@/lib/site";

/**
 * One entry per locale per page, each carrying the full alternates set so
 * search engines treat the three translations as one page rather than as
 * duplicates.
 *
 * Paths are derived from the same `categoryOrder` the routes are built
 * from, so a new clinical direction cannot land in the navigation and go
 * missing from the sitemap.
 *
 * Keep `paths` in sync with route readiness — flipping a flag in
 * `lib/routes.ts` changes site links but cannot update the sitemap itself.
 *
 * This file is a dynamic route: it queries the CMS rather than reading a
 * build-time constant, and `collections/hooks/revalidate.ts` flushes
 * `/sitemap.xml` on every document change. A new post or campaign page
 * appears here within seconds of publishing, without a deploy.
 */

/* --------------------------------------------------------------- lastmod

   Every URL used to carry `new Date()` — the moment the sitemap was
   rendered. So all forty-eight of them claimed to have changed just now,
   on every regeneration, and an article edited six months ago was
   indistinguishable from one edited this morning.

   That is not a wasted signal, it is a harmful one. Google's own guidance
   is that it ignores `lastmod` values it does not trust, and the judgement
   is made per site: one page reporting a date it cannot corroborate is
   enough to have the whole domain's `lastmod` discounted. A field that is
   always "now" is the clearest possible way to earn that.

   So each URL now reports something true. A document's URL takes the
   document's own `updatedAt`. A fixed route takes the newest `updatedAt`
   among the collections and globals that actually render on it — edit one
   doctor and `/about` moves; edit a service and `/services`, that service's
   category page and the home page move, and nothing else does.
   ----------------------------------------------------------------------- */

/** The newest `updatedAt` in a collection, or null when it is empty. */
async function latestIn(collection: "services" | "doctors" | "equipment" | "faq"): Promise<Date | null> {
  const payload = await cms();
  const result = await payload.find({
    collection,
    depth: 0,
    /* One row, newest first — the date is all this needs, and `pagination:
       false` would fetch the whole collection to read one field of it. */
    limit: 1,
    sort: "-updatedAt",
  });
  const value = result.docs[0]?.updatedAt;
  return value ? new Date(String(value)) : null;
}

/** A global's `updatedAt`. Globals never 404, but an unsaved one is empty. */
async function latestGlobal(slug: "clinic-info" | "seo"): Promise<Date | null> {
  const payload = await cms();
  const doc = (await payload.findGlobal({ slug, depth: 0 })) as { updatedAt?: unknown };
  return doc?.updatedAt ? new Date(String(doc.updatedAt)) : null;
}

/**
 * The most recent of several dates, falling back to the oldest sensible
 * value rather than to "now".
 *
 * The fallback matters: an empty collection must not make a page look
 * freshly edited. `site.launchedAt` is a fixed date in the past, so a page
 * with no CMS content behind it reports the day the site went up — which is
 * the truth about when its content last changed.
 */
function newest(...dates: (Date | null)[]): Date {
  const valid = dates.filter((date): date is Date => date instanceof Date && !isNaN(date.getTime()));
  if (!valid.length) return new Date(site.launchedAt);
  return valid.reduce((latest, date) => (date > latest ? date : latest));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Built per request rather than at module load — a new document must
     appear here without a rebuild. */
  const [posts, doctors, landingPages, services, doctorsAt, equipment, faq, clinic, seo] =
    await Promise.all([
      getPostIndex(),
      getDoctorIndex(),
      getIndexableLandingPages(),
      latestIn("services"),
      latestIn("doctors"),
      latestIn("equipment"),
      latestIn("faq"),
      latestGlobal("clinic-info"),
      latestGlobal("seo"),
    ]);

  const newestPost = newest(...posts.map((post) => new Date(post.updatedAt)));

  /* `seo` is in every row: the meta title and description are what the
     search result itself says, so editing them changes the page as far as
     a search engine is concerned even when no visible copy moved. */
  const lastModFor = (path: string): Date => {
    if (path === "") return newest(services, doctorsAt, equipment, faq, clinic, seo);
    if (path === "/about") return newest(doctorsAt, clinic, seo);
    if (path === "/services") return newest(services, seo);
    if (path.startsWith("/services/")) return newest(services, seo);
    if (path === "/technology") return newest(equipment, seo);
    if (path === "/news") return newest(newestPost, seo);
    if (path === "/contact") return newest(clinic, seo);
    return newest(seo);
  };

  const paths = [
    "",
    "/services",
    ...categoryOrder.map((slug) => `/services/${slug}`),
    "/technology",
    "/about",
    "/news",
    "/contact",
  ];

  const alternatesFor = (path: string) =>
    Object.fromEntries(locales.map((l) => [htmlLang[l], `${site.url}/${l}${path}`]));

  /**
   * One path, three locales.
   *
   * The home page outranks its children, and Georgian outranks the
   * translations — it is the locale the clinic actually serves.
   */
  const entriesFor = (path: string, lastModified: Date, basePriority: number) => {
    const languages = alternatesFor(path);
    return locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: basePriority * (locale === "ka" ? 1 : 0.8),
      alternates: { languages },
    }));
  };

  return [
    ...paths.flatMap((path) => entriesFor(path, lastModFor(path), path === "" ? 1 : 0.8)),

    /* Documents with a URL of their own carry their own date. */
    ...posts.flatMap((post) =>
      entriesFor(`/news/${post.slug}`, newest(new Date(post.updatedAt)), 0.8),
    ),
    ...doctors.flatMap((doctor) =>
      entriesFor(`/about/${doctor.slug}`, newest(new Date(doctor.updatedAt)), 0.7),
    ),
    ...landingPages.flatMap((campaign) =>
      entriesFor(`/${campaign.slug}`, newest(new Date(campaign.updatedAt)), 0.7),
    ),
  ];
}
