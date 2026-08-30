import assert from "node:assert/strict";
import test from "node:test";

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { auditCollection, auditCollectionDelete } from "./logger";

type Entry = Record<string, unknown>;
type Changes = Record<string, { old: unknown; new: unknown }>;

/**
 * A collection shaped like the real ones: Georgian labels, `useAsTitle`, and
 * one nested `array` field so the label walk is exercised the way it will be
 * in `doctors`.
 */
const doctors = {
  slug: "doctors",
  labels: { singular: "ექიმი", plural: "ექიმები" },
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", label: "სახელი და გვარი" },
    { name: "role", type: "text", label: "პოზიცია" },
    { name: "published", type: "checkbox", label: "გამოქვეყნებული" },
    { name: "bio", type: "richText", label: "ბიოგრაფია" },
    { name: "password", type: "text", label: "პაროლი" },
    {
      name: "education",
      type: "array",
      label: "განათლება",
      fields: [{ name: "text", type: "text", label: "სტრიქონი" }],
    },
  ],
};

/** Collects what the hook tried to write instead of touching a database. */
function makeReq(options: { user?: { id: number } | null; locale?: string; failWrite?: boolean } = {}) {
  const written: Entry[] = [];
  const errors: unknown[] = [];

  const req = {
    user: options.user === undefined ? { id: 7 } : options.user,
    locale: options.locale,
    payload: {
      config: { localization: { defaultLocale: "ka" } },
      logger: {
        error: (...args: unknown[]) => {
          errors.push(args);
        },
      },
      create: async ({ data }: { data: Entry }) => {
        if (options.failWrite) throw new Error("relation \"audit_logs\" does not exist");
        written.push(data);
        return data;
      },
    },
  };

  return { req, written, errors };
}

async function runChange(
  hook: CollectionAfterChangeHook,
  args: {
    req: unknown;
    doc: Entry;
    previousDoc?: Entry;
    operation?: "create" | "update";
  },
) {
  await hook({
    doc: args.doc,
    previousDoc: args.previousDoc ?? {},
    operation: args.operation ?? "update",
    collection: doctors,
    req: args.req,
    context: {},
  } as unknown as Parameters<CollectionAfterChangeHook>[0]);
}

async function runDelete(hook: CollectionAfterDeleteHook, args: { req: unknown; doc: Entry }) {
  await hook({
    doc: args.doc,
    id: args.doc.id,
    collection: doctors,
    req: args.req,
    context: {},
  } as unknown as Parameters<CollectionAfterDeleteHook>[0]);
}

test("an edit records who, what and the old and new value under Georgian labels", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", role: "ორთოდონტი", updatedAt: "2026-08-27T10:00:00Z" },
    doc: { id: 3, name: "არჩილ აფხაძე", role: "იმპლანტოლოგი", updatedAt: "2026-08-28T10:00:00Z" },
  });

  assert.equal(written.length, 1);
  const entry = written[0];

  assert.equal(entry.user, 7);
  assert.equal(entry.action, "update");
  assert.equal(entry.targetType, "collection");
  assert.equal(entry.target, "doctors");
  assert.equal(entry.documentId, "3");
  assert.equal(entry.documentLabel, "ექიმები · არჩილ აფხაძე");

  const changes = entry.changes as Changes;
  assert.deepEqual(Object.keys(changes), ["პოზიცია"]);
  assert.deepEqual(changes["პოზიცია"], { old: "ორთოდონტი", new: "იმპლანტოლოგი" });
});

test("`updatedAt` alone is not a change — an unchanged save writes nothing", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", updatedAt: "2026-08-27T10:00:00Z" },
    doc: { id: 3, name: "არჩილ აფხაძე", updatedAt: "2026-08-28T10:00:00Z" },
  });

  assert.equal(written.length, 0);
});

test("null, undefined and \"\" all mean the same empty field", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", role: null },
    doc: { id: 3, name: "არჩილ აფხაძე", role: "" },
  });

  assert.equal(written.length, 0);
});

test("a change with no signed-in user is not recorded", async () => {
  const { req, written } = makeReq({ user: null });

  await runChange(auditCollection(), {
    req,
    operation: "create",
    doc: { id: 9, name: "ვებგვერდიდან შემოსული" },
  });

  assert.equal(written.length, 0);
});

test("creating a document is recorded even though there is nothing to compare", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    operation: "create",
    doc: { id: 11, name: "ნინო ბერიძე", role: "თერაპევტი", published: false },
  });

  assert.equal(written.length, 1);
  assert.equal(written[0].action, "create");
  assert.equal(written[0].documentLabel, "ექიმები · ნინო ბერიძე");

  const changes = written[0].changes as Changes;
  assert.deepEqual(changes["სახელი და გვარი"], { old: null, new: "ნინო ბერიძე" });
  /* `false` is a value someone chose, not an empty field. */
  assert.deepEqual(changes["გამოქვეყნებული"], { old: null, new: false });
});

test("a password never reaches the history, even under a Georgian label", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", password: "old-secret" },
    doc: { id: 3, name: "არჩილ აფხაძე", password: "new-secret", role: "იმპლანტოლოგი" },
  });

  assert.equal(written.length, 1);
  const serialized = JSON.stringify(written[0]);
  assert.doesNotMatch(serialized, /secret/);
  assert.doesNotMatch(serialized, /პაროლი/);
});

test("long text is truncated and a rich-text body is only marked as changed", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", role: "a", bio: { root: { children: [] } } },
    doc: {
      id: 3,
      name: "არჩილ აფხაძე",
      role: "b".repeat(500),
      bio: { root: { children: [{ text: "ახალი ბიოგრაფია" }] } },
    },
  });

  const changes = written[0].changes as Changes;

  const role = String(changes["პოზიცია"].new);
  assert.equal(role.length, 201, "200 characters plus the ellipsis");
  assert.ok(role.endsWith("…"));

  assert.equal(changes["ბიოგრაფია"].new, "«ტექსტი შეიცვალა»");
  assert.equal(changes["ბიოგრაფია"].old, "«ტექსტი შეიცვალა»");
});

test("a long array collapses to a count rather than filling the column", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", education: [] },
    doc: {
      id: 3,
      name: "არჩილ აფხაძე",
      education: Array.from({ length: 30 }, (_, i) => ({ text: `უნივერსიტეტი ${i}` })),
    },
  });

  const changes = written[0].changes as Changes;
  assert.equal(changes["განათლება"].new, "სია — ჩანაწერების რაოდენობა: 30");
});

test("editing a translation notes the locale", async () => {
  const { req, written } = makeReq({ locale: "en" });

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "Archil Apkhadze", role: "Orthodontist" },
    doc: { id: 3, name: "Archil Apkhadze", role: "Implantologist" },
  });

  assert.equal(written[0].documentLabel, "ექიმები · Archil Apkhadze (en)");
});

test("the default locale is not repeated on every entry", async () => {
  const { req, written } = makeReq({ locale: "ka" });

  await runChange(auditCollection(), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", role: "ა" },
    doc: { id: 3, name: "არჩილ აფხაძე", role: "ბ" },
  });

  assert.equal(written[0].documentLabel, "ექიმები · არჩილ აფხაძე");
});

test("deleting records what the document was, so the entry still names it", async () => {
  const { req, written } = makeReq();

  await runDelete(auditCollectionDelete(), {
    req,
    doc: { id: 3, name: "არჩილ აფხაძე", role: "იმპლანტოლოგი" },
  });

  assert.equal(written.length, 1);
  assert.equal(written[0].action, "delete");
  assert.equal(written[0].documentId, "3");
  assert.equal(written[0].documentLabel, "ექიმები · არჩილ აფხაძე");

  const changes = written[0].changes as Changes;
  assert.deepEqual(changes["პოზიცია"], { old: "იმპლანტოლოგი", new: null });
});

test("a failed history write is logged, never thrown — the edit itself is safe", async () => {
  const { req, errors } = makeReq({ failWrite: true });

  await assert.doesNotReject(
    runChange(auditCollection(), {
      req,
      previousDoc: { id: 3, name: "არჩილ აფხაძე", role: "ა" },
      doc: { id: 3, name: "არჩილ აფხაძე", role: "ბ" },
    }),
  );

  assert.equal(errors.length, 1);
});

test("ignored fields stay out of the entry", async () => {
  const { req, written } = makeReq();

  await runChange(auditCollection({ ignore: ["role"] }), {
    req,
    previousDoc: { id: 3, name: "არჩილ აფხაძე", role: "ა" },
    doc: { id: 3, name: "არჩილ აფხაძე", role: "ბ" },
  });

  assert.equal(written.length, 0);
});
