import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getNavItems, route } from "@/lib/nav";
import type { ServiceCategory } from "@/lib/services-shared";
import type { Clinic } from "@/lib/clinic";
import { agency, media, site } from "@/lib/site";
import { ArrowUpRight, Clock, Mail, Phone, Pin, WhatsApp } from "@/components/ui/icons";
import BookingTrigger from "@/components/booking/BookingTrigger";
import { PrivacySettingsButton } from "@/components/analytics/AnalyticsProvider";

/* `categories` and `clinic` are passed in rather than fetched: the layout
   already queries both for the header, and one round trip is enough. The
   footer mirrors the home page — five directions, not sixteen links. */
export default function SiteFooter({
  dict,
  lang,
  categories,
  clinic,
}: {
  dict: Dictionary;
  lang: Locale;
  categories: ServiceCategory[];
  clinic: Clinic;
}) {
  const navItems = getNavItems(dict, lang);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-ivory-400 bg-ivory-50">
      <div className="aura -left-40 bottom-0 h-96 w-96 opacity-25" aria-hidden="true" />

      <div className="shell relative grid grid-cols-1 gap-12 py-20 md:grid-cols-12 lg:py-24">
        <div className="md:col-span-4">
          <Image
            src={media.logo}
            alt={site.name}
            width={200}
            height={175}
            unoptimized
            className="h-14 w-auto"
          />
          <p className="mt-6 max-w-xs font-display text-xl leading-snug text-ink-800">
            {dict.footer.tagline}
          </p>

          <div className="mt-8 flex gap-3">
            <a
              href={clinic.social.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory-600 bg-ivory-100 text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.7v8h3.5Z" />
              </svg>
            </a>
            <a
              href={clinic.social.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory-600 bg-ivory-100 text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="label-micro">
            {dict.footer.navLabel}
          </h3>
          <ul className="mt-5 space-y-3">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="text-sm text-ink-700 transition-colors hover:text-accent-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="label-micro">
            {dict.footer.servicesLabel}
          </h3>
          <ul className="mt-5 space-y-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={category.href}
                  className="text-sm text-ink-700 transition-colors hover:text-accent-700"
                >
                  {category.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={route(lang, "services")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
              >
                {dict.nav.allServices}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <h3 className="label-micro">
            {dict.footer.contactLabel}
          </h3>
          <ul className="mt-5 space-y-4 text-sm text-ink-700">
            <li className="flex items-start gap-3">
              <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <a href={clinic.maps} target="_blank" rel="noreferrer" className="hover:text-accent-700">
                {clinic.address}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <span>{clinic.hours}</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <span className="flex flex-col gap-1">
                <a href={`tel:${clinic.phoneHref}`} className="hover:text-accent-700">
                  {clinic.phone}
                </a>
                {/* The landline is optional in the CMS — an empty second line
                    would render as a blank link, not as nothing. */}
                {clinic.phoneAlt ? (
                  <a href={`tel:${clinic.phoneAltHref}`} className="text-ink-600 hover:text-accent-700">
                    {clinic.phoneAlt}
                  </a>
                ) : null}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <WhatsApp className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <a href={clinic.whatsappHref} target="_blank" rel="noreferrer" className="hover:text-accent-700">
                {dict.nav.whatsapp}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
              <a href={`mailto:${clinic.email}`} className="hover:text-accent-700">
                {clinic.email}
              </a>
            </li>
          </ul>

          {/* Took the slot the group-brand card used to occupy. Keeps the
              column's visual weight and ends the footer on the action we
              actually want, instead of on an outbound link. */}
          <BookingTrigger
            className="group mt-8 flex items-center justify-between rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3.5 transition-colors hover:border-accent-500"
          >
            <span className="text-sm font-medium text-ink-900">{dict.nav.book}</span>
            <span className="text-accent-700" aria-hidden="true">+</span>
          </BookingTrigger>
        </div>
      </div>

      <div className="hairline" />

      {/* pb-24 on mobile clears the fixed action bar, which would otherwise
          sit on top of this row. */}
      <div className="shell flex flex-col gap-3 pb-24 pt-6 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between lg:pb-6">
        <p>
          © {year} {site.name}. {dict.footer.rights}
        </p>
        {/* TODO(legal): these are inert spans because the pages do not exist
            yet. The booking form collects a name, phone and email, so a
            published privacy notice is a requirement under Georgia's
            personal data protection law — this needs a real page before
            launch, not a link to nowhere. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <PrivacySettingsButton>{dict.footer.privacySettings}</PrivacySettingsButton>
          <span className="cursor-default">{dict.footer.privacy}</span>
          <span className="cursor-default">{dict.footer.terms}</span>
          {/* The build credit. One step dimmer than the legal links beside it,
              so it is found by anyone who reads a footer and noticed by nobody
              who does not — this is a clinic's page, not the studio's.
              Deliberately absent from `LandingFooter`: campaign pages are paid
              traffic, and an outbound link there is a leak, not a signature. */}
          <a
            href={agency.url}
            target="_blank"
            rel="noreferrer nofollow"
            className="group text-ink-500 transition-colors hover:text-accent-700"
          >
            {dict.footer.credit}{" "}
            <span className="font-medium text-ink-700 transition-colors group-hover:text-accent-700">
              {agency.name}
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
