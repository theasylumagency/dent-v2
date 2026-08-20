"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import {
  recordAggregateEvent,
  trackEmailClick,
  trackMessengerClick,
  trackPageView,
  trackPhoneClick,
  trackServiceView,
} from "@/lib/analytics";
import { setAnalyticsConfig, setProviderConsent } from "@/lib/analytics/providers";
import type { AnalyticsConfig, ConsentChoice } from "@/lib/analytics/types";

const CONSENT_KEY = "total-charm-consent";
const CONSENT_VERSION = 1;

type ConsentCopy = {
  title: string;
  message: string;
  allow: string;
  deny: string;
  close: string;
  settingsTitle: string;
  settingsMessage: string;
  enabled: string;
  disabled: string;
  disable: string;
};

type ConsentContextValue = {
  openSettings: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStoredConsent(): ConsentChoice | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null") as {
      analyticsConsent?: unknown;
      consentVersion?: unknown;
    } | null;
    if (parsed?.consentVersion !== CONSENT_VERSION) return null;
    return parsed.analyticsConsent === "granted" || parsed.analyticsConsent === "denied"
      ? parsed.analyticsConsent
      : null;
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice): void {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({
      analyticsConsent: choice,
      consentVersion: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    }),
  );
}

function RouteTracker({ consent }: { consent: ConsentChoice | null }) {
  const pathname = usePathname();
  const aggregatedPathRef = useRef<string | null>(null);
  const trackedThirdPartyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || aggregatedPathRef.current === pathname) return;
    aggregatedPathRef.current = pathname;
    recordAggregateEvent("page_view", pathname);
  }, [pathname]);

  useEffect(() => {
    if (consent !== "granted" || !pathname || trackedThirdPartyRef.current === pathname) return;
    trackedThirdPartyRef.current = pathname;
    trackPageView(pathname);
    if (/^\/(ka|en|ru)\/services\/[^/]+\/?$/.test(pathname)) trackServiceView();
  }, [consent, pathname]);

  return null;
}

export default function AnalyticsProvider({
  children,
  config,
  copy,
}: {
  children: ReactNode;
  config: AnalyticsConfig;
  copy: ConsentCopy;
}) {
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setAnalyticsConfig(config);
    const stored = readStoredConsent();
    setProviderConsent(stored === "granted");
    const frame = window.requestAnimationFrame(() => {
      setConsent(stored);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [config]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.href.toLowerCase();
      if (href.startsWith("tel:")) trackPhoneClick();
      else if (href.startsWith("mailto:")) trackEmailClick();
      else if (/\/\/(wa\.me|api\.whatsapp\.com|m\.me|messenger\.com)\//.test(href)) trackMessengerClick();
    };

    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const choose = useCallback((next: ConsentChoice) => {
    storeConsent(next);
    setProviderConsent(next === "granted");
    setConsent(next);
    setSettingsOpen(false);
  }, []);

  const close = useCallback(() => {
    if (!settingsOpen && consent === null) choose("denied");
    else setSettingsOpen(false);
  }, [choose, consent, settingsOpen]);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const showNotice = ready && (consent === null || settingsOpen);

  return (
    <ConsentContext.Provider value={{ openSettings }}>
      {children}
      <Suspense fallback={null}>
        <RouteTracker consent={consent} />
      </Suspense>

      {showNotice ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="analytics-consent-title"
          className="fixed bottom-20 left-3 right-3 z-[90] max-w-md rounded-2xl border border-ivory-500 bg-ivory-50 p-5 shadow-lift sm:bottom-5 sm:left-5 sm:right-auto"
        >
          <button
            type="button"
            onClick={close}
            aria-label={copy.close}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-ink-600 transition-colors hover:bg-ivory-200 hover:text-ink-900"
          >
            ×
          </button>
          <h2 id="analytics-consent-title" className="pr-9 font-display text-xl text-ink-900">
            {settingsOpen ? copy.settingsTitle : copy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            {settingsOpen ? copy.settingsMessage : copy.message}
          </p>
          {settingsOpen && consent ? (
            <p className="mt-3 text-xs font-medium text-ink-700">
              {consent === "granted" ? copy.enabled : copy.disabled}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {consent === "granted" && settingsOpen ? (
              <button type="button" onClick={() => choose("denied")} className="btn-ghost !px-4 !py-2 !text-xs">
                {copy.disable}
              </button>
            ) : (
              <button type="button" onClick={() => choose("granted")} className="btn-primary !px-4 !py-2 !text-xs">
                {copy.allow}
              </button>
            )}
            {!settingsOpen || consent !== "granted" ? (
              <button type="button" onClick={() => choose("denied")} className="btn-ghost !px-4 !py-2 !text-xs">
                {copy.deny}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </ConsentContext.Provider>
  );
}

export function PrivacySettingsButton({ children }: { children: ReactNode }) {
  const context = useContext(ConsentContext);
  if (!context) return null;

  return (
    <button type="button" onClick={context.openSettings} className="text-left hover:text-accent-700">
      {children}
    </button>
  );
}
