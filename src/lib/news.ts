import type { Locale } from "@/i18n/config";
import { cms, mediaAlt, mediaUrl, toBlocks } from "./cms";
import { postCategories, type Block, type Post, type PostCategory } from "./news-shared";
import { route } from "./routes";

/**
 * Posts — news and guides — read from Payload's `posts` collection.
 *
 * The exported shapes are unchanged from the version that held the content
 * inline, so the pages and `PostCard` did not have to be touched beyond
 * awaiting these functions. That was the point of writing the stand-in
 * module to the collection's shape in the first place.
 *
 * Georgian fallback is Payload's, not ours: `localization.fallback` is on in
 * `payload.config.ts` with `defaultLocale: "ka"`, so an untranslated post
 * comes back as Georgian rather than empty. `isFallback` is derived by
 * comparing against the Georgian title — Payload does not report whether a
 * value was translated or inherited, and the reader deserves to be told.
 */

/* Re-exported so server callers can keep importing everything from one
   place. Client components must import from `./news-shared` directly — see
   the note at the top of that file. */
export { formatPostDate, postCategories } from "./news-shared";
export type { Block, Post, PostCategory } from "./news-shared";

const FALLBACK_LOCALE: Locale = "ka";

type PostDoc = {
  slug: string;
  category: PostCategory;
  publishedAt: string;
  cover?: unknown;
  title: string;
  excerpt: string;
  body?: unknown;
};

function toPost(doc: PostDoc, lang: Locale, kaTitle: string | undefined): Post {
  return {
    slug: doc.slug,
    category: doc.category,
    /* Stored as a timestamp, rendered as a date. Trimming here keeps
       `<time dateTime>` valid and the sort stable. */
    publishedAt: String(doc.publishedAt).slice(0, 10),
    cover: mediaUrl(doc.cover),
    coverAlt: mediaAlt(doc.cover, doc.title),
    href: `${route(lang, "news")}/${doc.slug}`,
    title: doc.title,
    excerpt: doc.excerpt,
    body: toBlocks(doc.body),
    isFallback: lang !== FALLBACK_LOCALE && kaTitle !== undefined && doc.title === kaTitle,
  };
}

async function findPosts(lang: Locale) {
  const payload = await cms();

  const [localised, georgian] = await Promise.all([
    payload.find({
      collection: "posts",
      locale: lang,
      depth: 1,
      limit: 200,
      sort: "-publishedAt",
      where: { _status: { equals: "published" } },
    }),
    /* Titles only, purely to detect untranslated documents. Cheap, and it
       avoids inventing a "translated" flag the CMS does not store. */
    lang === FALLBACK_LOCALE
      ? Promise.resolve(null)
      : payload.find({
          collection: "posts",
          locale: FALLBACK_LOCALE,
          depth: 0,
          limit: 200,
          where: { _status: { equals: "published" } },
        }),
  ]);

  const kaTitles = new Map<string, string>(
    (georgian?.docs ?? []).map((doc) => [String(doc.slug), String(doc.title)]),
  );

  return (localised.docs as unknown as PostDoc[]).map((doc) =>
    toPost(doc, lang, kaTitles.get(doc.slug)),
  );
}

export async function getPosts(lang: Locale): Promise<Post[]> {
  return findPosts(lang);
}

export async function getPost(slug: string, lang: Locale): Promise<Post | null> {
  const posts = await findPosts(lang);
  return posts.find((post) => post.slug === slug) ?? null;
}

/** Drives `generateStaticParams` and the sitemap. */
export async function getPostSlugs(): Promise<string[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "posts",
    locale: FALLBACK_LOCALE,
    depth: 0,
    limit: 200,
    where: { _status: { equals: "published" } },
  });
  return result.docs.map((doc) => String(doc.slug));
}

/** Only the categories that actually have posts — an empty filter tab is a dead end. */
export async function getUsedCategories(): Promise<PostCategory[]> {
  const posts = await findPosts(FALLBACK_LOCALE);
  const used = new Set(posts.map((post) => post.category));
  return postCategories.filter((category) => used.has(category));
}

