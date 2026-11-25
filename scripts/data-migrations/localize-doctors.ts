/** Run from the repository root. Preview: npm run data:doctor-locales. Write: add -- --apply. */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Payload } from "payload";

import { planDoctor } from "./doctor-localization-plan";
import { migrationConfig } from "./update-doctors-2026-10";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = { collection: "doctors", depth: 0, fallbackLocale: false } as const;

async function run(payload: Payload, apply: boolean) {
  const { createLocalReq } = await import("payload");
  const { docs } = await payload.find({
    ...read, locale: "ka", select: { slug: true }, sort: "id", limit: 0, pagination: false,
  });
  let changes = 0;
  let reviews = 0;
  for (const { id, slug } of docs) {
    // All reads and both translations share a PostgreSQL snapshot. A concurrent
    // edit causes a retryable serialization failure instead of a lost update.
    const tx = await payload.db.beginTransaction({ isolationLevel: "serializable" });
    if (tx == null) throw new Error("PostgreSQL transaction unavailable");
    try {
      const req = await createLocalReq({ req: { transactionID: tx } }, payload);
      const options = { ...read, id, req };
      const source = await payload.findByID({ ...options, locale: "ka" });
      for (const locale of ["en", "ru"] as const) {
        const current = await payload.findByID({ ...options, locale });
        const { patch, review } = planDoctor(source, current, locale);
        const fields = Object.keys(patch);
        const missingRequired = (["name", "role"] as const).filter(
          (field) => !(patch[field] ?? current[field])?.trim(),
        );
        if (fields.length && missingRequired.length) {
          review.push(`Locale update deferred until these required fields are translated: ${missingRequired.join(", ")}`);
        }
        for (const note of review) console.log(`REVIEW ${slug} [${locale}] ${note}`);
        reviews += review.length;
        if (!fields.length || missingRequired.length) continue;
        console.log(`${apply ? "UPDATE" : "PLAN"} ${slug} [${locale}]: ${fields.join(", ")}`);
        for (const [field, value] of Object.entries(patch)) {
          if (typeof value === "string") console.log(`  ${field}: ${value}`);
          else if (Array.isArray(value)) console.log(`  ${field}: ${value.map((row) => row.text).join(" / ")}`);
        }
        if (apply) {
          await payload.update({ ...options, locale, data: patch, overrideLock: false });
        }
        changes++;
      }
      await payload.db.commitTransaction(tx);
    } catch (error) {
      await payload.db.rollbackTransaction(tx);
      throw new Error(`Could not finish ${slug}`, { cause: error });
    }
  }
  console.log(`${docs.length} doctors checked; ${changes} locale updates ${apply ? "applied" : "planned"}; ${reviews} review notes.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 1 && args[0] === "--apply")) {
    throw new Error("Usage: npm run data:doctor-locales [-- --apply]");
  }
  const apply = args.includes("--apply");
  const envFile = [".env.local", ".env"].map((name) => resolve(root, name)).find(existsSync);
  if (envFile) process.loadEnvFile(envFile);
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  process.env.PAYLOAD_DROP_DATABASE = "false";
  console.log(apply ? "APPLY" : "DRY RUN (read only)");
  const { default: config } = await import("@payload-config");
  const { getPayload } = await import("payload");
  const payload = await getPayload({
    config: migrationConfig(await config, apply), disableOnInit: true, cron: false,
  });
  try {
    await run(payload, apply);
  } finally {
    await payload.destroy();
  }
}

main().then(
  () => process.stdout.write("", () => process.exit(0)),
  (error: Error) => {
    console.error(error.message, error.cause instanceof Error ? error.cause.message : "");
    process.stderr.write("", () => process.exit(1));
  },
);
