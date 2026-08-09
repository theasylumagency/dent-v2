export const locales = ["ka", "en", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ka";

/** BCP-47 tags used for <html lang> and hreflang. */
export const htmlLang: Record<Locale, string> = {
  ka: "ka-GE",
  en: "en",
  ru: "ru",
};

export const localeLabels: Record<Locale, { short: string; native: string }> = {
  ka: { short: "GE", native: "ქართული" },
  en: { short: "EN", native: "English" },
  ru: { short: "RU", native: "Русский" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Swap the locale segment of a pathname, e.g. /ka/services -> /en/services */
export function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    segments[0] = locale;
  } else {
    segments.unshift(locale);
  }
  return `/${segments.join("/")}`;
}
