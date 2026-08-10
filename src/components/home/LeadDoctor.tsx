import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import { leadPhoto } from "@/lib/team";
import Reveal from "@/components/ui/Reveal";

export default function LeadDoctor({ dict }: { dict: Dictionary }) {
  return (
    <section className="section relative overflow-hidden bg-ivory-100">
      <div className="aura -right-24 top-0 h-[26rem] w-[26rem] opacity-30" aria-hidden="true" />

      <div className="shell relative grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <Reveal className="lg:col-span-5">
          <div className="relative">
            <div
              className="absolute -inset-x-6 -top-6 bottom-16 rounded-[2rem] border border-accent-200 bg-accent-50/50"
              aria-hidden="true"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift">
              <Image
                src={leadPhoto}
                alt={`${dict.doctor.name} — ${dict.doctor.role}`}
                fill
                sizes="(min-width: 1024px) 38vw, 90vw"
                className="object-cover object-top"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
                aria-hidden="true"
              />
            </div>

            <div className="glass relative z-10 -mt-12 ml-6 mr-6 rounded-2xl px-5 py-4">
              <p className="label-micro text-accent-700">{dict.doctor.label}</p>
              <p className="mt-2 font-display text-2xl text-ink-900">{dict.doctor.name}</p>
              <p className="mt-1 text-xs text-ink-600">{dict.doctor.role}</p>
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <div className="flex items-baseline gap-4">
              <span className="font-display text-6xl leading-none text-accent-700 lg:text-7xl">
                {dict.doctor.experienceValue}
              </span>
              <span className="max-w-[8rem] text-sm leading-tight tracking-wide text-ink-600">
                {dict.doctor.experienceLabel}
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <p className="mt-10 font-display text-xl leading-relaxed text-ink-800 sm:text-2xl">
              {dict.doctor.credentials}
            </p>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-700">
              <p>{dict.doctor.bio1}</p>
              <p>{dict.doctor.bio2}</p>
            </div>
          </Reveal>

          <Reveal delay={220}>
            <ul className="mt-10 flex flex-wrap gap-2.5">
              {dict.doctor.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-xs tracking-wide text-accent-700"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
