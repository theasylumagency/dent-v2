import { createStrategyHandler } from "@/lib/strategy/handler";
import { strategyStore } from "@/lib/strategy/store";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createStrategyHandler(strategyStore, { origin: site.url, secure: process.env.NODE_ENV === "production" });
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
