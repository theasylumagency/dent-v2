"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import { Pause, Play } from "@/components/ui/icons";

type Orientation = "wide" | "tall";
type Codec = keyof (typeof media.heroVideo)[Orientation];
type VideoSource = {
  orientation: Orientation;
  src: string;
};

type DataSavingConnection = EventTarget & {
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: DataSavingConnection;
};

/**
 * The poster is the only media request in the critical render. It is served
 * directly (without an additional Next image-optimizer URL), while the video
 * is not mounted until the window load event has passed and the browser gets
 * an idle turn.
 *
 * At activation time we choose one crop and one codec, then put exactly one
 * URL on the video element. Keeping the poster as a separate layer means the
 * video needs no `poster` attribute and cannot trigger a second poster fetch.
 */
export default function HeroMedia({ dict }: { dict: Dictionary }) {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const activeSourceRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const connection = (navigator as NavigatorWithConnection).connection;
    const codecProbe = document.createElement("video");
    const codec: Codec = codecProbe.canPlayType("video/webm") ? "webm" : "mp4";

    let pageLoaded = document.readyState === "complete";
    let activationScheduled = false;
    let cancelScheduledActivation: (() => void) | undefined;

    const videoIsAllowed = () => motion.matches && connection?.saveData !== true;

    const sourceForCurrentViewport = (): VideoSource => {
      const orientation: Orientation = wide.matches ? "wide" : "tall";
      return {
        orientation,
        src: media.heroVideo[orientation][codec],
      };
    };

    const applyCurrentSource = () => {
      if (!videoIsAllowed()) return;

      const nextSource = sourceForCurrentViewport();
      if (activeSourceRef.current === nextSource.src) return;

      activeSourceRef.current = nextSource.src;
      setVideoReady(false);
      setPlaying(true);
      setVideoSource(nextSource);
    };

    const deactivateVideo = () => {
      cancelScheduledActivation?.();
      cancelScheduledActivation = undefined;
      activationScheduled = false;
      activeSourceRef.current = null;
      videoRef.current?.pause();
      setVideoReady(false);
      setVideoSource(null);
    };

    const scheduleActivation = () => {
      if (!pageLoaded || activationScheduled || activeSourceRef.current || !videoIsAllowed()) {
        return;
      }

      activationScheduled = true;

      const activate = () => {
        activationScheduled = false;
        cancelScheduledActivation = undefined;
        applyCurrentSource();
      };

      if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(activate, { timeout: 1500 });
        cancelScheduledActivation = () => window.cancelIdleCallback(idleId);
      } else {
        const timeoutId = globalThis.setTimeout(activate, 0);
        cancelScheduledActivation = () => globalThis.clearTimeout(timeoutId);
      }
    };

    const handleLoad = () => {
      pageLoaded = true;
      scheduleActivation();
    };

    const handlePreferenceChange = () => {
      if (videoIsAllowed()) {
        scheduleActivation();
      } else {
        deactivateVideo();
      }
    };

    const handleViewportChange = () => {
      if (activeSourceRef.current) applyCurrentSource();
    };

    if (pageLoaded) {
      scheduleActivation();
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    motion.addEventListener("change", handlePreferenceChange);
    wide.addEventListener("change", handleViewportChange);
    connection?.addEventListener("change", handlePreferenceChange);

    return () => {
      window.removeEventListener("load", handleLoad);
      motion.removeEventListener("change", handlePreferenceChange);
      wide.removeEventListener("change", handleViewportChange);
      connection?.removeEventListener("change", handlePreferenceChange);
      cancelScheduledActivation?.();
    };
  }, []);

  const toggle = () => {
    const node = videoRef.current;
    if (!node) return;

    if (node.paused) {
      void node.play().catch(() => setPlaying(false));
    } else {
      node.pause();
    }
  };

  const handleVideoError = () => {
    activeSourceRef.current = null;
    setVideoReady(false);
    setVideoSource(null);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image
        src={media.heroPoster}
        alt=""
        fill
        unoptimized
        loading="eager"
        fetchPriority="high"
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover"
      />

      {videoSource && (
        <video
          key={videoSource.src}
          ref={videoRef}
          src={videoSource.src}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={() => setVideoReady(true)}
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={handleVideoError}
        />
      )}

      {videoSource && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? dict.hero.pauseMotion : dict.hero.playMotion}
          className="absolute right-4 top-24 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-ivory-50 backdrop-blur transition-colors hover:border-accent-200 hover:bg-white/20 lg:bottom-8 lg:right-8 lg:top-auto"
        >
          {playing ? <Pause /> : <Play />}
        </button>
      )}
    </div>
  );
}
