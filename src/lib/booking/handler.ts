import {
  BookingRateLimiter,
  getRequestIp,
  parseBookingSubmission,
  type BookingRequestData,
} from "./intake";
import type { NotificationOutcome, StoredBookingRequest } from "./notifications";

export type NotificationStateUpdate = {
  emailNotificationStatus: NotificationOutcome["status"];
  emailNotificationError: string | null;
  telegramNotificationStatus: NotificationOutcome["status"];
  telegramNotificationError: string | null;
};

type FailureEvent =
  | "persistence"
  | "analytics"
  | "email"
  | "telegram"
  | "notification-state";

type BookingHandlerDependencies = {
  persist: (data: BookingRequestData) => Promise<{ id: number | string }>;
  incrementAnalytics: () => Promise<void>;
  notifyEmail: (booking: StoredBookingRequest) => Promise<NotificationOutcome>;
  notifyTelegram: (booking: StoredBookingRequest) => Promise<NotificationOutcome>;
  updateNotificationState: (
    id: number | string,
    state: NotificationStateUpdate,
  ) => Promise<void>;
  reportFailure?: (event: FailureEvent, error: unknown, bookingId?: number | string) => void;
};

function reportFailure(
  dependencies: BookingHandlerDependencies,
  event: FailureEvent,
  error: unknown,
  bookingId?: number | string,
) {
  try {
    dependencies.reportFailure?.(event, error, bookingId);
  } catch {
    // Observability must never change whether a patient request is accepted.
  }
}

async function attemptNotification(
  channel: "email" | "telegram",
  notify: () => Promise<NotificationOutcome>,
  dependencies: BookingHandlerDependencies,
  bookingId: number | string,
): Promise<NotificationOutcome> {
  try {
    return await notify();
  } catch (error) {
    reportFailure(dependencies, channel, error, bookingId);
    return {
      status: "failed",
      error: `${channel === "email" ? "Email" : "Telegram"} notification failed unexpectedly.`,
    };
  }
}

export function createBookingPost(
  dependencies: BookingHandlerDependencies,
  rateLimiter = new BookingRateLimiter(),
) {
  return async function POST(request: Request): Promise<Response> {
    const ip = getRequestIp(request);
    if (rateLimiter.isLimited(ip)) {
      return Response.json({ error: "rate_limited" }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    const parsed = parseBookingSubmission(body);
    if (parsed.kind === "honeypot") {
      return Response.json({ ok: true, accepted: false });
    }
    if (parsed.kind === "invalid") {
      return Response.json({ error: "invalid_input" }, { status: 422 });
    }

    let stored: { id: number | string };
    try {
      stored = await dependencies.persist(parsed.data);
    } catch (error) {
      reportFailure(dependencies, "persistence", error);
      return Response.json({ error: "persistence_failed" }, { status: 503 });
    }

    const booking: StoredBookingRequest = { ...parsed.data, id: stored.id };

    try {
      await dependencies.incrementAnalytics();
    } catch (error) {
      reportFailure(dependencies, "analytics", error, booking.id);
    }

    const [email, telegram] = await Promise.all([
      attemptNotification(
        "email",
        () => dependencies.notifyEmail(booking),
        dependencies,
        booking.id,
      ),
      attemptNotification(
        "telegram",
        () => dependencies.notifyTelegram(booking),
        dependencies,
        booking.id,
      ),
    ]);

    try {
      await dependencies.updateNotificationState(booking.id, {
        emailNotificationStatus: email.status,
        emailNotificationError: email.error ?? null,
        telegramNotificationStatus: telegram.status,
        telegramNotificationError: telegram.error ?? null,
      });
    } catch (error) {
      reportFailure(dependencies, "notification-state", error, booking.id);
    }

    return Response.json({ ok: true, accepted: true, id: booking.id });
  };
}
