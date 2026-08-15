"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
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

/** Homepage-specific editorial assets live here, away from the documentary
 * equipment catalogue. Keep image replacement independent of choreography. */
const SCENE_ASSETS: Record<
  SceneKey,
  {
    number: string;
    src: string;
    imageClass: string;
    staticPosition: string;
  }
> = {
  cbct: {
    number: "01",
    src: "/images/home/technology/cbct.webp",
    imageClass: "object-cover object-[68%_center] lg:object-center",
    staticPosition: "object-[68%_center]",
  },
  trios: {
    number: "02",
    src: "/images/home/technology/trios-3-move.webp",
    imageClass: "object-cover object-center opacity-70 mix-blend-luminosity",
    staticPosition: "object-center",
  },
  airflow: {
    number: "03",
    src: "/images/home/technology/airflow.webp",
    imageClass: "object-cover object-[72%_center] lg:object-center",
    staticPosition: "object-[72%_center]",
  },
  zoom: {
    number: "04",
    src: "/images/home/technology/zoom-4.webp",
    imageClass: "object-cover object-[69%_center] lg:object-center",
    staticPosition: "object-[69%_center]",
  },
};

const SCENE_KEYS: SceneKey[] = ["cbct", "trios", "airflow", "zoom"];

function useSceneMotion(
  progress: MotionValue<number>,
  range: [number, number, number, number],
  scaleRange: [number, number, number, number] = [1.04, 1, 1, 1],
) {
  return {
    opacity: useTransform(progress, range, [0, 1, 1, 0]),
    scale: useTransform(progress, range, scaleRange),
  };
}

export default function TechnologyExperience({
  copy,
  technologyHref,
}: {
  copy: TechnologyExperienceCopy;
  technologyHref: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const introOpacity = useTransform(scrollYProgress, [0, 0.035, 0.085, 0.11], [0, 1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.035, 0.085, 0.11], [18, 0, 0, -16]);

  const cbctMotion = useSceneMotion(scrollYProgress, [0.08, 0.14, 0.49, 0.51], [1.05, 1, 1, 1]);
  const cbctCopyOpacity = useTransform(scrollYProgress, [0.1, 0.14, 0.27, 0.32], [0, 1, 1, 0]);
  const cbctCopyY = useTransform(scrollYProgress, [0.1, 0.14, 0.27, 0.32], [16, 0, 0, -12]);

  const triosClipPath = useTransform(
    scrollYProgress,
    [0.3, 0.48],
    ["circle(7% at 72% 46%)", "circle(150% at 72% 46%)"],
  );
  const triosLayerOpacity = useTransform(scrollYProgress, [0.295, 0.3, 0.64, 0.68], [0, 1, 1, 0]);
  const triosScale = useTransform(scrollYProgress, [0.3, 0.48, 0.65], [1.025, 1, 1.01]);
  const triosCopyOpacity = useTransform(scrollYProgress, [0.45, 0.49, 0.61, 0.66], [0, 1, 1, 0]);
  const triosCopyY = useTransform(scrollYProgress, [0.45, 0.49, 0.61, 0.66], [14, 0, 0, -10]);

  const airflowMotion = useSceneMotion(
    scrollYProgress,
    [0.62, 0.67, 0.77, 0.81],
    [1.12, 1.03, 1.02, 1.02],
  );
  const airflowCopyOpacity = useTransform(scrollYProgress, [0.65, 0.69, 0.75, 0.79], [0, 1, 1, 0]);
  const airflowCopyY = useTransform(scrollYProgress, [0.65, 0.69, 0.75, 0.79], [14, 0, 0, -10]);

  const zoomMotion = useSceneMotion(scrollYProgress, [0.75, 0.8, 0.91, 0.95], [1.055, 1, 1, 1]);
  const zoomCopyOpacity = useTransform(scrollYProgress, [0.78, 0.82, 0.88, 0.92], [0, 1, 1, 0]);
  const zoomCopyY = useTransform(scrollYProgress, [0.78, 0.82, 0.88, 0.92], [14, 0, 0, -10]);
  const zoomGlowOpacity = useTransform(scrollYProgress, [0.78, 0.86, 0.92], [0.08, 0.72, 0.18]);
  const zoomGlowScale = useTransform(scrollYProgress, [0.78, 0.88], [0.78, 1.08]);

  const finaleOpacity = useTransform(scrollYProgress, [0.9, 0.94, 1], [0, 1, 1]);
  const finaleY = useTransform(scrollYProgress, [0.9, 0.94], [18, 0]);

  if (reduceMotion) {
    return <StaticExperience copy={copy} technologyHref={technologyHref} />;
  }

  return (
    <section
      ref={sectionRef}
      id="technology"
      aria-labelledby="technology-experience-title"
      className="on-dark relative isolate h-[330svh] bg-brand-950 lg:h-[450svh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-brand-950">
        <div
          className="absolute inset-0 bg-[radial-gradient(75%_80%_at_76%_42%,rgba(18,74,112,0.34),transparent_66%),linear-gradient(135deg,#04121d_0%,#071c2c_54%,#04121d_100%)]"
          aria-hidden="true"
        />
        <BrandGeometry />

        <motion.div
          className="absolute inset-0 z-10"
          style={{ opacity: cbctMotion.opacity, scale: cbctMotion.scale }}
        >
          <SceneImage scene="cbct" alt={copy.scenes.cbct.alt} />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-20 bg-brand-950"
          style={{
            clipPath: triosClipPath,
            opacity: triosLayerOpacity,
            scale: triosScale,
          }}
        >
          <SceneImage scene="trios" alt={copy.scenes.trios.alt} />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-30"
          style={{ opacity: airflowMotion.opacity, scale: airflowMotion.scale }}
        >
          <SceneImage scene="airflow" alt={copy.scenes.airflow.alt} />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-40"
          style={{ opacity: zoomMotion.opacity, scale: zoomMotion.scale }}
        >
          <SceneImage scene="zoom" alt={copy.scenes.zoom.alt} />
          <motion.div
            className="absolute right-[18%] top-[22%] h-64 w-64 rounded-full bg-accent-300/45 mix-blend-screen blur-3xl lg:right-[22%] lg:top-[27%] lg:h-80 lg:w-80"
            style={{ opacity: zoomGlowOpacity, scale: zoomGlowScale }}
            aria-hidden="true"
          />
        </motion.div>

        <div className="shell absolute inset-x-0 top-[18svh] z-50 lg:top-1/2 lg:-translate-y-1/2">
          <motion.div
            className="max-w-[32rem]"
            style={{ opacity: introOpacity, y: introY }}
          >
            <p className="eyebrow">{copy.intro.label}</p>
            <h2
              id="technology-experience-title"
              className="mt-6 max-w-3xl font-display text-[clamp(2.25rem,6vw,5.7rem)] leading-[1.04]"
            >
              {copy.intro.headline}
            </h2>
            <p className="mt-6 hidden max-w-xl text-base leading-relaxed text-ivory-200/78 lg:block lg:text-lg">
              {copy.intro.copy}
            </p>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-ivory-200/78 lg:hidden">
              {copy.intro.mobileCopy}
            </p>
          </motion.div>
        </div>

        <SceneCopyPanel
          asset={SCENE_ASSETS.cbct}
          copy={copy.scenes.cbct}
          opacity={cbctCopyOpacity}
          y={cbctCopyY}
        />
        <SceneCopyPanel
          asset={SCENE_ASSETS.trios}
          copy={copy.scenes.trios}
          opacity={triosCopyOpacity}
          y={triosCopyY}
        />
        <SceneCopyPanel
          asset={SCENE_ASSETS.airflow}
          copy={copy.scenes.airflow}
          opacity={airflowCopyOpacity}
          y={airflowCopyY}
        />
        <SceneCopyPanel
          asset={SCENE_ASSETS.zoom}
          copy={copy.scenes.zoom}
          opacity={zoomCopyOpacity}
          y={zoomCopyY}
        />

        <motion.div
          className="absolute inset-0 z-60 flex items-center bg-[radial-gradient(70%_70%_at_50%_45%,rgba(13,53,80,0.58),transparent_72%),#04121d] has-[a:focus-visible]:!opacity-100"
          style={{ opacity: finaleOpacity, y: finaleY }}
        >
          <div className="shell w-full text-center">
            <h3 className="mx-auto max-w-4xl font-display text-[clamp(2.2rem,5.5vw,5.3rem)] leading-[1.08]">
              {copy.finale.primary}
            </h3>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ivory-200/72 lg:text-2xl">
              {copy.finale.secondary}
            </p>
            <Link
              href={technologyHref}
              className="group mt-10 inline-flex items-center gap-3 text-sm font-medium text-accent-200 transition-colors hover:text-ivory-50"
            >
              {copy.finale.cta}
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 transition-colors duration-300 group-hover:border-accent-200 group-hover:bg-accent-300 group-hover:text-ink-900">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BrandGeometry() {
  return (
    <div className="pointer-events-none absolute -right-56 -top-40 z-[1] h-[42rem] w-[42rem] opacity-[0.09] lg:-right-48 lg:-top-72 lg:h-[64rem] lg:w-[64rem]" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-[46%_54%_48%_52%] border border-accent-300" />
      <div className="absolute inset-[17%] rotate-12 rounded-[52%_48%_54%_46%] border border-accent-300/70" />
      <div className="absolute inset-[29%] -rotate-6 rounded-full border border-accent-300/50" />
    </div>
  );
}

function SceneImage({ scene, alt }: { scene: SceneKey; alt: string }) {
  const asset = SCENE_ASSETS[scene];

  return (
    <>
      <div className="absolute inset-x-0 top-0 h-[59svh] lg:inset-0 lg:h-full">
        <Image
          src={asset.src}
          alt={alt}
          fill
          sizes="100vw"
          className={asset.imageClass}
        />
      </div>
      <div
        className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_32%,rgba(4,18,29,0.3)_49%,#04121d_61%)] lg:bg-[linear-gradient(90deg,rgba(4,18,29,0.98)_0%,rgba(4,18,29,0.72)_34%,rgba(4,18,29,0.08)_62%,rgba(4,18,29,0.15)_100%)]"
        aria-hidden="true"
      />
    </>
  );
}

function SceneCopyPanel({
  asset,
  copy,
  opacity,
  y,
}: {
  asset: (typeof SCENE_ASSETS)[SceneKey];
  copy: SceneCopy;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <div className="shell pointer-events-none absolute inset-x-0 bottom-[7svh] z-50 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2">
      <motion.article className="relative max-w-md" style={{ opacity, y }}>
        <span
          className="absolute -top-16 left-0 -z-10 font-display text-[7.5rem] leading-none text-white/[0.055] lg:-top-24 lg:text-[10rem]"
          aria-hidden="true"
        >
          {asset.number}
        </span>
        <p className="label-micro flex items-center gap-3">
          <span className="text-accent-300">{asset.number}</span>
          <span className="h-px w-8 bg-accent-300/55" aria-hidden="true" />
          {copy.microLabel}
        </p>
        <h3 className="mt-4 font-display text-[clamp(2rem,4vw,4.5rem)] leading-[1.05]">
          {copy.headline}
        </h3>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ivory-200/78 lg:text-lg">
          {copy.copy}
        </p>
      </motion.article>
    </div>
  );
}

function StaticExperience({
  copy,
  technologyHref,
}: {
  copy: TechnologyExperienceCopy;
  technologyHref: string;
}) {
  return (
    <section
      id="technology"
      aria-labelledby="technology-static-title"
      className="on-dark relative overflow-hidden bg-brand-950 py-20 lg:py-28"
    >
      <BrandGeometry />
      <div className="shell relative z-10">
        <p className="eyebrow">{copy.intro.label}</p>
        <h2
          id="technology-static-title"
          className="mt-6 max-w-4xl font-display text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05]"
        >
          {copy.intro.headline}
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory-200/78 lg:text-lg">
          {copy.intro.copy}
        </p>

        <div className="mt-16 space-y-16 lg:mt-24 lg:space-y-24">
          {SCENE_KEYS.map((key) => {
            const asset = SCENE_ASSETS[key];
            const scene = copy.scenes[key];

            return (
              <article key={key} className="grid items-center gap-7 lg:grid-cols-12 lg:gap-12">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-900 ring-1 ring-inset ring-white/10 lg:col-span-7">
                  <Image
                    src={asset.src}
                    alt={scene.alt}
                    fill
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className={`object-cover ${asset.staticPosition}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/45 to-transparent" aria-hidden="true" />
                </div>
                <div className="lg:col-span-5">
                  <p className="label-micro flex items-center gap-3">
                    <span>{asset.number}</span>
                    <span className="h-px w-8 bg-accent-300/55" aria-hidden="true" />
                    {scene.microLabel}
                  </p>
                  <h3 className="mt-4 font-display text-3xl leading-tight lg:text-5xl">
                    {scene.headline}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-ivory-200/78 lg:text-lg">
                    {scene.copy}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-20 max-w-4xl border-t border-white/12 pt-16 text-center lg:mt-28 lg:pt-24">
          <h3 className="font-display text-[clamp(2.25rem,5vw,4.75rem)] leading-[1.08]">
            {copy.finale.primary}
          </h3>
          <p className="mt-5 text-lg text-ivory-200/72 lg:text-2xl">{copy.finale.secondary}</p>
          <Link
            href={technologyHref}
            className="group mt-9 inline-flex items-center gap-3 text-sm font-medium text-accent-200 transition-colors hover:text-ivory-50"
          >
            {copy.finale.cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
