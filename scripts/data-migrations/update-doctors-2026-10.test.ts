import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { Payload, SanitizedConfig } from "payload";
import type { PostgresAdapter } from "@payloadcms/db-postgres";

import { Doctors } from "../../src/collections/Doctors";
import { Media as MediaCollection } from "../../src/collections/Media";
import type { Doctor, Media } from "../../src/payload-types";
import { doctors, migrationConfig, runMigration, type DoctorSpec } from "./update-doctors-2026-10";

type Write = {
  collection: "doctors" | "media";
  locale: string;
  data: Record<string, unknown>;
  id?: number;
  filePath?: string;
};
type StoredDoctor = Doctor & { en: { name: string }; ru: { name: string } };

function existingDoctor(slug: string, id: number): StoredDoctor {
  return {
    id, slug, name: slug === "nino-osadze" ? "ნინა ოსაძე" : "ძველი სახელი", role: "ძველი როლი",
    photo: 41, published: true, isLead: true, order: 17, experienceYears: "25+",
    languages: [{ id: "keep-language", text: "არსებული ენა" }],
    focusKeyword: "keep-keyword", createdAt: "2020-01-01", updatedAt: "2020-01-01",
    en: { name: "Keep English" }, ru: { name: "Keep Russian" },
  };
}

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "doctors-2026-10-test-"));
  t.after(async () => {
    // Only remove the uniquely created fixture directory under the system temp folder.
    assert.equal(path.dirname(rootDir), path.resolve(os.tmpdir()));
    assert.ok(path.basename(rootDir).startsWith("doctors-2026-10-test-"));
    await fs.rm(rootDir, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(rootDir, "source/doctors"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "public/doctors"), { recursive: true });
  await fs.mkdir(path.join(rootDir, "media"));
  const image = await fs.readFile(path.resolve("public/doctors/nino-buluashvili.webp"));
  await fs.writeFile(path.join(rootDir, "media/fixture.webp"), image);
  await fs.writeFile(path.join(rootDir, "public/doctors/nino-buluashvili.webp"), image);
  for (const spec of doctors) {
    if (spec.sourcePhoto) await fs.writeFile(path.join(rootDir, "source/doctors", spec.sourcePhoto), image);
  }
  const stored = [existingDoctor("nino-buluashvili", 1), existingDoctor("nino-osadze", 2)];
  const media: Media[] = [{
    id: 41, internalName: "doctor-nino-buluashvili", alt: "preserve alt",
    filename: "fixture.webp", mimeType: "image/webp", createdAt: "2020-01-01", updatedAt: "2020-01-01",
  }];
  const writes: Write[] = [];
  let nextID = 100;
  const failUploads = new Set<string>();
  function withRowIDs(data: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key,
      Array.isArray(value) ? value.map((row, index) => ({ ...row, id: `payload-row-${index}` })) : value,
    ]));
  }
  const payload = {
    collections: {
      doctors: { config: Doctors },
      media: { config: { ...MediaCollection, upload: { staticDir: path.join(rootDir, "media") } } },
    },
    async find({ collection, where }: {
      collection: string;
      where: { slug?: { equals: string }; internalName?: { equals: string }; or?: { internalName?: { equals: string }; filename?: { equals: string } }[] };
    }) {
      const matches = collection === "doctors" ? stored.filter((doc) => doc.slug === where.slug?.equals) :
        media.filter((doc) => where.or ? where.or.some((clause) =>
          clause.internalName ? doc.internalName === clause.internalName.equals : doc.filename === clause.filename?.equals,
        ) : doc.internalName === where.internalName?.equals);
      return { docs: structuredClone(matches.slice(0, 2)), totalDocs: matches.length };
    },
    async create(input: Write) {
      assert.equal(input.locale, "ka");
      if (input.collection === "media" && failUploads.has(input.data.internalName as string)) {
        throw new Error("Simulated upload failure");
      }
      writes.push(structuredClone(input));
      const doc = { ...withRowIDs(input.data), id: nextID++, createdAt: "2026-10-27", updatedAt: "2026-10-27" };
      if (input.collection === "media") {
        const upload = { ...doc, filename: "fixture.webp", mimeType: "image/webp" } as Media;
        media.push(upload);
        return structuredClone(upload);
      }
      stored.push(doc as StoredDoctor);
      return structuredClone(doc);
    },
    async update(input: Write) {
      assert.equal(input.locale, "ka");
      writes.push(structuredClone(input));
      const doc = (input.collection === "media" ? media : stored).find((entry) => entry.id === input.id);
      assert.ok(doc);
      Object.assign(doc, withRowIDs(input.data));
      return structuredClone(doc);
    },
  } as unknown as Payload;
  const run = (apply: boolean, specs: readonly DoctorSpec[] = doctors) =>
    runMigration(payload, { apply, rootDir, log() {} }, specs);
  return { rootDir, stored, media, writes, failUploads, run, payload };
}

test("dry run plans all eight doctors and cannot call mutation APIs", async (t) => {
  const f = await fixture(t);
  const before = structuredClone({ stored: f.stored, media: f.media });
  f.payload.create = (() => { throw new Error("Dry run attempted create"); }) as Payload["create"];
  f.payload.update = (() => { throw new Error("Dry run attempted update"); }) as Payload["update"];
  const results = await f.run(false);
  assert.equal(results.filter(({ status }) => status === "CREATED").length, 6);
  assert.equal(results.filter(({ status }) => status === "UPDATED").length, 2);
  assert.deepEqual({ stored: f.stored, media: f.media }, before);
  assert.equal(f.writes.length, 0);
});

test("apply is idempotent, uses row objects and valid Lexical, and preserves protected data", async (t) => {
  const f = await fixture(t);
  const before = structuredClone(f.stored);
  const first = await f.run(true);
  assert.equal(first.filter(({ status }) => status === "CREATED").length, 6);
  assert.equal(first.filter(({ status }) => status === "UPDATED").length, 2);
  assert.equal(f.stored.length, 8);
  assert.equal(f.media.length, 8); // Original Buluashvili photo plus seven official uploads.
  assert.equal(new Set(f.stored.map(({ slug }) => slug)).size, 8);
  assert.equal(new Set(f.media.map(({ internalName }) => internalName)).size, 8);
  for (const old of before) {
    const doc = f.stored.find(({ slug }) => slug === old.slug)!;
    for (const key of ["published", "isLead", "order", "experienceYears", "focusKeyword", "en", "ru"] as const) {
      assert.deepEqual(doc[key], old[key]);
    }
  }
  const osadze = f.stored.find(({ slug }) => slug === "nino-osadze")!;
  for (const [key, value] of Object.entries(before[1])) {
    if (!["education", "photo"].includes(key)) assert.deepEqual(osadze[key as keyof StoredDoctor], value);
  }
  const osadzeWrite = f.writes.find(({ collection, id }) => collection === "doctors" && id === 2)!;
  assert.deepEqual(Object.keys(osadzeWrite.data).sort(), ["education", "photo"]);
  assert.equal(f.stored.find(({ slug }) => slug === "nino-buluashvili")!.photo, 41);
  for (const doc of f.stored.filter(({ id }) => id >= 100)) {
    assert.equal(doc.published, false);
    assert.equal(doc.bio?.root.type, "root");
    assert.equal(doc.bio?.root.children[0].type, "paragraph");
    assert.ok(doc.tags?.every((row) => typeof row.text === "string"));
  }
  for (const slug of ["sofio-kotoreishvili", "ana-togonidze", "ana-batsanadze"]) {
    assert.equal(f.stored.find((doc) => doc.slug === slug)!.languages, undefined);
  }
  const count = f.writes.length;
  const second = await f.run(true);
  assert.ok(second.every(({ status }) => status === "UNCHANGED"));
  assert.equal(f.writes.length, count, "repeat runs must not write even timestamps");
});

test("missing official source skips that doctor and continues with the remaining seven", async (t) => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.rootDir, "source/doctors/ana-togonidze.jpg"));
  const results = await f.run(true);
  assert.equal(results.find(({ slug }) => slug === "ana-togonidze")!.status, "MISSING_SOURCE_PHOTO");
  assert.equal(f.stored.some(({ slug }) => slug === "ana-togonidze"), false);
  assert.equal(results.filter(({ status }) => ["CREATED", "UPDATED"].includes(status)).length, 7);
});

test("missing Osadze is skipped without inventing profile content or uploading a photo", async (t) => {
  const f = await fixture(t);
  f.stored.splice(1, 1);
  const result = await f.run(true, doctors.filter(({ slug }) => slug === "nino-osadze"));
  assert.equal(result[0].status, "SKIPPED");
  assert.equal(f.writes.length, 0);
});

test("missing Buluashvili reuses existing media, or uploads the existing project portrait once", async (t) => {
  for (const reuse of [true, false]) {
    const f = await fixture(t);
    f.stored.splice(0, 1);
    if (!reuse) f.media.splice(0, 1);
    const specs = doctors.filter(({ slug }) => slug === "nino-buluashvili");
    assert.equal((await f.run(true, specs))[0].status, "CREATED");
    assert.equal(f.writes.filter(({ collection }) => collection === "media").length, reuse ? 0 : 1);
    assert.equal((await f.run(true, specs))[0].status, "UNCHANGED");
  }
});

test("canonical media is reused and only its Georgian alt is updated", async (t) => {
  const f = await fixture(t);
  f.media.push({ ...f.media[0], id: 55, internalName: "doctor-ana-tsurtsumia-2026", alt: "old" });
  const results = await f.run(true, doctors.filter(({ slug }) => slug === "ana-tsurtsumia"));
  assert.equal(results[0].status, "CREATED");
  assert.equal(f.media.length, 2);
  const mediaWrite = f.writes.find(({ collection }) => collection === "media")!;
  assert.deepEqual(mediaWrite.data, { alt: "ანა წურწუმია — Total Charm Dent" });
  assert.equal(mediaWrite.locale, "ka");
  assert.equal(f.stored.find(({ slug }) => slug === "ana-tsurtsumia")!.photo, 55);
});

test("an upload failure does not block other doctors and a retry creates no duplicates", async (t) => {
  const f = await fixture(t);
  f.failUploads.add("doctor-sofio-kotoreishvili-2026");
  const results = await f.run(true);
  assert.equal(results[0].status, "ERROR");
  assert.equal(results.filter(({ status }) => status === "CREATED").length, 5);
  f.failUploads.clear();
  const retry = await f.run(true);
  assert.equal(retry[0].status, "CREATED");
  assert.ok(retry.slice(1).every(({ status }) => status === "UNCHANGED"));
  assert.equal(f.stored.length, 8);
  assert.equal(f.media.length, 8);
});

test("media survives a doctor-write failure and is reused on retry", async (t) => {
  const f = await fixture(t);
  const create = f.payload.create.bind(f.payload);
  f.payload.create = (async (input: Write) => {
    if (input.collection === "doctors" && input.data.slug === "sofio-kotoreishvili") {
      throw new Error("Simulated doctor-write failure after upload");
    }
    return create(input as never);
  }) as Payload["create"];
  const specs = doctors.filter(({ slug }) => slug === "sofio-kotoreishvili");
  assert.equal((await f.run(true, specs))[0].status, "ERROR");
  assert.equal(f.media.length, 2);
  f.payload.create = create;
  assert.equal((await f.run(true, specs))[0].status, "CREATED");
  assert.equal(f.media.length, 2);
  assert.equal((await f.run(true, specs))[0].status, "UNCHANGED");
});

test("duplicate doctor slugs and ambiguous canonical media fail without choosing an arbitrary record", async (t) => {
  const f = await fixture(t);
  f.stored.push({ ...f.stored[1], id: 9 });
  const osadze = await f.run(true, doctors.filter(({ slug }) => slug === "nino-osadze"));
  assert.equal(osadze[0].status, "ERROR");
  f.media.push(...[55, 56].map((id) => ({ ...f.media[0], id, internalName: "doctor-ana-tsurtsumia-2026" })));
  const tsurtsumia = await f.run(true, doctors.filter(({ slug }) => slug === "ana-tsurtsumia"));
  assert.equal(tsurtsumia[0].status, "ERROR");
  assert.equal(f.writes.length, 0);
});

test("schema limits and Osadze's content allowlist are checked before any write", async (t) => {
  const f = await fixture(t);
  const overLimit = { ...doctors[0], data: { ...doctors[0].data, metaTitle: "x".repeat(66) } };
  const unauthorized = { slug: "nino-osadze", data: { name: "Do not use this CV name" } };
  const result = await f.run(true, [overLimit, unauthorized]);
  assert.ok(result.every(({ status }) => status === "ERROR"));
  assert.equal(f.writes.length, 0);
});

test("startup disables schema mutations and makes dry-run connections read-only", () => {
  for (const apply of [false, true]) {
    const adapter = {
      name: "postgres",
      push: true, disableCreateDatabase: false, prodMigrations: ["must not run"],
      poolOptions: {
        connectionString: "postgres://localhost/not-used?options=-c%20default_transaction_read_only%3Doff",
        options: "-c statement_timeout=5000",
      },
      createExtensions: async () => { throw new Error("must not run"); },
    };
    const config = {
      db: { init: () => adapter }, typescript: { autoGenerate: true }, telemetry: true,
    } as unknown as SanitizedConfig;
    const safe = migrationConfig(config, apply);
    const db = safe.db.init({ payload: {} as Payload }) as PostgresAdapter;
    assert.equal(db.push, false);
    assert.equal(db.disableCreateDatabase, true);
    assert.equal(db.prodMigrations, undefined);
    assert.equal(db.poolOptions.options?.includes("default_transaction_read_only=on"), !apply);
    const urlOptions = new URL(db.poolOptions.connectionString!).searchParams.get("options");
    assert.equal(urlOptions?.endsWith("default_transaction_read_only=on"), !apply);
    assert.equal(safe.typescript.autoGenerate, false);
    assert.equal(safe.telemetry, false);
  }
});
