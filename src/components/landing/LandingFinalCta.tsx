import type { LandingPage } from "@/payload-types";
import LandingCtaLink from "./LandingCtaLink";

export default function LandingFinalCta({ campaign }: { campaign: LandingPage }) {
  const context = { landingSlug: campaign.slug, campaignName: campaign.campaignName };

  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 on-dark sm:py-28">
      <div className="aura -right-36 top-0 h-[30rem] w-[30rem] opacity-20" aria-hidden="true" />
      <div className="shell relative text-center">
        <h2 className="mx-auto max-w-4xl fluid-title font-display text-ivory-50">
          {campaign.finalCta.title}
        </h2>
        {campaign.finalCta.text ? (
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ivory-200">
            {campaign.finalCta.text}
          </p>
        ) : null}
        <LandingCtaLink href="#landing-lead-form" context={context} className="btn-primary mt-9">
          {campaign.finalCta.buttonLabel}
        </LandingCtaLink>
      </div>
    </section>
  );
}
