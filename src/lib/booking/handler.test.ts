import assert from "node:assert/strict";
import test from "node:test";

import { createBookingPost, type NotificationStateUpdate } from "./handler";
import { BookingRateLimiter } from "./intake";
import type { NotificationOutcome } from "./notifications";

const validBody = {
  name: "Test Patient",
  phone: "+995 555 12 34 56",
  email: "patient@example.com",
  service: "Implantology",
  preferredTime: "Morning",
  message: "Please call me",
  landingSlug: "implant-campaign",
  campaignName: "Implant campaign",
  utm_source: "google",
};

function request(body: unknown, ip = "192.0.2.10") {
  return new Request("https://example.test/api/booking", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

function setup({
  email = { status: "sent" },
  telegram = { status: "sent" },
  persistError,
}: {
  email?: NotificationOutcome;
  telegram?: NotificationOutcome;
  persistError?: Error;
} = {}) {
  const calls = {
    persisted: [] as unknown[],
    analytics: 0,
    email: 0,
    telegram: 0,
    updates: [] as NotificationStateUpdate[],
  };

  const post = createBookingPost({
    persist: async (data) => {
      calls.persisted.push(data);
      if (persistError) throw persistError;
      return { id: 42 };
    },
    incrementAnalytics: async () => {
      calls.analytics += 1;
    },
    notifyEmail: async () => {
      calls.email += 1;
      return email;
    },
    notifyTelegram: async () => {
      calls.telegram += 1;
      return telegram;
    },
    updateNotificationState: async (_id, state) => {
      calls.updates.push(state);
    },
  });

  return { calls, post };
}

async function responseJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

test("DB, email, and Telegram success returns an accepted booking ID", async () => {
  const { calls, post } = setup();
  const response = await post(request(validBody));

  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { ok: true, accepted: true, id: 42 });
  assert.equal(calls.persisted.length, 1);
  assert.equal(calls.analytics, 1);
  assert.equal(calls.email, 1);
  assert.equal(calls.telegram, 1);
  assert.deepEqual(calls.updates[0], {
    emailNotificationStatus: "sent",
    emailNotificationError: null,
    telegramNotificationStatus: "sent",
    telegramNotificationError: null,
  });
});

test("email failure keeps the stored booking accepted and records failure", async () => {
  const { calls, post } = setup({
    email: { status: "failed", error: "Resend returned HTTP 503." },
  });
  const response = await post(request(validBody));

  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).accepted, true);
  assert.equal(calls.persisted.length, 1);
  assert.equal(calls.updates[0]?.emailNotificationStatus, "failed");
});

test("Telegram failure keeps the stored booking accepted and records failure", async () => {
  const { calls, post } = setup({
    telegram: { status: "failed", error: "Telegram returned HTTP 503." },
  });
  const response = await post(request(validBody));

  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).accepted, true);
  assert.equal(calls.persisted.length, 1);
  assert.equal(calls.updates[0]?.telegramNotificationStatus, "failed");
});

test("both notification failures keep the stored booking accepted", async () => {
  const { calls, post } = setup({
    email: { status: "failed", error: "Email failed." },
    telegram: { status: "failed", error: "Telegram failed." },
  });
  const response = await post(request(validBody));

  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).accepted, true);
  assert.equal(calls.persisted.length, 1);
  assert.equal(calls.updates[0]?.emailNotificationStatus, "failed");
  assert.equal(calls.updates[0]?.telegramNotificationStatus, "failed");
});

test("database persistence failure does not accept or notify", async () => {
  const { calls, post } = setup({ persistError: new Error("database unavailable") });
  const response = await post(request(validBody));

  assert.equal(response.status, 503);
  assert.deepEqual(await responseJson(response), { error: "persistence_failed" });
  assert.equal(calls.analytics, 0);
  assert.equal(calls.email, 0);
  assert.equal(calls.telegram, 0);
  assert.equal(calls.updates.length, 0);
});

test("populated website honeypot creates no booking request", async () => {
  const { calls, post } = setup();
  const response = await post(request({ ...validBody, website: "https://spam.example" }));

  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { ok: true, accepted: false });
  assert.equal(calls.persisted.length, 0);
});

test("legitimate submission without website is accepted", async () => {
  const { calls, post } = setup();
  const response = await post(request(validBody));

  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).accepted, true);
  assert.equal(calls.persisted.length, 1);
});

test("company profile autofill is ignored and cannot trigger the honeypot", async () => {
  const { calls, post } = setup();
  const response = await post(request({ ...validBody, company: "The Asylum Agency" }));

  assert.equal(response.status, 200);
  assert.equal((await responseJson(response)).accepted, true);
  assert.equal(calls.persisted.length, 1);
  assert.equal("company" in (calls.persisted[0] as Record<string, unknown>), false);
});

test("invalid input creates no booking request", async () => {
  const { calls, post } = setup();
  const response = await post(request({ ...validBody, phone: "123" }));

  assert.equal(response.status, 422);
  assert.deepEqual(await responseJson(response), { error: "invalid_input" });
  assert.equal(calls.persisted.length, 0);
});

test("rate-limited request creates no additional booking request", async () => {
  const calls = { persisted: 0 };
  const post = createBookingPost(
    {
      persist: async () => {
        calls.persisted += 1;
        return { id: 42 };
      },
      incrementAnalytics: async () => undefined,
      notifyEmail: async () => ({ status: "skipped" }),
      notifyTelegram: async () => ({ status: "skipped" }),
      updateNotificationState: async () => undefined,
    },
    new BookingRateLimiter(60_000, 1),
  );

  assert.equal((await post(request(validBody))).status, 200);
  const limited = await post(request(validBody));
  assert.equal(limited.status, 429);
  assert.deepEqual(await responseJson(limited), { error: "rate_limited" });
  assert.equal(calls.persisted, 1);
});

test("analytics and status-update failures cannot revoke acceptance", async () => {
  const post = createBookingPost({
    persist: async () => ({ id: 42 }),
    incrementAnalytics: async () => {
      throw new Error("analytics unavailable");
    },
    notifyEmail: async () => ({ status: "failed", error: "Email failed." }),
    notifyTelegram: async () => ({ status: "failed", error: "Telegram failed." }),
    updateNotificationState: async () => {
      throw new Error("status update unavailable");
    },
  });

  const response = await post(request(validBody));
  assert.equal(response.status, 200);
  assert.deepEqual(await responseJson(response), { ok: true, accepted: true, id: 42 });
});
