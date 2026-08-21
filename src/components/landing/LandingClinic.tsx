import Image from "next/image";

import type { LandingPage } from "@/payload-types";
import type { Clinic } from "@/lib/clinic";
import { landingMediaAsset } from "@/lib/landing-pages";
import { site } from "@/lib/site";

export default function LandingClinic({
  campaign,
  clinic,
}: {
  campaign: LandingPage;
  clinic: Clinic;
}) {
  const section = campaign.clinicSection;
  if (!section?.enabled) return null;
  const image = landingMediaAsset(section.image, "wide");

  return (
    <section className="section border-b border-ivory-400 bg-ivory-100">
      <div className="shell grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
        <div className={image ? "lg:col-span-5" : "lg:col-span-8"}>
          <p className="eyebrow">{site.name}</p>
          {section.title ? <h2 className="mt-6 fluid-title font-display">{section.title}</h2> : null}
          {section.text ? (
            <p className="mt-6 text-base leading-relaxed text-ink-700">{section.text}</p>
          ) : null}
          <address className="mt-8 not-italic">
            <p className="font-medium text-ink-900">{clinic.address}</p>
            <p className="mt-2 text-sm text-ink-600">{clinic.hours}</p>
            <a href={`tel:${clinic.phoneHref}`} className="mt-5 inline-flex text-sm font-medium text-accent-700 hover:text-accent-600">
              {clinic.phone}
            </a>
          </address>
        </div>
        {image ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift lg:col-span-7">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1280px) 650px, (min-width: 1024px) 55vw, 92vw"
              className="object-cover"
              style={{ objectPosition: image.objectPosition }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
