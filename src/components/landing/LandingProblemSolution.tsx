import type { LandingPage } from "@/payload-types";

export default function LandingProblemSolution({ campaign }: { campaign: LandingPage }) {
  const section = campaign.problemSolution;
  if (!section?.enabled || (!section.title && !section.body)) return null;

  return (
    <section className="section border-b border-ivory-400 bg-brand-950 on-dark">
      <div className="shell grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {section.eyebrow ? <p className="eyebrow">{section.eyebrow}</p> : null}
          {section.title ? (
            <h2 className="mt-6 fluid-title font-display text-ivory-50">{section.title}</h2>
          ) : null}
        </div>
        {section.body ? (
          <p className="max-w-2xl text-lg leading-relaxed text-ivory-200 lg:col-span-7 lg:pt-10">
            {section.body}
          </p>
        ) : null}
      </div>
    </section>
  );
}
