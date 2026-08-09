"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import { Pause, Play } from "@/components/ui/icons";

/**
 * Hero media.
 *
 * The poster is a real <Image priority> and is always what paints first,
 * so it — not the video — is the LCP element. The video is layered on top
 * afterwards and only when it is actually wanted:
 *
 *   • `prefers-reduced-motion: reduce` — an autoplaying, looping clip is
 *     precisely what that setting exists to suppress. The global CSS
 *     reduced-motion rule only reaches CSS animations, never a <video>,
 *     so this has to be handled here.
 *   • below 1024px — a decorative clip is not worth the mobile data, and
 *     the 4:3 crop the phone layout needs would mangle the framing.
 *   • Save-Data / metered connections.
 *
 * Everyone who does get the video also gets a control to stop it. Motion
 * sensitivity is not limited to people who have found the OS setting.
 */
export default function HeroMedia({ dict }: { dict: Dictionary }) {
  const [showVideo, setShowVideo] = useState(false);
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const saveData =
      typeof navigator !== "undefined" &&
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
        true;

    const decide = () => setShowVideo(motion.matches && wide.matches && !saveData);

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

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-lift lg:aspect-[4/5]">
      <Image
        src={media.heroPoster}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover"
      />

      {showVideo && (
        <video
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
          <source src={media.heroVideo} type="video/mp4" />
        </video>
      )}

      {/* Just enough wash to seat the media in the ivory page. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(200deg, color-mix(in oklab, #7AC7EF 45%, transparent) 0%, transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
        aria-hidden="true"
      />

      {showVideo && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? dict.hero.pauseMotion : dict.hero.playMotion}
          className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50/90 text-ink-800 backdrop-blur transition-colors hover:text-accent-700"
        >
          {playing ? <Pause /> : <Play />}
        </button>
      )}
    </div>
  );
}
