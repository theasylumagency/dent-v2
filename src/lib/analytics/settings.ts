import "server-only";

import { cms } from "../cms";
import type { AnalyticsConfig } from "./types";

type AnalyticsSettingsDoc = {
  ga4MeasurementId?: string | null;
  metaPixelId?: string | null;
};

export async function getAnalyticsConfig(): Promise<AnalyticsConfig> {
  const payload = await cms();
  const doc = (await payload.findGlobal({
    slug: "analytics-settings",
    depth: 0,
  })) as unknown as AnalyticsSettingsDoc;

  return {
    ga4MeasurementId: doc.ga4MeasurementId?.trim() ?? "",
    metaPixelId: doc.metaPixelId?.trim() ?? "",
  };
}
