/**
 * Deployment configuration and asset paths.
 *
 * This used to be the source of truth for the clinic's contact details. It is
 * not any more — see the note on `site` below. What is still authoritative
 * here is the domain, the site name, the map coordinates and the machine-
 * readable opening hours.
 *
 * TODO(client): the counter values in `stats` inside the dictionaries are
 * still unverified marketing figures. On a medical site an unsourced "98%"
 * is a credibility risk - either substantiate it or drop it.
 */

/**
 * **Contact details here are fallbacks, not the source of truth.**
 *
 * Everything from `phone` down to `social` now lives in Payload's
 * `clinic-info` global and is read through `getClinic()` in `lib/clinic.ts`.
 * These constants are what renders if the global has never been saved — a
 * lazily created global comes back empty, and a page with a blank phone
 * number is worse than one showing the number we launched with.
 *
 * Do not import them into a component. If a value is missing from the CMS,
 * add the fallback here and read it through `getClinic()` anyway, so there
 * stays exactly one read path.
 *
 * `phone` is the mobile line: it is the one on WhatsApp, it is what the
 * mobile action bar dials, and it is what goes into structured data as the
 * primary contact. The landline is kept as a secondary so desk callers and
 * older patients still have it. The dialling forms are derived in
 * `lib/clinic.ts` rather than stored — two fields that must agree eventually
 * will not.
 */
export const site = {
  name: "Total Charm Dent",
  url: "https://totalcharmdent.ge",

  phone: "+995 511 21 16 16",
  phoneAlt: "+995 32 250 16 16",

  email: "vake_dent@tcc.ge",
  maps: "https://maps.app.goo.gl/jGJhDwsvyz67JkKU8",
  social: {
    facebook: "https://www.facebook.com/TotalCharm.ge",
    instagram: "https://www.instagram.com/total_charm_dent/",
    /**
     * TODO(client): paste the Google Business Profile URL into the
     * `clinic-info` global in the admin — this constant is only the
     * fallback. It is the single strongest `sameAs` link a local clinic can
     * publish: it ties the site to the entity Google already ranks in Maps
     * and the local pack. Falsy values are filtered out of the schema, so
     * leaving it empty is safe.
     */
    google: "",
  },

  /* `brands` used to live here as a hand-kept list of manufacturer links.
     It moved to `lib/equipment.ts` and is now derived from the devices
     themselves via `getManufacturers()` — the two lists had to be edited
     together and this one had already fallen behind, missing Vatech,
     3Shape and EMS entirely. */

  /**
   * Fallback consultation fees. The published figures are editable in
   * `clinic-info`; the currency is not, because changing it is a pricing
   * decision with tax consequences, not a content edit.
   */
  consultation: { first: 50, repeat: 25, currency: "GEL" },

  /** Deployment configuration, not content. */
  geo: { lat: 41.7069642, lng: 44.7667472 },

  /**
   * Machine-readable opening hours for `OpeningHoursSpecification`.
   *
   * Deliberately not editable: `hoursText` in the CMS is a sentence in three
   * languages, and parsing "ყოველდღე 9:00-დან 21:00-მდე" back into two
   * timestamps is a guess. The admin field says to tell a developer when the
   * real hours change, and this is the line they change.
   */
  hours: { opens: "09:00", closes: "21:00" },
} as const;

export const media = {
  logo: "/brand/logo.svg",
  /**
   * The hero clip exists in two crops, not one crop scaled two ways.
   *
   * The desktop hero puts the video in a tall-ish right-hand panel and
   * the mobile hero runs it full-bleed behind the copy; a single 16:9
   * master `object-cover`-ed into a 9:16 box throws away two thirds of
   * the frame and lands the crop wherever the subject happens not to be.
   * `HeroMedia` picks the orientation at runtime and mounts only that
   * one, so the other is never fetched.
   *
   * webm is listed first in the markup — it is roughly a quarter the
   * size of the mp4 here — with mp4 as the Safari fallback.
   */
  heroVideo: {
    wide: { webm: "/media/hero_video_16_9.webm", mp4: "/media/hero_video_16_9.mp4" },
    tall: { webm: "/media/hero_video_9_16.webm", mp4: "/media/hero_video_9_16.mp4" },
  },
  heroPoster: "/media/hero-poster.webp",
  interior: ["/interior/totcharm_dentinner2.webp", "/interior/totcharm_dentinner1.webp"],
  /**
   * TODO(client): replace with real photography. These slots are deliberately
   * labelled so it is obvious which shots are still missing.
   *
   * `location` was dropped here: the dedicated contact page now loads a real
   * Google Maps embed only as its location section approaches the viewport.
   */
  placeholder: {
    atmosphere: "/placeholder/atmosphere-wide.webp",
    reception: "/placeholder/reception.webp",
  },
} as const;
