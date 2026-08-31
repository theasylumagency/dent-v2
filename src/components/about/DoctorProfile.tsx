import Image from "next/image";
import Link from "next/link";

import type { Doctor } from "@/lib/team";
import { ArrowUpRight } from "@/components/ui/icons";
import TrackedView from "@/components/analytics/TrackedView";
import Reveal from "@/components/ui/Reveal";
import RichText from "@/components/ui/RichText";
import Credentials, { LanguageChips } from "./Credentials";

type Labels = {
  focus: string;
  education: string;
  experience: string;
  training: string;
  languages: string;
  pendingLabel: string;
  pendingText: string;
  profileCta: string;
};

/**
 * One doctor, with an anchor so the home page and the team grid can link
 * straight at them. The credential lists come from `Credentials`, shared
 * with the lead doctor's section on the same page.
 */
export default function DoctorProfile({
  profile,
  flipped,
  labels,
}: {
  profile: Doctor;
  flipped: boolean;
  labels: Labels;
}) {
  return (
    <article id={profile.slug} className="scroll-mt-28">
      <TrackedView type="doctor" viewKey={`doctor:${profile.slug}`} />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
        <Reveal className={`lg:col-span-4 ${flipped ? "lg:order-last" : ""}`}>
          <div className="lg:sticky lg:top-28">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-ivory-300 shadow-soft">
              <Image
                src={profile.photo}
                alt={profile.photoAlt}
                fill
                sizes="(min-width: 1024px) 30vw, 90vw"
                className="object-cover object-top"
              />
              <span
                className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-1 ring-inset ring-ink-900/10"
                aria-hidden="true"
              />
            </figure>

            <div className="mt-6">
              <LanguageChips label={labels.languages} languages={profile.languages} />
            </div>
          </div>
        </Reveal>

        <Reveal delay={90} className="lg:col-span-8">
          <h3 className="font-display text-2xl leading-snug lg:text-3xl">{profile.name}</h3>
          <p className="mt-2 text-sm tracking-wide text-accent-700">{profile.role}</p>

          {!profile.published ? (
            <div className="mt-6 rounded-card border border-ivory-500 bg-ivory-50 p-6">
              <p className="label-micro">{labels.pendingLabel}</p>
              <p className="mt-3 text-base leading-relaxed text-ink-700">{labels.pendingText}</p>
            </div>
          ) : (
            <>
              {profile.focus && (
                <p className="mt-5 font-display text-lg leading-relaxed text-ink-800 sm:text-xl">
                  {profile.focus}
                </p>
              )}

              {/* The doctor's name above is the `h3`, so a subheading the
                  editor writes starts at `h4` and cannot outrank it. */}
              <RichText blocks={profile.bio} baseLevel={3} className="mt-5 space-y-4" />

              <div className="mt-8">
                <Credentials groups={profile} labels={labels} />
              </div>

              {/* The block above is the summary; the page is the same
                  person with room to breathe — and the URL a search for
                  their name can actually land on. Only published doctors
                  have one, which is the same condition as this branch. */}
              {profile.pageHref && (
                <Link
                  href={profile.pageHref}
                  className="group mt-8 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
                >
                  {labels.profileCta}
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              )}
            </>
          )}
        </Reveal>
      </div>
    </article>
  );
}
