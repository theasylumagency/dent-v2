import type { MetadataRoute } from "next";

import { htmlLang, locales } from "@/i18n/config";
import { getPostSlugs } from "@/lib/news";
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
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  /* Post URLs come from the CMS, so this list is built per request rather
     than at module load — a new post must appear here without a rebuild. */
  const [postSlugs, landingPages] = await Promise.all([
    getPostSlugs(),
    getIndexableLandingPages(),
  ]);

  const paths = [
    "",
    "/services",
    ...categoryOrder.map((slug) => `/services/${slug}`),
    "/technology",
    "/about",
    "/news",
    "/contact",
    ...postSlugs.map((slug) => `/news/${slug}`),
  ];

  const siteEntries = paths.flatMap((path) => {
    const languages = Object.fromEntries(
      locales.map((l) => [htmlLang[l], `${site.url}/${l}${path}`]),
    );

    return locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      /* The home page outranks its children, and Georgian outranks the
         translations — it is the locale the clinic actually serves. */
      priority: (path === "" ? 1 : 0.8) * (locale === "ka" ? 1 : 0.8),
      alternates: { languages },
    }));
  });

  const campaignEntries = landingPages.flatMap((campaign) => {
    const path = `/${campaign.slug}`;
    const languages = Object.fromEntries(
      locales.map((locale) => [htmlLang[locale], `${site.url}/${locale}${path}`]),
    );

    return locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: new Date(campaign.updatedAt),
      changeFrequency: "monthly" as const,
      priority: locale === "ka" ? 0.7 : 0.56,
      alternates: { languages },
    }));
  });

  return [...siteEntries, ...campaignEntries];
}
