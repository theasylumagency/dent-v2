import assert from "node:assert/strict";
import test from "node:test";
import { hashToken, newInvitationToken, SESSION_COOKIE } from "./access";
import { createStrategyHandler, type Snapshot, type StrategyStore } from "./handler";
import { FORM_VERSION, sections, validateAnswers } from "./schema";

function fixture() {
  const token = newInvitationToken();
  let record: Snapshot | null = {
    id: 12, formVersion: FORM_VERSION, answers: {}, revision: 0, step: -1, status: "draft",
    completedAt: null, expiresAt: new Date(Date.now() + 86400000).toISOString(),
    deleteAfter: new Date(Date.now() + 86400000 * 90).toISOString(), privacyContact: "Test coordinator",
  };
  let fail = false;
  const store: StrategyStore = {
    read: async digest => { if (fail) throw new Error("offline"); return digest === hashToken(token) ? record && { ...record } : null; },
    save: async (digest, input) => {
      if (fail) throw new Error("offline");
      if (!record || digest !== hashToken(token) || input.revision !== record.revision || record.status !== "draft") return null;
      record = { ...record, answers: input.answers, step: input.step, revision: record.revision + 1, status: input.submit ? "submitted" : "draft", completedAt: input.submit ? new Date().toISOString() : null };
      return { ...record };
    },
  };
  const handler = createStrategyHandler(store, { origin: "https://clinic.test", secure: true });
  const request = (method: string, body?: unknown, authenticated = true, origin = "https://clinic.test") => handler(new Request("https://clinic.test/api/strategy", {
    method, headers: { "Content-Type": "application/json", Origin: origin, ...(authenticated ? { Cookie: SESSION_COOKIE + "=" + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  const body = (revision = 0, submit = false) => ({ answers: { goals: ["0"] }, step: 0, revision, submit, formVersion: FORM_VERSION });
  return { request, body, token, invalidate: () => { record = null; }, offline: () => { fail = true; } };
}
test("contains exactly 13 core questions; excludes budget and account-access fields", () => {
  assert.deepEqual(sections.flatMap(section => section.questions.map(question => question.number)), Array.from({ length: 13 }, (_, i) => i + 1));
  assert.doesNotMatch(JSON.stringify(sections), /ბიუჯეტ|რა ხარჯით|ანგარიშებზე/);
});
test("validates limits, exclusive unknown, option values, duplicate choices and text bounds", () => {
  assert.equal(validateAnswers({ goals: ["0", "1", "2"] }), null);
  assert.equal(validateAnswers({ priorities: ["unknown", "implants"] }), null);
  assert.equal(validateAnswers({ priorities: ["implants", "implants"] }), null);
  assert.equal(validateAnswers({ goals: ["invalid"] }), null);
  assert.equal(validateAnswers({ budget: "100" }), null);
  assert.equal(validateAnswers({ notes: "a".repeat(4001) }), null);
  assert.deepEqual(validateAnswers({ goals: ["unknown"] }), { goals: ["unknown"] });
});
test("removes stale conditional answers when their controlling choice changes", () => {
  assert.deepEqual(validateAnswers({ priorities: ["therapy"], capacity_implants: "2", languages: ["ka"], language_ru: "2", doctorBackground: "hidden" }), { priorities: ["therapy"], languages: ["ka"] });
});
test("requires a valid invitation and does not leak responses to unauthenticated users", async () => {
  const f = fixture();
  assert.equal((await f.request("GET", undefined, false)).status, 401);
  assert.equal((await f.request("POST", { token: newInvitationToken() }, false)).status, 401);
  const response = await f.request("POST", { token: f.token }, false);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /HttpOnly; SameSite=Strict; Secure/);
  assert.match(response.headers.get("cache-control")!, /no-store/);
  assert.doesNotMatch(await response.text(), new RegExp(f.token));
});
test("rejects cross-origin writes and malformed bodies", async () => {
  const f = fixture();
  assert.equal((await f.request("PATCH", f.body(), true, "https://untrusted.test")).status, 403);
  assert.equal((await f.request("PATCH", { ...f.body(), step: 99 })).status, 400);
  assert.equal((await f.request("PATCH", { ...f.body(), answers: { notes: "a".repeat(70000) } })).status, 400);
});
test("resumes saved answers in another session and rejects stale revisions", async () => {
  const f = fixture();
  assert.equal((await f.request("PATCH", f.body())).status, 200);
  const restored = await (await f.request("POST", { token: f.token }, false)).json();
  assert.equal(restored.revision, 1);
  assert.deepEqual(restored.answers, { goals: ["0"] });
  assert.equal((await f.request("PATCH", f.body())).status, 409);
});
test("simultaneous edits cannot silently overwrite one another", async () => {
  const f = fixture();
  const responses = await Promise.all([f.request("PATCH", f.body()), f.request("PATCH", f.body())]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 409]);
});
test("submission is idempotent and submitted answers cannot be changed", async () => {
  const f = fixture();
  const first = await (await f.request("PATCH", f.body(0, true))).json();
  const retry = await (await f.request("PATCH", f.body(0, true))).json();
  assert.equal(first.id, retry.id); assert.equal(first.revision, retry.revision);
  assert.equal(first.completedAt, retry.completedAt); assert.equal(first.status, "submitted");
  assert.equal((await f.request("PATCH", f.body(1))).status, 409);
});
test("revocation blocks an existing session, including writes", async () => {
  const f = fixture(); f.invalidate();
  assert.equal((await f.request("GET")).status, 401);
  assert.equal((await f.request("PATCH", f.body())).status, 401);
});
test("storage failure does not show false success", async () => {
  const f = fixture(); f.offline();
  assert.equal((await f.request("PATCH", f.body())).status, 503);
});
