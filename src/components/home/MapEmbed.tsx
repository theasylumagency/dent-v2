"use client";

import { useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { site, whatsappHref } from "@/lib/site";
import { ArrowUpRight, Clock, Phone, Pin, WhatsApp } from "@/components/ui/icons";

/**
 * Click-to-load map.
 *
 * A Google Maps iframe pulls roughly 1.5MB of script and sets Google's
 * cookies on sight. On a page whose main job is collecting a patient's
 * name and phone number, loading a third-party tracker before anyone has
 * asked for it is the wrong default — so the embed only mounts once the
 * visitor presses the button.
 *
 * The resting state is a real information card, not a spacer: address,
 * district, opening hours and a way to phone ahead if the building is
 * hard to find. Most visitors want the address and a directions link, not
 * a draggable map, and they now get both without paying for the embed.
 *
 * The `output=embed` URL form needs no API key and no billing account —
 * it is built straight from `site.geo`, so there is nothing to paste in
 * and nothing to keep in sync when the address changes.
 */
export default function MapEmbed({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const [loaded, setLoaded] = useState(false);

  const embedSrc = `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=16&hl=${lang}&output=embed`;

  if (loaded) {
    return (
      <div className="relative mt-6 min-h-[20rem] overflow-hidden rounded-card border border-ivory-500 shadow-soft sm:aspect-[16/10] sm:min-h-0">
        <iframe
          src={embedSrc}
          title={dict.contact.mapTitle}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="card relative mt-6 overflow-hidden">
      {/* Abstract grid, not a fake map screenshot — it reads as a
          deliberate surface rather than a picture that failed to load. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ivory-300) 1px, transparent 1px), linear-gradient(90deg, var(--color-ivory-300) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="aura -right-24 -top-20 h-72 w-72 opacity-40" aria-hidden="true" />

      {/* Oversized pin watermark. Purely decorative, and low enough in
          contrast that it never competes with the address. */}
      <Pin className="pointer-events-none absolute -bottom-8 -right-6 h-48 w-48 text-accent-300/25" />

      <div className="relative flex flex-col gap-7 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200">
            <Pin className="h-5 w-5" />
          </span>
          <div>
            <p className="label-micro">{dict.contact.addressLabel}</p>
            <p className="mt-1.5 font-display text-xl leading-snug text-ink-900 sm:text-2xl">
              {dict.contact.address}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-y border-ivory-300 py-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            <div>
              <dt className="label-micro">{dict.contact.districtLabel}</dt>
              <dd className="mt-1 text-sm text-ink-800">{dict.contact.district}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
            <div>
              <dt className="label-micro">{dict.contact.hoursLabel}</dt>
              <dd className="mt-1 text-sm text-ink-800">{dict.contact.hours}</dd>
            </div>
          </div>
        </dl>

        {/* The single most useful thing on a "where are you" panel is a way
            to ask a human, so it sits above the map button rather than
            being buried in the contact list further up. */}
        <div>
          <p className="text-sm font-medium text-ink-900">{dict.contact.cantFind}</p>
          <p className="mt-1 text-sm text-ink-600">{dict.contact.cantFindNote}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <a
              href={`tel:${site.phoneHref}`}
              className="inline-flex items-center gap-2 rounded-full border border-ivory-600 bg-ivory-50 px-3.5 py-2 text-sm text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700"
            >
              <Phone className="h-3.5 w-3.5 text-accent-600" />
              {site.phone}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ivory-600 bg-ivory-50 px-3.5 py-2 text-sm text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700"
            >
              <WhatsApp className="h-3.5 w-3.5 text-accent-600" />
              {dict.nav.whatsapp}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="btn-primary !py-3 !text-sm"
          >
            {dict.contact.showMap}
          </button>

          <a href={site.maps} target="_blank" rel="noreferrer" className="btn-ghost !py-3 !text-sm">
            {dict.contact.directions}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          <p className="w-full text-xs text-ink-500 sm:w-auto">{dict.contact.mapNote}</p>
        </div>
      </div>
    </div>
  );
}
