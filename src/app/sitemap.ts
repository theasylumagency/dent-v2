import type { MetadataRoute } from "next";

import { htmlLang, locales } from "@/i18n/config";
import { categoryOrder } from "@/lib/services";
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
 * TODO: extend `paths` as the remaining sub-pages land (clinic, team,
 * technology, contact) — flipping a flag in `lib/routes.ts` changes every
 * link on the site but not this file.
 */
const paths = ["", "/services", ...categoryOrder.map((slug) => `/services/${slug}`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return paths.flatMap((path) => {
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
}
