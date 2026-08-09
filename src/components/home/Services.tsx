import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { getServiceCategories } from "@/lib/services";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * The home page leads with five clinical directions, not all 16 services —
 * the exhaustive list belongs on the services page. Each card still links
 * every service underneath it, so nothing is buried.
 *
 * Layout: a 6-column grid on desktop. The first two cards take three columns,
 * the remaining three take two — five cards, two tidy rows, no orphan.
 */
export default function Services({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const categories = getServiceCategories(dict, lang);

  return (
    <section
      id="services"
      className="section relative overflow-hidden border-y border-ivory-400 bg-ivory-200"
    >
      <div className="aura -left-40 top-1/4 h-[30rem] w-[30rem] opacity-30" aria-hidden="true" />
      <div className="aura -right-56 bottom-0 h-[26rem] w-[26rem] opacity-20" aria-hidden="true" />

      <div className="shell relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">{dict.services.label}</p>
            <h2 className="mt-6 fluid-title font-display">{dict.services.title}</h2>
            <p className="mt-6 text-base leading-relaxed text-ink-700">{dict.services.lead}</p>
          </Reveal>

          <Reveal delay={120}>
            <Link
              href={route(lang, "services")}
              className="group inline-flex items-center gap-2.5 whitespace-nowrap text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              {dict.services.viewAll}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:mt-16 lg:grid-cols-6 lg:gap-6">
          {categories.map((category, index) => (
            <li
              key={category.slug}
              className={
                index < 2
                  ? "lg:col-span-3"
                  : index === 4
                    ? "md:col-span-2 lg:col-span-2"
                    : "lg:col-span-2"
              }
            >
              <Reveal delay={Math.min(index, 4) * 45} className="h-full">
                {/* No hover translate.
                    The card is a stretched link *and* contains its own
                    service links; lifting the whole card on hover slid
                    those pills out from under the cursor mid-click. The
                    border and shadow carry the affordance instead. */}
                <article className="group card relative flex h-full flex-col p-7 transition-[border-color,box-shadow] duration-300 hover:border-accent-400 hover:shadow-lift lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-accent-50 ring-1 ring-inset ring-accent-200 transition-colors duration-500 group-hover:bg-accent-100">
                      <Image
                        src={category.icon}
                        alt=""
                        fill
                        /* 2x the rendered 64px — the source art is raster,
                           so asking for 64px served a blurry icon on every
                           retina screen. TODO(design): these are line art
                           and belong in SVG. */
                        sizes="128px"
                        className="object-contain p-1.5 transition-transform duration-700 group-hover:scale-110"
                      />
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-2xl leading-snug">
                    <Link
                      href={category.href}
                      className="inline-flex items-start gap-2 transition-colors hover:text-accent-700"
                    >
                      {/* Stretched link: the whole card is the hit target, but
                          the service pills below sit above it via z-index. */}
                      <span className="after:absolute after:inset-0 after:content-['']">
                        {category.title}
                      </span>
                      <ArrowUpRight
                        className="mt-2 h-4 w-4 shrink-0 text-accent-500 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </h3>

                  <p className="mt-4 flex-1 text-base leading-relaxed text-ink-700">
                    {category.blurb}
                  </p>

                  <div className="mt-7 h-px w-full bg-ivory-400" aria-hidden="true" />

                  <ul className="relative z-10 mt-5 flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={item.href}
                          className="inline-flex rounded-full border border-ivory-600 bg-ivory-100 px-3 py-1.5 text-xs leading-none text-ink-700 transition-colors duration-300 hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal delay={100}>
          <p className="mt-10 text-center text-sm tracking-wide text-ink-600">
            {dict.services.categoriesNote}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
