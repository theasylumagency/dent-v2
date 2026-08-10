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
  },
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
