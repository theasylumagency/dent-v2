import type { LandingPage } from "@/payload-types";
import type { LandingCopy } from "@/lib/landing-copy";
import Reveal from "@/components/ui/Reveal";
import LandingCtaLink from "./LandingCtaLink";

export default function LandingFinalCta({
  campaign,
  copy,
}: {
  campaign: LandingPage;
  copy: LandingCopy;
}) {
  const context = { landingSlug: campaign.slug, campaignName: campaign.campaignName };

  return (
    <section className="relative overflow-hidden bg-brand-950 py-20 on-dark sm:py-28">
      <div className="aura -right-36 top-0 h-[30rem] w-[30rem] opacity-20" aria-hidden="true" />
      <div className="shell relative text-center">
        <Reveal>
          <h2 className="mx-auto max-w-4xl fluid-title font-display text-ivory-50">
            {copy.finalCta.title}
          </h2>
        </Reveal>
        {copy.finalCta.text ? (
          <Reveal delay={90}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ivory-200">
              {copy.finalCta.text}
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={180}>
          <LandingCtaLink href="#landing-lead-form" context={context} className="btn-primary mt-9">
            {copy.finalCta.buttonLabel}
          </LandingCtaLink>
        </Reveal>
      </div>
    </section>
  );
}
