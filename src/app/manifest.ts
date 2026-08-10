import type { MetadataRoute } from "next";

import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { site } from "@/lib/site";

/**
 * Web app manifest.
 *
 * Single-locale by nature — a manifest has no notion of hreflang — so it
 * describes the site in the default locale and starts at `/ka`. Visitors
 * in other languages still land correctly: `proxy.ts` only redirects bare
 * `/`, and their own hreflang entry points at their locale.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const dict = await getDictionary(defaultLocale);

  return {
    name: dict.meta.title,
    short_name: site.name,
    description: dict.meta.description,
    start_url: `/${defaultLocale}`,
    scope: "/",
    display: "standalone",
    background_color: "#fbf7f1",
    theme_color: "#fbf7f1",
    lang: defaultLocale,
    categories: ["health", "medical"],
    icons: [
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
