import Image from "next/image";

import type { Doctor } from "@/lib/team";
import TrackedView from "@/components/analytics/TrackedView";
import Reveal from "@/components/ui/Reveal";
import Credentials, { LanguageChips } from "./Credentials";

type Labels = {
  focus: string;
  education: string;
  experience: string;
  training: string;
  languages: string;
  pendingLabel: string;
  pendingText: string;
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

              <div className="mt-5 space-y-4">
                {profile.bio.map((block) =>
                  block.type === "h2" ? (
                    <h4 key={block.text} className="pt-2 font-display text-lg leading-snug">
                      {block.text}
                    </h4>
                  ) : (
                    <p key={block.text} className="text-base leading-relaxed text-ink-700">
                      {block.text}
                    </p>
                  ),
                )}
              </div>

              <div className="mt-8">
                <Credentials groups={profile} labels={labels} />
              </div>
            </>
          )}
        </Reveal>
      </div>
    </article>
  );
}
