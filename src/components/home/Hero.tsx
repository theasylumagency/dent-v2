import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { ArrowUpRight, ChevronDown } from "@/components/ui/icons";
import HeroMedia from "./HeroMedia";

/**
 * Light hero. The media sits in a rounded frame rather than running
 * full-bleed behind darkened text — on an ivory page a full-bleed video
 * would force the heavy grading the client asked us to drop.
 */
export default function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <section className="relative grain overflow-hidden bg-ivory-100 pb-16 pt-28 lg:pb-24 lg:pt-40">
      <div className="aura -left-52 -top-24 h-[34rem] w-[34rem] opacity-40" aria-hidden="true" />
      <div className="aura right-[-14rem] top-40 h-[30rem] w-[30rem] opacity-30" aria-hidden="true" />

      <div className="shell relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Copy ------------------------------------------------------ */}
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="eyebrow">{dict.hero.eyebrow}</p>

            <h1 className="mt-7 fluid-display font-display">
              <span className="block">{dict.hero.titleTop}</span>
              <span className="block text-gradient display-italic">{dict.hero.titleBottom}</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">
              {dict.hero.lead}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={route(lang, "contact")} className="btn-primary">
                {dict.hero.ctaPrimary}
                <ArrowUpRight />
              </Link>
              <Link href={route(lang, "services")} className="btn-ghost">
                {dict.hero.ctaSecondary}
              </Link>
            </div>
          </div>

          {/* Media frame ----------------------------------------------- */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div
                className="absolute -inset-3 rounded-[2rem] border border-accent-200 bg-accent-50/60 lg:-inset-4"
                aria-hidden="true"
              />

              <HeroMedia dict={dict} />

              {/* Floating hours card. Hidden on the narrowest screens by
                  design, not by omission — the fact row below repeats the
                  same opening hours and is visible at every width. */}
              <div className="glass absolute -bottom-6 left-4 hidden rounded-2xl px-5 py-4 sm:block lg:-left-8">
                <p className="label-micro text-accent-700">{dict.contact.hoursLabel}</p>
                <p className="mt-1.5 font-display text-xl text-ink-900">{dict.contact.hours}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fact row ----------------------------------------------------
            flex-col-reverse keeps the value visually on top while the
            markup stays <dt> (the label) before <dd> (the value), which
            is the pairing a screen reader announces. The original hid the
            <dt> and put both strings inside the <dd>. */}
        <dl className="card mt-20 grid grid-cols-1 divide-y divide-ivory-300 overflow-hidden sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {dict.hero.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse px-6 py-6 lg:px-8 lg:py-7">
              <dt className="mt-2 text-xs leading-relaxed tracking-wide text-ink-600">
                {fact.label}
              </dt>
              <dd className="font-display text-3xl text-accent-700 sm:text-4xl">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {/* Scroll cue — a real link now, so it is keyboard reachable and
            actually does the thing it is inviting. */}
        <Link
          href="#clinic"
          className="group mt-10 hidden items-center gap-3 text-ink-600 transition-colors hover:text-accent-700 lg:inline-flex"
        >
          <span className="label-micro text-current">{dict.hero.scroll}</span>
          <span className="relative h-px w-24 overflow-hidden bg-ivory-400">
            <span className="absolute inset-y-0 left-0 w-8 animate-[slide_2.4s_ease-in-out_infinite] bg-accent-400" />
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
        </Link>
      </div>

      <style>{`@keyframes slide{0%{transform:translateX(-100%)}60%,100%{transform:translateX(300%)}}`}</style>
    </section>
  );
}
