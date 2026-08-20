export type AnalyticsConfig = {
  ga4MeasurementId: string;
  metaPixelId: string;
};

export type AggregateEvent = "page_view" | "booking_open" | "booking_complete";
export type ConsentChoice = "granted" | "denied";
