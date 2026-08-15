import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/routes";
import { media } from "@/lib/site";
import { getClinic } from "@/lib/clinic";
import { getDoctors } from "@/lib/team";
import { getServiceCount } from "@/lib/services";
import { buildStats } from "@/lib/stats";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * Home-page teaser for `/[lang]/about`, one screen tall.
 *
 * The mission and vision paragraphs live on that page rather than being
 * duplicated here. The numbers stayed: four counters are not prose, they
 * cannot compete with themselves in search, and they are the fastest
 * thing on the page to read.
 *
 * Being `.h-viewport` changes how the section is laid out, not just how
 * tall it is. Three bands stack in a `.fit-stack`:
 *
 *   1. the head — eyebrow, title, accented teaser, link
 *   2. the image band — `flex-1 min-h-0`, i.e. the *only* flexible thing
 *   3. the stat row
 *
 * Bands 1 and 3 are as small as their content allows and band 2 takes
 * everything left over, so the section fits any screen by trading image
 * height rather than by clipping or scrolling copy.
 *
 * Everything that competes with band 2 for height is therefore held
 * down deliberately: the stat row is one line rather than two (see
 * `.stats-fit`), the padding clears the *collapsed* header rather than
 * the full-height one, and every gap and type size in here is clamped
 * against `vh` instead of being a fixed rem step. Together those are
 * worth ~150px on a 667px screen, which is the difference between an
 * image band and a sliver.
 */
export default async function Clinic({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  /* Two of these four are counted from the CMS, so the row cannot fall out
     of step with the doctors and services it describes. See `lib/stats.ts`
     for why the other two are allowed to be absent. */
  const [clinic, doctors, serviceCount] = await Promise.all([
    getClinic(lang, dict.contact),
    getDoctors(lang),
    getServiceCount(),
  ]);

  const stats = buildStats({
    labels: dict.stats,
    clinic,
    doctorCount: doctors.length,
    serviceCount,
  });

  /* Both interior shots, paired with their own alt text — they used to
     share one alt string, which reads to a crawler as the same picture
     twice and to a screen reader as a pointless repeat.

     `span` is the desktop grid weight: the wide room shot earns two
     thirds, the reception detail one. `sizes` follows from that split
     rather than being one shared guess, since the two end up at very
     different widths on the same screen. */
  const shots = [
    {
      src: media.interior[0],
      alt: dict.mission.imageAlt,
      span: "lg:col-span-2",
      sizes: "(min-width: 1024px) 58vw, 78vw",
    },
    {
      src: media.interior[1],
      alt: dict.mission.imageAlt2,
      span: "lg:col-span-1",
      sizes: "(min-width: 1024px) 29vw, 78vw",
    },
  ];

  return (
    <section id="about" className="h-viewport relative overflow-hidden bg-ivory-100">
      <div className="aura -right-40 top-10 h-[28rem] w-[28rem] opacity-30" aria-hidden="true" />

      <div className="shell fit-pad fit-stack relative h-full">
        {/* Head ------------------------------------------------------
            Title left, teaser right. The split is the point: the title
            is three words and the teaser is four lines, so stacking
            them would waste the width and cost height the section does
            not have. */}
        {/* Every vertical gap in here is vh-clamped rather than a fixed
            rem step. In a section that cannot grow, four fixed margins
            are four fixed subtractions from the image band — and on a
            667px screen they were most of what was left of it. */}
        <Reveal className="grid shrink-0 grid-cols-1 gap-x-16 gap-y-[clamp(0.75rem,2vh,1.5rem)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">{dict.mission.label}</p>
            <h2 className="mt-[clamp(0.5rem,1.4vh,1.25rem)] fluid-title font-display">
              {dict.mission.title}
            </h2>
          </div>

          <div className="lg:col-span-7">
            <p className="fit-lead max-w-2xl text-ink-800">
              {dict.mission.teaserText}{" "}
              {/* The clause that carries the actual promise — one place,
                  one team — is the reason the paragraph exists, so it is
                  the part that gets the brand colour. accent-600, not
                  300: this is body-sized text and has to clear 4.5:1. */}
              <span className="text-accent-600">{dict.mission.teaserAccent}</span>
            </p>

            <Link
              href={route(lang, "about")}
              className="group mt-[clamp(0.875rem,2.2vh,1.75rem)] inline-flex items-center gap-3 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              {dict.mission.teaserCta}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </Reveal>

        {/* Image band ------------------------------------------------
            The flexible one: it takes whatever height the head and the
            stat row leave, which is what lets the section be exactly one
            screen without clipping anything.

            A snap scroller on mobile — the second card deliberately
            peeks past the right edge, which is the only affordance a
            hidden scrollbar leaves — and a 2fr/1fr grid from lg. */}
        <Reveal delay={100} className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory gap-4 overflow-x-auto lg:grid lg:grid-cols-3 lg:grid-rows-1 lg:gap-6 lg:overflow-visible">
          {shots.map((shot) => (
            <figure
              key={shot.src}
              /* Mobile width is derived from the band's height via the
                 aspect ratio rather than set as a percentage of the
                 screen. A fixed `w-[78%]` looked right at 220px of band
                 and became a 2.4:1 letterbox once a short screen
                 squeezed the band to 120px; deriving it keeps the crop
                 constant and lets the *number* of visible cards change
                 instead, which is what a scroller should be signalling.

                 `min-w-[58%]` is the floor: without it a very short band
                 makes both cards narrow enough to fit the screen at
                 once, and the row loses the peek that tells anyone it
                 scrolls. */
              className={`relative aspect-[4/3] w-auto min-w-[58%] shrink-0 snap-start overflow-hidden rounded-[1.5rem] bg-ivory-200 shadow-lift lg:aspect-auto lg:min-w-0 ${shot.span}`}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes={shot.sizes}
                className="object-cover"
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-ink-900/10"
                aria-hidden="true"
              />
            </figure>
          ))}
        </Reveal>

        {/* Stats -----------------------------------------------------
            flex-col-reverse: the value reads first while the markup
            stays <dt> (label) before <dd> (value), which is the pairing
            a screen reader announces. */}
        <Reveal delay={160} className="shrink-0">
          <dl className="stats-fit border-t border-ivory-400 pt-[clamp(0.75rem,2vh,1.75rem)]">
            {stats.map((stat) => (
              <div key={stat.key} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[0.7rem] leading-snug tracking-wide text-ink-600 sm:text-xs">
                  {stat.label}
                </dt>
                <dd className="fit-stat font-display text-ink-900">
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
