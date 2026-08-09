import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Manrope, Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";

import "../globals.css";
import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServiceCategories } from "@/lib/services";
import { site } from "@/lib/site";
import SiteHeader from "@/components/nav/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MobileActionBar from "@/components/nav/MobileActionBar";

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

  return {
    metadataBase: new URL(site.url),
    title: {
      default: dict.meta.title,
      template: `%s — ${site.name}`,
    },
    description: dict.meta.description,
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
      title: dict.meta.title,
      description: dict.meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}`,
      images: [{ url: "/media/hero-poster.jpg", width: 1920, height: 1080, alt: dict.meta.ogAlt }],
    },
    icons: { icon: "/favicon.ico" },
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
  const categories = getServiceCategories(dict, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${site.url}/#clinic`,
    name: site.name,
    description: dict.meta.description,
    url: `${site.url}/${locale}`,
    image: `${site.url}/media/hero-poster.jpg`,
    logo: `${site.url}/brand/logo.svg`,
    telephone: site.phone,
    email: site.email,
    medicalSpecialty: "Dentistry",
    hasMap: site.maps,
    areaServed: { "@type": "City", name: "Tbilisi" },
    address: {
      "@type": "PostalAddress",
      streetAddress: dict.contact.address,
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
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "reservations",
        telephone: site.phone,
        availableLanguage: ["ka", "en", "ru"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: site.phoneAlt,
        availableLanguage: ["ka", "en", "ru"],
      },
    ],
    availableService: categories.map((category) => ({
      "@type": "MedicalProcedure",
      name: category.title,
      description: category.blurb,
    })),
    sameAs: [site.social.facebook, site.social.instagram],
  };

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

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent-300 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-ink-900"
        >
          {dict.nav.skipToContent}
        </a>

        <SiteHeader dict={dict} lang={locale} />

        <main id="main">{children}</main>

        <SiteFooter dict={dict} lang={locale} />
        <MobileActionBar dict={dict} lang={locale} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
