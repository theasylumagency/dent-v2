import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/routes";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

export default function QualityCertification({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const copy = dict.qualityCertification;

  return (
    <section
      id="quality"
      aria-labelledby="quality-title"
      className="relative overflow-hidden border-y border-mist-200 bg-mist-100 py-16 sm:py-20 lg:py-24"
    >
      <div className="shell grid items-center gap-10 lg:grid-cols-12 lg:gap-16 xl:gap-24">
        <Reveal className="lg:order-2 lg:col-span-7">
          <p className="eyebrow">{copy.label}</p>
          <h2
            id="quality-title"
            className="mt-5 max-w-2xl font-display text-[clamp(2rem,3.8vw,3.5rem)] leading-[1.16] text-brand-900"
          >
            {copy.title}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-800 sm:text-lg">
            {copy.lead}
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-700 sm:text-base">
            {copy.description}
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-mist-300 pt-6">
            {copy.principles.map((principle) => (
              <li key={principle} className="flex items-center gap-2.5 text-sm text-brand-800">
                <svg className="h-4 w-4 shrink-0 text-accent-600" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {principle}
              </li>
            ))}
          </ul>

          <Link
            href={route(lang, "certificate")}
            className="group mt-7 inline-flex min-h-11 items-center gap-3 rounded-sm text-sm font-medium text-accent-700 transition-colors hover:text-brand-900"
          >
            {copy.cta}
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-mist-300 transition-colors group-hover:bg-accent-200">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={100} className="w-full max-w-[28rem] justify-self-center lg:order-1 lg:col-span-5">
          <figure className="relative isolate overflow-hidden rounded-[1.75rem] bg-brand-900 px-6 py-8 text-center shadow-lift sm:px-8 sm:py-10">
            {/* An original typographic illustration, not an ISO logo or a
                reproduction of the clinic's certificate. */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-brand-700),transparent_70%)]" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-accent-200/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-accent-200/10" aria-hidden="true" />

            <p className="text-[0.65rem] font-medium tracking-[0.24em] text-accent-200">TOTAL CHARM DENT</p>

            <div className="relative mx-auto my-7 flex aspect-square w-full max-w-64 items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 280 280" fill="none" className="absolute inset-0 h-full w-full text-accent-200">
                <circle cx="140" cy="140" r="135" stroke="currentColor" strokeOpacity="0.25" />
                <circle cx="140" cy="140" r="124" stroke="currentColor" strokeOpacity="0.45" strokeDasharray="1 8" />
                <circle cx="140" cy="140" r="112" stroke="currentColor" strokeOpacity="0.65" />
                <path d="M140 5v12m0 246v12M5 140h12m246 0h12" stroke="currentColor" />
              </svg>
              <div className="relative flex flex-col items-center pb-2">
                <span className="pl-[0.3em] text-lg font-medium tracking-[0.3em] text-accent-200">ISO</span>
                <span className="mt-1 text-[clamp(3.75rem,8vw,4.75rem)] font-medium leading-none tracking-[-0.06em] text-ivory-50">9001</span>
                <span className="mt-5 flex h-9 w-9 items-center justify-center rounded-full bg-accent-200 text-brand-900">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                    <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>

            <figcaption className="relative mx-auto max-w-64 border-t border-accent-200/20 pt-5 text-sm leading-relaxed text-ivory-100">
              <span className="sr-only">ISO 9001 — </span>
              {copy.caption}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
