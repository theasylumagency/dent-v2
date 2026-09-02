import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCases } from "@/lib/cases";
import { isRouteReady } from "@/lib/routes";
import { getSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import BookingTrigger from "@/components/booking/BookingTrigger";
import CaseEntry from "@/components/cases/CaseEntry";
import Reveal from "@/components/ui/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = (await getDictionary(lang)).cases.page;
  const meta = await getSeo("cases", lang, {
    title: t.metaTitle,
    description: t.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    /* Unlinked but reachable while the page waits on its cases: nothing
       points here, yet a URL that exists can still be found. An empty page
       indexed on a medical domain is the exact harm `Doctors.published`
       guards against, so it says so itself until the switch flips. */
    robots: isRouteReady("cases") ? undefined : { index: false },
    alternates: {
      canonical: `/${lang}/cases`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/cases`]),
        ["x-default", "/en/cases"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/cases`,
    },
  };
}

/**
 * The clinical cases page.
 *
 * Cases are anchors on this one page rather than pages of their own — the
 * reasoning `lib/routes.ts` sets out for individual services applies with
 * more force here, because a handful of cases would make a handful of thin
 * pages competing for the same queries.
 *
 * **The page renders with nothing in it rather than 404ing.** It is in the
 * header and in the sitemap, so a missing page is a broken link and a crawl
 * error; an empty one is a clinic that has not published a case yet, which
 * is the truth. `getCases` filters on consent as well as on publication —
 * see the note at the top of that module.
 *
 * The structured data is a breadcrumb and a plain list of case names. No
 * `ImageObject`, no `Review`: a before/after photograph marked up as a
 * testimonial is a claim this site is not in a position to make, and the
 * page earns its trust from the pictures themselves.
 */
export default async function CasesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.cases.page;
  const entries = await getCases(locale);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: dict.nav.cases, item: `${site.url}/${locale}/cases` },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.title,
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.title,
      url: `${site.url}/${locale}/cases#${entry.slug}`,
    })),
  };

  return (
    <>
      <PageHero
        /* The section label, not the nav label: the nav reads "ისტორიები"
           and the h1 below reads "ღიმილის ისტორიები", so the nav word would
           have echoed the title one line above it. This is the same label
           the home page teaser wears, which is what ties the door to the
           room. */
        eyebrow={dict.cases.label}
        title={t.title}
        lead={t.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[{ label: t.breadcrumbHome, href: `/${locale}` }, { label: dict.nav.cases }]}
        /* The consent line sits in the hero, above the first photograph
           rather than in a footnote below the last one: it answers the
           question a visitor has *before* they scroll into someone else's
           mouth, not after. */
        aside={
          <p className="glass max-w-2xl rounded-2xl px-5 py-4 text-xs leading-relaxed text-ink-600">
            {t.consentNote}
          </p>
        }
      />

      {entries.length > 0 ? (
        entries.map((entry, index) => (
          <CaseEntry
            key={entry.slug}
            entry={entry}
            dict={dict}
            index={index}
            directionTitle={dict.services.categories[entry.direction].title}
          />
        ))
      ) : (
        <section className="section border-b border-ivory-300 bg-ivory-100">
          <div className="shell">
            <Reveal className="max-w-xl">
              <p className="leading-relaxed text-ink-700">{t.empty}</p>
              <BookingTrigger className="btn-primary mt-8">{dict.nav.book}</BookingTrigger>
            </Reveal>
          </div>
        </section>
      )}

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {entries.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
        />
      ) : null}
    </>
  );
}
