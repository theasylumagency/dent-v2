import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import type { Case } from "@/lib/cases";
import RichText from "@/components/ui/RichText";
import Reveal from "@/components/ui/Reveal";

/**
 * One treated case: the two photographs, side by side, and the words around
 * them.
 *
 * **Both states are visible at once, and that is the argument.** A dragged
 * slider is the genre convention and it is more fun, but at any given moment
 * it is showing half the evidence and hiding the other half — on a page whose
 * entire job is to be believed, an interaction that conceals is the wrong
 * one. Side by side also needs no JavaScript, survives a printed page, and
 * gives each photograph a real `alt` of its own.
 *
 * The hairline between the pair is the same mark the home page draws between
 * a case's two words. It is the one piece of continuity between the door and
 * the room, and it is decorative — the two labels carry the meaning.
 */
export default function CaseEntry({
  entry,
  dict,
  index,
  directionTitle,
}: {
  entry: Case;
  dict: Dictionary;
  index: number;
  directionTitle: string;
}) {
  const t = dict.cases.page;
  /* Alternating bands, the same two surfaces the rest of the site uses to
     phrase a long page. Without them four cases read as one wall. */
  const shaded = index % 2 === 1;

  return (
    <section
      id={entry.slug}
      /* `scroll-mt` rather than relying on the global `scroll-padding-top`:
         these are the anchor targets the home page and the CMS both link to,
         and the fixed header would otherwise cover the case title. */
      className={`section scroll-mt-24 border-b border-ivory-300 ${
        shaded ? "bg-ivory-200" : "bg-ivory-100"
      }`}
    >
      <div className="shell">
        <Reveal>
          <p className="label-micro text-accent-700">{directionTitle}</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
            {entry.title}
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink-700">{entry.summary}</p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8">
            <figure className="m-0">
              <figcaption className="label-micro mb-3">{t.beforeLabel}</figcaption>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-ivory-300 shadow-soft">
                <Image
                  src={entry.before.src}
                  alt={entry.before.alt}
                  fill
                  sizes="(min-width: 1024px) 44vw, 92vw"
                  className="object-cover"
                />
              </div>
            </figure>

            {/* Decorative: the two captions above already say which is which. */}
            <span
              className="mx-auto h-8 w-px bg-gradient-to-b from-ivory-500 to-accent-400 lg:h-px lg:w-16 lg:bg-gradient-to-r"
              aria-hidden="true"
            />

            <figure className="m-0">
              <figcaption className="label-micro mb-3 text-accent-700">{t.afterLabel}</figcaption>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-ivory-300 shadow-lift">
                <Image
                  src={entry.after.src}
                  alt={entry.after.alt}
                  fill
                  sizes="(min-width: 1024px) 44vw, 92vw"
                  className="object-cover"
                />
              </div>
            </figure>
          </div>
        </Reveal>

        {/* A definition list, not a sentence: two labelled facts that a
            reader scans rather than reads. Either can be absent — a case
            with no doctor recorded simply does not name one. */}
        {entry.duration || entry.doctorName ? (
          <Reveal delay={160}>
            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4">
              {entry.duration ? (
                <div>
                  <dt className="label-micro">{t.durationLabel}</dt>
                  <dd className="mt-1 text-sm text-ink-800">{entry.duration}</dd>
                </div>
              ) : null}
              {entry.doctorName ? (
                <div>
                  <dt className="label-micro">{t.doctorLabel}</dt>
                  <dd className="mt-1 text-sm text-ink-800">{entry.doctorName}</dd>
                </div>
              ) : null}
            </dl>
          </Reveal>
        ) : null}

        {entry.details.length > 0 ? (
          <Reveal delay={200}>
            {/* baseLevel 2: the case title above is an h2, so a subheading
                the editor marks as top level renders as h3. */}
            <div className="mt-8 max-w-2xl space-y-4 leading-relaxed text-ink-700">
              <RichText blocks={entry.details} baseLevel={2} />
            </div>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
