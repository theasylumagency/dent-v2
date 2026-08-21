"use client";

import { useEffect, useState } from "react";

import { Phone, WhatsApp } from "@/components/ui/icons";
import {
  trackLandingCta,
  trackMessengerClick,
  trackPhoneClick,
  type LandingAnalyticsContext,
} from "@/lib/analytics";

/**
 * The bar that follows a visitor down a campaign page on a phone.
 *
 * Most campaign traffic arrives from a paid ad on a phone, scrolls, and then
 * has to find its way back to the form. This keeps both conversions — dial or
 * fill in — one thumb-reach away for the whole page.
 *
 * It appears only after the hero has scrolled away, so it never covers the
 * first screen's own call to action, and hides again while the form is on
 * screen, where a second "leave your number" button would be noise sitting on
 * top of the field the visitor is typing into.
 *
 * Both conditions are observed rather than polled — a scroll handler on a
 * long page runs hundreds of times per swipe for two booleans.
 */
export default function LandingMobileBar({
  ctaLabel,
  callLabel,
  whatsappLabel,
  phoneHref,
  whatsappHref,
  context,
}: {
  ctaLabel: string;
  callLabel: string;
  whatsappLabel: string;
  phoneHref: string;
  whatsappHref: string;
  context: LandingAnalyticsContext;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [formOnScreen, setFormOnScreen] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("landing-hero-end");
    const form = document.getElementById("landing-lead-form");
    if (typeof IntersectionObserver === "undefined") return;

    const observers: IntersectionObserver[] = [];

    if (sentinel) {
      const observer = new IntersectionObserver(
        ([entry]) => setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        { threshold: 0 },
      );
      observer.observe(sentinel);
      observers.push(observer);
    }

    if (form) {
      const observer = new IntersectionObserver(([entry]) => setFormOnScreen(entry.isIntersecting), {
        threshold: 0,
      });
      observer.observe(form);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const shown = pastHero && !formOnScreen;

  return (
    <div
      className="lp-bar fixed inset-x-0 bottom-0 z-40 border-t border-ivory-500 bg-ivory-50 lg:hidden"
      data-shown={shown ? "true" : "false"}
      /* Hidden from the accessibility tree while off screen so a screen
         reader does not announce a bar nobody can reach. */
      aria-hidden={shown ? undefined : "true"}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 px-4 py-2.5">
        {phoneHref ? (
          <a
            href={`tel:${phoneHref}`}
            onClick={trackPhoneClick}
            tabIndex={shown ? undefined : -1}
            aria-label={callLabel}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          >
            <Phone className="h-5 w-5" />
          </a>
        ) : null}

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            onClick={trackMessengerClick}
            tabIndex={shown ? undefined : -1}
            aria-label={whatsappLabel}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          >
            <WhatsApp className="h-5 w-5" />
          </a>
        ) : null}

        <a
          href="#landing-lead-form"
          onClick={() => trackLandingCta(context)}
          tabIndex={shown ? undefined : -1}
          className="btn-primary w-full !py-3.5"
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
