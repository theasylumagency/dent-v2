import Image, { getImageProps } from "next/image";
import type { CSSProperties } from "react";

import type { LandingPage } from "@/payload-types";
import { landingMediaAsset, type LandingMediaAsset } from "@/lib/landing-pages";
import LandingCtaLink from "./LandingCtaLink";

function HeroPicture({
  desktop,
  mobile,
  sizes,
}: {
  desktop: LandingMediaAsset;
  mobile: LandingMediaAsset | null;
  sizes: string;
}) {
  if (!mobile || mobile.url === desktop.url) {
    return (
      <Image
        src={desktop.url}
        alt={desktop.alt}
        fill
        sizes={sizes}
        fetchPriority="high"
        className="object-cover"
        style={{ objectPosition: desktop.objectPosition }}
      />
    );
  }

  const common = { alt: mobile.alt || desktop.alt, sizes };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: desktop.url,
    width: desktop.width,
    height: desktop.height,
  });
  const {
    props: { srcSet: mobileSrcSet, ...mobileProps },
  } = getImageProps({
    ...common,
    src: mobile.url,
    width: mobile.width,
    height: mobile.height,
  });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
      <source media="(max-width: 767px)" srcSet={mobileSrcSet} />
      {/* `fetchPriority`, rather than deprecated `priority`, avoids eagerly
          downloading both art-directed sources on a single viewport. */}
      <img
        {...mobileProps}
        alt={mobile.alt || desktop.alt}
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover [object-position:var(--mobile-position)] md:[object-position:var(--desktop-position)]"
        style={{
          "--mobile-position": mobile.objectPosition,
          "--desktop-position": desktop.objectPosition,
        } as CSSProperties}
      />
    </picture>
  );
}

function HeroCopy({ campaign, dark = false }: { campaign: LandingPage; dark?: boolean }) {
  const { hero } = campaign;
  const context = { landingSlug: campaign.slug, campaignName: campaign.campaignName };

  return (
    <div className={dark ? "on-dark" : undefined}>
      {hero.eyebrow ? <p className="eyebrow">{hero.eyebrow}</p> : null}
      <h1 className="mt-6 max-w-4xl font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.96] tracking-[-0.025em] text-ink-900">
        {hero.headline}
      </h1>
      {hero.subheadline ? (
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-ink-700 sm:text-lg">
          {hero.subheadline}
        </p>
      ) : null}
      <LandingCtaLink href="#landing-lead-form" context={context} className="btn-primary mt-9">
        {hero.ctaLabel}
      </LandingCtaLink>
    </div>
  );
}

export default function LandingHero({ campaign }: { campaign: LandingPage }) {
  const { hero } = campaign;
  const desktop = landingMediaAsset(hero.desktopImage, "wide");
  const mobile = landingMediaAsset(hero.mobileImage, "card");
  const hasImage = hero.layout !== "copy-only" && Boolean(desktop);

  if (hero.layout === "full-bleed" && desktop) {
    return (
      <section className="relative min-h-[min(780px,calc(100dvh-5rem))] overflow-hidden bg-brand-950">
        <HeroPicture desktop={desktop} mobile={mobile} sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,18,29,0.86)_0%,rgba(4,18,29,0.54)_55%,rgba(4,18,29,0.2)_100%)]" aria-hidden="true" />
        <div className="shell relative flex min-h-[min(780px,calc(100dvh-5rem))] items-end py-20 sm:items-center sm:py-24">
          <div className="max-w-3xl [&_h1]:text-ivory-50 [&_p:not(.eyebrow)]:text-ivory-200">
            <HeroCopy campaign={campaign} dark />
          </div>
        </div>
      </section>
    );
  }

  if (hero.layout === "centered-editorial") {
    return (
      <section className="overflow-hidden border-b border-ivory-400 bg-ivory-100 py-20 sm:py-28">
        <div className="shell">
          <div className="mx-auto max-w-4xl text-center [&_.eyebrow]:justify-center [&_h1]:mx-auto [&_p:not(.eyebrow)]:mx-auto">
            <HeroCopy campaign={campaign} />
          </div>
          {desktop ? (
            <div className="relative mt-14 aspect-[16/9] overflow-hidden rounded-[2rem] shadow-lift sm:mt-18">
              <HeroPicture desktop={desktop} mobile={mobile} sizes="(min-width: 1280px) 1180px, 92vw" />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  if (!hasImage) {
    return (
      <section className="relative overflow-hidden border-b border-ivory-400 bg-ivory-100 py-24 sm:py-32">
        <div className="aura -right-32 top-0 h-[30rem] w-[30rem] opacity-30" aria-hidden="true" />
        <div className="shell relative max-w-5xl">
          <HeroCopy campaign={campaign} />
        </div>
      </section>
    );
  }

  const imageFirst = hero.layout === "image-left";
  return (
    <section className="overflow-hidden border-b border-ivory-400 bg-ivory-100">
      <div className="shell grid min-h-[650px] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
        <div className={`lg:col-span-6 ${imageFirst ? "lg:order-2" : ""}`}>
          <HeroCopy campaign={campaign} />
        </div>
        <div className={`relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift lg:col-span-6 lg:aspect-[5/6] ${imageFirst ? "lg:order-1" : ""}`}>
          <HeroPicture desktop={desktop!} mobile={mobile} sizes="(min-width: 1280px) 560px, (min-width: 1024px) 48vw, 92vw" />
        </div>
      </div>
    </section>
  );
}
