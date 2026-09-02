import type { Dictionary } from "@/i18n/dictionaries";
import { homeHref, isRouteReady, route, type RouteKey } from "./routes";

export { homeHref, route };
export type { RouteKey };

export type NavItem = {
  key: RouteKey | "home";
  label: string;
  href: string;
  mega?: boolean;
  /**
   * Kept out of the desktop bar, shown everywhere else.
   *
   * The header row is not elastic: logo, nav, phone, language and the
   * booking button are one flex line inside `max-width: 88rem`, and measured
   * against the live site the five Georgian labels already overflow it below
   * roughly 1536px — at 1280px "ჩვენს შესახებ" wraps onto two lines today.
   * A sixth label makes that happen at every desktop width, so the bar takes
   * five and the sixth goes where there is room.
   *
   * News is the one that steps back rather than cases: a patient choosing a
   * clinic wants to see the work before they want the clinic's announcements,
   * and the drawer and the footer still list it in full.
   */
  secondary?: boolean;
};

/**
 * Every item, in reading order. The drawer and the footer render all of
 * them; the desktop bar drops the ones marked `secondary` because it has no
 * room — see the field's own note.
 *
 * Synchronous on purpose: `SiteHeader` is a client component and builds its
 * own nav from the dictionary it already receives. The mega menu's columns
 * are the one thing it cannot compute — those come from the CMS, so the
 * layout fetches them and passes them down as props.
 */
export function getNavItems(dict: Dictionary, lang: string): NavItem[] {
  /* Annotated rather than inferred: with a `.filter()` in between, the
     return type no longer reaches the literal, and `key` widens to `string`
     — which then fails against `RouteKey` both here and inside the filter. */
  const items: NavItem[] = [
    { key: "about", label: dict.nav.about, href: route(lang, "about") },
    { key: "services", label: dict.nav.services, href: route(lang, "services"), mega: true },
    /* Next to services rather than beside news: a visitor weighing up the
       clinic reads the treatments and then wants to see them done. */
    { key: "cases", label: dict.nav.cases, href: route(lang, "cases") },
    { key: "technology", label: dict.nav.technology, href: route(lang, "technology") },
    { key: "news", label: dict.nav.news, href: route(lang, "news"), secondary: true },
    { key: "contact", label: dict.nav.contact, href: route(lang, "contact") },
    /* A nav entry for a route that is not ready links to an anchor on the
       home page — a menu item that does not go where it says it does. It is
       dropped instead, everywhere at once: the bar, the drawer and the
       footer all build from this list. */
  ];

  return items.filter((item) => item.key === "home" || isRouteReady(item.key));
}
