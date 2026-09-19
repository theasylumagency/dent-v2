import { SESSION_COOKIE, hashToken, privateHeaders, validToken } from "./access";
import { FORM_VERSION, validateAnswers, type Answers } from "./schema";

export type Snapshot = {
  id: number; formVersion: string; answers: Answers; step: number; revision: number;
  status: "draft" | "submitted"; completedAt: string | null; expiresAt: string;
  deleteAfter: string; privacyContact: string;
};
export type SaveInput = { answers: Answers; step: number; revision: number; submit: boolean };
export type StrategyStore = {
  read: (tokenHash: string) => Promise<Snapshot | null>;
  save: (tokenHash: string, input: SaveInput) => Promise<Snapshot | null>;
};
function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...privateHeaders, ...headers } });
}
function cookie(request: Request): string | undefined {
  return request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(SESSION_COOKIE + "="))?.slice(SESSION_COOKIE.length + 1);
}
async function readJSON(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("body");
  if (Number(request.headers.get("content-length") || 0) > 65536 || !request.body) throw new Error("body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 65536) { await reader.cancel(); throw new Error("body"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function createStrategyHandler(store: StrategyStore, settings: { origin: string; secure: boolean }) {
  return async (request: Request): Promise<Response> => {
    const method = request.method;
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) return json({ error: "method" }, 405);
    if (method !== "GET") {
      const origin = request.headers.get("origin");
      const requestUrl = new URL(request.url);
      const hostOrigin = request.headers.get("host") ? requestUrl.protocol + "//" + request.headers.get("host") : requestUrl.origin;
      if (!origin || (origin !== hostOrigin && origin !== settings.origin) ||
          request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "origin" }, 403);
    }
    const cookieAttributes = "; Path=/api/strategy; HttpOnly; SameSite=Strict" + (settings.secure ? "; Secure" : "");
    if (method === "DELETE") return json({ ok: true }, 200, { "Set-Cookie": SESSION_COOKIE + "=; Max-Age=0" + cookieAttributes });
    let body: Record<string, unknown> = {};
    if (method === "POST" || method === "PATCH") {
      try {
        const parsed = await readJSON(request);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("body");
        body = parsed as Record<string, unknown>;
      } catch { return json({ error: "invalid_body" }, 400); }
    }
    const token = method === "POST" ? body.token : cookie(request);
    if (!validToken(token)) return json({ error: "unauthorized" }, 401);
    const digest = hashToken(token);
    try {
      const current = await store.read(digest);
      if (!current) return json({ error: "unauthorized" }, 401);
      if (current.formVersion !== FORM_VERSION) return json({ error: "form_version" }, 409);
      if (method === "POST") {
        const seconds = Math.max(0, Math.min(2592000, Math.floor((new Date(current.expiresAt).getTime() - Date.now()) / 1000)));
        return json(current, 200, { "Set-Cookie": SESSION_COOKIE + "=" + token + "; Max-Age=" + seconds + cookieAttributes });
      }
      if (method === "GET") return json(current);
      const answers = validateAnswers(body.answers);
      if (!answers || !Number.isSafeInteger(body.revision) || Number(body.revision) < 0 ||
          !Number.isInteger(body.step) || Number(body.step) < -1 || Number(body.step) > 5 ||
          typeof body.submit !== "boolean" || body.formVersion !== FORM_VERSION) return json({ error: "invalid_answers" }, 400);
      // A lost response followed by a repeated submit must not create another record.
      if (current.status === "submitted") return body.submit ? json(current) : json({ error: "submitted" }, 409);
      if (body.revision !== current.revision) return json({ error: "conflict" }, 409);
      const saved = await store.save(digest, { answers, step: body.submit ? 5 : Number(body.step), revision: Number(body.revision), submit: body.submit });
      if (!saved) {
        const latest = await store.read(digest);
        if (!latest) return json({ error: "unauthorized" }, 401);
        if (body.submit && latest.status === "submitted") return json(latest);
        return json({ error: "conflict" }, 409);
      }
      return json(saved);
    } catch {
      // Neither answers nor bearer tokens belong in application logs.
      console.error("[strategy] persistence unavailable");
      return json({ error: "unavailable" }, 503);
    }
  };
}
