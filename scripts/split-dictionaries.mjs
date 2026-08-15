/**
 * One-shot codemod: move CMS-owned content out of the i18n dictionaries.
 *
 *   node scripts/split-dictionaries.mjs          # show what would change
 *   node scripts/split-dictionaries.mjs --write  # do it
 *
 * Five blocks were migrated into Payload and are no longer read by any
 * component — but `scripts/seed.ts` still reads them, because it is what
 * puts content into a fresh database. Deleting them outright would trade a
 * tidy dictionary for the loss of the only repeatable import path.
 *
 * So they move rather than disappear: out of `src/i18n/dictionaries/*.json`
 * and into `scripts/seed-data/content/*.json`, keeping their exact nesting so
 * the seed reads them at the same key paths.
 *
 * What that buys:
 *   - `check:i18n` stops enforcing three-locale parity on ~600 strings that
 *     nobody renders, so a translator's remaining work is real work
 *   - the shipped dictionaries describe the UI, and only the UI
 *   - a fresh database can still be seeded
 *
 * Written as a script rather than done by hand because the content is
 * Georgian and Russian prose. A dropped character in a hand-edit of 1700
 * lines is invisible in review and would surface as a mangled sentence on a
 * patient-facing page.
 *
 * Safe to re-run: paths already moved are simply absent the second time.
 * Delete this file once it has been run and the result committed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictDir = path.join(root, "src/i18n/dictionaries");
const archiveDir = path.join(root, "scripts/seed-data/content");
const locales = ["ka", "en", "ru"];
const write = process.argv.includes("--write");

/** Moved to `scripts/seed-data/content/*.json`, still read by the seed. */
const ARCHIVE = [
  "services.items",
  "team.members",
  "faq.items",
  "about.profiles",
  "about.leadProfile",
  "technology.page.devices",
  "doctor.name",
  "doctor.role",
  "doctor.credentials",
  "doctor.bio1",
  "doctor.bio2",
  "doctor.tags",
  "doctor.experienceValue",
];

/**
 * Deleted outright. The two counted figures now come from the CMS and the two
 * claimed ones from `clinic-info`, so there is nothing here worth keeping —
 * see `src/lib/stats.ts`.
 */
const DROP = [
  "stats.satisfiedValue",
  "stats.satisfiedSuffix",
  "stats.yearsValue",
  "stats.yearsSuffix",
  "stats.specialistsValue",
  "stats.specialistsSuffix",
  "stats.directionsValue",
  "stats.directionsSuffix",
];

const get = (object, dotted) =>
  dotted.split(".").reduce((node, key) => (node == null ? undefined : node[key]), object);

function setAt(object, dotted, value) {
  const keys = dotted.split(".");
  const last = keys.pop();
  const parent = keys.reduce((node, key) => (node[key] ??= {}), object);
  parent[last] = value;
}

/** Removes a key, then any ancestor the removal left empty. */
function removeAt(object, dotted) {
  const keys = dotted.split(".");
  const chain = [];
  let node = object;
  for (const key of keys.slice(0, -1)) {
    if (node == null) return false;
    chain.push([node, key]);
    node = node[key];
  }
  if (node == null) return false;

  const last = keys.at(-1);
  if (!(last in node)) return false;
  delete node[last];

  for (const [parent, key] of chain.reverse()) {
    if (parent[key] && Object.keys(parent[key]).length === 0) delete parent[key];
  }
  return true;
}

let touched = 0;

for (const locale of locales) {
  const dictPath = path.join(dictDir, `${locale}.json`);
  const dict = JSON.parse(fs.readFileSync(dictPath, "utf8"));
  const archive = {};

  const moved = [];
  for (const dotted of ARCHIVE) {
    const value = get(dict, dotted);
    if (value === undefined) continue;
    setAt(archive, dotted, value);
    removeAt(dict, dotted);
    moved.push(dotted);
  }

  const dropped = DROP.filter((dotted) => removeAt(dict, dotted));

  console.log(`\n${locale}`);
  console.log(`  archived: ${moved.length ? moved.join(", ") : "nothing (already run?)"}`);
  console.log(`  dropped:  ${dropped.length ? dropped.join(", ") : "nothing"}`);

  if (!moved.length && !dropped.length) continue;
  touched += 1;

  if (write) {
    fs.mkdirSync(archiveDir, { recursive: true });
    const archivePath = path.join(archiveDir, `${locale}.json`);
    /* Merge, so a re-run after a partial move does not discard the first. */
    const existing = fs.existsSync(archivePath)
      ? JSON.parse(fs.readFileSync(archivePath, "utf8"))
      : {};
    fs.writeFileSync(
      archivePath,
      `${JSON.stringify({ ...existing, ...archive }, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(dictPath, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
  }
}

console.log(
  write
    ? `\nWritten. ${touched} dictionar${touched === 1 ? "y" : "ies"} trimmed; archive in scripts/seed-data/content/.`
    : "\nDry run — nothing written. Re-run with --write.",
);
