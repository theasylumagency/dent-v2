import type { Dictionary } from "@/i18n/dictionaries";
import { homeHref, route, type RouteKey } from "./routes";

export { homeHref, route };
export type { RouteKey };

export type NavItem = {
  key: RouteKey | "home";
  label: string;
  href: string;
  mega?: boolean;
};

/**
 * Synchronous on purpose: `SiteHeader` is a client component and builds its
 * own nav from the dictionary it already receives. The mega menu's columns
 * are the one thing it cannot compute — those come from the CMS, so the
 * layout fetches them and passes them down as props.
 */
export function getNavItems(dict: Dictionary, lang: string): NavItem[] {
  return [
    { key: "about", label: dict.nav.about, href: route(lang, "about") },
    { key: "services", label: dict.nav.services, href: route(lang, "services"), mega: true },
    { key: "technology", label: dict.nav.technology, href: route(lang, "technology") },
    { key: "news", label: dict.nav.news, href: route(lang, "news") },
    { key: "contact", label: dict.nav.contact, href: route(lang, "contact") },
  ];
}
