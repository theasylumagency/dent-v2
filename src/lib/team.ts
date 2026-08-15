import type { Locale } from "@/i18n/config";
import { cms, mediaAlt, mediaUrl, toBlocks, toStrings } from "./cms";
import type { Block } from "./news-shared";
import { route } from "./routes";

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
  /** Deep link to this doctor's block on the about page. */
  href: string;
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
};

function toDoctor(doc: DoctorDoc, lang: Locale): Doctor {
  return {
    slug: doc.slug,
    name: doc.name,
    role: doc.role,
    photo: mediaUrl(doc.photo),
    photoAlt: mediaAlt(doc.photo, `${doc.name} — ${doc.role}`),
    href: `${route(lang, "about")}#${doc.slug}`,
    isLead: Boolean(doc.isLead),
    published: Boolean(doc.published),
    focus: doc.focus ?? "",
    bio: toBlocks(doc.bio),
    tags: toStrings(doc.tags),
    education: toStrings(doc.education),
    experience: toStrings(doc.experience),
    training: toStrings(doc.training),
    languages: toStrings(doc.languages),
    experienceYears: doc.experienceYears ?? "",
  };
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
