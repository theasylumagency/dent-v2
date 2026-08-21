import type { LandingCopy } from "@/lib/landing-copy";
import Reveal from "@/components/ui/Reveal";

/**
 * The strip of numbered value propositions directly under the hero.
 *
 * Headless by design — a heading here would put a full line of text between
 * the campaign promise and its supporting reasons. The heading exists in the
 * markup as a screen-reader label so the outline stays honest.
 */
export default function LandingReasons({ copy }: { copy: LandingCopy }) {
  const columns =
    copy.reasons.length === 2
      ? "md:grid-cols-2"
      : copy.reasons.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <section aria-labelledby="landing-reasons-heading" className="section-tight border-b border-ivory-400 bg-ivory-200">
      <div className="shell">
        <h2 id="landing-reasons-heading" className="sr-only">
          {copy.reasonsHeading}
        </h2>
        <ol className={`grid grid-cols-1 gap-px overflow-hidden rounded-[1.75rem] border border-ivory-400 bg-ivory-400 ${columns}`}>
          {copy.reasons.map((reason, index) => (
            <Reveal as="li" key={reason.id} delay={index * 80} className="bg-ivory-50 p-7 sm:p-8">
              <span className="lp-step-number font-display text-xl text-accent-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              {reason.title ? (
                <h3 className="mt-7 font-display text-2xl leading-snug text-ink-900">{reason.title}</h3>
              ) : null}
              {reason.text ? (
                <p className="mt-3 text-sm leading-relaxed text-ink-700">{reason.text}</p>
              ) : null}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
