import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { getServiceCategories } from "@/lib/services";
import { categoryOrder, isCategorySlug } from "@/lib/services-shared";
import { getCategorySeo } from "@/lib/seo";
import { site } from "@/lib/site";
import { ArrowUpRight, Sparkle } from "@/components/ui/icons";
import ServiceIcon from "@/components/ui/ServiceIcons";
import Reveal from "@/components/ui/Reveal";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import BookingTrigger from "@/components/booking/BookingTrigger";

/* Only the category is enumerated here — `[lang]` is owned by the locale
   layout, and Next composes the two sets. */
export function generateStaticParams() {
  return categoryOrder.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}): Promise<Metadata> {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isCategorySlug(category)) return {};

  const dict = await getDictionary(lang);
  const copy = dict.services.categories[category];
  const meta = await getCategorySeo(category, lang, {
    title: copy.metaTitle,
    description: copy.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/services/${category}`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/services/${category}`]),
        ["x-default", `/en/services/${category}`],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/services/${category}`,
    },
  };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>;
}) {
  const { lang, category } = await params;
  if (!isLocale(lang) || !isCategorySlug(category)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.services.page;

  /* One query for all five, then split. Fetching the current category and
     the "other directions" list separately would be two round trips for the
     same rows. */
  const categories = await getServiceCategories(dict.services.categories, locale);
  const current = categories.find((entry) => entry.slug === category);
  /* The direction exists as a route but has no services in the CMS — an
     empty page is worse than an honest 404. */
  if (!current) notFound();

  const others = categories.filter((entry) => entry.slug !== category);
  const copy = dict.services.categories[category];

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
      {
        "@type": "ListItem",
        position: 3,
        name: current.title,
        item: `${site.url}/${locale}/services/${category}`,
      },
    ],
  };

  /* Each service is a named MedicalProcedure with the copy that is actually
     on the page. `url` points at the anchor it lives at, so the entity and
     the visible content resolve to the same place. */
  const proceduresLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: current.title,
    itemListElement: current.items.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "MedicalProcedure",
        name: service.title,
        description: service.lead || service.blurb,
        url: `${site.url}/${locale}/services/${category}#${service.slug}`,
        provider: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
      },
    })),
  };

  return (
    <>
      <PageHero
        eyebrow={dict.services.label}
        title={current.title}
        lead={copy.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[
          { label: t.breadcrumbHome, href: `/${locale}` },
          { label: dict.nav.services, href: route(locale, "services") },
          { label: current.title },
        ]}
        aside={
          <Reveal delay={160}>
            <nav aria-label={t.inCategory} className="border-t border-ivory-400 pt-8">
              <h2 className="label-micro">{t.inCategory}</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {current.items.map((service) => (
                  <li key={service.slug}>
                    <a
                      href={`#${service.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-ivory-600 bg-ivory-50 px-4 py-2 text-xs text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                    >
                      <ServiceIcon name={service.slug} className="h-4 w-4 text-accent-600" />
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        }
      />

      <section className="section relative overflow-hidden bg-ivory-100">
        <div className="aura -right-52 top-1/3 h-[30rem] w-[30rem] opacity-25" aria-hidden="true" />

        <div className="shell relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-8">
            <div className="space-y-6">
              {current.items.map((service, index) => {
                return (
                  <Reveal key={service.slug} delay={Math.min(index, 3) * 60}>
                    {/* `scroll-mt` rather than relying on the global
                        scroll-padding alone: these are the anchor targets
                        every in-page link and every mega-menu entry lands
                        on, and the fixed header is 64px once scrolled. */}
                    <article id={service.slug} className="card scroll-mt-28 p-7 lg:p-9">
                      <div className="flex items-start gap-5">
                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">
                          <ServiceIcon name={service.slug} className="h-8 w-8" />
                        </span>
                        <div>
                          <h2 className="font-display text-2xl leading-snug lg:text-3xl">
                            {service.title}
                          </h2>
                          <p className="mt-1.5 text-sm text-ink-600">{service.blurb}</p>
                        </div>
                      </div>

                      {service.lead && (
                        <p className="mt-7 text-base leading-relaxed text-ink-700">
                          {service.lead}
                        </p>
                      )}

                      {service.whatsIncluded.length > 0 && (
                        <>
                          <div className="mt-7 h-px w-full bg-ivory-400" aria-hidden="true" />

                          <h3 className="mt-6 label-micro">{t.whatsIncluded}</h3>
                          <ul className="mt-4 space-y-3">
                            {service.whatsIncluded.map((point) => (
                              <li key={point} className="flex items-start gap-3">
                                <Sparkle className="mt-1 h-3.5 w-3.5 shrink-0 text-accent-500" />
                                <span className="text-base leading-relaxed text-ink-700">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Sidebar ---------------------------------------------------- */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <div className="card p-7">
                  <h2 className="label-micro">{t.otherDirections}</h2>
                  <ul className="mt-5 space-y-1">
                    {others.map((entry) => (
                      <li key={entry.slug}>
                        <Link
                          href={entry.href}
                          className="group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent-50"
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200 transition-colors group-hover:bg-accent-100">
                            <ServiceIcon name={entry.slug} className="h-5 w-5" />
                          </span>
                          <span className="text-sm leading-snug text-ink-800 transition-colors group-hover:text-accent-700">
                            {entry.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={route(locale, "services")}
                    className="group mt-5 inline-flex items-center gap-2 border-t border-ivory-400 pt-5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
                  >
                    {dict.nav.allServices}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="mt-5 rounded-card border border-accent-200 bg-accent-50 p-7">
                  <p className="font-display text-xl leading-snug text-ink-900">{t.ctaTitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700">
                    {dict.contact.lead}
                  </p>
                  <BookingTrigger className="btn-primary mt-6 w-full">
                    {dict.nav.book}
                  </BookingTrigger>
                </div>
              </Reveal>
            </div>
          </aside>
        </div>
      </section>

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(proceduresLd) }}
      />
    </>
  );
}
