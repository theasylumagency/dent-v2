"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import { Pause, Play } from "@/components/ui/icons";

/**
 * Hero media — fills whatever box the hero hands it.
 *
 * The poster is a real <Image priority> and is always what paints first,
 * so it — not the video — is the LCP element. The video is layered on top
 * afterwards, and in one of two crops:
 *
 *   • ≥1024px — the 16:9 master, sitting in the right-hand panel.
 *   • below that — the 9:16 master, full-bleed behind the copy.
 *
 * `orientation` starts as `null` and is only resolved in an effect, which
 * is what keeps the server and first client render identical: picking a
 * crop during render would need `window`. It also means exactly one file
 * is ever requested — the losing crop is never in the DOM, so the browser
 * never speculatively fetches it.
 *
 * The video is still suppressed entirely for:
 *
 *   • `prefers-reduced-motion: reduce` — an autoplaying, looping clip is
 *     precisely what that setting exists to suppress. The global CSS
 *     reduced-motion rule only reaches CSS animations, never a <video>,
 *     so this has to be handled here.
 *   • Save-Data / metered connections. The mobile gate that used to live
 *     here was a blanket "no video below 1024px"; now that there is a
 *     purpose-made vertical crop the clip is wanted on phones, and this
 *     is the check that should have been carrying that decision anyway.
 *
 * Everyone who does get the video also gets a control to stop it. Motion
 * sensitivity is not limited to people who have found the OS setting.
 */
type Orientation = "wide" | "tall";

export default function HeroMedia({ dict }: { dict: Dictionary }) {
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const saveData =
      typeof navigator !== "undefined" &&
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
        true;

    const decide = () => {
      if (!motion.matches || saveData) {
        setOrientation(null);
        return;
      }
      setOrientation(wide.matches ? "wide" : "tall");
    };

    decide();
    motion.addEventListener("change", decide);
    wide.addEventListener("change", decide);
    return () => {
      motion.removeEventListener("change", decide);
      wide.removeEventListener("change", decide);
    };
  }, []);

  const toggle = () => {
    const node = videoRef.current;
    if (!node) return;
    if (node.paused) {
      void node.play();
      setPlaying(true);
    } else {
      node.pause();
      setPlaying(false);
    }
  };

  const sources = orientation ? media.heroVideo[orientation] : null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={media.heroPoster}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover"
      />

      {sources && (
        <video
          /* Keyed on the crop: swapping <source> children on a live
             <video> does nothing without an explicit .load(), so on a
             desktop↔mobile resize the element would keep playing the
             old file. Remounting is the honest fix. */
          key={orientation}
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={media.heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source src={sources.webm} type="video/webm" />
          <source src={sources.mp4} type="video/mp4" />
        </video>
      )}

      {sources && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? dict.hero.pauseMotion : dict.hero.playMotion}
          /* Top-right on phones, bottom-right on desktop. The mobile
             hero stacks copy, two CTAs and the fixed action bar into
             the lower half of the screen — a bottom-anchored control
             there lands on top of one of them at some viewport height. */
          className="absolute right-4 top-24 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-ivory-50 backdrop-blur transition-colors hover:border-accent-200 hover:bg-white/20 lg:bottom-8 lg:right-8 lg:top-auto"
        >
          {playing ? <Pause /> : <Play />}
        </button>
      )}
    </div>
  );
}
