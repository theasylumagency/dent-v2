import type { ReactNode } from "react";

import Reveal from "@/components/ui/Reveal";
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";

/**
 * Shared opening block for the services pages.
 *
 * `pt-28 lg:pt-40` mirrors the home hero: the site header is
 * `position: fixed`, so every page has to clear it itself. Anything less
 * and the h1 sits under the bar on first paint, before the scroll listener
 * has collapsed it.
 */
export default function PageHero({
  eyebrow,
  title,
  lead,
  crumbs,
  crumbLabel,
  aside,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  crumbs: Crumb[];
  crumbLabel: string;
  aside?: ReactNode;
}) {
  return (
    <section className="relative grain overflow-hidden border-b border-ivory-400 bg-ivory-100 pb-16 pt-28 lg:pb-20 lg:pt-40">
      <div className="aura -left-52 -top-24 h-[34rem] w-[34rem] opacity-40" aria-hidden="true" />
      <div className="aura right-[-14rem] top-32 h-[28rem] w-[28rem] opacity-25" aria-hidden="true" />

      <div className="shell relative">
        <Breadcrumbs items={crumbs} label={crumbLabel} />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end lg:gap-14">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-6 fluid-display font-display">{title}</h1>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-5">
            <p className="max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">{lead}</p>
          </Reveal>
        </div>

        {aside ? <div className="mt-12 lg:mt-14">{aside}</div> : null}
      </div>
    </section>
  );
}
