import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Manrope, Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";

import "../globals.css";
import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServiceCategories } from "@/lib/services";
import { getDoctors } from "@/lib/team";
import { getClinic } from "@/lib/clinic";
import { getSeo } from "@/lib/seo";
import { media, site } from "@/lib/site";
import SiteHeader from "@/components/nav/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MobileActionBar from "@/components/nav/MobileActionBar";
import BookingProvider from "@/components/booking/BookingProvider";

/* --- Type stack -------------------------------------------------------
   Latin + Cyrillic come from the first family in each stack, Georgian
   glyphs fall through to the Noto Georgian companion. Per-glyph fallback
   keeps every language on a consistent design.

   Note that on `ka` — the default locale — the Noto companions are what
   actually render. See the `:lang(ka)` block in globals.css for the
   metric corrections that follow from that.                            */

const body = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const bodyKa = Noto_Sans_Georgian({
  subsets: ["georgian"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body-ka",
  display: "swap",
});

const display = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500"],
  variable: "--font-display-latin",
  display: "swap",
});

const displayKa = Noto_Serif_Georgian({
  subsets: ["georgian"],
  weight: ["300", "400", "500"],
  variable: "--font-display-ka",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  colorScheme: "light",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const meta = await getSeo("home", lang, {
    title: dict.meta.title,
    description: dict.meta.description,
  });

  return {
    metadataBase: new URL(site.url),
    title: {
      default: meta.title,
      template: `%s — ${site.name}`,
    },
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}`]),
        /* x-default points at English: it is the fallback for visitors
           whose language we do not publish, and that audience reads
           Latin script far more reliably than mkhedruli. Georgian
           speakers still land on /ka via their own hreflang. */
        ["x-default", "/en"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}`,
      images: [{ url: media.heroPoster, width: 1200, height: 1166, alt: dict.meta.ogAlt }],
    },
    /* Without an explicit card type X falls back to a small thumbnail;
       `summary_large_image` is what makes a shared link look deliberate. */
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [{ url: media.heroPoster, alt: dict.meta.ogAlt }],
    },
    /* SVG first for anything modern, .ico as the fallback.
       TODO(design): `apple` still points at the SVG, which iOS ignores —
       a real 180x180 PNG is needed before launch or iOS home-screen
       bookmarks fall back to a screenshot of the page. */
    icons: {
      icon: [
        { url: "/brand/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: "/brand/icon.svg",
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const [categories, team, clinic, meta] = await Promise.all([
    getServiceCategories(dict.services.categories, locale),
    getDoctors(locale),
    getClinic(locale, dict.contact),
    getSeo("home", locale, { title: dict.meta.title, description: dict.meta.description }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${site.url}/#clinic`,
    name: site.name,
    description: meta.description,
    url: `${site.url}/${locale}`,
    image: `${site.url}${media.heroPoster}`,
    logo: `${site.url}/brand/logo.svg`,
    telephone: clinic.phone,
    email: clinic.email,
    medicalSpecialty: "Dentistry",
    hasMap: clinic.maps,
    areaServed: { "@type": "City", name: "Tbilisi" },
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.address,
      addressLocality: "Tbilisi",
      postalCode: "0179",
      addressCountry: "GE",
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: site.hours.opens,
      closes: site.hours.closes,
    },
    /* The landline is dropped rather than emitted empty when the CMS has no
       second number — a `ContactPoint` with `telephone: ""` is a broken
       claim, not an absent one. */
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "reservations",
        telephone: clinic.phone,
        availableLanguage: ["ka", "en", "ru"],
      },
      ...(clinic.phoneAlt
        ? [
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              telephone: clinic.phoneAlt,
              availableLanguage: ["ka", "en", "ru"],
            },
          ]
        : []),
    ],
    availableService: categories.map((category) => ({
      "@type": "MedicalProcedure",
      name: category.title,
      description: category.blurb,
    })),

    /* Named practitioners with their roles. The clinic's strongest E-E-A-T
       asset was sitting in prose only — search and AI engines cannot infer
       "candidate of dental sciences, 20+ years" from a paragraph, but they
       will read it here. `Person`, not `Physician`: in schema.org
       `Physician` is a MedicalBusiness, i.e. a practice, not a human.

       Credentials come from each doctor's own record. They used to be read
       from `dict.doctor.*` for whoever happened to be first in the array —
       two bugs in one line: the lead is identified by the `isLead` flag, not
       by position, and the text was a second copy of a bio the CMS already
       owned. Editing the chief doctor in the admin left this block quoting
       the old credentials indefinitely.

       Gated on `published`, matching the about page: an unconfirmed profile
       is emitted as a name and a job title, never as an assertion we have
       not checked. */
    employee: team.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.role,
      image: member.photo ? `${site.url}${member.photo}` : undefined,
      url: `${site.url}${member.href}`,
      worksFor: { "@id": `${site.url}/#clinic` },
      ...(member.published
        ? {
            description: member.focus || undefined,
            knowsAbout: member.tags.length ? member.tags : undefined,
            knowsLanguage: member.languages.length ? member.languages : undefined,
          }
        : {}),
    })),

    /* Only the two fees the clinic actually publishes. `priceRange` is
       deliberately omitted — treatment pricing is not published, and
       inventing a "$$" band would be a guess dressed as structured data. */
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: dict.contact.consultationFirst },
        price: String(clinic.consultation.first),
        priceCurrency: clinic.consultation.currency,
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: dict.contact.consultationRepeat },
        price: String(clinic.consultation.repeat),
        priceCurrency: clinic.consultation.currency,
      },
    ],

    /* Filtered: an empty Google Business Profile URL would emit `""`. */
    sameAs: [clinic.social.facebook, clinic.social.instagram, clinic.social.google].filter(Boolean),
  };

  const bookingCopy = {
    ...dict.booking,
    loading: dict.common.loading,
    form: dict.contact.form,
  };

  const bookingOptions = categories.map((category) => ({
    value: category.slug,
    label: category.title,
  }));

  return (
    <html
      lang={htmlLang[locale]}
      className={`${body.variable} ${bodyKa.variable} ${display.variable} ${displayKa.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ivory-100 text-ink-700 antialiased">
        {/* Runs before the first paint, so `.reveal` only hides content
            when JS is actually available to bring it back. Without this
            a failed bundle serves a blank clinic site. */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js")` }}
        />

        <BookingProvider copy={bookingCopy} options={bookingOptions}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent-300 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-ink-900"
          >
            {dict.nav.skipToContent}
          </a>

          {/* `clinic` is fetched once here and passed down. The header is a
              client component and cannot await a query; the footer and the
              action bar could, but three separate reads of the same global
              on every page is work for nothing. */}
          <SiteHeader dict={dict} lang={locale} megaColumns={categories} clinic={clinic} />

          <main id="main">{children}</main>

          <SiteFooter dict={dict} lang={locale} categories={categories} clinic={clinic} />
          <MobileActionBar dict={dict} lang={locale} clinic={clinic} />
        </BookingProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
