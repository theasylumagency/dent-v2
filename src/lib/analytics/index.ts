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

export function trackBookingComplete(): void {
  sendGA4Event("generate_lead");
  sendMetaEvent("Lead");
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
