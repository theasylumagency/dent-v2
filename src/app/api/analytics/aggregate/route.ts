import { incrementAggregate } from "@/lib/analytics/aggregate-server";
import type { AggregateEvent } from "@/lib/analytics/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS = new Set<AggregateEvent>(["page_view", "booking_open"]);

function normalizeRoute(value: unknown): string | null {
  if (typeof value !== "string") return "";
  const route = value.trim();
  if (!route) return "";
  if (!route.startsWith("/") || route.length > 240 || route.includes("?") || route.includes("#")) return null;
  return route;
}

export async function POST(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > 512) return Response.json({ error: "payload_too_large" }, { status: 413 });

  let body: { event?: unknown; route?: unknown };
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.event !== "string" || !EVENTS.has(body.event as AggregateEvent)) {
    return Response.json({ error: "invalid_event" }, { status: 422 });
  }

  const route = normalizeRoute(body.route);
  if (route === null || (body.event === "page_view" && !route)) {
    return Response.json({ error: "invalid_route" }, { status: 422 });
  }

  try {
    await incrementAggregate(body.event as AggregateEvent, body.event === "page_view" ? route : "");
  } catch (error) {
    console.error("[analytics] aggregate increment failed", error);
    return Response.json({ error: "write_failed" }, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
