import { site } from "../site";
import type { BookingRequestData } from "./intake";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationOutcome = {
  status: Exclude<NotificationStatus, "pending">;
  error?: string;
};

export type StoredBookingRequest = BookingRequestData & { id: number | string };

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const NOTIFICATION_TIMEOUT_MS = 8_000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function failed(provider: "Email" | "Telegram", error: unknown): NotificationOutcome {
  const timedOut =
    error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");

  return {
    status: "failed",
    error: timedOut
      ? `${provider} notification timed out after ${NOTIFICATION_TIMEOUT_MS / 1000} seconds.`
      : `${provider} notification could not reach the provider.`,
  };
}

export async function sendBookingEmail({
  booking,
  recipient,
  apiKey,
  from,
  fetcher = fetch,
}: {
  booking: StoredBookingRequest;
  recipient?: string;
  apiKey?: string;
  from?: string;
  fetcher?: Fetcher;
}): Promise<NotificationOutcome> {
  if (!recipient?.trim() || !apiKey || !from) return { status: "skipped" };

  const rows: [string, string][] = [
    ["Booking ID", String(booking.id)],
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email || "—"],
    ["Area of interest", booking.service || "—"],
    ["Best time to call", booking.preferredTime || "—"],
    ["Message", booking.message || "—"],
    ...(booking.landingSlug
      ? ([["Landing page / slug", booking.landingSlug]] as [string, string][])
      : []),
    ...(booking.campaignName
      ? ([["Campaign name", booking.campaignName]] as [string, string][])
      : []),
    ...(booking.utmSource ? ([["UTM Source", booking.utmSource]] as [string, string][]) : []),
    ...(booking.utmMedium ? ([["UTM Medium", booking.utmMedium]] as [string, string][]) : []),
    ...(booking.utmCampaign
      ? ([["UTM Campaign", booking.utmCampaign]] as [string, string][])
      : []),
    ...(booking.utmContent
      ? ([["UTM Content", booking.utmContent]] as [string, string][])
      : []),
    ...(booking.utmTerm ? ([["UTM Term", booking.utmTerm]] as [string, string][]) : []),
  ];

  const html = `
    <h2>New booking request — ${escapeHtml(site.name)}</h2>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="border:1px solid #ddd"><strong>${escapeHtml(label)}</strong></td><td style="border:1px solid #ddd">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="color:#666;font-size:12px">Stored by ${escapeHtml(site.name)}</p>
  `;

  try {
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient.trim()],
        subject: `Booking request #${booking.id} — ${booking.name}`,
        html,
        ...(booking.email ? { reply_to: booking.email } : {}),
      }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        status: "failed",
        error: `Resend returned HTTP ${response.status}.`,
      };
    }

    return { status: "sent" };
  } catch (error) {
    return failed("Email", error);
  }
}

export async function sendBookingTelegram({
  booking,
  botToken,
  chatId,
  fetcher = fetch,
}: {
  booking: StoredBookingRequest;
  botToken?: string;
  chatId?: string;
  fetcher?: Fetcher;
}): Promise<NotificationOutcome> {
  if (!botToken || !chatId) return { status: "skipped" };

  const adminUrl = `${site.url}/admin/collections/booking-requests/${encodeURIComponent(String(booking.id))}`;
  const text = [
    "🔔 New booking request",
    `ID: ${booking.id}`,
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Service: ${booking.service || "—"}`,
    `Preferred time: ${booking.preferredTime || "—"}`,
    `Admin: ${adminUrl}`,
  ].join("\n");

  try {
    const response = await fetcher(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(NOTIFICATION_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        status: "failed",
        error: `Telegram returned HTTP ${response.status}.`,
      };
    }

    return { status: "sent" };
  } catch (error) {
    return failed("Telegram", error);
  }
}
