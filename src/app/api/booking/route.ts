import { incrementAggregate } from "@/lib/analytics/aggregate-server";
import { createBookingPost } from "@/lib/booking/handler";
import {
  buildBookingEmailRecipients,
  sendBookingEmail,
  sendBookingTelegram,
  type NotificationOutcome,
} from "@/lib/booking/notifications";
import { cms } from "@/lib/cms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function emailNotification(
  booking: Parameters<typeof sendBookingEmail>[0]["booking"],
): Promise<NotificationOutcome> {
  let additionalRecipient: string | undefined;

  try {
    const payload = await cms();
    const settings = await payload.findGlobal({
      slug: "booking-settings",
      overrideAccess: true,
    });
    additionalRecipient = settings.notificationEmail || undefined;
  } catch {
    if (!process.env.BOOKING_INBOX?.trim()) {
      return {
        status: "failed",
        error: "Booking Settings could not be loaded.",
      };
    }
  }

  const recipients = buildBookingEmailRecipients(
    process.env.BOOKING_INBOX,
    additionalRecipient,
  );

  return sendBookingEmail({
    booking,
    recipients,
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.BOOKING_FROM,
  });
}

const post = createBookingPost({
  persist: async (data) => {
    const payload = await cms();
    return payload.create({
      collection: "booking-requests",
      data: {
        ...data,
        status: "new",
        emailNotificationStatus: "pending",
        telegramNotificationStatus: "pending",
      },
      overrideAccess: true,
    });
  },
  incrementAnalytics: () => incrementAggregate("booking_complete"),
  notifyEmail: emailNotification,
  notifyTelegram: (booking) =>
    sendBookingTelegram({
      booking,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    }),
  updateNotificationState: async (id, state) => {
    const payload = await cms();
    await payload.update({
      collection: "booking-requests",
      id,
      data: state,
      overrideAccess: true,
    });
  },
  reportFailure: (event, error, bookingId) => {
    // Never include request content, provider bodies, headers or environment
    // values in ordinary logs. Safe notification summaries live in Payload.
    console.error(`[booking] ${event} failed`, {
      ...(bookingId === undefined ? {} : { bookingId }),
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
  },
});

export async function POST(request: Request) {
  return post(request);
}
