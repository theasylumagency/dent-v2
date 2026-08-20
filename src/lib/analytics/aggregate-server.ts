import "server-only";

import { sql } from "@payloadcms/db-postgres";

import { cms } from "../cms";
import type { AggregateEvent } from "./types";

/** Atomic daily increment. No request object, IP address, cookie, user agent,
 * visitor id, or session id enters this function or the database row. */
export async function incrementAggregate(event: AggregateEvent, route = ""): Promise<void> {
  const payload = await cms();
  const bucket = new Date().toISOString().slice(0, 10);

  await payload.db.drizzle.execute(sql`
    INSERT INTO "analytics_aggregates" ("bucket", "event", "route", "count", "updated_at", "created_at")
    VALUES (${bucket}, ${event}, ${route}, 1, now(), now())
    ON CONFLICT ("bucket", "event", "route")
    DO UPDATE SET "count" = "analytics_aggregates"."count" + 1, "updated_at" = now()
  `);
}
