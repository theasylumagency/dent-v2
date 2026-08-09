"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getMegaColumns, getNavItems, homeHref, route } from "@/lib/nav";
import { media, site, whatsappHref } from "@/lib/site";
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  Close,
  Mail,
  Menu,
  Phone,
  Pin,
  WhatsApp,
} from "@/components/ui/icons";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = { dict: Dictionary; lang: Locale };

/** Section ids on the home page, in document order — drives scroll-spy. */
const SECTION_IDS = ["clinic", "services", "team", "technology", "faq", "contact"] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SiteHeader({ dict, lang }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileServices, setMobileServices] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const navItems = getNavItems(dict, lang);
  const megaColumns = getMegaColumns(dict, lang);

  /* Close every menu on navigation. Adjusted during render rather than in an
     effect — React re-runs this pass before painting, so the drawer never
     flashes on the new route. */
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
    setMegaOpen(false);
    setMobileServices(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ------------------------------------------------------------------
     Scroll-spy.

     Until the sub-pages exist every nav item is an anchor into one very
     long page, and nothing told the visitor where they were. The
     rootMargin carves out a reading band across the upper third of the
     viewport; whichever section occupies it wins, resolved in document
     order so overlapping sections never flicker.
     ------------------------------------------------------------------ */
  useEffect(() => {
    const nodes = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (node): node is HTMLElement => node !== null,
    );
    if (!nodes.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActiveId(SECTION_IDS.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDrawerOpen(false);
      setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* Focus trap. The drawer covers the whole viewport, so without this Tab
     walks straight out of it and into the page underneath — the user is
     then typing into something they cannot see. */
  useEffect(() => {
    if (!drawerOpen) return;
    const node = drawerRef.current;
    if (!node) return;

    node.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [drawerOpen]);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };

  const scheduleCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  /* The bar is `position: fixed`, so animating its height reflows only the
     header subtree, never the document. Kept as an explicit value so the
     drawer can start exactly below it. */
  const barHeight = scrolled ? 64 : 80;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      onMouseLeave={scheduleCloseMega}
      data-scrolled={scrolled}
    >
      {/* Utility strip ------------------------------------------------ */}
      <div
        className={`hidden overflow-hidden border-b border-accent-200 bg-accent-50 transition-[max-height,opacity] duration-500 lg:block ${
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <div className="shell flex h-10 items-center justify-between text-[0.7rem] text-ink-600">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 text-accent-600" />
              {dict.contact.address}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-accent-600" />
              {dict.contact.hours}
            </span>
          </div>
          {/* The group-brand link used to sit here. WhatsApp and email take
              the slot so the strip keeps its balance — and deliberately not
              the phone, which already has a pill in the main bar below and
              would otherwise appear twice on an unscrolled desktop. */}
          <div className="flex items-center gap-5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-700"
            >
              <WhatsApp className="h-3.5 w-3.5 text-accent-600" />
              {dict.nav.whatsapp}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-700"
            >
              <Mail className="h-3.5 w-3.5 text-accent-600" />
              {site.email}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar ------------------------------------------------------ */}
      <div
        className={`border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled || megaOpen || drawerOpen
            ? "border-ivory-400 bg-ivory-50/90 shadow-soft backdrop-blur-xl"
            : "border-transparent bg-ivory-100/80 backdrop-blur-md"
        }`}
      >
        <div
          className={`shell flex items-center justify-between transition-[height] duration-500 ${
            scrolled ? "h-16" : "h-20 lg:h-24"
          }`}
        >
          <Link
            href={homeHref(lang)}
            className="relative z-10 flex items-center gap-3"
            aria-label={site.name}
          >
            <Image
              src={media.logo}
              alt=""
              width={160}
              height={140}
              priority
              unoptimized
              className={`w-auto transition-[height] duration-500 ${scrolled ? "h-9" : "h-11 lg:h-12"}`}
            />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-lg tracking-[0.02em] text-ink-900">Total Charm</span>
              <span className="text-[0.6rem] uppercase tracking-[0.42em] text-accent-600">Dent</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label={dict.nav.primaryLabel}>
            {navItems.map((item) => {
              const isActive = item.key === activeId;

              return item.mega ? (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={openMega}
                  onFocus={openMega}
                  onClick={() => setMegaOpen((v) => !v)}
                  aria-expanded={megaOpen}
                  aria-controls="mega-menu"
                  className={`group flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm transition-colors ${
                    megaOpen || isActive
                      ? "bg-accent-50 text-accent-700"
                      : "text-ink-700 hover:text-accent-700"
                  }`}
                >
                  {item.label}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`}
                  />
                </button>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  onMouseEnter={scheduleCloseMega}
                  aria-current={isActive ? "true" : undefined}
                  className={`rounded-full px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent-50 font-medium text-accent-700"
                      : "text-ink-700 hover:text-accent-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Shown from lg, not xl: at 1024-1279px the clinic's phone
                number used to disappear entirely, which is the width of
                a great many laptops. */}
            <a
              href={`tel:${site.phoneHref}`}
              className="hidden items-center gap-2 rounded-full border border-ivory-600 bg-ivory-50 px-3.5 py-2 text-xs text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700 lg:inline-flex"
            >
              <Phone className="h-3.5 w-3.5 text-accent-600" />
              {site.phone}
            </a>

            <div className="hidden sm:block">
              <LanguageSwitcher current={lang} label={dict.nav.language} />
            </div>

            <Link href={route(lang, "contact")} className="btn-primary hidden !px-6 !py-2.5 md:inline-flex">
              {dict.nav.book}
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-label={drawerOpen ? dict.nav.closeMenu : dict.nav.openMenu}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700 lg:hidden"
            >
              {drawerOpen ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mega menu — one column per clinical direction ------------------ */}
      <div
        id="mega-menu"
        onMouseEnter={openMega}
        onMouseLeave={scheduleCloseMega}
        className={`absolute inset-x-0 top-full hidden origin-top border-b border-ivory-400 bg-ivory-50/97 shadow-lift backdrop-blur-2xl transition-[opacity,transform,visibility] duration-500 lg:block ${
          megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <div className="shell grid grid-cols-12 gap-10 py-10">
          <div className="col-span-3 flex flex-col justify-between border-r border-ivory-300 pr-8">
            <div>
              <p className="eyebrow">{dict.services.label}</p>
              {/* <p>, not <h2>: this panel is rendered on every page, and a
                  heading here would inject itself into each page outline. */}
              <p className="mt-4 font-display text-3xl leading-tight text-ink-900">
                {dict.services.title}
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
                {dict.nav.servicesIntro}
              </p>
            </div>
            <Link
              href={route(lang, "services")}
              className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              {dict.nav.allServices}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="col-span-9 grid grid-cols-5 gap-x-6">
            {megaColumns.map((column) => (
              <div key={column.slug}>
                <Link
                  href={column.href}
                  className="block px-2 pb-3 font-display text-base leading-snug text-ink-900 transition-colors hover:text-accent-700"
                >
                  {column.title}
                </Link>
                <ul className="space-y-0.5 border-t border-ivory-400 pt-2">
                  {column.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={item.href}
                        className="group flex items-start gap-2 rounded-lg px-2 py-2 text-[0.8rem] text-ink-600 transition-colors hover:bg-accent-50 hover:text-accent-700"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-400 transition-all group-hover:w-3 group-hover:bg-accent-500" />
                        <span className="leading-snug">{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer -------------------------------------------------- */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={dict.nav.primaryLabel}
        className={`fixed inset-0 top-0 z-40 flex flex-col bg-ivory-100/98 backdrop-blur-2xl transition-[opacity,visibility] duration-300 lg:hidden ${
          drawerOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}
      >
        {/* Tracks the live bar height instead of assuming 80px — the bar
            collapses to 64px once scrolled, and the old fixed spacer left
            the first link sitting 16px too low. */}
        <div className="shrink-0 transition-[height] duration-500" style={{ height: barHeight }} />

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-28">
          <nav className="border-t border-ivory-400" aria-label={dict.nav.sectionsLabel}>
            {navItems.map((item) =>
              item.mega ? (
                <div key={item.key} className="border-b border-ivory-400">
                  <button
                    type="button"
                    onClick={() => setMobileServices((v) => !v)}
                    aria-expanded={mobileServices}
                    className="flex w-full items-center justify-between py-5 text-left font-display text-2xl text-ink-900"
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 text-accent-600 transition-transform duration-300 ${
                        mobileServices ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-500 ${
                      mobileServices ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {megaColumns.map((column) => (
                        <div key={column.slug} className="mb-4">
                          <Link
                            href={column.href}
                            className="block py-1.5 text-sm font-medium text-ink-900"
                          >
                            {column.title}
                          </Link>
                          <ul>
                            {column.items.map((service) => (
                              <li key={service.slug}>
                                <Link
                                  href={service.href}
                                  className="block border-l border-accent-200 py-2 pl-4 text-sm text-ink-700 transition-colors hover:text-accent-700"
                                >
                                  {service.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={item.key === activeId ? "true" : undefined}
                  className="block border-b border-ivory-400 py-5 font-display text-2xl text-ink-900"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="mt-8 space-y-6">
            <LanguageSwitcher current={lang} label={dict.nav.language} variant="stack" />

            {/* Repeated here because the drawer (z-40) sits above the
                mobile action bar (z-30) — without it the menu is the one
                place on mobile with no way to book. */}
            <Link href={route(lang, "contact")} className="btn-primary w-full">
              {dict.nav.book}
            </Link>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3 text-ink-700">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <dt className="sr-only">{dict.contact.addressLabel}</dt>
                <dd>{dict.contact.address}</dd>
              </div>
              <div className="flex items-start gap-3 text-ink-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <dt className="sr-only">{dict.contact.hoursLabel}</dt>
                <dd>{dict.contact.hours}</dd>
              </div>
              <div className="flex items-start gap-3 text-ink-700">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <dt className="sr-only">{dict.contact.phoneLabel}</dt>
                <dd>
                  <a href={`tel:${site.phoneHref}`} className="hover:text-accent-700">
                    {site.phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-start gap-3 text-ink-700">
                <WhatsApp className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <dt className="sr-only">{dict.nav.whatsapp}</dt>
                <dd>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-accent-700"
                  >
                    {dict.nav.whatsapp}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </header>
  );
}
