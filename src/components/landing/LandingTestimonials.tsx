import type { LandingPage } from "@/payload-types";
import Reveal from "@/components/ui/Reveal";

export default function LandingTestimonials({ campaign }: { campaign: LandingPage }) {
  const section = campaign.testimonials;
  const items = (section?.items ?? []).filter((item) => item.quote?.trim());
  if (!section?.enabled || !items.length) return null;

  return (
    <section className="section border-b border-ivory-400 bg-ivory-200">
      <div className="shell">
        {section.heading ? (
          <Reveal>
            <h2 className="fluid-title max-w-3xl font-display">{section.heading}</h2>
          </Reveal>
        ) : null}
        <div className={`${section.heading ? "mt-12" : ""} grid grid-cols-1 gap-5 lg:grid-cols-3`}>
          {items.map((item, index) => (
            <Reveal
              key={item.id ?? item.quote}
              delay={index * 100}
              className="card lp-lift flex h-full flex-col p-7 sm:p-8"
            >
              <figure className="flex h-full flex-col">
                <blockquote className="flex-1 font-display text-2xl leading-relaxed text-ink-900">
                  {"“"}{item.quote}{"”"}
                </blockquote>
                <figcaption className="mt-8 border-t border-ivory-400 pt-5 text-sm text-ink-700">
                  {item.displayName ? (
                    <span className="font-medium text-ink-900">{item.displayName}</span>
                  ) : null}
                  {item.sourceLabel ? (
                    <span className="mt-1 block text-xs text-ink-600">{item.sourceLabel}</span>
                  ) : null}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
