import { NextResponse } from "next/server";

import { site } from "@/lib/site";
import { incrementAggregate } from "@/lib/analytics/aggregate-server";

export const runtime = "nodejs";
/* Never cached, never statically evaluated at build time. */
export const dynamic = "force-dynamic";

type Payload = {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  preferredTime?: string;
  message?: string;
  company?: string;
  landingSlug?: string;
  campaignName?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

/* --------------------------------------------------------------------------
   Rate limiting

   In-memory, so the window is per server instance. On a single long-lived
   Node process (the usual deployment for a clinic site) that is exactly
   right. If this ever moves to a multi-instance serverless setup, swap the
   Map for a shared store — the limit silently multiplies by instance count
   otherwise.
   -------------------------------------------------------------------------- */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  /* Opportunistic sweep so the Map cannot grow without bound. */
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function clean(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  /* Honeypot. A human never sees this field, so anything in it is a bot.
     Answer 200 so the bot has no signal that it was caught. */
  if (clean(body.company)) {
    return NextResponse.json({ ok: true, accepted: false });
  }

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160);
  const service = clean(body.service, 120);
  const preferredTime = clean(body.preferredTime, 60);
  const message = clean(body.message);
  const submittedLandingSlug = clean(body.landingSlug, 120);
  const landingSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(submittedLandingSlug)
    ? submittedLandingSlug
    : "";
  const campaignName = clean(body.campaignName, 160);
  const attribution = {
    utmSource: clean(body.utm_source, 200),
    utmMedium: clean(body.utm_medium, 200),
    utmCampaign: clean(body.utm_campaign, 200),
    utmContent: clean(body.utm_content, 200),
    utmTerm: clean(body.utm_term, 200),
  };

  /* Server-side validation is the real gate — the client checks exist to
     give fast feedback, not to be trusted. */
  const digits = phone.replace(/\D/g, "");
  if (name.length < 2 || digits.length < 9) {
    return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  /* Deliberately not read from the `clinic-info` global. That field is the
     public contact address; this is where patient bookings are delivered.
     Wiring them together would mean an editor tidying the address on the
     contact page silently reroutes — or loses — every lead. `BOOKING_INBOX`
     is the switch, and it is deployment configuration. */
  const to = process.env.BOOKING_INBOX ?? site.email;
  const from = process.env.BOOKING_FROM;

  if (!apiKey || !from) {
    /* Loud on the server, honest to the patient. The form will show its
       error state and offer the phone number, which is the correct
       outcome — far better than the previous behaviour, where a fake
       success meant a booking request simply evaporated. */
    console.error(
      "[booking] RESEND_API_KEY and/or BOOKING_FROM is not set — the request was not delivered.",
      { name, phone, email, service, preferredTime },
    );
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Phone", phone],
    ["Email", email || "—"],
    ["Area of interest", service || "—"],
    ["Best time to call", preferredTime || "—"],
    ["Message", message || "—"],
    ...(landingSlug ? ([["Landing page / slug", landingSlug]] as [string, string][]) : []),
    ...(campaignName ? ([["Campaign name", campaignName]] as [string, string][]) : []),
    ...(attribution.utmSource ? ([["UTM Source", attribution.utmSource]] as [string, string][]) : []),
    ...(attribution.utmMedium ? ([["UTM Medium", attribution.utmMedium]] as [string, string][]) : []),
    ...(attribution.utmCampaign
      ? ([["UTM Campaign", attribution.utmCampaign]] as [string, string][])
      : []),
    ...(attribution.utmContent
      ? ([["UTM Content", attribution.utmContent]] as [string, string][])
      : []),
    ...(attribution.utmTerm ? ([["UTM Term", attribution.utmTerm]] as [string, string][]) : []),
  ];

  const html = `
    <h2>New booking request — ${escapeHtml(site.name)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="border:1px solid #ddd"><strong>${label}</strong></td><td style="border:1px solid #ddd">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="color:#666;font-size:12px">Sent from ${escapeHtml(site.url)} · IP ${escapeHtml(ip)}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Booking request — ${name}`,
        html,
        /* So the clinic can hit reply and reach the patient directly. */
        ...(email ? { reply_to: email } : {}),
      }),
    });

    if (!response.ok) {
      console.error("[booking] delivery failed", response.status, await response.text());
      return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[booking] delivery threw", error);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  try {
    await incrementAggregate("booking_complete");
  } catch (error) {
    /* Delivery succeeded, so analytics failure must never turn an accepted
       patient request into a visible form error or prompt a duplicate send. */
    console.error("[booking] aggregate increment failed", error);
  }

  return NextResponse.json({ ok: true, accepted: true });
}
