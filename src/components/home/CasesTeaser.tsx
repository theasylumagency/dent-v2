import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import { route } from "@/lib/routes";

/**
 * The door to the clinical-cases page — and only the door. Nothing here is a
 * case.
 *
 * Two decisions, and they are the whole section:
 *
 * 1. **No photograph.** A dental before/after is a close-up of damage, and
 *    dropping one between the atmosphere quote and the lead doctor's
 *    portrait is the same genre clash the audit flagged between the AI
 *    renders and the real photography. The pictures belong on the page this
 *    links to, where the frame is ours to control.
 * 2. **No case, either.** An earlier draft listed four real-looking
 *    treatments with durations. That spent the page's material on its own
 *    doorstep, contradicted the copy around it — which says the cases are on
 *    their own page — and made this file assert clinical outcomes nobody at
 *    the clinic had signed off on.
 *
 * What is left is the *shape* of a transformation, four times: the arc a
 * patient walks, ordered so the left column moves from technical to human
 * and the right from abstract to the one warm word on the page.
 *
 * The order of the copy is the argument. Nothing explains the rows before
 * they are read — the eyebrow and the title are the only frame they get.
 * The explanation arrives underneath them, and it turns the universal shape
 * back into a reason to click: every smile fills that shape differently.
 * Then the link, then a three-item label of what is actually behind it.
 * A link at the top right, which is where this started, asked the visitor
 * to leave before the argument had been made — and on a phone it landed
 * before the rows entirely.
 *
 * No client island. The animation is the `Reveal` observer already used
 * across the page plus CSS keyed off `.is-visible` (`.case-*` in
 * globals.css), so the section stays server-rendered and degrades to a plain
 * legible list without JS.
 */
export default function CasesTeaser({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const copy = dict.cases;

  return (
    /* ivory-50 rather than the page's ivory-100: a shade *lighter* after the
       atmosphere band reads as air, which is what a near-empty section needs.
       No top border — the band above already draws one. */
    <section
      id="cases"
      className="cases-teaser section relative overflow-hidden border-b border-ivory-300 bg-ivory-50"
    >
      <div className="aura -left-32 top-4 h-[24rem] w-[24rem] opacity-25" aria-hidden="true" />

      <div className="shell relative">
        <Reveal>
          <p className="label-micro text-accent-700">{copy.label}</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
            {copy.title}
          </h2>
        </Reveal>

        {/* No column headings. They were there when the rows were records
            with a duration; over a pair of words they would only name the
            obvious. */}
        <div className="mt-12 lg:mt-16">
          <ul className="border-t border-ivory-300">
            {copy.items.map((item, index) => (
              <li key={item.after} className="border-b border-ivory-300">
                <Reveal delay={index * 110} className="case-row">
                  <span className="case-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="case-before">{item.before}</span>

                  {/* The line draws left to right (top to bottom on a phone)
                      and the second word lands after it arrives — the
                      animation is the transformation, not an entrance
                      effect. It is drawn, so it carries no text: the dash
                      beside it is what a screen reader gets instead, and it
                      is there to separate the two words rather than to be
                      read aloud as an arrow. */}
                  <span className="case-arrow" aria-hidden="true">
                    <span className="case-line" />
                    <span className="case-arrow-dot" />
                  </span>
                  <span className="sr-only"> — </span>

                  <span className="case-after">{item.after}</span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        {/* Left-aligned, on the same axis as the numbers: the section is a
            ledger and centring its ending would break that axis. The link
            keeps the quiet teaser treatment the other sections use rather
            than becoming a filled button — `.btn-primary` belongs to
            booking, and this must not compete with it. */}
        <Reveal delay={120} className="mt-14 max-w-xl lg:mt-16">
          <p className="font-display text-xl leading-relaxed text-ink-800 sm:text-2xl">
            {copy.closing}
          </p>

          <Link
            href={route(lang, "cases")}
            className="group mt-8 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
          >
            {copy.cta}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {/* Set as a label rather than a sentence — middots, no verb — so
              that it reads as what you get and does not become a fourth
              block of prose in a section built on two-word rows. */}
          <p className="mt-6 text-xs leading-relaxed text-ink-500">{copy.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
