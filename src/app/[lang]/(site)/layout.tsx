import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import BookingProvider from "@/components/booking/BookingProvider";
import MobileActionBar from "@/components/nav/MobileActionBar";
import SiteHeader from "@/components/nav/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getClinic } from "@/lib/clinic";
import { getSeo } from "@/lib/seo";
import { getServiceCategories } from "@/lib/services";
import { media, site } from "@/lib/site";
import { getDoctors } from "@/lib/team";

/** Homepage defaults and the normal-site title template live only in this
 * route group, so campaign pages never inherit homepage copy or imagery. */
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
    title: {
      default: meta.title,
      template: `%s — ${site.name}`,
    },
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: Object.fromEntries([
        ...locales.map((locale) => [htmlLang[locale], `/${locale}`]),
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
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [{ url: media.heroPoster, alt: dict.meta.ogAlt }],
    },
  };
}

export default async function SiteLayout({
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

  const bookingCopy = {
    ...dict.booking,
    loading: dict.common.loading,
    form: dict.contact.form,
  };
  const bookingOptions = categories.map((category) => ({
    value: category.slug,
    label: category.title,
  }));

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
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "reservations",
        telephone: clinic.phone,
        availableLanguage: ["ka", "en", "ru"],
      },
      ...(clinic.phoneAlt
        ? [{
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: clinic.phoneAlt,
            availableLanguage: ["ka", "en", "ru"],
          }]
        : []),
    ],
    availableService: categories.map((category) => ({
      "@type": "MedicalProcedure",
      name: category.title,
      description: category.blurb,
    })),
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
    sameAs: [clinic.social.facebook, clinic.social.instagram, clinic.social.google].filter(Boolean),
  };

  return (
    <BookingProvider copy={bookingCopy} options={bookingOptions}>
      <SiteHeader dict={dict} lang={locale} megaColumns={categories} clinic={clinic} />
      <main id="main">{children}</main>
      <SiteFooter dict={dict} lang={locale} categories={categories} clinic={clinic} />
      <MobileActionBar dict={dict} lang={locale} clinic={clinic} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </BookingProvider>
  );
}
