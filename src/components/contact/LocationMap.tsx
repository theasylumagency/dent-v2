"use client";

import { useEffect, useRef, useState } from "react";

import { Pin } from "@/components/ui/icons";

export default function LocationMap({
  lang,
  title,
  loadingLabel,
  lat,
  lng,
}: {
  lang: string;
  title: string;
  loadingLabel: string;
  lat: number;
  lng: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || loaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setLoaded(true);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loaded]);

  const embedSrc = `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=${lang}&output=embed`;

  return (
    <div
      ref={hostRef}
      className="relative min-h-[22rem] overflow-hidden rounded-[1.5rem] border border-ivory-500 bg-ivory-200 shadow-soft sm:aspect-[16/9] sm:min-h-0"
      aria-busy={!loaded}
    >
      {loaded ? (
        <iframe
          src={embedSrc}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(var(--color-ivory-300)_1px,transparent_1px),linear-gradient(90deg,var(--color-ivory-300)_1px,transparent_1px)] bg-[size:48px_48px] text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-accent-200 bg-ivory-50 text-accent-700 shadow-soft" aria-hidden="true">
            <Pin className="h-5 w-5" />
          </span>
          <p role="status" className="mt-4 text-sm text-ink-600">{loadingLabel}</p>
        </div>
      )}
    </div>
  );
}
