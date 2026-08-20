import type { GlobalAfterChangeHook, JsonValue, PayloadRequest } from "payload";

type JsonRecord = Record<string, unknown>;

const SENSITIVE_FIELD =
  /(password|passphrase|hash|secret|token|api[-_]?key|authorization|credential|salt)/i;

function cleanAuditValue(value: unknown): JsonValue {
  if (Array.isArray(value)) return value.map(cleanAuditValue);
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value);

  return Object.fromEntries(
    Object.entries(value as JsonRecord)
      .filter(([key]) => !SENSITIVE_FIELD.test(key))
      .map(([key, entry]) => [key, cleanAuditValue(entry)]),
  );
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(cleanAuditValue(left)) === JSON.stringify(cleanAuditValue(right));
}

export async function writeAuditEntry({
  req,
  action,
  targetType,
  target,
  documentId,
  changes,
}: {
  req: PayloadRequest;
  action: "create" | "update" | "delete";
  targetType: "collection" | "global";
  target: string;
  documentId?: string;
  changes: JsonRecord;
}): Promise<void> {
  if (!Object.keys(changes).length) return;

  await req.payload.create({
    collection: "audit-logs",
    data: {
      user: req.user?.id ?? null,
      action,
      targetType,
      target,
      documentId,
      changes: cleanAuditValue(changes) as { [key: string]: unknown },
    },
    overrideAccess: true,
    req,
  });
}

/**
 * Builds an audit hook for any Payload global. Callers explicitly list the
 * fields that are meaningful for that global; unchanged values and sensitive
 * field names are excluded before an immutable entry is written.
 */
export function auditGlobal(fields: readonly string[]): GlobalAfterChangeHook {
  return async ({ doc, previousDoc, global, req }) => {
    const current = (doc ?? {}) as JsonRecord;
    const previous = (previousDoc ?? {}) as JsonRecord;
    const changes: JsonRecord = {};

    for (const field of fields) {
      if (SENSITIVE_FIELD.test(field) || equal(previous[field], current[field])) continue;
      changes[field] = {
        old: cleanAuditValue(previous[field]),
        new: cleanAuditValue(current[field]),
      };
    }

    await writeAuditEntry({
      req,
      action: "update",
      targetType: "global",
      target: global.slug,
      documentId: global.slug,
      changes,
    });
  };
}
