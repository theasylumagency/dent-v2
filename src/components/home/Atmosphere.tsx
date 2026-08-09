import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";

/**
 * Full-bleed atmosphere band. The photo sits under a warm ivory scrim so the
 * quote can stay dark on light — a dark grade here would fight the rest of
 * the page. Uses a labelled placeholder until the client supplies real
 * interior photography (see `media.placeholder`).
 */
export default function Atmosphere({ dict }: { dict: Dictionary }) {
  return (
    /* dvh, not vh: on mobile browsers `vh` is measured against the tallest
       possible viewport, so the band jumped every time the URL bar moved. */
    <section className="relative h-[50dvh] min-h-[22rem] overflow-hidden border-y border-ivory-400 lg:h-[62dvh]">
      {/* Decorative: the quote beside it carries the meaning, and the
          image is a stand-in until real interior photography lands.
          An alt of "clinic interior" here was describing a different
          picture than the one on screen. */}
      <Image
        src={media.placeholder.atmosphere}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />

      {/* Ivory veil — the photograph reads as texture, not as background. */}
      <div className="absolute inset-0 bg-ivory-100/82" aria-hidden="true" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(85% 70% at 50% 110%, color-mix(in oklab, #7AC7EF 32%, transparent) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="shell relative flex h-full flex-col items-center justify-center text-center">
        <Reveal>
          <p className="font-display text-lg tracking-wide text-accent-600 sm:text-xl">
            {dict.mission.quoteTop}
          </p>
          <p className="mt-4 max-w-3xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl lg:text-5xl">
            {dict.mission.quoteBottom}
          </p>
          <span className="mx-auto mt-10 block h-px w-24 bg-gradient-to-r from-transparent via-accent-400 to-transparent" />
        </Reveal>
      </div>
    </section>
  );
}
