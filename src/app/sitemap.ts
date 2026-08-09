import type { MetadataRoute } from "next";

import { htmlLang, locales } from "@/i18n/config";
import { site } from "@/lib/site";

/**
 * One entry per locale, each carrying the full alternates set so search
 * engines treat the three as translations rather than duplicates.
 *
 * TODO: extend this the moment the sub-pages land — flipping a flag in
 * `lib/routes.ts` changes every link on the site but not this file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [htmlLang[l], `${site.url}/${l}`]));

  return locales.map((locale) => ({
    url: `${site.url}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: locale === "ka" ? 1 : 0.8,
    alternates: { languages },
  }));
}
