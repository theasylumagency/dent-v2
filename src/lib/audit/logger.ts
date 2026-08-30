import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  JsonValue,
  PayloadRequest,
} from "payload";

import { auditLogs as t } from "@/admin/labels";

type JsonRecord = Record<string, unknown>;

type CollectionHookArgs = Parameters<CollectionAfterChangeHook>[0];

const SENSITIVE_FIELD =
  /(password|passphrase|hash|secret|token|api[-_]?key|authorization|credential|salt)/i;

/**
 * Fields every entry ignores.
 *
 * `updatedAt` changes on literally every save, so leaving it in would mean
 * every entry reports at least one "change" and an unchanged save still
 * writes a row. The login bookkeeping (`loginAttempts`, `lockUntil`,
 * `sessions`) is written by Payload itself, not by a person, and an audit
 * trail of "someone logged in" belongs in a different log than "someone
 * edited the price list".
 */
const IGNORED_FIELDS = new Set([
  "id",
  "_id",
  "createdAt",
  "updatedAt",
  "sessions",
  "loginAttempts",
  "lockUntil",
  "_verified",
  "_verificationToken",
  "resetPasswordToken",
  "resetPasswordExpiration",
]);

/** A changed value is shown, not reproduced. See `summarize`. */
const MAX_TEXT = 200;
const MAX_SERIALIZED = 400;

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

/**
 * Comparison uses the *full* value; only the stored copy is shortened.
 *
 * Truncating before comparing would silently miss an edit past the cut-off —
 * two meta descriptions differing only in their last sentence would compare
 * equal and the change would never be recorded.
 */
function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(cleanAuditValue(left)) === JSON.stringify(cleanAuditValue(right));
}

/**
 * A field nobody has filled in.
 *
 * Payload is not consistent about how an untouched field comes back —
 * `undefined` from a fresh document, `null` from the database, `""` from a
 * text input that was focused and left. All three mean the same thing to a
 * reader, so a move between them is not a change worth a line.
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** True when the two values differ in a way a person would call a change. */
function changed(previous: unknown, current: unknown): boolean {
  if (isEmpty(previous) && isEmpty(current)) return false;
  return !equal(previous, current);
}

/** Lexical stores a whole document tree under `root`. */
function isRichText(value: unknown): boolean {
  return (
    !!value && typeof value === "object" && !Array.isArray(value) && "root" in (value as object)
  );
}

/**
 * What actually gets written into the `changes` column.
 *
 * The audit log answers "who touched this, and roughly what" — it is not a
 * second copy of the site. A rich-text body or a twenty-row array would push
 * a single entry past any useful size and make the column unreadable in the
 * panel, so anything oversized collapses to a marker that still says the
 * field changed.
 */
function summarize(value: unknown): JsonValue {
  if (value === null || value === undefined) return null;
  if (isRichText(value)) return t.valueRichText;

  const cleaned = cleanAuditValue(value);

  if (typeof cleaned === "string") {
    return cleaned.length > MAX_TEXT ? `${cleaned.slice(0, MAX_TEXT)}…` : cleaned;
  }

  const serialized = JSON.stringify(cleaned) ?? "";
  if (serialized.length > MAX_SERIALIZED) {
    return Array.isArray(cleaned) ? `${t.valueList}: ${cleaned.length}` : t.valueObject;
  }

  return cleaned;
}

/** `label` may be a string, a per-language record, a component, or `false`. */
function labelOf(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    for (const key of ["ka", "en"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }
  }
  return fallback;
}

/**
 * Field name → Georgian label, so `changes` reads „ფოტო" rather than
 * `photo`.
 *
 * The walk is deliberately defensive: it looks for anything shaped like a
 * field and recurses into `fields` and `tabs`, so a config shape this project
 * does not use yet degrades to bare field names instead of throwing inside a
 * save. Cached per config object — those are built once at boot.
 */
const labelCache = new WeakMap<object, Record<string, string>>();

function collectFieldLabels(fields: unknown, into: Record<string, string>): void {
  if (!Array.isArray(fields)) return;

  for (const field of fields) {
    if (!field || typeof field !== "object") continue;
    const entry = field as { name?: unknown; label?: unknown; fields?: unknown; tabs?: unknown };

    if (typeof entry.name === "string" && !(entry.name in into)) {
      const label = labelOf(entry.label, "");
      if (label) into[entry.name] = label;
    }

    collectFieldLabels(entry.fields, into);

    if (Array.isArray(entry.tabs)) {
      for (const tab of entry.tabs) {
        collectFieldLabels((tab as { fields?: unknown })?.fields, into);
      }
    }
  }
}

function fieldLabels(config: unknown): Record<string, string> {
  if (!config || typeof config !== "object") return {};

  const cached = labelCache.get(config as object);
  if (cached) return cached;

  const labels: Record<string, string> = {};
  try {
    collectFieldLabels((config as { fields?: unknown }).fields, labels);
  } catch {
    /* A label is a convenience; never let it cost an editor their save. */
  }
  labelCache.set(config as object, labels);
  return labels;
}

/** The default locale, read from config so this does not hard-code "ka". */
function defaultLocale(req: PayloadRequest): string | undefined {
  const localization = req.payload?.config?.localization;
  return localization ? localization.defaultLocale : undefined;
}

/** Appends the locale when an editor was working in a translation. */
function withLocale(label: string, req: PayloadRequest): string {
  const locale = req.locale;
  if (!locale || locale === "all" || locale === defaultLocale(req)) return label;
  return `${label} (${locale})`;
}

/**
 * Builds the diff for one document.
 *
 * Keys are Georgian labels where the config defines one. On a collision (two
 * fields sharing a label) the second falls back to its field name, so a
 * change is never silently dropped for want of a unique key.
 */
function buildChanges({
  previous,
  current,
  labels,
  ignore,
}: {
  previous: JsonRecord;
  current: JsonRecord;
  labels: Record<string, string>;
  ignore: ReadonlySet<string>;
}): JsonRecord {
  const changes: JsonRecord = {};
  const names = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const name of names) {
    if (ignore.has(name) || IGNORED_FIELDS.has(name) || SENSITIVE_FIELD.test(name)) continue;
    if (!changed(previous[name], current[name])) continue;

    const label = labels[name] ?? name;
    const key = label in changes ? name : label;

    changes[key] = { old: summarize(previous[name]), new: summarize(current[name]) };
  }

  return changes;
}

export async function writeAuditEntry({
  req,
  action,
  targetType,
  target,
  documentId,
  documentLabel,
  changes,
}: {
  req: PayloadRequest;
  action: "create" | "update" | "delete";
  targetType: "collection" | "global";
  target: string;
  documentId?: string;
  documentLabel?: string;
  changes: JsonRecord;
}): Promise<void> {
  /* An update that changed nothing is not history, it is noise. A create or
     a delete is worth recording even when the diff came out empty — the
     event itself is the record. */
  if (action === "update" && !Object.keys(changes).length) return;

  try {
    /**
     * Deliberately *without* `req`.
     *
     * Passing it would enlist this insert in the editor's own transaction,
     * and one failing statement poisons a Postgres transaction: the error
     * would stop being "the history entry did not save" and become "the
     * doctor's profile did not save". A gap in a log is a gap; a lost edit
     * is lost work.
     *
     * The trade-off is the opposite gap — if the outer save were rolled back
     * after this hook, the entry would describe a change that never landed.
     * `afterChange` runs only once the write has succeeded, so that window is
     * small, and a spurious line is easier to live with than a missing one.
     */
    await req.payload.create({
      collection: "audit-logs",
      data: {
        user: req.user?.id ?? null,
        action,
        targetType,
        target,
        documentId,
        documentLabel,
        changes: changes as { [key: string]: unknown },
      },
      overrideAccess: true,
    });
  } catch (error) {
    req.payload.logger.error(
      { err: error, action, target, documentId },
      "[audit] history entry could not be written — the change itself was saved",
    );
  }
}

/**
 * Builds an audit hook for a Payload global from an explicit field list.
 *
 * Used by the two settings screens where the interesting fields are few and
 * named. Content globals use `auditGlobalAll` instead.
 */
export function auditGlobal(fields: readonly string[]): GlobalAfterChangeHook {
  return async ({ doc, previousDoc, global, req }) => {
    /* Only a person's change belongs here. A save with no signed-in user is a
       seed script or a server route, and those would flood the history. */
    if (!req.user) return;

    const current = (doc ?? {}) as JsonRecord;
    const previous = (previousDoc ?? {}) as JsonRecord;
    const labels = fieldLabels(global);
    const changes: JsonRecord = {};

    for (const field of fields) {
      if (SENSITIVE_FIELD.test(field) || !changed(previous[field], current[field])) continue;
      const label = labels[field] ?? field;
      const key = label in changes ? field : label;
      changes[key] = { old: summarize(previous[field]), new: summarize(current[field]) };
    }

    await writeAuditEntry({
      req,
      action: "update",
      targetType: "global",
      target: global.slug,
      documentId: global.slug,
      documentLabel: withLocale(labelOf(global.label, global.slug), req),
      changes,
    });
  };
}

/**
 * The same for a whole global, without naming its fields.
 *
 * Keeping an explicit field list in step with a form is a maintenance trap:
 * a field added next year would silently stay outside the history. For a
 * global with many editable fields — clinic details, page meta — the diff
 * covers everything and the ignore list carries the exceptions.
 */
export function auditGlobalAll(options: { ignore?: readonly string[] } = {}): GlobalAfterChangeHook {
  const ignore = new Set(options.ignore ?? []);

  return async ({ doc, previousDoc, global, req }) => {
    if (!req.user) return;

    await writeAuditEntry({
      req,
      action: "update",
      targetType: "global",
      target: global.slug,
      documentId: global.slug,
      documentLabel: withLocale(labelOf(global.label, global.slug), req),
      changes: buildChanges({
        previous: (previousDoc ?? {}) as JsonRecord,
        current: (doc ?? {}) as JsonRecord,
        labels: fieldLabels(global),
        ignore,
      }),
    });
  };
}

/** „ექიმები · არჩილ აფხაძე" — the collection, then the document's own title. */
function describe(doc: JsonRecord, collection: CollectionHookArgs["collection"]): string {
  const plural = labelOf(collection.labels?.plural, collection.slug);
  const titleField = collection.admin?.useAsTitle;
  const raw = titleField && titleField !== "id" ? doc[titleField] : undefined;

  const title =
    typeof raw === "string" && raw.trim()
      ? raw.trim()
      : typeof raw === "number"
        ? String(raw)
        : doc.id != null
          ? `#${String(doc.id)}`
          : "";

  const full = title ? `${plural} · ${title}` : plural;
  return full.length > MAX_TEXT ? `${full.slice(0, MAX_TEXT)}…` : full;
}

/**
 * Records who created or edited a document, and what changed.
 *
 * Attach to every collection an employee edits by hand. Two are deliberately
 * left out: `analytics-aggregates`, which the public endpoint increments
 * hundreds of times a day, and `audit-logs` itself, which cannot be written
 * through the panel at all.
 *
 * Only a signed-in user's changes are recorded. A booking arriving from the
 * site is created by a server route with no user attached, so the history
 * stays what it claims to be — a list of what people did — while a
 * receptionist moving that same booking to "contacted" is recorded normally.
 */
export function auditCollection(
  options: { ignore?: readonly string[] } = {},
): CollectionAfterChangeHook {
  const ignore = new Set(options.ignore ?? []);

  return async ({ doc, previousDoc, collection, operation, req }) => {
    if (!req.user) return;

    const current = (doc ?? {}) as JsonRecord;

    /* On create there is nothing to compare against, so the entry lists what
       the document was born with rather than an empty diff. */
    const previous = operation === "create" ? {} : ((previousDoc ?? {}) as JsonRecord);

    await writeAuditEntry({
      req,
      action: operation === "create" ? "create" : "update",
      targetType: "collection",
      target: collection.slug,
      documentId: current.id != null ? String(current.id) : undefined,
      documentLabel: withLocale(describe(current, collection), req),
      changes: buildChanges({ previous, current, labels: fieldLabels(collection), ignore }),
    });
  };
}

/** The deletion counterpart: records what the document held on its way out. */
export function auditCollectionDelete(
  options: { ignore?: readonly string[] } = {},
): CollectionAfterDeleteHook {
  const ignore = new Set(options.ignore ?? []);

  return async ({ doc, collection, req }) => {
    if (!req.user) return;

    const previous = (doc ?? {}) as JsonRecord;

    await writeAuditEntry({
      req,
      action: "delete",
      targetType: "collection",
      target: collection.slug,
      documentId: previous.id != null ? String(previous.id) : undefined,
      documentLabel: withLocale(describe(previous, collection), req),
      changes: buildChanges({
        previous,
        current: {},
        labels: fieldLabels(collection),
        ignore,
      }),
    });
  };
}
