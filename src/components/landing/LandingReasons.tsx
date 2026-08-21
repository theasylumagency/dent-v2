import type { LandingPage } from "@/payload-types";

export default function LandingReasons({ campaign }: { campaign: LandingPage }) {
  const columns =
    campaign.reasons.length === 2
      ? "md:grid-cols-2"
      : campaign.reasons.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <section className="section-tight border-b border-ivory-400 bg-ivory-200">
      <div className="shell">
        <ol className={`grid grid-cols-1 gap-px overflow-hidden rounded-[1.75rem] border border-ivory-400 bg-ivory-400 ${columns}`}>
          {campaign.reasons.map((reason, index) => (
            <li key={reason.id ?? reason.title} className="bg-ivory-50 p-7 sm:p-8">
              <span className="font-display text-xl tabular-nums text-accent-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-7 font-display text-2xl leading-snug text-ink-900">{reason.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{reason.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
