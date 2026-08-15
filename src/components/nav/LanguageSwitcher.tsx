"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { localeLabels, locales, withLocale, type Locale } from "@/i18n/config";
import { ChevronDown, Globe } from "@/components/ui/icons";

/**
 * Remembers the choice so `proxy.ts` can honour it on the next bare `/` hit.
 * Module scope, not a handler in the component body — writing to `document`
 * from inside a component trips `react-hooks/immutability`.
 */
function persistLocale(locale: Locale) {
  document.cookie = `tcd-locale=${locale}; path=/; max-age=31536000; samesite=lax`;
}

type Props = {
  current: Locale;
  label: string;
  /** `bar` sits in the header, `stack` is the expanded list used on mobile. */
  variant?: "bar" | "stack";
  /**
   * Only the trigger inverts. The dropdown itself stays an ivory card in
   * both modes — it is a floating surface with its own background, so
   * matching it to the hero behind it would make it harder to read, not
   * more consistent.
   */
  onDark?: boolean;
};

export default function LanguageSwitcher({
  current,
  label,
  variant = "bar",
  onDark = false,
}: Props) {
  const pathname = usePathname() || `/${current}`;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (variant === "stack") {
    return (
      <div>
        <p className="label-micro mb-3">{label}</p>
        <div className="flex gap-2">
          {locales.map((locale) => {
            const active = locale === current;
            return (
              <Link
                key={locale}
                href={withLocale(pathname, locale)}
                onClick={() => persistLocale(locale)}
                hrefLang={locale}
                aria-current={active ? "true" : undefined}
                className={`flex-1 rounded-full border px-4 py-2.5 text-center text-sm transition-colors ${
                  active
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-ivory-600 bg-ivory-50 text-ink-700 hover:border-accent-500 hover:text-accent-700"
                }`}
              >
                {localeLabels[locale].short}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs tracking-[0.12em] transition-colors ${
          onDark
            ? "border-white/45 bg-white/10 text-ivory-50 hover:border-accent-200 hover:bg-white/20"
            : "border-ivory-600 bg-ivory-50 text-ink-800 hover:border-accent-500 hover:text-accent-700"
        }`}
      >
        <Globe className={`h-3.5 w-3.5 ${onDark ? "text-accent-200" : "text-accent-600"}`} />
        {localeLabels[current].short}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-[calc(100%+0.6rem)] w-44 origin-top-right overflow-hidden rounded-2xl border border-ivory-500 bg-ivory-50 p-1.5 shadow-lift backdrop-blur-xl transition-[opacity,transform,visibility] duration-300 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        {locales.map((locale) => {
          const active = locale === current;
          return (
            <Link
              key={locale}
              role="menuitem"
              href={withLocale(pathname, locale)}
              hrefLang={locale}
              onClick={() => {
                persistLocale(locale);
                setOpen(false);
              }}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                active ? "bg-accent-50 text-accent-700" : "text-ink-700 hover:bg-ivory-100 hover:text-accent-700"
              }`}
            >
              <span>{localeLabels[locale].native}</span>
              <span className="text-xs tracking-[0.18em] text-ink-600">
                {localeLabels[locale].short}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
