import Image from "next/image";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import { Sparkle } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

export default function Technology({ dict }: { dict: Dictionary }) {
  return (
    <section id="technology" className="section-airy relative overflow-hidden bg-ivory-100">
      <div className="aura left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 opacity-25" aria-hidden="true" />

      <div className="shell relative">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">{dict.technology.label}</p>
          <h2 className="mt-6 fluid-title font-display">{dict.technology.title}</h2>
          <p className="mt-6 text-base leading-relaxed text-ink-700">{dict.technology.lead}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-14 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <ol className="lg:col-span-7">
            {dict.technology.items.map((item, index) => (
              <li key={item.index}>
                <Reveal delay={index * 45}>
                  <div className="group grid grid-cols-[3rem_1fr] gap-5 border-t border-ivory-400 py-7 transition-colors hover:border-accent-400 sm:grid-cols-[4rem_1fr] sm:gap-8">
                    <span className="font-display text-xl tabular-nums text-accent-700 transition-colors group-hover:text-accent-600">
                      {item.index}
                    </span>
                    <div>
                      <h3 className="font-display text-xl leading-snug sm:text-2xl">{item.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-ink-700">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <div className="lg:col-span-5">
            <Reveal delay={140}>
              <div className="sticky top-28 space-y-6">
                <div className="card relative overflow-hidden p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[media.ornament.implantology, media.ornament.aesthetic].map((src) => (
                      <span
                        key={src}
                        className="relative isolate aspect-square overflow-hidden rounded-2xl bg-accent-50 ring-1 ring-inset ring-accent-200"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="24rem"
                          className="object-contain mix-blend-multiply"
                        />
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-start gap-3 border-t border-ivory-400 pt-6">
                    <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <p className="text-base leading-relaxed text-ink-700">{dict.technology.note}</p>
                  </div>
                </div>

                <div className="rounded-card border border-accent-200 bg-accent-50 p-8">
                  <p className="eyebrow">{dict.care.label}</p>
                  <h3 className="mt-4 font-display text-2xl leading-snug">{dict.care.title}</h3>
                  <ul className="mt-6 space-y-4">
                    {dict.care.items.map((item) => (
                      <li key={item} className="flex gap-3 text-base leading-relaxed text-ink-700">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
