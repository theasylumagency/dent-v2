export type BookingRequestData = {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  preferredTime?: string;
  message?: string;
  landingSlug?: string;
  campaignName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export type ParsedBookingSubmission =
  | { kind: "honeypot" }
  | { kind: "invalid" }
  | { kind: "valid"; data: BookingRequestData };

type UnknownRecord = Record<string, unknown>;

function clean(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optional(value: string): string | undefined {
  return value || undefined;
}

export function parseBookingSubmission(value: unknown): ParsedBookingSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { kind: "invalid" };
  const body = value as UnknownRecord;

  if (clean(body.company)) return { kind: "honeypot" };

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160);
  const submittedLandingSlug = clean(body.landingSlug, 120);
  const landingSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(submittedLandingSlug)
    ? submittedLandingSlug
    : "";

  const digits = phone.replace(/\D/g, "");
  if (name.length < 2 || digits.length < 9) return { kind: "invalid" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { kind: "invalid" };

  return {
    kind: "valid",
    data: {
      name,
      phone,
      email: optional(email),
      service: optional(clean(body.service, 120)),
      preferredTime: optional(clean(body.preferredTime, 60)),
      message: optional(clean(body.message)),
      landingSlug: optional(landingSlug),
      campaignName: optional(clean(body.campaignName, 160)),
      utmSource: optional(clean(body.utm_source, 200)),
      utmMedium: optional(clean(body.utm_medium, 200)),
      utmCampaign: optional(clean(body.utm_campaign, 200)),
      utmContent: optional(clean(body.utm_content, 200)),
      utmTerm: optional(clean(body.utm_term, 200)),
    },
  };
}

export class BookingRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs = 10 * 60 * 1000,
    private readonly maxPerWindow = 5,
    private readonly now: () => number = Date.now,
  ) {}

  isLimited(ip: string): boolean {
    const now = this.now();
    const recent = (this.hits.get(ip) ?? []).filter((time) => now - time < this.windowMs);
    recent.push(now);
    this.hits.set(ip, recent);

    if (this.hits.size > 500) {
      for (const [key, times] of this.hits) {
        if (times.every((time) => now - time >= this.windowMs)) this.hits.delete(key);
      }
    }

    return recent.length > this.maxPerWindow;
  }
}

export function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
