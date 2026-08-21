import "client-only";

import { sendGA4Event, sendMetaCustomEvent, sendMetaEvent } from "./providers";
import type { AggregateEvent } from "./types";

/** Public analytics API. No caller knows which provider is configured. */
export function trackPageView(pathname: string): void {
  sendGA4Event("page_view", { page_path: pathname });
  sendMetaEvent("PageView");
}

export function trackBookingOpen(): void {
  sendGA4Event("booking_form_open");
  sendMetaCustomEvent("BookingOpen");
}

export type LandingAnalyticsContext = {
  landingSlug: string;
  campaignName?: string;
};

function landingParameters(context?: LandingAnalyticsContext): Record<string, string> | undefined {
  if (!context) return undefined;
  return {
    landing_slug: context.landingSlug,
    ...(context.campaignName ? { campaign_name: context.campaignName } : {}),
  };
}

export function trackBookingComplete(context?: LandingAnalyticsContext): void {
  const parameters = landingParameters(context);
  sendGA4Event("generate_lead", parameters);
  sendMetaEvent("Lead", parameters);
}

export function trackLandingCta(context: LandingAnalyticsContext): void {
  const parameters = landingParameters(context);
  sendGA4Event("landing_cta_click", parameters);
  sendMetaCustomEvent("LandingCtaClick", parameters);
}

export function trackPhoneClick(): void {
  sendGA4Event("phone_click");
  sendMetaEvent("Contact");
}

export function trackMessengerClick(): void {
  sendGA4Event("messenger_click");
  sendMetaEvent("Contact");
}

export function trackEmailClick(): void {
  sendGA4Event("email_click");
  sendMetaEvent("Contact");
}

export function trackServiceView(): void {
  sendGA4Event("service_view");
  sendMetaEvent("ViewContent");
}

export function trackDoctorView(): void {
  sendGA4Event("doctor_view");
  sendMetaEvent("ViewContent");
}

/** Fire-and-forget, first-party aggregate increment. It carries only the
 * event and route — never a visitor or session identifier. */
export function recordAggregateEvent(event: AggregateEvent, route = ""): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, route });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/aggregate", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/aggregate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
