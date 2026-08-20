import "client-only";

import type { AnalyticsConfig } from "./types";

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  queue: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let config: AnalyticsConfig = { ga4MeasurementId: "", metaPixelId: "" };
let consentGranted = false;
let configuredGaId = "";
let configuredMetaId = "";

function appendAsyncScript(id: string, src: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initializeGA4(): void {
  const id = config.ga4MeasurementId;
  if (!id || !consentGranted || configuredGaId === id) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag("js", new Date());
  window.gtag("consent", "update", { analytics_storage: "granted" });
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
  window.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  appendAsyncScript("total-charm-ga4", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  configuredGaId = id;
}

function initializeMeta(): void {
  const id = config.metaPixelId;
  if (!id || !consentGranted || configuredMetaId === id) return;

  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    }) as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
  }

  window.fbq("consent", "grant");
  window.fbq("init", id);
  appendAsyncScript("total-charm-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  configuredMetaId = id;
}

function initializeConfiguredProviders(): void {
  if (typeof window === "undefined" || !consentGranted) return;
  initializeGA4();
  initializeMeta();
}

export function setAnalyticsConfig(next: AnalyticsConfig): void {
  config = next;
  initializeConfiguredProviders();
}

export function setProviderConsent(granted: boolean): void {
  consentGranted = granted;
  if (granted) {
    if (configuredGaId) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${configuredGaId}`] = false;
    }
    initializeConfiguredProviders();
    window.gtag?.("consent", "update", { analytics_storage: "granted" });
    window.fbq?.("consent", "grant");
    return;
  }

  if (configuredGaId) {
    /* Unlike Consent Mode's denied state, the documented ga-disable flag
       prevents even cookieless measurement pings after withdrawal. */
    (window as unknown as Record<string, unknown>)[`ga-disable-${configuredGaId}`] = true;
  }
  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.fbq?.("consent", "revoke");
  removeProviderCookies();
}

function expireCookie(name: string, domain?: string): void {
  const domainPart = domain ? `; Domain=${domain}` : "";
  document.cookie = `${name}=; Max-Age=0; Path=/${domainPart}; SameSite=Lax`;
}

export function removeProviderCookies(): void {
  if (typeof document === "undefined") return;
  const names = document.cookie
    .split(";")
    .map((entry) => entry.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name && (name.startsWith("_ga") || name === "_fbp" || name === "_fbc")));
  const hostname = window.location.hostname;
  const registrable = hostname.split(".").slice(-2).join(".");

  for (const name of names) {
    expireCookie(name);
    expireCookie(name, hostname);
    if (registrable && registrable !== hostname) expireCookie(name, `.${registrable}`);
  }
}

export function sendGA4Event(name: string, parameters?: Record<string, unknown>): void {
  if (!consentGranted || !configuredGaId) return;
  window.gtag?.("event", name, parameters ?? {});
}

export function sendMetaEvent(name: string): void {
  if (!consentGranted || !configuredMetaId) return;
  window.fbq?.("track", name);
}

export function sendMetaCustomEvent(name: string): void {
  if (!consentGranted || !configuredMetaId) return;
  window.fbq?.("trackCustom", name);
}
