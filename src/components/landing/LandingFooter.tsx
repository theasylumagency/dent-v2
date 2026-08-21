import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { htmlLang, localeLabels, locales } from "@/i18n/config";
import type { Clinic } from "@/lib/clinic";
import { campaignPath } from "@/lib/campaign-slug";
import { media, site } from "@/lib/site";
import { PrivacySettingsButton } from "@/components/analytics/AnalyticsProvider";

export default function LandingFooter({
  clinic,
  lang,
  slug,
  languageLabel,
  privacySettingsLabel,
  rightsLabel,
}: {
  clinic: Clinic;
  lang: Locale;
  slug: string;
  languageLabel: string;
  privacySettingsLabel: string;
  rightsLabel: string;
}) {
  return (
    /* The bottom padding clears the fixed mobile call bar, which would
       otherwise sit on top of the language switcher — the one control a
       Russian- or English-speaking visitor needs from this footer. */
    <footer className="border-t border-ivory-400 bg-ivory-50 py-10 pb-28 lg:pb-10">
      <div className="shell flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Image
            src={media.logo}
            alt={site.name}
            width={200}
            height={175}
            unoptimized
            className="h-11 w-auto"
          />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-600">{clinic.address}</p>
          <p className="mt-2 text-xs text-ink-500">© {new Date().getFullYear()} {site.name}. {rightsLabel}</p>
        </div>
        <div className="flex flex-col items-start gap-4 sm:items-end">
          <nav aria-label={languageLabel}>
            <ul className="flex gap-2">
              {locales.map((locale) => (
                <li key={locale}>
                  <Link
                    href={campaignPath(locale, slug)}
                    hrefLang={htmlLang[locale]}
                    aria-current={locale === lang ? "page" : undefined}
                    className={`inline-flex rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      locale === lang
                        ? "border-accent-500 bg-accent-50 text-accent-700"
                        : "border-ivory-500 text-ink-600 hover:border-accent-400 hover:text-accent-700"
                    }`}
                  >
                    {localeLabels[locale].short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <PrivacySettingsButton>{privacySettingsLabel}</PrivacySettingsButton>
        </div>
      </div>
    </footer>
  );
}
