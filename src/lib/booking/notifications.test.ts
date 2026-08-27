import assert from "node:assert/strict";
import test from "node:test";

import { sendBookingEmail, sendBookingTelegram, type StoredBookingRequest } from "./notifications";

const booking: StoredBookingRequest = {
  id: 42,
  name: "Test <Patient>",
  phone: "+995 555 12 34 56",
  email: "patient@example.com",
  service: "Implantology",
  preferredTime: "Morning",
  message: "Private free-text message",
  campaignName: "Implant campaign",
  utmSource: "google",
};

test("Telegram notification is minimal and omits email and free-text message", async () => {
  let sentBody: Record<string, unknown> | undefined;

  const result = await sendBookingTelegram({
    booking,
    botToken: "test-token",
    chatId: "test-chat",
    fetcher: async (_input, init) => {
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(null, { status: 200 });
    },
  });

  assert.deepEqual(result, { status: "sent" });
  const text = String(sentBody?.text);
  assert.match(text, /ID: 42/);
  assert.match(text, /Name: Test <Patient>/);
  assert.match(text, /Phone: \+995 555 12 34 56/);
  assert.match(text, /Service: Implantology/);
  assert.match(text, /Preferred time: Morning/);
  assert.doesNotMatch(text, /patient@example\.com/);
  assert.doesNotMatch(text, /Private free-text message/);
});

test("email contains the booking ID and attribution and uses a valid patient reply-to", async () => {
  let sentBody: Record<string, unknown> | undefined;

  const result = await sendBookingEmail({
    booking,
    recipient: "bookings@example.com",
    apiKey: "test-key",
    from: "Clinic <booking@example.com>",
    fetcher: async (_input, init) => {
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(null, { status: 200 });
    },
  });

  assert.deepEqual(result, { status: "sent" });
  assert.equal(sentBody?.reply_to, "patient@example.com");
  assert.deepEqual(sentBody?.to, ["bookings@example.com"]);
  assert.match(String(sentBody?.html), /Booking ID/);
  assert.match(String(sentBody?.html), /42/);
  assert.match(String(sentBody?.html), /UTM Source/);
  assert.match(String(sentBody?.html), /google/);
  assert.match(String(sentBody?.html), /Test &lt;Patient&gt;/);
});

test("missing provider configuration records skipped without making a request", async () => {
  let requests = 0;
  const fetcher = async () => {
    requests += 1;
    return new Response(null, { status: 200 });
  };

  assert.deepEqual(await sendBookingEmail({ booking, fetcher }), { status: "skipped" });
  assert.deepEqual(await sendBookingTelegram({ booking, fetcher }), { status: "skipped" });
  assert.equal(requests, 0);
});

test("provider failures store only a safe HTTP summary", async () => {
  const secretBody = "Authorization: Bearer should-never-be-stored";
  const result = await sendBookingEmail({
    booking,
    recipient: "bookings@example.com",
    apiKey: "test-key",
    from: "Clinic <booking@example.com>",
    fetcher: async () => new Response(secretBody, { status: 401 }),
  });

  assert.deepEqual(result, { status: "failed", error: "Resend returned HTTP 401." });
  assert.doesNotMatch(result.error || "", /Authorization|Bearer|should-never-be-stored/);
});
