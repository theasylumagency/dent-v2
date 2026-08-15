import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { getServiceCategories } from "@/lib/services";
import { categoryImage } from "@/lib/services-shared";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * The five clinical directions, as an index rather than a card grid.
 *
 * The grid this replaces gave every direction an identical box — icon,
 * title, blurb, then a cloud of service pills. Five identical boxes have
 * no hierarchy, so nothing led; and the pills put sixteen secondary links
 * in direct competition with the five primary ones they sat inside. On a
 * phone the whole thing became a very long ragged wall.
 *
 * An index fixes both. One row per direction, numbered, with the title at
 * display size doing the leading and the services underneath as quiet
 * text. The row is the link. Hovering or focusing it fades in that
 * direction's photograph from the right, dissolved into the page with a
 * gradient so the type never sits on top of an image.
 *
 * That reveal is CSS only — no scroll listener, no state, no measuring.
 * It costs nothing on a phone (where it is not rendered at all, hover
 * being meaningless there) and the global `prefers-reduced-motion` rule
 * already flattens the transition to nothing for anyone who asks.
 *
 * Height: exactly one screen from lg, at least one below it
 * (`.h-viewport-lg`). The hero and the about section can hold a hard
 * 100vh on a phone; this one cannot. Five directions named in Georgian
 * wrap to two lines at 375px, and once the head and the padding are paid
 * for there is no fifth of a short screen left to put them in. Forcing
 * it meant deleting the numbers, the service names and the photographs
 * — a worse trade than a section that runs to about 1.2 screens.
 *
 * So below lg the rows take their natural height and the section grows.
 * What mobile gets in exchange for the hover reveal it cannot use is the
 * photograph, as a thumbnail on every row.
 */
export default async function Services({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const categories = await getServiceCategories(dict.services.categories, lang);

  return (
    <section
      id="services"
      className="h-viewport-lg relative overflow-hidden border-y border-ivory-400 bg-ivory-200"
    >
      <div className="aura -left-40 top-1/4 h-[30rem] w-[30rem] opacity-30" aria-hidden="true" />

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

        {/* Index ----------------------------------------------------
            From lg the list and every row are `flex-1`, so the five rows
            divide the leftover height between them and the section
            absorbs any window by changing row height rather than
            overflowing. Below lg none of that applies — see the row. */}
        <Reveal delay={100} className="flex min-h-0 flex-col lg:flex-1">
          <ul className="flex min-h-0 flex-col border-t border-ivory-400 lg:flex-1">
            {categories.map((category, index) => (
              <li
                key={category.slug}
                /* Natural height on a phone, an equal share of the band
                   from lg. That difference is the whole mobile fix: five
                   rows forced to a fifth of a short screen each is what
                   was making the Georgian titles collide. */
                className="group relative flex min-h-0 items-center border-b border-ivory-400 lg:flex-1"
              >
                {/* Photograph, desktop only. Masked rather than dimmed:
                    a gradient that reaches full page colour on the left
                    means the title is always on flat ivory, whatever the
                    picture happens to be doing behind it.

                    `group-focus-within` sits alongside `group-hover` on
                    this and on the other two affordances below — the row
                    is reachable by keyboard, and a Tab that lit up
                    nothing would leave someone stepping through five
                    rows with no idea which one they were on. */}
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-focus-within:opacity-100 group-hover:opacity-100 lg:block"
                  aria-hidden="true"
                >
                  <Image
                    src={categoryImage[category.slug]}
                    alt=""
                    fill
                    sizes="(min-width: 1440px) 600px, 42vw"
                    className="object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to right, var(--color-ivory-200) 0%, color-mix(in oklab, var(--color-ivory-200) 45%, transparent) 55%, transparent 100%)",
                    }}
                  />
                </div>

                <div className="relative flex w-full items-center gap-4 py-3.5 sm:gap-6 lg:gap-10 lg:py-[clamp(0.25rem,1vh,0.75rem)]">
                  {/* Phones get the photograph as a thumbnail rather than
                      not at all. The hover reveal below is desktop-only
                      by necessity — there is no hover on touch — which
                      left mobile with the one thing this section has
                      that nothing else on the page does. It also gives
                      the row a height floor, so the list keeps an even
                      rhythm even where one title wraps and another
                      does not. */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ivory-300 lg:hidden">
                    <Image
                      src={categoryImage[category.slug]}
                      alt=""
                      fill
                      sizes="4rem"
                      className="object-cover"
                    />
                  </div>

                  <span
                    className="hidden shrink-0 font-display text-[clamp(0.8rem,1.7vh,1rem)] tabular-nums text-accent-500 transition-colors duration-500 group-focus-within:text-accent-700 group-hover:text-accent-700 lg:inline"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* Capped at half the row from lg. The photograph
                      occupies the right 42%, and although its mask is
                      opaque ivory at that edge, letting the service
                      names run under it would put small grey text over
                      a photograph at exactly the width where the mask
                      starts giving way. */}
                  <div className="min-w-0 flex-1 lg:max-w-[50%]">
                    {/* Fixed size on mobile, viewport-relative from lg.
                        Below lg the section is free to grow, so tying
                        the title to `vh` there bought nothing and meant
                        a taller phone got bigger type for no reason. */}
                    <h3 className="font-display text-xl leading-tight lg:text-[clamp(1.15rem,2.7vh,2.1rem)]">
                      {/* Stretched link — the whole row is the target.
                          Nothing else in the row is interactive, so this
                          needs none of the z-index juggling the card
                          version required. */}
                      <Link
                        href={category.href}
                        className="transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-focus-within:text-accent-700 group-hover:text-accent-700"
                      >
                        {category.title}
                      </Link>
                    </h3>

                    {/* The services, as text rather than as sixteen
                        links. They are here to be *read* — they are the
                        concrete answer to "what do you actually do" that
                        a generic blurb never gives — and every one of
                        them is a link on the direction's own page, which
                        is one click away through the row itself. */}
                    <p className="index-services mt-1.5 text-xs leading-snug text-ink-600 lg:mt-1 lg:text-[clamp(0.68rem,1.45vh,0.85rem)]">
                      {category.items.map((item) => item.title).join(" · ")}
                    </p>
                  </div>

                  <span
                    /* Desktop only. On touch there is no hover for it to
                       respond to, and five decorative circles is five
                       rows' worth of width taken from titles that need
                       every pixel of it. */
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
      </div>
    </section>
  );
}
