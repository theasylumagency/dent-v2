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

/**
 * The studio that designed and built the site.
 *
 * One constant, two consumers: the footer credit line and the `author` /
 * `creator` metadata in the locale layout. They are kept together because a
 * credit that links somewhere other than the name it displays is worse than
 * no credit at all.
 *
 * `name` is the short form and the only string that renders on the page —
 * the footer is not the place for a legal entity. `legalName` goes into the
 * metadata, where length costs nothing and specificity is the point.
 *
 * On `rel`: the footer link carries `nofollow`, which is Google's own
 * recommendation for site-credit links — "if you have control over the link,
 * we recommend that you add nofollow to these types of links" (Search
 * Central SEO office hours, February 2023).
 *
 * The credit is sitewide, so a single client is already hundreds of identical
 * links aimed at one domain; repeated across a portfolio that becomes the
 * "widely distributed links in the footers or templates of various sites"
 * pattern the spam policy names by hand. Nothing is given up by complying:
 * links like this are discounted anyway, and what a credit is actually worth
 * is the person who clicks it — which `nofollow` does not touch.
 *
 * Keep the anchor text as the brand name. A keyword-rich anchor is the part
 * that genuinely reads as a scheme, not the link itself.
 */
export const agency = {
  name: "The Asylum",
  legalName: "The Asylum Agency",
  url: "https://theasylum.agency",
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
   * **One codec, not two.** There used to be a WebM/MP4 pair per crop and a
   * `canPlayType` probe in `HeroMedia` to choose between them, because the
   * VP9 files were a quarter the size of the H.264 ones. That was true of
   * those particular encodes and not of the codecs: the MP4s had been
   * exported at ~9 Mbit/s for a muted, seven-second background loop that
   * spends its life behind a scrim. Re-encoded at a sane bitrate — same
   * 1080p, CRF 31, no audio track — H.264 comes out *smaller* than the VP9
   * it was losing to, 1.1 MB against 2.1 MB.
   *
   * So the trade the probe existed to make no longer exists. H.264 in MP4
   * plays everywhere, decodes in hardware on phones where VP9 often does
   * not, and is now the smaller file. Adding a WebM back would mean
   * maintaining two encodes to save nothing.
   *
   * If these are ever re-exported, mind the bitrate rather than the codec:
   *   ffmpeg -i in.mp4 -c:v libx264 -crf 31 -preset slow -profile:v main \
   *          -pix_fmt yuv420p -an -movflags +faststart out.mp4
   *
   * Filenames are the cache key. `next.config.ts` serves everything under
   * `/media/` with a thirty-day `max-age`, so replacing a clip means giving
   * it a new name, not overwriting this one.
   */
  heroVideo: {
    wide: "/media/hero-wide.mp4",
    tall: "/media/hero-tall.mp4",
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
