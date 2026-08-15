import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getClinic } from "@/lib/clinic";
import { getSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import BookingTrigger from "@/components/booking/BookingTrigger";
import LocationMap from "@/components/contact/LocationMap";
import Breadcrumbs from "@/components/services/Breadcrumbs";
import { ArrowUpRight, Clock, Mail, Phone, Pin } from "@/components/ui/icons";

const exteriorImage = "/images/contact/exterior.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const copy = dict.contact.page;
  const meta = await getSeo("contact", lang, {
    title: copy.metaTitle,
    description: copy.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/contact`,
      languages: Object.fromEntries([
        ...locales.map((locale) => [htmlLang[locale], `/${locale}/contact`]),
        ["x-default", "/en/contact"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/contact`,
      images: [{ url: exteriorImage, width: 922, height: 1152, alt: copy.exteriorAlt }],
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const copy = dict.contact.page;
  const clinic = await getClinic(locale, dict.contact);

  const contactPageLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: copy.title,
    description: copy.metaDescription,
    url: `${site.url}/${locale}/contact`,
    mainEntity: { "@id": `${site.url}/#clinic` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.breadcrumbHome, item: `${site.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: copy.title, item: `${site.url}/${locale}/contact` },
    ],
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-ivory-400 bg-ivory-100 pb-20 pt-28 lg:pb-28 lg:pt-40">
        <div className="aura -left-52 top-10 h-[32rem] w-[32rem] opacity-30" aria-hidden="true" />
        <div className="shell relative">
          <Breadcrumbs
            label={copy.breadcrumbLabel}
            items={[{ label: copy.breadcrumbHome, href: `/${locale}` }, { label: copy.title }]}
          />

          <div className="mt-9 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-6">
              <p className="eyebrow">{dict.contact.label}</p>
              <h1 className="mt-6 fluid-display font-display">{copy.title}</h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">{copy.lead}</p>

              <address className="mt-9 grid gap-5 not-italic sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <div><p className="label-micro">{dict.contact.addressLabel}</p><p className="mt-1.5 text-sm leading-relaxed text-ink-800">{clinic.address}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <div><p className="label-micro">{dict.contact.hoursLabel}</p><p className="mt-1.5 text-sm text-ink-800">{clinic.hours}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <div><p className="label-micro">{dict.contact.phoneLabel}</p><a href={`tel:${clinic.phoneHref}`} className="mt-1.5 block text-sm text-ink-800 transition-colors hover:text-accent-700">{clinic.phone}</a></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                  <div><p className="label-micro">{dict.contact.emailLabel}</p><a href={`mailto:${clinic.email}`} className="mt-1.5 block text-sm text-ink-800 transition-colors hover:text-accent-700">{clinic.email}</a></div>
                </div>
              </address>

              <BookingTrigger className="btn-primary mt-9">{dict.nav.book}</BookingTrigger>
            </div>

            <div className="lg:col-span-6">
              <figure className="relative mx-auto aspect-[4/5] max-w-[34rem] overflow-hidden rounded-[1.75rem] bg-ivory-300 shadow-lift lg:ml-auto">
                <Image
                  src={exteriorImage}
                  alt={copy.exteriorAlt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 44vw, 92vw"
                  className="object-cover object-center"
                />
                <span className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10" aria-hidden="true" />
              </figure>
            </div>
          </div>
        </div>
      </section>

      <section className="section relative overflow-hidden bg-ivory-200">
        <div className="shell">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="eyebrow">{dict.contact.district}</p>
              <h2 className="mt-6 fluid-title font-display">{copy.locationTitle}</h2>
              <p className="mt-5 text-base leading-relaxed text-ink-700">{copy.locationLead}</p>
            </div>

            <div className="lg:col-span-8 lg:row-span-2">
              <LocationMap lang={locale} title={dict.contact.mapTitle} loadingLabel={copy.mapLoading} lat={site.geo.lat} lng={site.geo.lng} />
            </div>

            <div className="border-t border-ivory-400 pt-6 lg:col-span-4">
              <p className="label-micro">{copy.entranceLabel}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{copy.entranceNote}</p>
              <p className="mt-5 text-sm font-medium text-ink-900">{clinic.address}</p>
              <a href={clinic.maps} target="_blank" rel="noreferrer" className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent-700 transition-colors hover:text-accent-600">
                {copy.mapsCta}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-ivory-400 bg-ivory-100 py-20 sm:py-24 lg:py-28">
        <div className="shell text-center">
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.35rem,5vw,4.75rem)] leading-[1.08]">{copy.finalTitle}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">{copy.finalLead}</p>
          <BookingTrigger className="btn-primary mt-8">{dict.nav.book}</BookingTrigger>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  );
}
