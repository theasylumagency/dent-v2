"use client";

import { useEffect, useRef } from "react";

import { Close } from "@/components/ui/icons";
import BookingForm from "@/components/home/BookingForm";
import type { BookingCopy, BookingOption } from "./types";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function BookingDrawer({
  isOpen,
  copy,
  options,
  onClose,
}: {
  isOpen: boolean;
  copy: BookingCopy;
  options: BookingOption[];
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      panel.querySelector<HTMLElement>("[data-booking-initial-focus]")?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] transition-[visibility] duration-300 motion-reduce:transition-none ${
        isOpen ? "visible" : "pointer-events-none invisible"
      }`}
      aria-hidden={isOpen ? undefined : "true"}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={copy.close}
        onClick={onClose}
        className={`absolute inset-0 bg-brand-950/35 transition-opacity duration-300 motion-reduce:transition-none ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-drawer-title"
        className={`absolute inset-y-0 right-0 flex w-[min(100%,460px)] flex-col bg-ivory-100 shadow-[-18px_0_55px_-28px_rgba(4,18,29,0.45)] transition-transform duration-300 ease-[var(--ease-premium)] motion-reduce:transition-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-ivory-400 bg-ivory-100/95 px-6 py-5 backdrop-blur-lg sm:px-8 sm:py-6">
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700 sm:right-6 sm:top-5"
          >
            <Close className="h-4 w-4" />
          </button>
          <div className="pr-12">
            <p className="eyebrow">{copy.title}</p>
            <h2 id="booking-drawer-title" className="mt-3 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{copy.intro}</p>
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <BookingForm copy={copy} options={options} onClose={onClose} />
        </div>
      </aside>
    </div>
  );
}
