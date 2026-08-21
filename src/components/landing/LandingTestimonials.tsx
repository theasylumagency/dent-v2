import type { LandingPage } from "@/payload-types";

export default function LandingTestimonials({ campaign }: { campaign: LandingPage }) {
  const section = campaign.testimonials;
  const items = section?.items ?? [];
  if (!section?.enabled || !items.length) return null;

  return (
    <section className="section border-b border-ivory-400 bg-ivory-200">
      <div className="shell">
        {section.heading ? <h2 className="fluid-title max-w-3xl font-display">{section.heading}</h2> : null}
        <div className={`${section.heading ? "mt-12" : ""} grid grid-cols-1 gap-5 lg:grid-cols-3`}>
          {items.map((item) => (
            <figure key={item.id ?? item.quote} className="card flex h-full flex-col p-7 sm:p-8">
              <blockquote className="flex-1 font-display text-2xl leading-relaxed text-ink-900">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-8 border-t border-ivory-400 pt-5 text-sm text-ink-700">
                <span className="font-medium text-ink-900">{item.displayName}</span>
                {item.sourceLabel ? <span className="mt-1 block text-xs text-ink-600">{item.sourceLabel}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
