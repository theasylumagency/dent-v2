import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { locales } from "@/i18n/config";

/**
 * On-demand revalidation.
 *
 * Payload and Next run in the same process on the VPS, so a collection
 * hook can call `revalidatePath` directly — no webhook, no deploy hook, no
 * HTTP round trip. Pages stay statically generated and an editor pressing
 * "Publish" sees the change within seconds.
 *
 * Paths are revalidated for every locale because a single document carries
 * all three translations; publishing once must refresh `/ka/...`,
 * `/en/...` and `/ru/...` alike.
 *
 * `paths` takes the locale-relative part ("/news", "" for the home page).
 * A function form is for collections whose document has its own URL — the
 * slug is only known per document.
 */
type PathsFor = (doc: Record<string, unknown>) => string[];

let warnedOutsideNext = false;

/**
 * `revalidatePath` needs Next's static-generation store, which exists when a
 * hook runs inside the server — from the admin panel, or from an API call —
 * and does not exist when Payload is driven from a CLI script such as
 * `scripts/seed.ts`.
 *
 * Outside the server there is also nothing to revalidate: no rendered cache
 * is being served by that process. So swallowing the error is correct rather
 * than merely convenient. It is logged once so a real misconfiguration in
 * production does not pass unnoticed.
 */
function safeRevalidate(target: string) {
  try {
    revalidatePath(target);
  } catch {
    if (!warnedOutsideNext) {
      warnedOutsideNext = true;
      console.warn(
        "[revalidate] no Next.js context — skipping cache revalidation. Expected when running a script; unexpected in the running server.",
      );
    }
  }
}

function revalidateFor(paths: string[] | PathsFor) {
  return (doc: Record<string, unknown>) => {
    const list = typeof paths === "function" ? paths(doc) : paths;

    for (const locale of locales) {
      for (const path of list) {
        safeRevalidate(`/${locale}${path}`);
      }
    }

    /* The sitemap lists every post URL, so it goes stale the moment a
       document is created or deleted. It is cheap to regenerate. */
    safeRevalidate("/sitemap.xml");
  };
}

export function afterChangeRevalidate(paths: string[] | PathsFor): CollectionAfterChangeHook {
  const run = revalidateFor(paths);

  return ({ doc, previousDoc }) => {
    run(doc as Record<string, unknown>);

    /* If the slug changed, the old URL needs flushing too — otherwise the
       previous path keeps serving a page that no longer exists. */
    if (previousDoc && (previousDoc as { slug?: string }).slug !== (doc as { slug?: string }).slug) {
      run(previousDoc as Record<string, unknown>);
    }

    return doc;
  };
}

export function afterDeleteRevalidate(paths: string[] | PathsFor): CollectionAfterDeleteHook {
  const run = revalidateFor(paths);

  return ({ doc }) => {
    run(doc as Record<string, unknown>);
    return doc;
  };
}
