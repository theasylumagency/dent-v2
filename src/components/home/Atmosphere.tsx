import Image from "next/image";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getClinic } from "@/lib/clinic";
import { media } from "@/lib/site";
import { ArrowUpRight, Clock, Pin } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * The trust band — the clinic's own front door.
 *
 * This slot waited a long time for "atmosphere" interior photography, and
 * the interior shots that did arrive are already doing that job two screens
 * up, in the about section. What the page did not have anywhere was the
 * building: the blue sign on Arakishvili Street, in daylight. For a first
 * visit that is the most reassuring picture there is — a real place, with
 * the name over the door, that you can walk to.
 *
 * So the band makes the claim ("beyond beauty, we build trust") over the
 * one photograph that backs it, and pairs it with the two facts a
 * photograph of a door invites: where it is and when it is open. Both come
 * from the `clinic-info` global, the same source the contact page and the
 * footer read, so the clinic changing its hours changes them here too.
 *
 * Layout: the photograph runs full-bleed and stays bright — no veil, it is
 * the evidence. The card straddles the band's lower edge on desktop, over
 * the planters rather than the sign; on a phone it sits under the picture
 * and overlaps it slightly.
 *
 * The slow drift is a CSS scroll-driven animation (`.visit-photo`), so it
 * costs no JavaScript and is simply absent in browsers without
 * `animation-timeline` or for anyone who asks for reduced motion.
 */
export default async function Atmosphere({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const clinic = await getClinic(lang, dict.contact);
  const place = dict.contact.page;

  return (
    <section
      aria-labelledby="visit-title"
      className="relative isolate border-y border-ivory-400 bg-ivory-100 pb-10 lg:pb-24"
    >
      <figure className="relative">
        <div className="relative h-[62vw] max-h-[26rem] min-h-[15rem] overflow-hidden sm:h-[52vw] lg:h-[74svh] lg:max-h-[52rem] lg:min-h-[32rem]">
          <Image
            src={media.exterior}
            alt={place.exteriorAlt}
            fill
            sizes="100vw"
            className="visit-photo object-cover object-[56%_58%] lg:object-[50%_62%]"
          />
          {/* A little weight at the foot of the picture, under the card's
              shadow — the street is the busiest part of the frame and the
              least needed. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-900/20 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* The caption lives in the strip under the photograph on desktop,
            level with the foot of the card, so the picture itself stays
            clean. On a phone it follows the card. */}
        <figcaption className="shell order-last hidden lg:absolute lg:inset-x-0 lg:top-full lg:mt-10 lg:flex lg:justify-end">
          <span className="flex max-w-sm items-start gap-2.5 text-sm leading-relaxed text-ink-600">
            <Pin className="mt-1 h-4 w-4 shrink-0 text-accent-600" />
            {place.entranceNote}
          </span>
        </figcaption>
      </figure>

      <div className="shell relative z-10 -mt-12 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0">
        <Reveal className="card max-w-[36rem] !rounded-[1.75rem] p-6 sm:p-8 lg:px-10 lg:py-9">
          <p className="eyebrow">{dict.mission.quoteTop}</p>
          <h2
            id="visit-title"
            className="mt-4 font-display text-[clamp(1.85rem,3.1vw,2.9rem)] leading-[1.14]"
          >
            {dict.mission.quoteBottom}
          </h2>

          <dl className="mt-7 grid gap-5 border-t border-ivory-400 pt-6 sm:grid-cols-2 sm:gap-6">
            <div className="flex gap-3">
              <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <div>
                <dt className="label-micro">{dict.contact.addressLabel}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-800">
                  {clinic.address}
                  <span className="block text-ink-600">{dict.contact.district}</span>
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <div>
                <dt className="label-micro">{dict.contact.hoursLabel}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-800">{clinic.hours}</dd>
              </div>
            </div>
          </dl>

          {clinic.maps ? (
            <a
              href={clinic.maps}
              target="_blank"
              rel="noreferrer"
              className="group mt-7 inline-flex items-center gap-3 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              {place.mapsCta}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </a>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
