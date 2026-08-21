import type { LandingCopy } from "@/lib/landing-copy";
import Reveal from "@/components/ui/Reveal";

export default function LandingSteps({ copy }: { copy: LandingCopy }) {
  return (
    <section className="section border-b border-ivory-400 bg-ivory-100">
      <div className="shell">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">
            01 — {String(copy.steps.length).padStart(2, "0")}
          </p>
          <h2 className="mt-6 fluid-title font-display">{copy.stepsHeading}</h2>
          {copy.stepsIntro ? (
            <p className="mt-6 text-base leading-relaxed text-ink-700">{copy.stepsIntro}</p>
          ) : null}
        </Reveal>
        <ol
          className={`mt-14 grid grid-cols-1 gap-5 ${
            copy.steps.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"
          }`}
        >
          {copy.steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.id}
              delay={120 + index * 100}
              className="card lp-lift flex h-full flex-col p-7 sm:p-8"
            >
              <span className="lp-step-number font-display text-3xl text-accent-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step.title ? (
                <h3 className="mt-8 font-display text-2xl leading-snug text-ink-900">{step.title}</h3>
              ) : null}
              {step.text ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-700">{step.text}</p>
              ) : null}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
