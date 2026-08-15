import type { Locale } from "@/i18n/config";
import { cms } from "./cms";
import { site } from "./site";

/**
 * Contact details, read from Payload's `clinic-info` global.
 *
 * The global has existed since the CMS went in, but nothing read it — every
 * component still imported `site.phone` and `dict.contact.address` directly.
 * An editable field that changes nothing is worse than a missing one: the
 * clinic changes its number in the admin, the site keeps dialling the old
 * one, and nobody finds out until a patient calls a dead line.
 *
 * **One editable number, three derived forms.** The admin stores the phone as
 * a person reads it (`+995 511 21 16 16`). `tel:` and `wa.me` both reject
 * spaces, so the dialling forms are computed here rather than asked of an
 * editor — two fields that must agree will eventually disagree, and the
 * failure is silent.
 *
 * `address` and `hours` are localised in the CMS, so `getClinic` takes the
 * locale. The dictionary values are passed in as the fallback: the global is
 * lazily created by Payload and comes back empty until it is first saved, and
 * a build that renders a blank address is worse than one that renders the
 * copy we shipped with.
 *
 * What stays in `site.ts`: the domain, the site name and the map coordinates.
 * Those are deployment configuration — changing them is a migration, not an
 * edit.
 */

export type Clinic = {
  /** As a person reads it. */
  phone: string;
  /** E.164, for `tel:`. Empty when there is no number. */
  phoneHref: string;
  phoneAlt: string;
  phoneAltHref: string;
  /** Digits only, for `wa.me`. */
  whatsapp: string;
  whatsappHref: string;
  email: string;
  address: string;
  hours: string;
  maps: string;
  consultation: { first: number; repeat: number; currency: string };
  social: { facebook: string; instagram: string; google: string };
  /**
   * Published claims, and `null` when the clinic has not made them.
   *
   * Deliberately nullable rather than defaulted. These two used to be
   * hard-coded in the dictionaries as "98" and "10" — figures nobody could
   * source, sitting on a medical site. A missing counter is honest; an
   * invented one is not, so `buildStats` drops them when they are unset.
   */
  satisfiedPercent: number | null;
  yearsOnMarket: number | null;
};

/** The locale-dependent strings the dictionary can cover if the CMS cannot. */
export type ClinicFallback = { address: string; hours: string };

type ClinicInfoDoc = {
  phone?: string | null;
  phoneAlt?: string | null;
  whatsappSameAsPhone?: boolean | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
  hoursText?: string | null;
  consultationFirst?: number | null;
  consultationRepeat?: number | null;
  satisfiedPercent?: number | null;
  yearsOnMarket?: number | null;
  facebook?: string | null;
  instagram?: string | null;
  google?: string | null;
};

/** `tel:` wants E.164 — a leading plus and nothing else but digits. */
function toDialHref(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

/** `wa.me` wants the same digits without the plus. */
function toWhatsappDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const text = (value: unknown, fallback: string): string => {
  const next = typeof value === "string" ? value.trim() : "";
  return next || fallback;
};

export async function getClinic(lang: Locale, fallback: ClinicFallback): Promise<Clinic> {
  const payload = await cms();
  /* Narrowed by hand, and through `unknown` — matching `lib/team.ts`. The
     generated type marks `phone`, `email` and `address` as required because
     the fields are, but Payload creates a global lazily and returns an empty
     document until it is first saved. Trusting the generated type here would
     mean trusting a `string` that is actually `undefined`. */
  const doc = (await payload.findGlobal({
    slug: "clinic-info",
    locale: lang,
    depth: 0,
  })) as unknown as ClinicInfoDoc;

  const phone = text(doc.phone, site.phone);
  const phoneAlt = text(doc.phoneAlt, site.phoneAlt);

  /* The checkbox defaults to true, so an unsaved global reads as "same as
     phone" — which is the right answer for this clinic and a safe one for
     any other: a WhatsApp link to the main line is never wrong, an empty
     one is a dead button. */
  const whatsappSource =
    doc.whatsappSameAsPhone === false && doc.whatsapp ? doc.whatsapp : phone;

  return {
    phone,
    phoneHref: toDialHref(phone),
    phoneAlt,
    phoneAltHref: toDialHref(phoneAlt),
    whatsapp: toWhatsappDigits(whatsappSource),
    whatsappHref: `https://wa.me/${toWhatsappDigits(whatsappSource)}`,
    email: text(doc.email, site.email),
    address: text(doc.address, fallback.address),
    hours: text(doc.hoursText, fallback.hours),
    maps: text(doc.mapsUrl, site.maps),
    consultation: {
      first: doc.consultationFirst ?? site.consultation.first,
      repeat: doc.consultationRepeat ?? site.consultation.repeat,
      currency: site.consultation.currency,
    },
    social: {
      facebook: text(doc.facebook, site.social.facebook),
      instagram: text(doc.instagram, site.social.instagram),
      google: text(doc.google, site.social.google),
    },
    /* No `site.ts` fallback for these two, unlike every field above. A
       fallback exists so the site keeps working when the CMS is empty; there
       is nothing to keep working here, because an unpublished claim should
       not appear at all. */
    satisfiedPercent: typeof doc.satisfiedPercent === "number" ? doc.satisfiedPercent : null,
    yearsOnMarket: typeof doc.yearsOnMarket === "number" ? doc.yearsOnMarket : null,
  };
}
