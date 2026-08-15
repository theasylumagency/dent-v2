import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/routes";
import { getTeam } from "@/lib/team";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * Home-page teaser for the team section of `/[lang]/about`.
 *
 * The long paragraph about European internships and international
 * protocols moved to the about page, where it sits above the credentials
 * that back it up. Here it would be a claim with nothing under it — and
 * the same claim on two URLs.
 *
 * Each card links to that doctor's block rather than to the top of the
 * page, so clicking a face lands on that face.
 */
export default async function Team({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const members = await getTeam(lang);

  return (
    <section id="team" className="section relative border-y border-ivory-400 bg-ivory-200">
      <div className="shell">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">{dict.team.label}</p>
            <h2 className="mt-6 fluid-title font-display">{dict.team.title}</h2>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-7">
            <p className="text-base leading-relaxed text-ink-700 lg:pt-4">
              {dict.team.teaserLead}
            </p>

            <Link
              href={`${route(lang, "about")}#team`}
              className="group mt-7 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              {dict.team.teaserCta}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </Reveal>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-5 sm:gap-6 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {members.map((member, index) => (
            <li key={member.slug}>
              <Reveal delay={index * 45}>
                <Link href={member.href} className="group block">
                  <figure>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-300 shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
                      <Image
                        src={member.photo}
                        /* Name plus role: "ნინო ბულუაშვილი" alone tells an
                           image search nothing about what the page is for. */
                        alt={member.photoAlt}
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
                      <p className="font-display text-lg leading-tight text-ink-900 transition-colors group-hover:text-accent-700 lg:text-xl">
                        {member.name}
                      </p>
                      <p className="mt-1.5 text-sm tracking-wide text-accent-700">{member.role}</p>
                    </figcaption>
                  </figure>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
