import Image from "next/image";

import type { LandingPage } from "@/payload-types";
import { landingMediaAsset, populatedDoctor } from "@/lib/landing-pages";
import Reveal from "@/components/ui/Reveal";

export default function LandingDoctor({ campaign }: { campaign: LandingPage }) {
  const section = campaign.doctor;
  const doctor = populatedDoctor(section?.practitioner);
  if (!section?.enabled || !doctor) return null;

  const photo = landingMediaAsset(doctor.photo, "card");
  const tags = doctor.tags?.map((item) => item.text).filter(Boolean) ?? [];

  return (
    <section className="section border-b border-ivory-400 bg-ivory-200">
      <div className="shell grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
        {photo ? (
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift lg:col-span-5">
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1280px) 480px, (min-width: 1024px) 40vw, 92vw"
              className="object-cover"
              style={{ objectPosition: photo.objectPosition }}
            />
          </Reveal>
        ) : null}
        <Reveal delay={photo ? 120 : 0} className={photo ? "lg:col-span-7" : "lg:col-span-9 lg:col-start-3"}>
          <p className="eyebrow">{doctor.role}</p>
          <h2 className="mt-6 fluid-title font-display">{section.heading || doctor.name}</h2>
          {section.heading ? (
            <p className="mt-4 font-display text-2xl text-accent-700">{doctor.name}</p>
          ) : null}
          {section.intro ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-700">{section.intro}</p>
          ) : doctor.focus ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-700">{doctor.focus}</p>
          ) : null}
          {tags.length ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag} className="rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-xs text-accent-700">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
