import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/routes";

import TechnologyExperience from "./TechnologyExperience";

/**
 * Server-facing boundary for the homepage technology theatre. The scroll
 * choreography stays in a small client island; localized copy and the route
 * are prepared here so the rest of the homepage remains server-rendered.
 */
export default function Technology({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <TechnologyExperience
      copy={dict.technology.homeExperience}
      technologyHref={route(lang, "technology")}
    />
  );
}
