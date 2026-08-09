import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";

export default function Clinic({ dict }: { dict: Dictionary }) {
  const stats = [
    { value: dict.stats.satisfiedValue, suffix: dict.stats.satisfiedSuffix, label: dict.stats.satisfied },
    { value: dict.stats.yearsValue, suffix: dict.stats.yearsSuffix, label: dict.stats.years },
    {
      value: dict.stats.specialistsValue,
      suffix: dict.stats.specialistsSuffix,
      label: dict.stats.specialists,
    },
    {
      value: dict.stats.directionsValue,
      suffix: dict.stats.directionsSuffix,
      label: dict.stats.directions,
    },
  ];

  return (
    <section id="clinic" className="section-airy relative overflow-hidden bg-ivory-100">
      <div className="aura -right-32 top-20 h-[28rem] w-[28rem] opacity-30" aria-hidden="true" />

      <div className="shell relative">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
          {/* Image collage */}
          <Reveal className="lg:col-span-5">
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift">
                <Image
                  src={media.interior[0]}
                  alt={dict.mission.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
                  aria-hidden="true"
                />
              </div>

              <div className="absolute -bottom-10 -right-6 hidden w-48 overflow-hidden rounded-2xl border-4 border-ivory-100 shadow-lift sm:block lg:-right-10 lg:w-56">
                <div className="relative aspect-square">
                  <Image
                    src={media.interior[1]}
                    alt={dict.mission.imageAlt}
                    fill
                    sizes="14rem"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="glass absolute -left-4 top-8 hidden rounded-2xl px-5 py-4 lg:block">
                <p className="font-display text-2xl text-ink-900">
                  {dict.stats.yearsValue}
                  <span className="text-accent-600">{dict.stats.yearsSuffix}</span>
                </p>
                <p className="mt-1 max-w-[8rem] text-xs leading-tight tracking-wide text-ink-600">
                  {dict.stats.years}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Copy */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">{dict.mission.label}</p>
              <h2 className="mt-6 fluid-title font-display">{dict.mission.title}</h2>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-10 space-y-8">
                <div className="relative border-l-2 border-accent-400 pl-6">
                  <p className="label-micro text-accent-700">{dict.mission.missionLabel}</p>
                  <p className="mt-3 text-base leading-relaxed text-ink-700">
                    {dict.mission.missionText}
                  </p>
                </div>

                <div className="relative border-l-2 border-accent-400 pl-6">
                  <p className="label-micro text-accent-700">{dict.mission.visionLabel}</p>
                  <p className="mt-3 text-base leading-relaxed text-ink-700">
                    {dict.mission.visionText}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Stats */}
        <Reveal delay={100}>
          {/* flex-col-reverse: value reads first, markup stays dt → dd. */}
          <dl className="card mt-24 grid grid-cols-2 divide-x divide-y divide-ivory-300 overflow-hidden lg:grid-cols-4 lg:divide-y-0">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse px-6 py-8 lg:px-8 lg:py-10"
              >
                <dt className="mt-3 text-xs leading-relaxed tracking-wide text-ink-600">
                  {stat.label}
                </dt>
                <dd className="font-display text-4xl text-ink-900 lg:text-5xl">
                  {stat.value}
                  <span className="text-accent-600">{stat.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
