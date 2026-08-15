import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { getDoctors } from "@/lib/team";
import BookingTrigger from "@/components/booking/BookingTrigger";
import HeroMedia from "./HeroMedia";

/**
 * Inverted hero — brand blue carries the whole section.
 *
 * Exactly one screen tall everywhere (`.h-viewport`), which is the
 * constraint the layout is built around: nothing here scrolls, so the
 * content is only what survives at the shortest supported height. The
 * fact row, the floating hours card and the scroll cue that used to sit
 * at the bottom are gone for that reason rather than by oversight — on a
 * 667px phone they were the difference between "one screen" and "clipped".
 *
 * Two arrangements, one markup tree:
 *
 *   • ≥1024px — copy left, video in a right-hand panel, split by a
 *     hairline. The clip's own backdrop is near-black, so the page is
 *     graded to meet it instead of the panel sitting on it as a box.
 *   • below that — video full-bleed, copy bottom-anchored over a scrim
 *     and held clear of the fixed action bar.
 *
 * Stacking is deliberate and unusual: the media wrapper is left at
 * `z-auto` while the copy takes `z-10`, so the copy paints over the
 * footage — but HeroMedia's pause control carries `z-20` and therefore
 * still sits above the copy layer and stays clickable. Putting the media
 * on `-z-10` would have buried that button.
 */
export default async function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  /* Four faces, not all five — the row stays compact and the count lives
     in the copy. Lead doctor first, so the stack opens on the name the
     rest of the page builds on. */
  const faces = (await getDoctors(lang)).slice(0, 4);

  return (
    <section className="on-dark relative isolate h-viewport overflow-hidden bg-brand-900">
      {/* Base wash ---------------------------------------------------
          Light at the bottom-left, where the headline sits, falling away
          to near-black at the top-right, where the video is. A gradient
          rather than a flat fill: one solid blue behind a clip whose own
          background is black reads as two rectangles. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 105% at 0% 100%, var(--color-brand-600) 0%, var(--color-brand-800) 44%, var(--color-brand-950) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Media — full-bleed on mobile, right panel from lg. This box is
          what decides the crop; HeroMedia only fills it. */}
      <div className="absolute inset-0 lg:left-[56%]">
        <HeroMedia dict={dict} />

        {/* Mobile scrim. Below lg the copy sits directly on the footage,
            so it needs a floor: opaque at the bottom, clear by two
            thirds up so the frame is still readable. */}
        <div
          className="absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(to top, var(--color-brand-950) 4%, color-mix(in oklab, var(--color-brand-900) 92%, transparent) 36%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Desktop seam. A hard edge between panel and page would read as
            a crop; a band of gradient dissolves it into the wash. */}
        <div
          className="absolute inset-y-0 left-0 hidden w-[14vw] lg:block"
          style={{
            background: "linear-gradient(to right, var(--color-brand-800), transparent)",
          }}
          aria-hidden="true"
        />
      </div>

      {/* The vertical hairline the desktop layout hangs on. */}
      <div
        className="absolute inset-y-0 left-[56%] hidden w-px bg-white/15 lg:block"
        aria-hidden="true"
      />

      {/* Copy ---------------------------------------------------------
          Mobile parks the block just above the fixed action bar. Desktop
          centres it in the space the header actually leaves over —
          `pt-[8.5rem]` is the unscrolled header (40px utility strip +
          96px bar), so `justify-center` centres below it, not behind it. */}
      <div className="relative z-10 flex h-full flex-col justify-end pb-32 pt-24 lg:justify-center lg:pb-0 lg:pt-[8.5rem]">
        <div className="shell">
          <div className="max-w-[34rem]">
            <p className="eyebrow">{dict.hero.eyebrow}</p>

            <h1 className="mt-6 fluid-display font-display lg:mt-7">
              <span className="block">{dict.hero.titleTop}</span>
              <span className="block text-gradient display-italic">{dict.hero.titleBottom}</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-ivory-200/90 sm:text-lg lg:mt-8">
              {dict.hero.lead}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-10">
              <BookingTrigger className="btn-primary">
                {dict.hero.ctaPrimary}
              </BookingTrigger>
              <Link href={route(lang, "services")} className="btn-ghost">
                {dict.hero.ctaSecondary}
              </Link>
            </div>

            {/* Social proof, immediately after the CTAs — real faces do
                more for a first-time patient than another statistic, and
                this is the moment they are deciding whether to click.

                The stack is decorative: names and roles belong to the team
                section, so the sentence carries the whole meaning here and
                the images are hidden from assistive tech rather than read
                out as four unlabelled photos. */}
            <div className="mt-8 flex items-center gap-4 sm:gap-5 lg:mt-10">
              <ul className="flex shrink-0" aria-hidden="true">
                {faces.map((member, index) => (
                  <li
                    key={member.slug}
                    /* ring-brand-900, not ivory: on an inverted panel an
                       ivory ring turns four photos into four cut-outs. */
                    className={`relative h-12 w-12 overflow-hidden rounded-full bg-brand-800 ring-2 ring-brand-900 xl:h-14 xl:w-14 ${
                      index === 0 ? "" : "-ml-3.5"
                    }`}
                  >
                    <Image
                      src={member.photo}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  </li>
                ))}
              </ul>

              <p className="max-w-xs text-sm leading-relaxed text-ivory-300/85">
                {dict.hero.trust}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
