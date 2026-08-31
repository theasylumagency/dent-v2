import type { Locale } from "@/i18n/config";
import { cms, mediaAlt, mediaUrl, toBlocks, toStrings } from "./cms";
import type { Block } from "./news-shared";
import { route } from "./routes";

/** Georgian is the source language — see `localization` in `payload.config.ts`. */
const FALLBACK_LOCALE: Locale = "ka";

/**
 * The clinical team, read from Payload's `doctors` collection.
 *
 * `published` replaced the hard-coded `profilePending` map: an editor ticks
 * it once a doctor's credentials are confirmed, and until then the about
 * page renders a short note instead of five empty headings. That check now
 * lives with the data rather than in a constant a developer has to remember
 * to change.
 */

export type Doctor = {
  slug: string;
  name: string;
  role: string;
  photo: string;
  photoAlt: string;
  /**
   * Where a link to this doctor should go.
   *
   * A published doctor has a page of their own and this is it. An
   * unpublished one does not — their block on the about page renders a
   * "profile in preparation" note instead — so `href` stays the anchor
   * there. Callers link to `href` and get the right target either way.
   */
  href: string;
  /** The page URL, or null while the profile is unpublished. */
  pageHref: string | null;
  isLead: boolean;
  published: boolean;
  focus: string;
  bio: Block[];
  tags: string[];
  education: string[];
  experience: string[];
  training: string[];
  languages: string[];
  experienceYears: string;
  /** The search listing for the doctor's own page. Empty falls back. */
  metaTitle: string;
  metaDescription: string;
  /** Last edit, for `<lastmod>`. ISO 8601. */
  updatedAt: string;
};

type DoctorDoc = {
  slug: string;
  name: string;
  role: string;
  photo?: unknown;
  isLead?: boolean;
  published?: boolean;
  focus?: string;
  bio?: unknown;
  tags?: unknown;
  education?: unknown;
  experience?: unknown;
  training?: unknown;
  languages?: unknown;
  experienceYears?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt?: string;
};

function toDoctor(doc: DoctorDoc, lang: Locale): Doctor {
  const published = Boolean(doc.published);
  const pageHref = published ? route(lang, "doctor", doc.slug) : null;

  return {
    slug: doc.slug,
    name: doc.name,
    role: doc.role,
    photo: mediaUrl(doc.photo),
    photoAlt: mediaAlt(doc.photo, `${doc.name} — ${doc.role}`),
    href: pageHref ?? `${route(lang, "about")}#${doc.slug}`,
    pageHref,
    isLead: Boolean(doc.isLead),
    published,
    focus: doc.focus ?? "",
    bio: toBlocks(doc.bio, lang),
    tags: toStrings(doc.tags),
    education: toStrings(doc.education),
    experience: toStrings(doc.experience),
    training: toStrings(doc.training),
    languages: toStrings(doc.languages),
    experienceYears: doc.experienceYears ?? "",
    metaTitle: doc.metaTitle?.trim() ?? "",
    metaDescription: doc.metaDescription?.trim() ?? "",
    updatedAt: doc.updatedAt ?? "",
  };
}

/** One doctor by slug, or null. Drives `/[lang]/about/[slug]`. */
export async function getDoctor(slug: string, lang: Locale): Promise<Doctor | null> {
  const doctors = await getDoctors(lang);
  return doctors.find((doctor) => doctor.slug === slug) ?? null;
}

/**
 * The doctors with a page of their own, for `generateStaticParams` and the
 * sitemap. An unpublished profile has no page: it would be a URL whose only
 * content is a note saying the content is not ready.
 */
export async function getDoctorIndex(): Promise<{ slug: string; updatedAt: string }[]> {
  const payload = await cms();
  /* Two fields, not whole documents: this runs for every sitemap rebuild
     and every `generateStaticParams`, and going through `getDoctors` would
     populate five photos and convert five bios to throw all of it away. */
  const result = await payload.find({
    collection: "doctors",
    locale: FALLBACK_LOCALE,
    depth: 0,
    limit: 100,
    sort: "order",
    select: { slug: true, updatedAt: true },
    where: { published: { equals: true } },
  });

  return result.docs.map((doc) => ({
    slug: String(doc.slug),
    updatedAt: String(doc.updatedAt ?? ""),
  }));
}

export async function getDoctors(lang: Locale): Promise<Doctor[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "doctors",
    locale: lang,
    depth: 1,
    limit: 100,
    sort: "order",
  });
  return (result.docs as unknown as DoctorDoc[]).map((doc) => toDoctor(doc, lang));
}

/**
 * The chief doctor.
 *
 * Returns `null` rather than throwing if nobody is flagged as lead — an
 * empty section is recoverable, a build that fails because someone unticked
 * a checkbox in the admin is not.
 */
export async function getLeadDoctor(lang: Locale): Promise<Doctor | null> {
  const doctors = await getDoctors(lang);
  return doctors.find((doctor) => doctor.isLead) ?? null;
}

/** Everyone except the lead, who gets his own larger block. */
export async function getTeam(lang: Locale): Promise<Doctor[]> {
  const doctors = await getDoctors(lang);
  return doctors.filter((doctor) => !doctor.isLead);
}
