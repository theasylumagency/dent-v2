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
import LandingMobileBar from "@/components/landing/LandingMobileBar";
import LandingProblemSolution from "@/components/landing/LandingProblemSolution";
import LandingReasons from "@/components/landing/LandingReasons";
import LandingSteps from "@/components/landing/LandingSteps";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import { campaignPath } from "@/lib/campaign-slug";
import { getClinic } from "@/lib/clinic";
import { landingCopy } from "@/lib/landing-copy";
import {
  getLandingPage,
  getLandingPageSlugs,
  landingMediaAsset,
  populatedRedirect,
  populatedService,
} from "@/lib/landing-pages";
import { getServices } from "@/lib/services";
import { media, site } from "@/lib/site";

/**
 * Campaign landing pages, served from the root of a locale: `/ka/veneers`.
 *
 * This is the only dynamic segment at this depth, and Next resolves a static
 * segment before a dynamic one, so `/ka/services` still reaches the services
 * page. `RESERVED_SLUGS` in `lib/campaign-slug.ts` stops an editor creating a
 * campaign that would land in that shadow and silently never appear.
 *
 * Existing campaigns are prerendered; a new CMS slug is generated and cached
 * on its first request, then invalidated by the collection hook.
 */
export const dynamic = "force-static";
export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
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
  const title = campaign.seo?.metaTitle?.trim() || campaign.hero?.headline || campaign.campaignName;
  const description =
    campaign.seo?.metaDescription?.trim() || campaign.hero?.subheadline?.trim() || "";
  const social =
    landingMediaAsset(campaign.seo?.socialImage, "wide") ||
    landingMediaAsset(campaign.hero?.desktopImage, "wide");
  const path = campaignPath(lang, campaign.slug);

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
        ...locales.map((locale) => [htmlLang[locale], campaignPath(locale, campaign.slug)]),
        ["x-default", campaignPath("en", campaign.slug)],
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

  const copy = landingCopy(campaign, dict);

  if (campaign.status === "archived" && campaign.archivedBehavior === "redirect") {
    const target = populatedRedirect(campaign.redirectTarget);
    if (!target || target.status === "draft" || target.slug === campaign.slug) notFound();

    /* 307 is intentional: the destination is an editor-controlled campaign
       relationship and may be corrected later. A browser-cached 308 would
       make that correction ineffective for returning visitors. */
    redirect(campaignPath(locale, target.slug));
  }

  if (campaign.status === "archived" && campaign.archivedBehavior === "ended-page") {
    return <LandingEnded copy={copy} lang={locale} />;
  }

  const clinicPromise = getClinic(locale, dict.contact);
  const servicesPromise = campaign.form?.showService ? getServices(locale) : Promise.resolve([]);
  const [clinic, services] = await Promise.all([clinicPromise, servicesPromise]);
  const options = services.map((service) => ({ value: service.slug, label: service.title }));
  const defaultService = populatedService(campaign.form?.defaultService)?.title;
  const context = { landingSlug: campaign.slug, campaignName: campaign.campaignName };

  return (
    <>
      <LandingHeader campaign={campaign} clinic={clinic} copy={copy} lang={locale} />
      <main id="main">
        <LandingHero campaign={campaign} copy={copy} />
        {/* Watched by the mobile bar: once this scrolls above the viewport
            the hero's own call to action is gone and the bar takes over. */}
        <div id="landing-hero-end" aria-hidden="true" />
        <LandingReasons copy={copy} />
        <LandingLeadForm
          campaign={campaign}
          copy={copy}
          dict={dict}
          options={options}
          defaultService={defaultService}
        />
        <LandingProblemSolution campaign={campaign} />
        <LandingDoctor campaign={campaign} />
        <LandingSteps copy={copy} />
        <LandingTestimonials campaign={campaign} />
        <LandingClinic campaign={campaign} clinic={clinic} />
        <LandingFinalCta campaign={campaign} copy={copy} />
      </main>
      <LandingFooter
        clinic={clinic}
        lang={locale}
        slug={campaign.slug}
        languageLabel={dict.nav.language}
        privacySettingsLabel={dict.footer.privacySettings}
        rightsLabel={dict.footer.rights}
      />
      <LandingMobileBar
        ctaLabel={copy.heroCta}
        callLabel={`${copy.call} ${clinic.phone}`.trim()}
        whatsappLabel={dict.nav.whatsapp}
        phoneHref={clinic.phoneHref}
        whatsappHref={clinic.whatsapp ? clinic.whatsappHref : ""}
        context={context}
      />
    </>
  );
}
