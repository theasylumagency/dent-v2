import type { MetadataRoute } from "next";

import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { brandIcons, site } from "@/lib/site";

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
    /* The two PNG sizes support installation and splash screens. The
       maskable variant keeps the wordmark inside Android's circular safe area. */
    icons: [
      {
        src: brandIcons.svg,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: brandIcons.png192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIcons.png512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandIcons.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
