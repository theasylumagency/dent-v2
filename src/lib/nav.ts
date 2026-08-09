import type { Dictionary } from "@/i18n/dictionaries";
import { getServiceCategories, type ServiceCategory } from "./services";
import { homeHref, route, type RouteKey } from "./routes";

export { homeHref, route };
export type { RouteKey };

export type NavItem = {
  key: RouteKey | "home";
  label: string;
  href: string;
  mega?: boolean;
};

export function getNavItems(dict: Dictionary, lang: string): NavItem[] {
  return [
    { key: "clinic", label: dict.nav.clinic, href: route(lang, "clinic") },
    { key: "services", label: dict.nav.services, href: route(lang, "services"), mega: true },
    { key: "team", label: dict.nav.team, href: route(lang, "team") },
    { key: "technology", label: dict.nav.technology, href: route(lang, "technology") },
    { key: "contact", label: dict.nav.contact, href: route(lang, "contact") },
  ];
}

/** The mega menu shows one column per clinical direction. */
export function getMegaColumns(dict: Dictionary, lang: string): ServiceCategory[] {
  return getServiceCategories(dict, lang);
}
