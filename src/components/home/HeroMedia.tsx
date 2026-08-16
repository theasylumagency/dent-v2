"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { media } from "@/lib/site";
import { Pause, Play } from "@/components/ui/icons";

type Orientation = "wide" | "tall";
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
 * One video element owns both the initial poster and the eventual clip. Its
 * initial HTML has a poster but no `src`, so the poster can paint immediately
 * without making any video URL discoverable during the critical render.
 *
 * After window load and an idle turn, we choose one crop and assign exactly
 * one URL to that same element. The native poster remains in place until the
 * browser has a frame to show, so there is no blank handoff.
 *
 * There is no codec probe any more — `site.heroVideo` ships a single H.264
 * MP4 per crop, and the note there explains why the WebM alternative stopped
 * earning its keep.
 */
export default function HeroMedia({ dict }: { dict: Dictionary }) {
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [playing, setPlaying] = useState(true);
  const activeSourceRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const connection = (navigator as NavigatorWithConnection).connection;

    let pageLoaded = document.readyState === "complete";
    let activationScheduled = false;
    let cancelScheduledActivation: (() => void) | undefined;

    const videoIsAllowed = () => motion.matches && connection?.saveData !== true;

    const sourceForCurrentViewport = (): VideoSource => {
      const orientation: Orientation = wide.matches ? "wide" : "tall";
      return {
        orientation,
        src: media.heroVideo[orientation],
      };
    };

    const applyCurrentSource = () => {
      if (!videoIsAllowed()) return;

      const nextSource = sourceForCurrentViewport();
      if (activeSourceRef.current === nextSource.src) return;

      activeSourceRef.current = nextSource.src;
      setPlaying(true);
      setVideoSource(nextSource);
    };

    const deactivateVideo = () => {
      cancelScheduledActivation?.();
      cancelScheduledActivation = undefined;
      activationScheduled = false;
      activeSourceRef.current = null;
      const node = videoRef.current;
      if (node) {
        node.pause();
        node.removeAttribute("src");
        node.load();
      }
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

  const handleVideoError = (event: SyntheticEvent<HTMLVideoElement>) => {
    activeSourceRef.current = null;
    event.currentTarget.removeAttribute("src");
    event.currentTarget.load();
    setVideoSource(null);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        src={videoSource?.src}
        poster={media.heroPoster}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload={videoSource ? "auto" : "none"}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={handleVideoError}
      />

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
