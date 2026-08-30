import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /* The booking endpoint accepts POST only — nothing to index, and
           no reason to spend crawl budget on it. `manual.html` is the staff
           documentation linked from the admin sidebar: it describes the
           panel, the roles and what each screen does, which is nothing a
           patient searches for and nothing worth publishing. The page also
           sets `noindex` itself — this line only saves the crawl. */
        disallow: ["/api/", "/manual.html"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
