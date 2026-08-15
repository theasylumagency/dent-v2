import type { Clinic } from "./clinic";

/**
 * The counter row, shared by the home page and `/about`.
 *
 * Four figures, from two different kinds of source, and the distinction is
 * the whole point of this module:
 *
 * - **Counted.** Specialists and services are `COUNT(*)` over the CMS. They
 *   used to be the strings `"5"` and `"16"` in the dictionaries, which meant
 *   the first doctor an editor added made the site quietly wrong — in three
 *   languages, with nothing to catch it. They are not editable because there
 *   is nothing to edit: the answer is in the database.
 * - **Claimed.** Satisfied patients and years on the market cannot be
 *   counted, so the clinic owns them in `clinic-info`. Unset means the
 *   counter is not rendered. A medical site publishing an unsourced "98%" is
 *   a credibility risk, and inventing a placeholder for it in code made this
 *   codebase the one asserting it.
 *
 * Pure on purpose — every caller already has the clinic record and the two
 * counts, so this does no querying of its own and can be reasoned about
 * without a database.
 */

export type Stat = { key: string; value: string; suffix: string; label: string };

/**
 * `directions` is a historical key name: the label under it now reads
 * "dental services", because the figure was always the service count. It sat
 * under "16 treatment directions" while the site had five — a stat that
 * contradicted the navigation beside it. The key is left alone so the
 * dictionaries do not need another migration for a name only this file sees.
 */
export type StatLabels = {
  satisfied: string;
  years: string;
  specialists: string;
  directions: string;
};

export function buildStats(input: {
  labels: StatLabels;
  clinic: Clinic;
  doctorCount: number;
  serviceCount: number;
}): Stat[] {
  const { labels, clinic, doctorCount, serviceCount } = input;

  const stats: Stat[] = [];

  if (clinic.satisfiedPercent !== null) {
    stats.push({
      key: "satisfied",
      value: String(clinic.satisfiedPercent),
      suffix: "%",
      label: labels.satisfied,
    });
  }

  if (clinic.yearsOnMarket !== null) {
    stats.push({
      key: "years",
      value: String(clinic.yearsOnMarket),
      suffix: "+",
      label: labels.years,
    });
  }

  if (doctorCount > 0) {
    stats.push({
      key: "specialists",
      value: String(doctorCount),
      suffix: "",
      label: labels.specialists,
    });
  }

  if (serviceCount > 0) {
    stats.push({
      key: "services",
      value: String(serviceCount),
      suffix: "",
      label: labels.directions,
    });
  }

  return stats;
}
