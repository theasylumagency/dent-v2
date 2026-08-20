"use client";

import { useEffect, useRef } from "react";

import { trackDoctorView, trackServiceView } from "@/lib/analytics";

const seen = new Set<string>();

export default function TrackedView({ type, viewKey }: { type: "doctor" | "service"; viewKey: string }) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || seen.has(viewKey)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || seen.has(viewKey)) return;
        seen.add(viewKey);
        if (type === "doctor") trackDoctorView();
        else trackServiceView();
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [type, viewKey]);

  return <span ref={markerRef} aria-hidden="true" className="pointer-events-none block h-px w-px" />;
}
