import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

/**
 * Assets under `public/` that are worth caching, listed as one alternation so
 * the rule stays a single `source` entry.
 *
 * `media` is the hero footage and its poster; the rest are photography. All of
 * them were being served with `cache-control: public, max-age=0` — Next's
 * default for `public/` — which meant a returning visitor re-downloaded the
 * interior shots, every doctor's portrait and, on iOS, a multi-megabyte video
 * that had not changed.
 */
const CACHEABLE_PUBLIC_DIRS = "media|interior|images|brand|doctors|equipment|services|placeholder";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Ship the stylesheet as a `<style>` block in the document instead of a
     * `<link>`.
     *
     * The measurement that motivated this: on a warm HTTP/2 connection the
     * hero poster finished downloading at 527 ms and then did nothing until
     * 939 ms, because a render-blocking stylesheet has to parse before
     * anything paints. Four hundred milliseconds of the LCP was one 17 KB
     * request's round trip.
     *
     * Next's own guidance points here for exactly this shape of site:
     * Tailwind keeps the sheet small and roughly constant regardless of how
     * much UI is added, so inlining buys the round trip without meaningfully
     * bloating the HTML.
     *
     * The trade is real and worth stating: inlined CSS cannot be cached
     * separately, so a returning visitor re-downloads it with every page.
     * Taken knowingly — this is a clinic's marketing site where first-time
     * visitors are the traffic that matters, and the HTML is gzipped
     * anyway. If analytics ever show heavy repeat visitation, this is the
     * first flag to reconsider.
     *
     * Flagged experimental in this version of Next. Verify the `<style>`
     * block actually appears in the built HTML after upgrading.
     */
    inlineCss: true,
  },

  async headers() {
    return [
      {
        source: `/:dir(${CACHEABLE_PUBLIC_DIRS})/:path*`,
        headers: [
          {
            key: "Cache-Control",
            /**
             * Thirty days, and deliberately **not** `immutable`.
             *
             * These filenames carry no content hash — `hero-wide.mp4` and
             * `nino-osadze.webp` are stable names for whatever is currently
             * behind them. `immutable` tells the browser never to revalidate
             * for the lifetime of the entry, so replacing a photo without
             * renaming it would leave existing visitors pinned to the old one
             * with no way to recover short of a hard reload.
             *
             * `/_next/static/*` is the opposite case and Next already marks it
             * `immutable` on its own: those names are hashed, so a change is
             * always a new URL.
             *
             * If a shot ever does need to change inside the window, rename it.
             * That is the versioning mechanism here.
             */
            value: "public, max-age=2592000",
          },
        ],
      },
    ];
  },
};

/* Compression note, for whoever gets to the nginx side:
   `compress` is left at its default (true), so Next gzips its own responses.
   Do not set it to false in the hope of getting brotli until brotli is
   actually confirmed working in nginx — dropping Next's gzip first would
   leave the site serving 320 KB of uncompressed HTML in the gap. */

export default withPayload(nextConfig);
