"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, useSyncExternalStore, type Ref } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { ArrowUpRight } from "@/components/ui/icons";

type SceneCopy = {
  microLabel: string;
  headline: string;
  copy: string;
  alt: string;
};

export type TechnologyExperienceCopy = {
  intro: {
    label: string;
    headline: string;
    copy: string;
    mobileCopy: string;
  };
  scenes: {
    cbct: SceneCopy;
    trios: SceneCopy;
    airflow: SceneCopy;
    zoom: SceneCopy;
  };
  finale: {
    primary: string;
    secondary: string;
    cta: string;
  };
};

type SceneKey = keyof TechnologyExperienceCopy["scenes"];

/**
 * Homepage-specific editorial assets, kept apart from the documentary
 * equipment catalogue.
 *
 * `model` is the manufacturer's own name and stays Latin in every locale,
 * for the same reason it does on the technology page: it is the string the
 * manufacturer, the patient's search and the search index all share.
 *
 * TRIOS points at `-clean`: the supplied render had the manufacturer's
 * advertising lockup ("TRIOS 3 Move+ / Digital precision. Better care.")
 * printed into the picture, which collided with our own caption whenever
 * the two were on screen together. The lockup has been painted out of the
 * background; the device itself is untouched.
 */
const SCENES: { key: SceneKey; model: string; src: string; position: string }[] = [
  {
    key: "cbct",
    model: "Vatech CBCT",
    src: "/images/home/technology/cbct.webp",
    position: "object-[62%_50%]",
  },
  {
    key: "trios",
    model: "3Shape TRIOS 3 Move+",
    src: "/images/home/technology/trios-3-move-clean.webp",
    position: "object-[64%_50%]",
  },
  {
    key: "airflow",
    model: "EMS AIRFLOW Prophylaxis Master",
    src: "/images/home/technology/airflow.webp",
    position: "object-[52%_62%]",
  },
  {
    key: "zoom",
    model: "Philips Zoom 4",
    src: "/images/home/technology/zoom-4.webp",
    position: "object-[68%_45%]",
  },
];

const pad = (value: number) => String(value).padStart(2, "0");

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reduced-motion preference, hydration-safe.
 *
 * Motion's `useReducedMotion` reads the media query during the very first
 * client render, so a visitor who asks for less motion got a different tree
 * on the client than the server had sent: a hydration failure, a full client
 * re-render of the section, and `useScroll` complaining about a target that
 * never hydrated. `useSyncExternalStore` hydrates with the server snapshot
 * (`false`) and switches to the real value straight after, which is the
 * supported way to read a browser-only value without a mismatch.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * The technology section — a light, stepped "precision rail".
 *
 * What it replaces, and why. The previous theatre was 4.5 screens of
 * near-black on a site whose whole palette is ivory and sky; four
 * full-bleed renders of near-identical dark rooms cross-faded under one
 * caption at a time, so long stretches of scrolling changed nothing on
 * screen, and the TRIOS scene printed the manufacturer's slogan straight
 * through ours. It also repainted the whole viewport on every scrolled
 * frame, which is what made it jam under a thumb.
 *
 * What it is now:
 *
 * - **Light.** A pale brand-blue surface (`mist`) with deep brand-navy type.
 *   The renders keep their dark studio backdrops, but inside a framed
 *   "viewfinder" — a lit screen on a light page, not a dark page.
 * - **Stepped, not scrubbed.** Scroll position picks *which* device is
 *   showing; the change itself is a short timed transition. A scrubbed
 *   cross-fade parks two half-transparent full-size images on screen for
 *   as long as the thumb is slow, which is both the ugliest frame and the
 *   most expensive one. Only the progress rail follows the scroll 1:1.
 * - **Always legible.** Desktop shows all four steps as a list beside the
 *   frame, so the reader can see where they are, what is next, and jump
 *   there. Phones get a counter and a four-part progress bar instead.
 * - **Compositor-only.** Everything that moves is `opacity` or `transform`.
 *   React re-renders four times across the whole section — once per step —
 *   and never per frame.
 *
 * The one stepped state lives in `active`, derived from scroll progress in a
 * motion-value listener. `setActive` with an unchanged value is a no-op, so
 * the listener costs nothing between step boundaries.
 */
export default function TechnologyExperience({
  copy,
  technologyHref,
}: {
  copy: TechnologyExperienceCopy;
  technologyHref: string;
}) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const count = SCENES.length;

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(count - 1, Math.max(0, Math.floor(value * count))));
  });

  /* Jump to the middle of a step's stretch of the runway, so the step lands
     settled rather than on its boundary. */
  const goTo = useCallback(
    (index: number) => {
      const runway = runwayRef.current;
      if (!runway) return;
      const top = runway.getBoundingClientRect().top + window.scrollY;
      const span = runway.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (span * (index + 0.5)) / count });
    },
    [count],
  );

  if (reduceMotion) {
    /* The static layout takes the runway ref too, so `useScroll` always has
       a mounted target to measure — it just has nothing to drive. */
    return <StaticTechnology ref={runwayRef} copy={copy} technologyHref={technologyHref} />;
  }

  const current = SCENES[active];
  const currentCopy = copy.scenes[current.key];

  return (
    <section
      id="technology"
      aria-labelledby="technology-title"
      className="tech-surface relative isolate overflow-x-clip border-y border-mist-200"
    >
      <BrandRings />

      <TechnologyHead copy={copy} />

      {/* The runway: one screen of stage plus one step-length of scroll per
          device. `--tech-step` is set per breakpoint in globals.css. */}
      <div ref={runwayRef} className="tech-runway relative">
        <div className="tech-stage sticky top-0 flex h-svh flex-col">
          <div className="shell flex min-h-0 w-full flex-1 flex-col gap-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 xl:gap-16">
            {/* Phone: counter, label and a four-part progress bar. */}
            <div className="shrink-0 lg:hidden">
              <div className="flex items-baseline justify-between gap-4">
                <p className="label-micro !text-accent-600">
                  <span className="tabular-nums">
                    {pad(active + 1)} / {pad(count)}
                  </span>
                  <span className="mx-2 text-mist-300">·</span>
                  {currentCopy.microLabel}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
                {SCENES.map((scene, index) => (
                  <ProgressSegment
                    key={scene.key}
                    progress={scrollYProgress}
                    index={index}
                    count={count}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: the whole list, with a rail that fills as you go. */}
            <ol className="relative hidden pl-9 lg:col-span-5 lg:block">
              <span
                className="absolute bottom-6 left-[5px] top-6 w-px overflow-hidden bg-mist-300"
                aria-hidden="true"
              >
                <motion.span
                  className="absolute inset-0 origin-top bg-accent-500"
                  style={{ scaleY: scrollYProgress }}
                />
              </span>

              {SCENES.map((scene, index) => {
                const sceneCopy = copy.scenes[scene.key];
                const isActive = index === active;

                return (
                  <li
                    key={scene.key}
                    data-active={isActive}
                    className="tech-step group relative py-[clamp(0.6rem,1.6vh,1.1rem)]"
                  >
                    <span
                      className="tech-node absolute -left-9 top-[calc(clamp(0.6rem,1.6vh,1.1rem)+0.2rem)] h-[11px] w-[11px] rounded-full border border-mist-300 bg-mist-50"
                      aria-hidden="true"
                    />
                    <p className="label-micro flex items-center gap-3 !text-accent-600">
                      <span className="tabular-nums">{pad(index + 1)}</span>
                      <span className="h-px w-6 bg-accent-300" aria-hidden="true" />
                      {sceneCopy.microLabel}
                    </p>
                    <h3 className="mt-2 font-display text-[clamp(1.5rem,2.3vw,2.4rem)] leading-[1.12] text-brand-900">
                      <button
                        type="button"
                        onClick={() => goTo(index)}
                        aria-current={isActive ? "step" : undefined}
                        className="text-left transition-colors hover:text-accent-700"
                      >
                        {sceneCopy.headline}
                      </button>
                    </h3>
                    <div className="tech-step-body grid">
                      <div className="overflow-hidden">
                        <p className="max-w-sm pt-2.5 text-base leading-relaxed text-ink-700">
                          {sceneCopy.copy}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* The viewfinder — shared by both layouts. */}
            <div className="relative min-h-0 flex-1 lg:col-span-7 lg:flex-none">
              <div
                key={`focus-${active}`}
                className="tech-focus pointer-events-none absolute -inset-2 z-10 lg:-inset-3.5"
                aria-hidden="true"
              >
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-[0.9rem] border-l-[1.5px] border-t-[1.5px] border-accent-400 lg:h-8 lg:w-8" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-[0.9rem] border-r-[1.5px] border-t-[1.5px] border-accent-400 lg:h-8 lg:w-8" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-[0.9rem] border-b-[1.5px] border-l-[1.5px] border-accent-400 lg:h-8 lg:w-8" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-[0.9rem] border-b-[1.5px] border-r-[1.5px] border-accent-400 lg:h-8 lg:w-8" />
              </div>

              <div className="relative h-full overflow-hidden rounded-[1.25rem] bg-brand-950 shadow-lift lg:h-[min(70svh,46rem)] lg:rounded-[1.75rem]">
                {SCENES.map((scene, index) => (
                  <div
                    key={scene.key}
                    data-active={index === active}
                    className="tech-shot absolute inset-0"
                  >
                    <Image
                      src={scene.src}
                      alt={copy.scenes[scene.key].alt}
                      fill
                      sizes="(min-width: 1024px) 55vw, 92vw"
                      className={`object-cover ${scene.position}`}
                    />
                  </div>
                ))}

                <div key={`scan-${active}`} className="tech-scan pointer-events-none absolute inset-0" aria-hidden="true" />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4 lg:p-6">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-[0.7rem] font-medium tracking-wide text-ivory-50 ring-1 ring-inset ring-white/20 backdrop-blur-md lg:text-xs">
                    {current.model}
                  </span>
                  <span className="hidden font-display text-sm tabular-nums text-ivory-50/70 lg:block">
                    {pad(active + 1)} / {pad(count)}
                  </span>
                </div>
              </div>
            </div>

            {/* Phone: the active step's words. All four share one grid
                cell, so the block is always as tall as the longest and
                nothing below it moves when the step changes. */}
            <div className="grid shrink-0 lg:hidden">
              {SCENES.map((scene, index) => {
                const sceneCopy = copy.scenes[scene.key];
                return (
                  <div
                    key={scene.key}
                    data-active={index === active}
                    className="tech-caption col-start-1 row-start-1"
                  >
                    <h3 className="font-display text-[1.75rem] leading-[1.15] text-brand-900">
                      {sceneCopy.headline}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-700">{sceneCopy.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <TechnologyFinale copy={copy} technologyHref={technologyHref} />
    </section>
  );
}

function ProgressSegment({
  progress,
  index,
  count,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
}) {
  /* Both ends pinned to 0 and 1. Motion can hand a scroll-linked transform
     to the browser as a WAAPI animation, and WAAPI fills any stretch of the
     timeline the keyframes do not cover with the element's *underlying*
     style — so a segment whose range stopped short of 1 would drain back to
     empty after its step had passed. */
  const input = [0, index / count, (index + 1) / count, 1];
  const fill = useTransform(progress, input, [0, 0, 1, 1]);

  return (
    <span className="relative h-[3px] overflow-hidden rounded-full bg-mist-300">
      <motion.span className="absolute inset-0 origin-left rounded-full bg-accent-500" style={{ scaleX: fill }} />
    </span>
  );
}

function TechnologyHead({ copy }: { copy: TechnologyExperienceCopy }) {
  return (
    <div className="shell relative grid gap-5 pb-10 pt-20 lg:grid-cols-12 lg:items-end lg:gap-12 lg:pb-6 lg:pt-28">
      <div className="lg:col-span-7">
        <p className="eyebrow">{copy.intro.label}</p>
        <h2
          id="technology-title"
          className="mt-5 font-display text-[clamp(2.25rem,4.6vw,4.25rem)] leading-[1.06] text-brand-900"
        >
          {copy.intro.headline}
        </h2>
      </div>
      <p className="hidden max-w-md text-lg leading-relaxed text-ink-700 lg:col-span-5 lg:block lg:pb-2">
        {copy.intro.copy}
      </p>
      <p className="max-w-md text-base leading-relaxed text-ink-700 lg:hidden">{copy.intro.mobileCopy}</p>
    </div>
  );
}

function TechnologyFinale({
  copy,
  technologyHref,
}: {
  copy: TechnologyExperienceCopy;
  technologyHref: string;
}) {
  return (
    <div className="shell relative pb-20 pt-10 text-center lg:pb-28 lg:pt-6">
      <span className="mx-auto block h-12 w-px bg-gradient-to-b from-transparent to-accent-400" aria-hidden="true" />
      <p className="mx-auto mt-8 max-w-3xl font-display text-[clamp(1.9rem,3.6vw,3.25rem)] leading-[1.12] text-brand-900">
        {copy.finale.primary}{" "}
        <span className="text-accent-600">{copy.finale.secondary}</span>
      </p>
      <Link
        href={technologyHref}
        className="group mt-9 inline-flex items-center gap-3 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
      >
        {copy.finale.cta}
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}

/** The logo's loose rings, drawn large and faint behind the section. */
function BrandRings() {
  return (
    <div
      className="pointer-events-none absolute -right-64 -top-24 -z-10 h-[40rem] w-[40rem] opacity-60 lg:-right-48 lg:-top-40 lg:h-[60rem] lg:w-[60rem]"
      aria-hidden="true"
    >
      <div className="absolute inset-[8%] rounded-[46%_54%_48%_52%] border border-accent-200" />
      <div className="absolute inset-[17%] rotate-12 rounded-[52%_48%_54%_46%] border border-accent-200/80" />
      <div className="absolute inset-[29%] -rotate-6 rounded-full border border-accent-200/60" />
    </div>
  );
}

/**
 * Reduced motion: the same four devices, laid out as a plain two-by-two
 * grid on the same light surface. Nothing pins and nothing is tied to the
 * scroll — every word the animated version says is here, in the same order.
 */
function StaticTechnology({
  ref,
  copy,
  technologyHref,
}: {
  ref: Ref<HTMLDivElement>;
  copy: TechnologyExperienceCopy;
  technologyHref: string;
}) {
  return (
    <section
      id="technology"
      aria-labelledby="technology-title"
      className="tech-surface relative isolate overflow-x-clip border-y border-mist-200"
    >
      <BrandRings />
      <TechnologyHead copy={copy} />

      <div ref={ref} className="shell relative mt-6 grid gap-10 sm:grid-cols-2 lg:mt-10 lg:gap-12">
        {SCENES.map((scene, index) => {
          const sceneCopy = copy.scenes[scene.key];
          return (
            <article key={scene.key}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-brand-950 shadow-lift">
                <Image
                  src={scene.src}
                  alt={sceneCopy.alt}
                  fill
                  sizes="(min-width: 640px) 45vw, 92vw"
                  className={`object-cover ${scene.position}`}
                />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-ivory-50 ring-1 ring-inset ring-white/20 backdrop-blur-md">
                  {scene.model}
                </span>
              </div>
              <p className="label-micro mt-6 flex items-center gap-3 !text-accent-600">
                <span className="tabular-nums">{pad(index + 1)}</span>
                <span className="h-px w-6 bg-accent-300" aria-hidden="true" />
                {sceneCopy.microLabel}
              </p>
              <h3 className="mt-2 font-display text-3xl leading-tight text-brand-900 lg:text-4xl">
                {sceneCopy.headline}
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ink-700">{sceneCopy.copy}</p>
            </article>
          );
        })}
      </div>

      <TechnologyFinale copy={copy} technologyHref={technologyHref} />
    </section>
  );
}
