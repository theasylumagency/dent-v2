/**
 * Georgian content only; no schema migration. See update-doctors-2026-10.md.
 *   npm run data:update-doctors               # read-only plan
 *   npm run data:update-doctors -- --apply    # write the plan
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Field, Payload, SanitizedConfig } from "payload";
import type { PostgresAdapter } from "@payloadcms/db-postgres";
import sharp from "sharp";

import type { Doctor, Media } from "../../src/payload-types";
import sourceDoctors from "./doctors-2026-10.json";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const rowFields = ["tags", "education", "experience", "training", "languages"] as const;
const textFields = ["name", "role", "focus", "metaTitle", "metaDescription"] as const;
type RowField = (typeof rowFields)[number];
type TextField = (typeof textFields)[number];
type ContentField = RowField | TextField | "bio";
type DoctorPatch = Partial<Pick<Doctor, ContentField | "photo">>;
export type DoctorSpec = {
  slug: string;
  sourcePhoto?: string;
  data: Partial<Record<TextField, string> & Record<RowField | "bio", string[]>>;
};
export const doctors: readonly DoctorSpec[] = sourceDoctors;
export const statuses = [
  "CREATED", "UPDATED", "UNCHANGED", "MISSING_SOURCE_PHOTO", "SKIPPED", "ERROR",
] as const;
export type Status = (typeof statuses)[number];
export type Result = { slug: string; status: Status; detail?: string };
type RunOptions = { apply: boolean; rootDir?: string; log?: (line: string) => void };

class MigrationIssue extends Error {
  constructor(public status: "MISSING_SOURCE_PHOTO" | "SKIPPED", message: string) {
    super(message);
  }
}

/** Only unnamed layout wrappers are flattened: SEO lives at the document root. */
function namedFields(fields: Field[]): Map<string, Field> {
  const found = new Map<string, Field>();
  for (const field of fields) {
    if ("name" in field && field.name) found.set(field.name, field);
    else if ("fields" in field) {
      for (const [name, nested] of namedFields(field.fields)) found.set(name, nested);
    } else if (field.type === "tabs") {
      for (const tab of field.tabs) {
        if (!("name" in tab)) {
          for (const [name, nested] of namedFields(tab.fields)) found.set(name, nested);
        }
      }
    }
  }
  return found;
}

/** The same minimal Payload Lexical paragraph structure used by scripts/seed.ts. */
function paragraphs(texts: string[]): NonNullable<Doctor["bio"]> {
  return {
    root: {
      type: "root", format: "", indent: 0, version: 1, direction: "ltr",
      children: texts.map((text) => ({
        type: "paragraph", format: "", indent: 0, version: 1, direction: "ltr", textFormat: 0,
        children: [{ type: "text", text, detail: 0, format: 0, mode: "normal", style: "", version: 1 }],
      })),
    },
  };
}

/** Compare supplied content, ignoring Payload row IDs / additional Lexical metadata. */
function matches(actual: unknown, desired: unknown): boolean {
  if (Array.isArray(desired)) {
    return Array.isArray(actual) && actual.length === desired.length &&
      desired.every((item, index) => matches(actual[index], item));
  }
  if (desired && typeof desired === "object") {
    return !!actual && typeof actual === "object" && Object.entries(desired).every(
      ([key, value]) => matches((actual as Record<string, unknown>)[key], value),
    );
  }
  return actual === desired;
}

function contentPatch(spec: DoctorSpec, fields: Map<string, Field>): DoctorPatch {
  const patch: DoctorPatch = {};
  for (const [key, value] of Object.entries(spec.data)) {
    if (spec.slug === "nino-osadze" && key !== "education") {
      throw new Error("nino-osadze: only education may be supplied as profile content");
    }
    const field = fields.get(key);
    const expectedType = key === "bio" ? "richText" :
      rowFields.includes(key as RowField) ? "array" :
        textFields.includes(key as TextField) ? (key === "metaDescription" ? "textarea" : "text") : null;
    if (!field || !expectedType || field.type !== expectedType ||
        !("localized" in field) || field.localized !== true) {
      throw new Error(`SCHEMA_MISMATCH: ${key} must be a localized ${expectedType ?? "approved field"}`);
    }
    if (typeof value === "string") {
      if (!value.trim()) throw new Error(`Empty supplied text: ${key}`);
      if ("maxLength" in field && typeof field.maxLength === "number" && value.length > field.maxLength) {
        throw new Error(`SCHEMA_MISMATCH: ${key} has ${value.length} characters; limit ${field.maxLength}`);
      }
      Object.assign(patch, { [key]: value });
    } else {
      if (!Array.isArray(value) || !value.length || value.some((text) => typeof text !== "string" || !text.trim())) {
        throw new Error(`Invalid supplied list: ${key}`);
      }
      if (field.type === "array") {
        const textField = namedFields(field.fields).get("text");
        if (textField?.type !== "text" || !textField.required) {
          throw new Error(`SCHEMA_MISMATCH: ${key} rows must have required text`);
        }
      }
      Object.assign(patch, { [key]: key === "bio" ? paragraphs(value) : value.map((text) => ({ text })) });
    }
  }
  return patch;
}

async function findDoctor(payload: Payload, slug: string) {
  const result = await payload.find({
    collection: "doctors", where: { slug: { equals: slug } }, limit: 2,
    depth: 0, locale: "ka", fallbackLocale: false, overrideAccess: true,
  });
  if (result.totalDocs > 1) throw new Error(`Ambiguous doctor slug: ${slug}`);
  return result.docs[0];
}

async function nextDoctorOrder(payload: Payload, lastPlannedOrder?: number): Promise<number> {
  // Include every doctor, even unpublished profiles outside this migration.
  const result = await payload.find({
    collection: "doctors", sort: "-order", limit: 1, select: { order: true },
    depth: 0, locale: "ka", fallbackLocale: false, overrideAccess: true,
  });
  const currentMax = result.docs[0]?.order;
  if (result.docs.length && (typeof currentMax !== "number" || !Number.isFinite(currentMax))) {
    throw new Error("Cannot assign order: the highest existing doctor order is invalid");
  }
  const maximum = lastPlannedOrder === undefined ? currentMax :
    currentMax === undefined ? lastPlannedOrder : Math.max(currentMax, lastPlannedOrder);
  const next = maximum === undefined ? 0 : maximum + 1;
  if (!Number.isFinite(next) || (maximum !== undefined && next <= maximum)) {
    throw new Error("Cannot assign order: the next value is outside the supported numeric range");
  }
  return next;
}

async function findMedia(payload: Payload, internalName: string, filename?: string) {
  const result = await payload.find({
    collection: "media",
    where: filename ? { or: [{ internalName: { equals: internalName } }, { filename: { equals: filename } }] } :
      { internalName: { equals: internalName } },
    limit: 2, depth: 0, locale: "ka", fallbackLocale: false, overrideAccess: true,
  });
  if (result.totalDocs > 1) throw new Error(`Ambiguous media: ${internalName}; resolve duplicates manually`);
  return result.docs[0];
}

async function checkImage(filePath: string, source: boolean) {
  try {
    if (!(await fs.stat(filePath)).isFile()) throw new Error("Not a file");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new MigrationIssue(source ? "MISSING_SOURCE_PHOTO" : "SKIPPED", `Missing image: ${filePath}`);
    }
    throw error;
  }
  // A buffer avoids libvips holding a source file open in its cache on Windows.
  const metadata = await sharp(await fs.readFile(filePath)).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Invalid image: ${filePath}`);
}

async function checkMedia(payload: Payload, media: Media) {
  if (!media.mimeType?.startsWith("image/") || !media.filename || path.basename(media.filename) !== media.filename) {
    throw new Error(`Invalid reusable image media: ${media.internalName ?? media.id}`);
  }
  const upload = payload.collections.media.config.upload;
  if (!upload || !upload.staticDir) throw new Error("SCHEMA_MISMATCH: expected local media storage");
  await checkImage(path.resolve(upload.staticDir, media.filename), false);
}

type PhotoPlan = {
  internalName?: string;
  filePath?: string;
  media?: Media;
  id?: number;
  alt?: string;
  updateAlt: boolean;
  preserve: boolean;
};

async function planPhoto(payload: Payload, spec: DoctorSpec, existing: Doctor | undefined, rootDir: string): Promise<PhotoPlan> {
  if (spec.slug === "nino-buluashvili" && existing) {
    return { preserve: true, updateAlt: false };
  }
  const official = !!spec.sourcePhoto;
  if (!official && spec.slug !== "nino-buluashvili") throw new Error(`No photo policy for ${spec.slug}`);
  const internalName = `doctor-${spec.slug}${official ? "-2026" : ""}`;
  const filePath = official ? path.join(rootDir, "source/doctors", spec.sourcePhoto!) :
    path.join(rootDir, "public/doctors/nino-buluashvili.webp");
  // Missing official source files are always reported, even on a later rerun.
  if (official) await checkImage(filePath, true);
  const media = await findMedia(payload, internalName, official ? undefined : "nino-buluashvili.webp");
  if (media) await checkMedia(payload, media);
  else if (!official) await checkImage(filePath, true);
  const name = spec.data.name ?? existing?.name;
  if (!name) throw new MigrationIssue("SKIPPED", "Cannot supply Georgian photo alt without an existing Georgian name");
  const alt = `${name} — Total Charm Dent`;
  return {
    internalName, filePath, media, id: media?.id, alt, preserve: false,
    updateAlt: !!media && official && media.alt !== alt,
  };
}

function creationData(spec: DoctorSpec, patch: DoctorPatch, fields: Map<string, Field>) {
  // Osadze's name/role are deliberately not sourced from the CV or seed archive.
  if (!patch.name || !patch.role) {
    throw new MigrationIssue("SKIPPED", "Missing doctor; approved name and role are required for creation");
  }
  const order = fields.get("order");
  if (order?.type !== "number" || order.localized) {
    throw new Error("SCHEMA_MISMATCH: expected a shared numeric order field");
  }
  const data = { ...patch, slug: spec.slug, name: patch.name, role: patch.role, published: false };
  for (const [name, field] of fields) {
    // Photo and order are supplied after the remaining creation fields are validated.
    if (name === "photo" || name === "order" || name === "id" || name === "createdAt" || name === "updatedAt") continue;
    if ("required" in field && field.required && !(name in data) &&
        !("defaultValue" in field && field.defaultValue !== undefined)) {
      throw new MigrationIssue("SKIPPED", `Missing required creation field: ${name}`);
    }
  }
  return data;
}

function changes(existing: Doctor, patch: DoctorPatch): DoctorPatch {
  return Object.fromEntries(Object.entries(patch).filter(([key, value]) =>
    !matches(existing[key as keyof Doctor], value),
  ));
}

async function ensurePhoto(payload: Payload, photo: PhotoPlan): Promise<number | undefined> {
  if (photo.preserve) return undefined;
  // Look up again immediately before uploading; successful partial runs reuse media.
  const media = photo.media ?? await findMedia(payload, photo.internalName!);
  if (media) {
    await checkMedia(payload, media);
    if (photo.updateAlt) {
      await payload.update({
        collection: "media", id: media.id, locale: "ka", fallbackLocale: false,
        overrideAccess: true, data: { alt: photo.alt! },
      });
    }
    return media.id;
  }
  const created = await payload.create({
    collection: "media", locale: "ka", fallbackLocale: false, overrideAccess: true,
    data: { internalName: photo.internalName!, alt: photo.alt! }, filePath: photo.filePath!,
  });
  return created.id;
}

export function printSummary(results: Result[], apply: boolean, log: (line: string) => void = console.log) {
  log(`\n${apply ? "APPLY" : "DRY RUN (planned statuses; no writes)"} summary`);
  for (const status of statuses) {
    const entries = results.filter((result) => result.status === status);
    log(`  ${status}: ${entries.length}${entries.length ? ` — ${entries.map((entry) => entry.slug).join(", ")}` : ""}`);
  }
}

export async function runMigration(payload: Payload, options: RunOptions, specs: readonly DoctorSpec[] = doctors): Promise<Result[]> {
  const { apply, rootDir = root, log = console.log } = options;
  const results: Result[] = [];
  let lastPlannedOrder: number | undefined;
  const fields = namedFields(payload.collections.doctors.config.fields);
  for (const spec of specs) {
    log(`\n[${apply ? "APPLY" : "DRY RUN"}] ${spec.slug}`);
    try {
      const slugField = fields.get("slug");
      const photoField = fields.get("photo");
      if (slugField?.type !== "text" || !slugField.unique || slugField.localized ||
          photoField?.type !== "upload" || photoField.relationTo !== "media" || photoField.localized) {
        throw new Error("SCHEMA_MISMATCH: expected a unique shared slug and shared media photo");
      }
      const existing = await findDoctor(payload, spec.slug);
      log(`  doctor: ${existing ? `found id=${existing.id}; published=${existing.published}; order=${existing.order}` : "missing"}`);
      const content = contentPatch(spec, fields);
      const create = existing ? undefined : creationData(spec, content, fields);
      const photo = await planPhoto(payload, spec, existing, rootDir);
      const createOrder = create ? await nextDoctorOrder(payload, lastPlannedOrder) : undefined;
      const patch = existing ? changes(existing, content) : content;
      const oldPhoto = typeof existing?.photo === "object" ? existing.photo.id : existing?.photo;
      const replacePhoto = !photo.preserve && (!photo.id || oldPhoto !== photo.id);
      if (replacePhoto && photo.id) patch.photo = photo.id;
      log(`  photo: ${photo.preserve ? "preserve existing relationship" : photo.media ?
        `reuse ${photo.internalName} (id=${photo.id}); relationship ${replacePhoto ? "will replace" : "unchanged"}` :
        `will upload ${photo.internalName}; relationship ${existing ? "will replace" : "will set"}`}`);
      if (photo.updateAlt) log("  media alt: will update ka only");
      for (const [key, value] of Object.entries(patch)) {
        if (key !== "photo") log(`  ${key}: ${Array.isArray(value) ? `${value.length} rows; ` : ""}will ${existing ? "update" : "set"}`);
      }
      log(existing ? "  all other fields: preserved" : "  doctor: will create; published: false");
      if (createOrder !== undefined) log(`  order: will set ${createOrder}`);
      let status: Status = existing ?
        (Object.keys(patch).length || replacePhoto || photo.updateAlt ? "UPDATED" : "UNCHANGED") : "CREATED";
      if (apply && status !== "UNCHANGED") {
        const photoID = await ensurePhoto(payload, photo);
        if (replacePhoto && photoID) patch.photo = photoID;
        if (existing) {
          if (Object.keys(patch).length) {
            await payload.update({
              collection: "doctors", id: existing.id, locale: "ka", fallbackLocale: false,
              overrideAccess: true, overrideLock: false, data: patch,
            });
          }
        } else {
          // Recheck by slug, and keep the database's unique constraint as a final race guard.
          const raced = await findDoctor(payload, spec.slug);
          if (raced) {
            const racedPatch = changes(raced, { ...content, photo: photoID! });
            if (Object.keys(racedPatch).length) await payload.update({
              collection: "doctors", id: raced.id, locale: "ka", fallbackLocale: false,
              overrideAccess: true, overrideLock: false, data: racedPatch,
            });
            status = Object.keys(racedPatch).length || photo.updateAlt ? "UPDATED" : "UNCHANGED";
          } else {
            await payload.create({
              collection: "doctors", locale: "ka", fallbackLocale: false, overrideAccess: true,
              data: { ...create!, order: createOrder!, photo: photoID! },
            });
          }
        }
      }
      if (status === "CREATED") lastPlannedOrder = createOrder;
      results.push({ slug: spec.slug, status });
      log(`  status: ${status}${apply ? "" : " (planned)"}`);
    } catch (error) {
      const status = error instanceof MigrationIssue ? error.status : "ERROR";
      const detail = error instanceof Error ? error.message : String(error);
      results.push({ slug: spec.slug, status, detail });
      log(`  ${status}: ${detail}`);
    }
  }
  printSummary(results, apply, log);
  return results;
}

/** Keep the configured adapter, but prevent every automatic schema write path. */
export function migrationConfig(config: SanitizedConfig, apply: boolean): SanitizedConfig {
  const init = config.db.init;
  return {
    ...config,
    telemetry: false,
    typescript: { ...config.typescript, autoGenerate: false },
    db: {
      ...config.db,
      init(args) {
        const original = init(args);
        if (original.name !== "postgres") throw new Error("Expected the configured PostgreSQL adapter");
        const adapter = original as PostgresAdapter;
        adapter.push = false;
        adapter.disableCreateDatabase = true;
        adapter.prodMigrations = undefined;
        adapter.createExtensions = async () => {};
        // Always inspect the primary: replica lag could hide a just-created record.
        adapter.readReplicaOptions = undefined;
        if (!apply) {
          // PostgreSQL itself rejects writes, including accidental writes from hooks.
          // pg gives URL options priority over pool options, so protect both paths.
          let connectionURL: URL | undefined;
          if (adapter.poolOptions.connectionString) {
            try {
              connectionURL = new URL(adapter.poolOptions.connectionString);
            } catch {
              throw new Error("DATABASE_URL must be a PostgreSQL URL for the read-only preview");
            }
          }
          const previousOptions = connectionURL?.searchParams.get("options") ??
            adapter.poolOptions.options ?? process.env.PGOPTIONS ?? "";
          const options = `${previousOptions} -c default_transaction_read_only=on`.trim();
          if (connectionURL) connectionURL.searchParams.set("options", options);
          adapter.poolOptions = {
            ...adapter.poolOptions,
            ...(connectionURL ? { connectionString: connectionURL.toString() } : {}),
            options,
          };
        }
        return adapter;
      },
    },
  };
}

export async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply") || args.length > 1) {
    throw new Error("Usage: npm run data:update-doctors [-- --apply]");
  }
  const apply = args.includes("--apply");
  // Same loading order as seed.ts, before the dynamic config import.
  for (const file of [".env.local", ".env"]) {
    try {
      await fs.access(path.join(root, file));
    } catch {
      continue;
    }
    process.loadEnvFile(path.join(root, file));
    console.log(`env: ${file}`);
    break;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. See .env.example.");
  // The adapter otherwise honours this dangerous environment toggle even with push:false.
  process.env.PAYLOAD_DROP_DATABASE = "false";
  let payload: Payload | undefined;
  try {
    console.log(`${apply ? "APPLY" : "DRY RUN (read-only)"}: connecting to Payload…`);
    const { default: sourceConfig } = await import("@payload-config");
    const { getPayload } = await import("payload");
    payload = await getPayload({
      config: migrationConfig(await sourceConfig, apply), disableOnInit: true, cron: false,
    });
    const results = await runMigration(payload, { apply });
    if (results.some((result) => ["ERROR", "SKIPPED", "MISSING_SOURCE_PHOTO"].includes(result.status))) process.exitCode = 1;
  } catch (error) {
    printSummary(doctors.map(({ slug }) => ({ slug, status: "ERROR" })), apply);
    throw error;
  } finally {
    if (payload) await payload.destroy();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    // Initialization can fail before Payload exposes a handle; do not leave its pool alive.
    process.exit(1);
  });
}
