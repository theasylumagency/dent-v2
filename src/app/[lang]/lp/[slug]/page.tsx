import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import LandingClinic from "@/components/landing/LandingClinic";
import LandingDoctor from "@/components/landing/LandingDoctor";
import LandingEnded from "@/components/landing/LandingEnded";
import LandingFinalCta from "@/components/landing/LandingFinalCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingHero from "@/components/landing/LandingHero";
import LandingLeadForm from "@/components/landing/LandingLeadForm";
import LandingProblemSolution from "@/components/landing/LandingProblemSolution";
import LandingReasons from "@/components/landing/LandingReasons";
import LandingSteps from "@/components/landing/LandingSteps";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import { getClinic } from "@/lib/clinic";
import {
  getLandingPage,
  getLandingPageSlugs,
  landingMediaAsset,
  populatedRedirect,
  populatedService,
} from "@/lib/landing-pages";
import { getServices } from "@/lib/services";
import { media, site } from "@/lib/site";

/** Existing campaigns are prerendered; new CMS slugs are generated and
 * cached on their first request, then invalidated by the collection hook. */
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) return [];
  const slugs = await getLandingPageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const [campaign, dict] = await Promise.all([
    getLandingPage(slug, lang),
    getDictionary(lang),
  ]);
  if (!campaign || campaign.status === "draft") notFound();

  const redirects =
    campaign.status === "archived" && campaign.archivedBehavior === "redirect";
  const canIndex = campaign.status === "active" && campaign.indexable === true;
  const title = campaign.seo?.metaTitle?.trim() || campaign.hero.headline;
  const description =
    campaign.seo?.metaDescription?.trim() || campaign.hero.subheadline?.trim() || "";
  const social =
    landingMediaAsset(campaign.seo?.socialImage, "wide") ||
    landingMediaAsset(campaign.hero.desktopImage, "wide");
  const path = `/${lang}/lp/${campaign.slug}`;

  if (redirects) {
    return {
      title,
      robots: { index: false, follow: false },
    };
  }

  const image = social
    ? { url: social.url, width: social.width, height: social.height, alt: social.alt }
    : { url: media.heroPoster, width: 1200, height: 1166, alt: dict.meta.ogAlt };

  return {
    title,
    description,
    robots: { index: canIndex, follow: canIndex },
    alternates: {
      canonical: path,
      languages: Object.fromEntries([
        ...locales.map((locale) => [htmlLang[locale], `/${locale}/lp/${campaign.slug}`]),
        ["x-default", `/en/lp/${campaign.slug}`],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      locale: htmlLang[lang].replace("-", "_"),
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;

  const [campaign, dict] = await Promise.all([
    getLandingPage(slug, locale),
    getDictionary(locale),
  ]);
  if (!campaign || campaign.status === "draft") notFound();

  if (campaign.status === "archived" && campaign.archivedBehavior === "redirect") {
    const target = populatedRedirect(campaign.redirectTarget);
    if (!target || target.status === "draft" || target.slug === campaign.slug) notFound();

    /* 307 is intentional: the destination is an editor-controlled campaign
       relationship and may be corrected later. A browser-cached 308 would
       make that correction ineffective for returning visitors. */
    redirect(`/${locale}/lp/${target.slug}`);
  }

  if (campaign.status === "archived" && campaign.archivedBehavior === "ended-page") {
    return <LandingEnded campaign={campaign} lang={locale} />;
  }

  const clinicPromise = getClinic(locale, dict.contact);
  const servicesPromise = campaign.form.showService ? getServices(locale) : Promise.resolve([]);
  const [clinic, services] = await Promise.all([clinicPromise, servicesPromise]);
  const options = services.map((service) => ({ value: service.slug, label: service.title }));
  const defaultService = populatedService(campaign.form.defaultService)?.title;

  return (
    <>
      <LandingHeader campaign={campaign} clinic={clinic} lang={locale} />
      <main id="main">
        <LandingHero campaign={campaign} />
        <LandingReasons campaign={campaign} />
        <LandingLeadForm
          campaign={campaign}
          dict={dict}
          options={options}
          defaultService={defaultService}
        />
        <LandingProblemSolution campaign={campaign} />
        <LandingDoctor campaign={campaign} />
        <LandingSteps campaign={campaign} />
        <LandingTestimonials campaign={campaign} />
        <LandingClinic campaign={campaign} clinic={clinic} />
        <LandingFinalCta campaign={campaign} />
      </main>
      <LandingFooter
        clinic={clinic}
        lang={locale}
        slug={campaign.slug}
        languageLabel={dict.nav.language}
        privacySettingsLabel={dict.footer.privacySettings}
        rightsLabel={dict.footer.rights}
      />
    </>
  );
}
