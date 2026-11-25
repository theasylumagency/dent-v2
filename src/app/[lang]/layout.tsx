import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import "../globals.css";
import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { getAnalyticsConfig } from "@/lib/analytics/settings";
import { agency, brandIcons, site } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#fbf7f1",
  colorScheme: "light",
};

/** Shared by the normal website and campaign route trees. */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  /* Attribution that survives a content edit. `authors` renders as
     `<meta name="author">` plus `<link rel="author">`; `creator` as
     `<meta name="creator">`. Both are inherited by every page under this
     layout, campaign routes included, and neither is reachable from the
     admin — unlike the visible footer credit, which is a string in a
     dictionary. `publisher` is the clinic: it built none of this, but it
     is the one publishing it. */
  authors: [{ name: agency.legalName, url: agency.url }],
  creator: agency.legalName,
  publisher: site.name,
  icons: {
    icon: { url: brandIcons.svg, sizes: "any", type: "image/svg+xml" },
    apple: { url: brandIcons.apple, sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.webmanifest",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const [dict, analyticsConfig] = await Promise.all([
    getDictionary(locale),
    getAnalyticsConfig(),
  ]);

  return (
    <html lang={htmlLang[locale]} suppressHydrationWarning>
      <body className="min-h-dvh bg-ivory-100 text-ink-700 antialiased">
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js")` }} />
        <AnalyticsProvider config={analyticsConfig} copy={dict.analyticsConsent}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent-300 focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-ink-900"
          >
            {dict.nav.skipToContent}
          </a>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
