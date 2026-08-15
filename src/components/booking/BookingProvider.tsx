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

type BookingContextValue = {
  isOpen: boolean;
  openBooking: (trigger?: HTMLElement | null) => void;
  closeBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);
const HISTORY_KEY = "__totalCharmBookingDrawer";

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
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const openBooking = useCallback(
    (trigger?: HTMLElement | null) => {
      if (isOpen) return;
      triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
      window.history.pushState(
        { ...window.history.state, [HISTORY_KEY]: true },
        "",
        window.location.href,
      );
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
      <BookingDrawer isOpen={isOpen} copy={copy} options={options} onClose={closeBooking} />
    </BookingContext.Provider>
  );
}
