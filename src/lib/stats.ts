import type { Clinic } from "./clinic";

/** Shared by the home and about pages. The service count comes from the
 * catalog. The clinic provides its optional patient and experience figures. */

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
  directions: string;
};

export function buildStats(input: {
  labels: StatLabels;
  clinic: Clinic;
  serviceCount: number;
}): Stat[] {
  const { labels, clinic, serviceCount } = input;

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
