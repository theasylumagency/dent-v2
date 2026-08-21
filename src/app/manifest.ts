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
    /* Chrome will not offer "Add to Home Screen" on an SVG alone: the
       install criteria require a raster icon of at least 192px, and the
       splash screen is drawn from the 512px one. The SVG stays first so
       anything that can scale it does.

       The maskable entry is a separate file, not the same PNG relabelled:
       Android crops maskable icons to whatever shape the launcher uses, so
       it is drawn full-bleed with the tooth inside the 80% safe zone. Reuse
       the rounded-square icon here and the corners get shaved off. */
    icons: [
      {
        src: "/brand/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
