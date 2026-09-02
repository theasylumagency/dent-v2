import type { Locale } from "@/i18n/config";
import { cms, mediaAlt, mediaUrl, toBlocks } from "./cms";
import type { Block } from "./rich-text";
import { isCategorySlug, type CategorySlug } from "./services-shared";

/**
 * Treated cases, read from Payload's `cases` collection.
 *
 * Two filters, and the second one is the point: `published` is the editor's
 * switch, `consent` is the patient's. The collection already refuses to save
 * a published case without consent, so this is belt and braces — but the
 * failure it guards against (a photograph of someone's mouth on the public
 * internet without their agreement) is not one to leave to a single
 * validator that a future migration or a direct database edit could bypass.
 *
 * Georgian fallback is Payload's, as everywhere else: `localization.fallback`
 * with `defaultLocale: "ka"` means an untranslated case comes back Georgian
 * rather than empty, so the page never renders a blank caption.
 */

export type Case = {
  slug: string;
  title: string;
  direction: CategorySlug;
  summary: string;
  duration: string;
  doctorName: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  details: Block[];
  updatedAt: string;
};

type CaseDoc = {
  slug: string;
  title: string;
  direction?: string | null;
  summary: string;
  duration?: string | null;
  doctor?: unknown;
  beforeImage?: unknown;
  afterImage?: unknown;
  details?: unknown;
  updatedAt?: string;
};

/** The related doctor arrives populated at `depth: 1`; only the name is used. */
function doctorName(value: unknown): string {
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "").trim();
  }
  return "";
}

function toCase(doc: CaseDoc, lang: Locale): Case | null {
  const before = mediaUrl(doc.beforeImage);
  const after = mediaUrl(doc.afterImage);
  /* Both uploads are `required`, so a case missing one has had its media
     deleted out from under it. Half a before/after is not a smaller version
     of the section — it is a claim with its evidence removed. */
  if (!before || !after) return null;

  const direction = typeof doc.direction === "string" ? doc.direction : "";
  if (!isCategorySlug(direction)) return null;

  return {
    slug: doc.slug,
    title: doc.title,
    direction,
    summary: doc.summary,
    duration: doc.duration?.trim() ?? "",
    doctorName: doctorName(doc.doctor),
    /* The title is the alt fallback rather than a generic "before photo":
       a screen reader user gets told which treatment it belongs to, and the
       editor can still write something better on the upload itself. */
    before: { src: before, alt: mediaAlt(doc.beforeImage, doc.title) },
    after: { src: after, alt: mediaAlt(doc.afterImage, doc.title) },
    details: toBlocks(doc.details, lang),
    updatedAt: doc.updatedAt ?? "",
  };
}

async function findCases(lang: Locale): Promise<CaseDoc[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "cases",
    locale: lang,
    /* depth 1 populates both uploads and the doctor relationship. */
    depth: 1,
    limit: 100,
    sort: "order",
    where: {
      and: [{ published: { equals: true } }, { consent: { equals: true } }],
    },
  });
  return result.docs as unknown as CaseDoc[];
}

export async function getCases(lang: Locale): Promise<Case[]> {
  const docs = await findCases(lang);
  return docs.map((doc) => toCase(doc, lang)).filter((entry): entry is Case => entry !== null);
}

/**
 * The newest `updatedAt` among published cases, for the sitemap's `lastmod`
 * on `/cases`. Null when nothing is published yet — the caller then falls
 * back to the site date rather than reporting "now", which is the whole
 * argument set out at the top of `app/sitemap.ts`.
 */
export async function getCasesUpdatedAt(): Promise<Date | null> {
  const payload = await cms();
  const result = await payload.find({
    collection: "cases",
    depth: 0,
    limit: 1,
    sort: "-updatedAt",
    where: {
      and: [{ published: { equals: true } }, { consent: { equals: true } }],
    },
  });
  const value = result.docs[0]?.updatedAt;
  return value ? new Date(value) : null;
}
