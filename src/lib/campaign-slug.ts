/**
 * Campaign slugs live at the root of a locale — `/ka/veneers-2026` — so they
 * share a namespace with the real site routes. Two things follow, and both
 * live here so the CMS and the router agree on them:
 *
 *   1. A slug may never collide with an existing path segment. Next resolves
 *      a static segment before a dynamic one, so a campaign called `services`
 *      would keep serving the services page and simply never appear — a silent
 *      failure an editor has no way to diagnose. The list below turns it into
 *      a validation error at the moment the slug is typed.
 *
 *   2. The slug has to be typeable into an ad platform, so it is ASCII. The
 *      transliteration table exists so an editor can name a campaign in
 *      Georgian and still get a usable URL without inventing one by hand.
 */

/** Path segments the router already owns, plus the ones Next and Payload own. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  /* Locale prefixes — `/ka/en` would resolve, but reads like a broken link. */
  "ka",
  "en",
  "ru",

  /* Real pages. Keep in step with `src/app/[lang]/(site)`. */
  "about",
  "services",
  "technology",
  "news",
  "contact",

  /* Framework, CMS and static asset folders. These never reach this route —
     the proxy matcher excludes them — but reserving them keeps the admin
     honest rather than letting an editor create a page that cannot load. */
  "admin",
  "api",
  "lp",
  "_next",
  "media",
  "brand",
  "images",
  "interior",
  "doctors",
  "equipment",
  "placeholder",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "favicon.ico",
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Georgian to Latin, following the national transliteration standard. */
const GEORGIAN_TO_LATIN: Record<string, string> = {
  "ა": "a", "ბ": "b", "გ": "g", "დ": "d",
  "ე": "e", "ვ": "v", "ზ": "z", "თ": "t",
  "ი": "i", "კ": "k", "ლ": "l", "მ": "m",
  "ნ": "n", "ო": "o", "პ": "p", "ჟ": "zh",
  "რ": "r", "ს": "s", "ტ": "t", "უ": "u",
  "ფ": "p", "ქ": "k", "ღ": "gh", "ყ": "q",
  "შ": "sh", "ჩ": "ch", "ც": "ts", "ძ": "dz",
  "წ": "ts", "ჭ": "ch", "ხ": "kh", "ჯ": "j",
  "ჰ": "h",
};

/** Cyrillic to Latin, so a Russian campaign name also produces a URL. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "g",
  "д": "d", "е": "e", "ё": "e", "ж": "zh",
  "з": "z", "и": "i", "й": "i", "к": "k",
  "л": "l", "м": "m", "н": "n", "о": "o",
  "п": "p", "р": "r", "с": "s", "т": "t",
  "у": "u", "ф": "f", "х": "kh", "ц": "ts",
  "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "",
  "ы": "y", "ь": "", "э": "e", "ю": "yu",
  "я": "ya",
};

/**
 * Turn any campaign name into a URL segment. Returns "" when nothing
 * transliterable survives, which callers treat as "ask the editor".
 */
export function slugify(input: string): string {
  const lower = input.trim().toLowerCase();

  let out = "";
  for (const char of lower) {
    out += GEORGIAN_TO_LATIN[char] ?? CYRILLIC_TO_LATIN[char] ?? char;
  }

  return out
    /* Strip diacritics so "café" becomes "cafe" rather than "caf". */
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

/** The public path a campaign is served from. One definition, several callers. */
export function campaignPath(locale: string, slug: string): string {
  return `/${locale}/${slug}`;
}
