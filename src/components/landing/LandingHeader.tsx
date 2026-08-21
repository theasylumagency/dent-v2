import Image from "next/image";
import Link from "next/link";

import type { LandingPage } from "@/payload-types";
import type { Locale } from "@/i18n/config";
import type { Clinic } from "@/lib/clinic";
import { media, site } from "@/lib/site";
import LandingCtaLink from "./LandingCtaLink";

export default function LandingHeader({
  campaign,
  clinic,
  lang,
}: {
  campaign: LandingPage;
  clinic: Clinic;
  lang: Locale;
}) {
  const { header } = campaign;
  const showTrust = header.preset === "brand" && Boolean(header.trustText);
  const showPhone = header.preset !== "ultra-minimal" && header.showPhone !== false;
  const context = { landingSlug: campaign.slug, campaignName: campaign.campaignName };

  return (
    <header className="sticky top-0 z-50 border-b border-ivory-400/80 bg-ivory-50/95 backdrop-blur-xl">
      <div className="shell flex min-h-20 items-center justify-between gap-5 py-3">
        <Link href={`/${lang}`} aria-label={site.name} className="shrink-0 rounded-md">
          <Image
            src={media.logo}
            alt={site.name}
            width={200}
            height={175}
            unoptimized
            className="h-11 w-auto sm:h-12"
          />
        </Link>

        {showTrust ? (
          <p className="hidden max-w-sm text-center text-xs leading-relaxed text-ink-600 lg:block">
            {header.trustText}
          </p>
        ) : null}

        <div className="flex items-center gap-3 sm:gap-5">
          {showPhone ? (
            <a
              href={`tel:${clinic.phoneHref}`}
              className="hidden text-sm font-medium text-ink-800 transition-colors hover:text-accent-700 sm:inline"
            >
              {clinic.phone}
            </a>
          ) : null}
          <LandingCtaLink href="#landing-lead-form" context={context} className="btn-primary !px-5 !py-2.5 text-xs sm:!px-6">
            {header.ctaLabel}
          </LandingCtaLink>
        </div>
      </div>
    </header>
  );
}
