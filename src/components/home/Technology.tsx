import Link from "next/link";

import type { Dictionary } from "@/i18n/dictionaries";
import { getDeviceGroups, getManufacturers } from "@/lib/equipment";
import { route } from "@/lib/routes";
import { ArrowUpRight, Sparkle } from "@/components/ui/icons";
import ServiceIcon from "@/components/ui/ServiceIcons";
import Reveal from "@/components/ui/Reveal";

/**
 * Home-page teaser for `/[lang]/technology`.
 *
 * This section used to carry the five numbered capability claims. Those
 * moved wholesale to the technology page rather than being duplicated: the
 * same five paragraphs on two URLs would have left Google to pick which
 * one to rank, and it does not pick the one you want.
 *
 * What is left is the part the home page is better at — naming the actual
 * machines. A list of eight recognisable models is concrete, scans in two
 * seconds, and gives anyone who cares a reason to click through; the
 * argument for why each one matters belongs on the page that has room for
 * it.
 */
export default function Technology({ dict, lang }: { dict: Dictionary; lang: string }) {
  const devices = getDeviceGroups(dict, lang).flatMap((group) => group.items);
  const manufacturers = getManufacturers();
  const technologyHref = route(lang, "technology");

  return (
    <section id="technology" className="section-airy relative overflow-hidden bg-ivory-100">
      <div className="aura left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 opacity-25" aria-hidden="true" />

      <div className="shell relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{dict.technology.label}</p>
          <h2 className="mt-6 fluid-title font-display">{dict.technology.title}</h2>
          {/* `technology.lead` is deliberately not reused here: it ends in
              a colon because it introduces the five capability claims, and
              those now live on the technology page. The teaser gets its own
              sentence rather than a dangling lead-in to a list that is no
              longer below it. */}
          <p className="mt-6 text-base leading-relaxed text-ink-700">
            {dict.technology.teaserLead}
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="label-micro">{dict.technology.teaserLabel}</p>
            </Reveal>

            {/* Each row deep-links to that device's block rather than to
                the top of the page, so the click lands on the thing the
                person just read the name of. */}
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-10">
              {devices.map((device, index) => (
                <li key={device.slug}>
                  <Reveal delay={Math.min(index, 5) * 40}>
                    <Link
                      href={`${technologyHref}#${device.slug}`}
                      className="group flex items-baseline justify-between gap-4 border-t border-ivory-400 py-4 transition-colors hover:border-accent-400"
                    >
                      <span className="font-display text-lg leading-snug transition-colors group-hover:text-accent-700">
                        {device.name}
                      </span>
                      <span className="shrink-0 text-xs text-ink-600">
                        {device.manufacturer.name}
                      </span>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>

            <Reveal delay={120}>
              <Link
                href={technologyHref}
                className="group mt-10 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
              >
                {dict.technology.teaserCta}
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={140}>
              <div className="sticky top-28 space-y-6">
                <div className="card relative overflow-hidden p-8">
                  {/* Four of the pieces of equipment the list beside this
                      talks about, rather than two decorative tiles. */}
                  <div className="grid grid-cols-2 gap-4">
                    {(["tomography", "digital-modelling", "visiograph", "implantation"] as const).map(
                      (name) => (
                        <span
                          key={name}
                          className="flex aspect-square items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200"
                        >
                          <ServiceIcon name={name} className="h-12 w-12" />
                        </span>
                      ),
                    )}
                  </div>

                  <div className="mt-8 flex items-start gap-3 border-t border-ivory-400 pt-6">
                    <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <p className="text-base leading-relaxed text-ink-700">{dict.technology.note}</p>
                  </div>

                  {/* Outbound links to the manufacturers named in the list.
                      They tie this clinic to entities search and AI engines
                      already recognise, and they let a patient verify the
                      claim instead of taking it on trust. The list is
                      derived from `equipment.ts`, so it cannot drift from
                      the devices it is supposed to describe. */}
                  <div className="mt-6 border-t border-ivory-400 pt-5">
                    <p className="label-micro">{dict.technology.brandsLabel}</p>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                      {manufacturers.map((brand) => (
                        <li key={brand.url}>
                          <a
                            href={brand.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-ink-700 underline decoration-ivory-500 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-400"
                          >
                            {brand.name}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-card border border-accent-200 bg-accent-50 p-8">
                  <p className="eyebrow">{dict.care.label}</p>
                  <h3 className="mt-4 font-display text-2xl leading-snug">{dict.care.title}</h3>
                  <ul className="mt-6 space-y-4">
                    {dict.care.items.map((item) => (
                      <li key={item} className="flex gap-3 text-base leading-relaxed text-ink-700">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
