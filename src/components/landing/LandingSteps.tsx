import type { LandingPage } from "@/payload-types";

export default function LandingSteps({ campaign }: { campaign: LandingPage }) {
  return (
    <section className="section border-b border-ivory-400 bg-ivory-100">
      <div className="shell">
        <div className="max-w-3xl">
          <p className="eyebrow">01 — 03</p>
          <h2 className="mt-6 fluid-title font-display">{campaign.stepsHeading}</h2>
          {campaign.stepsIntro ? (
            <p className="mt-6 text-base leading-relaxed text-ink-700">{campaign.stepsIntro}</p>
          ) : null}
        </div>
        <ol className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {campaign.steps.map((step, index) => (
            <li key={step.id ?? step.title} className="card flex h-full flex-col p-7 sm:p-8">
              <span className="font-display text-3xl text-accent-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 font-display text-2xl leading-snug text-ink-900">{step.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
