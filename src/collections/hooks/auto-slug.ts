import type { CollectionBeforeValidateHook, CollectionSlug, Payload } from "payload";

import { slugify } from "@/lib/campaign-slug";

/** Georgian is the source language, so it is what a slug is derived from. */
const DEFAULT_LOCALE = "ka";

/**
 * Fill a document's slug from a title field, once.
 *
 * The pattern is `LandingPages`', generalised so doctors, equipment and posts
 * can share it. The three rules that matter are all about *not* rewriting:
 *
 *   1. **A typed slug wins.** If the editor put something in the field, it is
 *      used verbatim (trimmed). Validation still runs on it afterwards.
 *   2. **An existing slug is never regenerated.** A published URL — an anchor
 *      someone linked to, a Google result, an ad pointing at a campaign —
 *      must not break because a name was corrected. Clearing the field in the
 *      UI restores the old slug rather than minting a new one.
 *   3. **Collisions are resolved, not reported.** `-2`, `-3` … up to 50, then
 *      a timestamp suffix. An editor adding a second doctor called Nino
 *      should get a working page, not a validation error about a field they
 *      never filled in.
 *
 * `source` may be a localized field. Whichever locale is being saved produces
 * a valid Latin slug, because `slugify` transliterates Georgian and Cyrillic
 * alike; when the whole localized object arrives at once (`?locale=all` on
 * the API — never from the admin UI) the Georgian value is used.
 */
export function autoSlug(options: {
  /** The collection's own slug, for the uniqueness query. */
  collection: CollectionSlug;
  /** Field to derive from — `name`, `title`. */
  source: string;
  /** Slugs the router already owns. Only campaigns share the locale root. */
  reserved?: ReadonlySet<string>;
}): CollectionBeforeValidateHook {
  const { collection, source, reserved } = options;

  return async ({ data, originalDoc, req }) => {
    if (!data) return data;

    const typed = typeof data.slug === "string" ? data.slug.trim() : "";
    if (typed) {
      data.slug = typed;
      return data;
    }

    if (originalDoc?.slug) {
      data.slug = originalDoc.slug;
      return data;
    }

    const base = slugify(localizedString(data[source]));
    if (!base) return data;

    data.slug = await firstFreeSlug(req.payload, collection, base, originalDoc?.id, reserved);
    return data;
  };
}

/** A localized field is a string per locale, or the whole map at `locale=all`. */
function localizedString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const map = value as Record<string, unknown>;
    const picked = map[DEFAULT_LOCALE] ?? Object.values(map).find((v) => typeof v === "string");
    return typeof picked === "string" ? picked : "";
  }
  return "";
}

async function firstFreeSlug(
  payload: Payload,
  collection: CollectionSlug,
  base: string,
  ownId?: string,
  reserved?: ReadonlySet<string>,
): Promise<string> {
  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    if (reserved?.has(candidate)) continue;

    const existing = await payload.find({
      collection,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: { slug: { equals: candidate } },
    });

    const taken = existing.docs.find((doc) => String(doc.id) !== String(ownId ?? ""));
    if (!taken) return candidate;
  }

  /* Fifty collisions on one name does not deserve a nicer answer than a
     suffix that is guaranteed to be free. */
  return `${base}-${Date.now().toString(36)}`;
}
