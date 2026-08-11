/**
 * Translation parity check.
 *
 *   node scripts/check-i18n.mjs
 *
 * Compares every key path in the locale dictionaries against `ka` (the source
 * of truth) and reports missing keys, extra keys, array-length mismatches and
 * values that were left untranslated.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dictDir = join(root, "src/i18n/dictionaries");
const base = "ka";
const others = ["en", "ru"];

const load = (locale) => JSON.parse(readFileSync(join(dictDir, `${locale}.json`), "utf8"));

function paths(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => paths(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      paths(child, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [prefix];
}

function valueAt(object, path) {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .reduce((acc, key) => (acc == null ? acc : acc[key]), object);
}

const baseDict = load(base);
const basePaths = paths(baseDict);
let failed = false;

for (const locale of others) {
  const dict = load(locale);
  const localePaths = new Set(paths(dict));

  const missing = basePaths.filter((p) => !localePaths.has(p));
  const extra = [...localePaths].filter((p) => !basePaths.includes(p));
  const identical = basePaths.filter((p) => {
    if (!localePaths.has(p)) return false;
    const a = valueAt(baseDict, p);
    const b = valueAt(dict, p);
    if (typeof a !== "string" || a.length < 12) return false;
    return a === b;
  });

  console.log(`\n${locale}.json — ${localePaths.size}/${basePaths.length} keys`);
  if (missing.length) {
    failed = true;
    console.log(`  ✗ missing (${missing.length}): ${missing.join(", ")}`);
  }
  if (extra.length) {
    failed = true;
    console.log(`  ✗ extra (${extra.length}): ${extra.join(", ")}`);
  }
  if (identical.length) {
    console.log(`  ! same text as ka (${identical.length}): ${identical.join(", ")}`);
  }
  if (!missing.length && !extra.length) console.log("  ✓ key parity ok");
}

/* --- referenced assets ------------------------------------------------- */
const assets = [
  ...basePaths
    .map((p) => valueAt(baseDict, p))
    .filter((v) => typeof v === "string" && v.startsWith("/") && /\.(webp|jpg|png|svg|mp4)$/.test(v)),
  ...["/brand/logo.svg", "/media/hero.mp4", "/media/hero-poster.jpg"],
];

const sources = ["services", "team", "site", "equipment"]
  .map((module) => readFileSync(join(root, `src/lib/${module}.ts`), "utf8"))
  .join("\n");
const referenced = [...new Set([...assets, ...(sources.match(/"\/[^"]+\.(webp|jpg|svg|mp4)"/g) ?? []).map((s) => s.slice(1, -1))])];

const missingAssets = referenced.filter((asset) => !existsSync(join(root, "public", asset)));
console.log(`\nassets — ${referenced.length - missingAssets.length}/${referenced.length} present`);
if (missingAssets.length) {
  failed = true;
  console.log(`  ✗ missing: ${missingAssets.join(", ")}`);
} else {
  console.log("  ✓ all referenced assets exist");
}

process.exit(failed ? 1 : 0);
