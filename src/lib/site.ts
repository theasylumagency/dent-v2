/**
 * Single source of truth for clinic data that is not translated
 * (addresses, links, phone numbers, asset paths).
 *
 * TODO(client): the counter values in `stats` inside the dictionaries are
 * still unverified marketing figures. On a medical site an unsourced "98%"
 * is a credibility risk - either substantiate it or drop it.
 */

/**
 * Two numbers, deliberately ordered.
 *
 * `phone` is the mobile line: it is the one on WhatsApp, it is what the
 * mobile action bar dials, and it is what goes into structured data as the
 * primary contact. The landline is kept as a secondary so desk callers and
 * older patients still have it.
 *
 * `*Href` variants are E.164 - `tel:` and `wa.me` both reject spaces.
 */
export const site = {
  name: "Total Charm Dent",
  url: "https://totalcharmdent.ge",

  phone: "+995 511 21 16 16",
  phoneHref: "+995511211616",
  phoneAlt: "+995 32 250 16 16",
  phoneAltHref: "+995322501616",
  /** wa.me takes the number without "+" or separators. */
  whatsapp: "995511211616",

  email: "vake_dent@tcc.ge",
  maps: "https://maps.app.goo.gl/jGJhDwsvyz67JkKU8",
  social: {
    facebook: "https://www.facebook.com/TotalCharm.ge",
    instagram: "https://www.instagram.com/total_charm_dent/",
    /**
     * TODO(client): paste the Google Business Profile URL here.
     * It is the single strongest `sameAs` link a local clinic can publish —
     * it ties the site to the entity Google already ranks in Maps and the
     * local pack. Falsy values are filtered out of the schema, so leaving
     * it empty is safe.
     */
    google: "",
  },

  /**
   * Equipment and systems named in the copy. Linking them out associates
   * this clinic with entities search and AI engines already know, which is
   * a cheap and durable authority signal — and it lets a patient verify
   * the claim rather than take it on trust.
   */
  brands: [
    { name: "FORESTADENT", url: "https://www.forestadent.com/" },
    { name: "Ormco / Damon", url: "https://ormco.com/" },
    { name: "American Orthodontics", url: "https://americanortho.com/" },
    { name: "Philips Zoom", url: "https://www.philips.com/" },
  ],

  /** Published consultation fees. Kept here so schema and copy cannot drift. */
  consultation: { first: 50, repeat: 25, currency: "GEL" },
  geo: { lat: 41.7069642, lng: 44.7667472 },

  /** Machine-readable opening hours. Keep in sync with `contact.hours`. */
  hours: { opens: "09:00", closes: "21:00" },
} as const;

export const whatsappHref = `https://wa.me/${site.whatsapp}`;

export const media = {
  logo: "/brand/logo.svg",
  heroVideo: "/media/hero.mp4",
  heroPoster: "/media/hero-poster.jpg",
  interior: ["/interior/totcharm_dentinner99.webp", "/interior/totcharm_dentinner11.webp"],
  /**
   * TODO(client): replace with real photography. These slots are deliberately
   * labelled so it is obvious which shots are still missing.
   *
   * `location` was dropped here: the contact section now loads a real Google
   * Maps embed on demand instead of showing a stand-in image, so there is no
   * longer a slot for it. `public/placeholder/location.webp` can be deleted.
   */
  placeholder: {
    atmosphere: "/placeholder/atmosphere-wide.webp",
    reception: "/placeholder/reception.webp",
  },
} as const;
