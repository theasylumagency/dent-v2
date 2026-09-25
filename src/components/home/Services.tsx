import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { getServiceCategories } from "@/lib/services";
import { ArrowUpRight } from "@/components/ui/icons";
import ServiceIcon from "@/components/ui/ServiceIcons";
import Reveal from "@/components/ui/Reveal";
import ServicesDial from "./ServicesDial";

/**
 * The five clinical directions, as an index rather than a card grid.
 *
 * One row per direction, numbered, with the title at display size doing the
 * leading and the services underneath as quiet text. The row is the link.
 *
 * From lg the index shares the screen with a dial (`ServicesDial`): pointing
 * at a row turns it to that direction's node and answers with the one-line
 * promise the row does not show. It replaced a hover photograph — see the
 * note in that file for why.
 *
 * Height: exactly one screen from lg, at least one below it
 * (`.h-viewport-lg`). Five directions named in Georgian wrap to two lines at
 * 375px, and there is no fifth of a short phone screen left to put them in,
 * so below lg the rows take their natural height and the section grows.
 * Mobile gets each direction's icon on its row instead of the dial.
 */
export default async function Services({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const categories = await getServiceCategories(dict.services.categories, lang);
  const total = categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <section
      id="services"
      className="h-viewport-lg relative overflow-hidden border-y border-ivory-400 bg-ivory-200"
    >
      <div className="aura -left-40 top-1/4 h-[30rem] w-[30rem] opacity-30" aria-hidden="true" />
      <div className="aura -right-32 bottom-0 hidden h-[26rem] w-[26rem] opacity-40 lg:block" aria-hidden="true" />

      <div className="shell fit-pad fit-stack relative flex-1">
        {/* Head ------------------------------------------------------ */}
        <Reveal className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="eyebrow">{dict.services.label}</p>
            <h2 className="mt-[clamp(0.5rem,1.4vh,1.25rem)] fluid-title font-display">
              {dict.services.title}
            </h2>
            <p className="mt-[clamp(0.5rem,1.6vh,1.5rem)] text-[clamp(0.9rem,1.8vh,1.05rem)] leading-relaxed text-ink-700">
              {dict.services.lead}
            </p>
          </div>

          <Link
            href={route(lang, "services")}
            className="group inline-flex shrink-0 items-center gap-2.5 self-start whitespace-nowrap text-sm font-medium text-accent-600 transition-colors hover:text-accent-700 lg:self-auto lg:pb-1"
          >
            {dict.services.viewAll}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </Reveal>

        {/* Index + dial --------------------------------------------- */}
        <ServicesDial
          items={categories.map((category) => ({ slug: category.slug, blurb: category.blurb }))}
          total={total}
          totalLabel={dict.stats.directions}
        >
          {/* From lg the list and every row are `flex-1`, so the rows
              divide the leftover height between them and the section
              absorbs any window by changing row height rather than
              overflowing. Below lg none of that applies. */}
          <Reveal delay={100} className="flex min-h-0 flex-col lg:flex-1">
            <ul className="flex min-h-0 flex-col border-t border-ivory-400 lg:flex-1">
              {categories.map((category, index) => (
                <li
                  key={category.slug}
                  data-dial-index={index}
                  className="group relative flex min-h-0 items-center border-b border-ivory-400 lg:flex-1"
                >
                  {/* Wash — a tint that sweeps in from the left under the
                      row. `scaleX` rather than a width or background
                      transition, so it never leaves the compositor. */}
                  <span
                    className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-accent-50 via-accent-50/60 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:scale-x-100 group-hover:scale-x-100"
                    aria-hidden="true"
                  />

                  <div className="relative flex w-full items-center gap-4 py-3.5 sm:gap-6 lg:gap-8 lg:py-[clamp(0.25rem,1vh,0.75rem)] lg:pl-2">
                    {/* Phones: the direction's icon on the row itself. */}
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-inset ring-accent-200 lg:hidden"
                      aria-hidden="true"
                    >
                      <ServiceIcon name={category.slug} className="h-6 w-6" />
                    </span>

                    <span
                      className="hidden shrink-0 font-display text-[clamp(0.8rem,1.7vh,1rem)] tabular-nums text-accent-500 transition-colors duration-500 group-focus-within:text-accent-700 group-hover:text-accent-700 lg:inline"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl leading-tight lg:text-[clamp(1.15rem,2.6vh,2rem)]">
                        {/* Stretched link — the whole row is the target. */}
                        <Link
                          href={category.href}
                          className="transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-focus-within:text-accent-700 group-hover:text-accent-700"
                        >
                          {category.title}
                        </Link>
                      </h3>

                      {/* The services, as text rather than as sixteen
                          links — every one of them is a link on the
                          direction's own page, one click away. */}
                      <p className="index-services mt-1.5 text-xs leading-snug text-ink-600 lg:mt-1 lg:text-[clamp(0.68rem,1.45vh,0.85rem)]">
                        {category.items.map((item) => item.title).join(" · ")}
                      </p>
                    </div>

                    <span
                      className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory-500 bg-ivory-50/60 text-accent-600 transition-all duration-500 group-focus-within:border-accent-400 group-focus-within:bg-accent-300 group-focus-within:text-ink-900 group-hover:border-accent-400 group-hover:bg-accent-300 group-hover:text-ink-900 lg:inline-flex lg:h-11 lg:w-11"
                      aria-hidden="true"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </ServicesDial>
      </div>
    </section>
  );
}
