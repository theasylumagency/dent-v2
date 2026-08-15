import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServiceCategories, getServiceCount } from "@/lib/services";
import { getSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import { ArrowUpRight } from "@/components/ui/icons";
import ServiceIcon from "@/components/ui/ServiceIcons";
import Reveal from "@/components/ui/Reveal";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const t = dict.services.page;
  const meta = await getSeo("services", lang, {
    title: t.metaTitle,
    description: t.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/services`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/services`]),
        ["x-default", "/en/services"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/services`,
    },
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.services.page;
  const [categories, serviceCount] = await Promise.all([
    getServiceCategories(dict.services.categories, locale),
    getServiceCount(),
  ]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.nav.services,
        item: `${site.url}/${locale}/services`,
      },
    ],
  };

  /* An OfferCatalog rather than a bare ItemList: the five entries are
     things the clinic offers, and the nesting lets each direction carry
     its own services without inventing a URL per service. */
  const catalogLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: t.title,
    url: `${site.url}/${locale}/services`,
    provider: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
    itemListElement: categories.map((category, index) => ({
      "@type": "OfferCatalog",
      position: index + 1,
      name: category.title,
      description: category.blurb,
      url: `${site.url}/${locale}/services/${category.slug}`,
      itemListElement: category.items.map((service, childIndex) => ({
        "@type": "Offer",
        position: childIndex + 1,
        itemOffered: {
          "@type": "MedicalProcedure",
          name: service.title,
          description: service.blurb,
        },
      })),
    })),
  };

  return (
    <>
      <PageHero
        eyebrow={dict.services.label}
        title={t.title}
        lead={t.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[
          { label: t.breadcrumbHome, href: `/${locale}` },
          { label: dict.nav.services },
        ]}
        aside={
          <Reveal delay={160}>
            <div className="flex flex-col gap-8 border-t border-ivory-400 pt-8 lg:flex-row lg:items-center lg:justify-between">
              {/* The divider is a border on the second group rather than a
                  spacer element: inside a <dl> the only permitted children
                  are dt, dd and the <div>s that wrap them. */}
              <dl className="flex items-center">
                <div className="pr-10">
                  <dt className="label-micro">{t.directionsLabel}</dt>
                  <dd className="mt-1 font-display text-3xl text-ink-900">{categories.length}</dd>
                </div>
                <div className="border-l border-ivory-400 pl-10">
                  <dt className="label-micro">{t.servicesLabel}</dt>
                  <dd className="mt-1 font-display text-3xl text-ink-900">{serviceCount}</dd>
                </div>
              </dl>

              {/* In-page jump list. Sixteen services is a long scroll; this
                  is the cheapest way to let someone who already knows what
                  they came for skip the rest. */}
              <nav aria-label={t.jumpLabel}>
                <ul className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <a
                        href={`#${category.slug}`}
                        className="inline-flex rounded-full border border-ivory-600 bg-ivory-50 px-4 py-2 text-xs text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                      >
                        {category.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </Reveal>
        }
      />

      {categories.map((category, index) => (
        <section
          key={category.slug}
          id={category.slug}
          className={`section relative overflow-hidden border-b border-ivory-400 ${
            index % 2 === 0 ? "bg-ivory-100" : "bg-ivory-200"
          }`}
        >
          {index % 2 === 1 && (
            <div className="aura -left-40 top-1/4 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />
          )}

          <div className="shell relative">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
              <Reveal className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">
                    <ServiceIcon name={category.slug} className="h-9 w-9" />
                  </span>

                  <h2 className="mt-6 font-display text-3xl leading-snug lg:text-4xl">
                    {category.title}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-ink-700">
                    {category.lead}
                  </p>

                  <Link
                    href={category.href}
                    className="group mt-7 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
                  >
                    {dict.services.categoryCta}
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
              </Reveal>

              <div className="lg:col-span-8">
                <h3 className="label-micro">{t.inCategory}</h3>

                <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {category.items.map((service, childIndex) => (
                    <li key={service.slug}>
                      <Reveal delay={Math.min(childIndex, 3) * 45} className="h-full">
                        <article className="group card relative flex h-full flex-col p-6 transition-[border-color,box-shadow] duration-300 hover:border-accent-400 hover:shadow-lift">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200 transition-colors duration-500 group-hover:bg-accent-100 group-hover:text-accent-600">
                            <ServiceIcon name={service.slug} className="h-6 w-6" />
                          </span>

                          <h4 className="mt-5 font-display text-xl leading-snug">
                            <Link
                              href={service.href}
                              className="transition-colors hover:text-accent-700"
                            >
                              {/* Stretched link — the whole card is the target. */}
                              <span className="after:absolute after:inset-0 after:content-['']">
                                {service.title}
                              </span>
                            </Link>
                          </h4>

                          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">
                            {service.blurb}
                          </p>
                        </article>
                      </Reveal>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ))}

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogLd) }}
      />
    </>
  );
}
