import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import { getTeam } from "@/lib/team";
import Reveal from "@/components/ui/Reveal";

export default function Team({ dict }: { dict: Dictionary }) {
  const members = getTeam(dict, { excludeLead: true });

  return (
    <section id="team" className="section relative border-y border-ivory-400 bg-ivory-200">
      <div className="shell">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{dict.team.label}</p>
            <h2 className="mt-6 fluid-title font-display">{dict.team.title}</h2>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-7">
            <p className="text-base leading-relaxed text-ink-700 lg:pt-4">{dict.team.lead}</p>
          </Reveal>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-5 sm:gap-6 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {members.map((member, index) => (
            <li key={member.slug}>
              <Reveal delay={index * 45}>
                <figure className="group">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-300 shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
                    <Image
                      src={member.photo}
                      /* Name plus role: "ნინო ბულუაშვილი" alone tells an
                         image search nothing about what the page is for. */
                      alt={`${member.name} — ${member.role}`}
                      fill
                      sizes="(min-width: 1024px) 22vw, 45vw"
                      /* 500ms, and only the two properties that change —
                         four cards each animating scale, filter and a ring
                         for 900ms was a lot of simultaneous compositing. */
                      className="object-cover object-top grayscale-[30%] transition-[transform,filter] duration-500 group-hover:scale-[1.04] group-hover:grayscale-0"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ink-900/10 transition-all duration-700 group-hover:ring-2 group-hover:ring-accent-300"
                      aria-hidden="true"
                    />
                  </div>
                  <figcaption className="mt-5">
                    <p className="font-display text-lg leading-tight text-ink-900 lg:text-xl">
                      {member.name}
                    </p>
                    <p className="mt-1.5 text-sm tracking-wide text-accent-700">{member.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
