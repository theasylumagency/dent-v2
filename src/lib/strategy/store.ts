import "server-only";
import { sql } from "@payloadcms/db-postgres";
import { cms } from "@/lib/cms";
import type { Snapshot, StrategyStore } from "./handler";

// Use a single conditional UPDATE: Payload's updateMany first selects IDs and
// cannot enforce revision matching atomically across devices.
const columns = sql`id, form_version AS "formVersion", answers, step, revision, status,
  completed_at AS "completedAt", expires_at AS "expiresAt", delete_after AS "deleteAfter",
  privacy_contact AS "privacyContact"`;
function snapshot(row: Record<string, unknown>): Snapshot {
  return {
    id: Number(row.id), formVersion: String(row.formVersion),
    answers: (row.answers ?? {}) as Snapshot["answers"],
    step: Number(row.step), revision: Number(row.revision),
    status: row.status as Snapshot["status"],
    completedAt: row.completedAt ? new Date(String(row.completedAt)).toISOString() : null,
    expiresAt: new Date(String(row.expiresAt)).toISOString(),
    deleteAfter: new Date(String(row.deleteAfter)).toISOString(),
    privacyContact: String(row.privacyContact),
  };
}
export const strategyStore: StrategyStore = {
  async read(digest) {
    const payload = await cms();
    const result = await payload.db.drizzle.execute(sql`SELECT ${columns} FROM strategy_responses
      WHERE token_hash = ${digest} AND revoked = false AND expires_at > now() AND delete_after > now() LIMIT 1`);
    return result.rows[0] ? snapshot(result.rows[0]) : null;
  },
  async save(digest, input) {
    const payload = await cms();
    const result = await payload.db.drizzle.execute(sql`UPDATE strategy_responses SET
      answers = ${JSON.stringify(input.answers)}::jsonb, step = ${input.step},
      revision = revision + 1, status = ${input.submit ? "submitted" : "draft"}::enum_strategy_responses_status,
      started_at = COALESCE(started_at, now()),
      completed_at = CASE WHEN ${input.submit} THEN now() ELSE NULL END, updated_at = now()
      WHERE token_hash = ${digest} AND revision = ${input.revision} AND status = 'draft'
        AND revoked = false AND expires_at > now() AND delete_after > now()
      RETURNING ${columns}`);
    return result.rows[0] ? snapshot(result.rows[0]) : null;
  },
};
