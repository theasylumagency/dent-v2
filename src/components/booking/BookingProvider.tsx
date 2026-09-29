"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import BookingDrawer from "./BookingDrawer";
import type { BookingCopy, BookingOption } from "./types";
import {
  recordAggregateEvent,
  trackBookingOpen,
  type BookingAnalyticsContext,
} from "@/lib/analytics";

type BookingContextValue = {
  isOpen: boolean;
  openBooking: (trigger?: HTMLElement | null) => void;
  closeBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);
const HISTORY_KEY = "__totalCharmBookingDrawer";

function inferTriggerLocation(trigger?: HTMLElement | null): string {
  const explicit = trigger?.dataset.analyticsLocation?.trim();
  if (explicit) return explicit;
  if (trigger?.closest("header")) return "header";
  if (trigger?.closest("aside")) return "sidebar";
  if (trigger?.closest("nav")) return "navigation";
  if (trigger?.closest("footer")) return "footer";
  return "page";
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used inside BookingProvider");
  return context;
}

export default function BookingProvider({
  children,
  copy,
  options,
}: {
  children: ReactNode;
  copy: BookingCopy;
  options: BookingOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [analyticsContext, setAnalyticsContext] = useState<BookingAnalyticsContext>();
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const openBooking = useCallback(
    (trigger?: HTMLElement | null) => {
      if (isOpen) return;
      triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
      const nextAnalyticsContext: BookingAnalyticsContext = {
        pagePath: window.location.pathname,
        triggerLocation: inferTriggerLocation(triggerRef.current),
      };
      setAnalyticsContext(nextAnalyticsContext);
      window.history.pushState(
        { ...window.history.state, [HISTORY_KEY]: true },
        "",
        window.location.href,
      );
      trackBookingOpen(nextAnalyticsContext);
      recordAggregateEvent("booking_open", nextAnalyticsContext.pagePath);
      setIsOpen(true);
    },
    [isOpen],
  );

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    if (window.history.state?.[HISTORY_KEY]) window.history.back();
  }, []);

  useEffect(() => {
    const handlePopState = () => setIsOpen(false);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      const frame = window.requestAnimationFrame(() => triggerRef.current?.focus());
      wasOpenRef.current = isOpen;
      return () => window.cancelAnimationFrame(frame);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <BookingContext.Provider value={{ isOpen, openBooking, closeBooking }}>
      {children}
      <BookingDrawer
        isOpen={isOpen}
        copy={copy}
        options={options}
        analyticsContext={analyticsContext}
        onClose={closeBooking}
      />
    </BookingContext.Provider>
  );
}
