import "client-only";

import { sendGA4Event, sendMetaCustomEvent, sendMetaEvent } from "./providers";
import type { AggregateEvent } from "./types";

/** Public analytics API. No caller knows which provider is configured. */
export function trackPageView(pathname: string): void {
  sendGA4Event("page_view", { page_path: pathname });
  sendMetaEvent("PageView");
}

export type BookingAnalyticsContext = {
  pagePath: string;
  triggerLocation: string;
};

function bookingParameters(context?: BookingAnalyticsContext): Record<string, string> {
  const pagePath =
    context?.pagePath || (typeof window !== "undefined" ? window.location.pathname : "");
  const triggerLocation = context?.triggerLocation || "form";

  return {
    ...(pagePath ? { page_path: pagePath } : {}),
    trigger_location: triggerLocation,
  };
}

export function trackBookingOpen(context?: BookingAnalyticsContext): void {
  const parameters = bookingParameters(context);
  sendGA4Event("booking_form_open", parameters);
  sendMetaCustomEvent("BookingOpen", parameters);
}

export function trackBookingStart(context?: BookingAnalyticsContext): void {
  const parameters = bookingParameters(context);
  sendGA4Event("booking_form_start", parameters);
  sendMetaCustomEvent("BookingStart", parameters);
}

export type LandingAnalyticsContext = {
  landingSlug: string;
  campaignName?: string;
};

function landingParameters(context?: LandingAnalyticsContext): Record<string, string> {
  if (!context) return {};
  return {
    landing_slug: context.landingSlug,
    ...(context.campaignName ? { campaign_name: context.campaignName } : {}),
  };
}

export function trackBookingComplete(
  context?: LandingAnalyticsContext,
  bookingContext?: BookingAnalyticsContext,
): void {
  const parameters = {
    ...landingParameters(context),
    ...bookingParameters(bookingContext),
    lead_source: context ? "campaign_landing" : "booking_form",
  };
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

export function trackDirectionsClick(): void {
  sendGA4Event("directions_click");
  sendMetaEvent("Contact");
}

function inferredContentKey(kind: "service" | "doctor"): string | undefined {
  if (typeof window === "undefined") return undefined;
  const pattern =
    kind === "service"
      ? /^\/(?:ka|en|ru)\/services\/([^/]+)\/?$/
      : /^\/(?:ka|en|ru)\/about\/([^/]+)\/?$/;
  return window.location.pathname.match(pattern)?.[1];
}

function normalizeContentKey(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  const pieces = normalized.split(":");
  return pieces[pieces.length - 1] || undefined;
}

export function trackServiceView(contentKey?: string): void {
  const key = normalizeContentKey(contentKey) ?? inferredContentKey("service");
  const parameters = key ? { content_key: key } : undefined;
  sendGA4Event("service_view", parameters);
  sendMetaEvent("ViewContent", parameters);
}

export function trackDoctorView(contentKey?: string): void {
  const key = normalizeContentKey(contentKey) ?? inferredContentKey("doctor");
  const parameters = key ? { content_key: key } : undefined;
  sendGA4Event("doctor_view", parameters);
  sendMetaEvent("ViewContent", parameters);
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
