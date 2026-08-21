import { readFileSync, writeFileSync } from "node:fs";

const path = "next.config.ts";
let source = readFileSync(path, "utf8");

if (source.includes("async redirects()")) {
  console.log("already present");
  process.exit(0);
}

const marker = "  async headers() {";
if (!source.includes(marker)) throw new Error("headers marker missing");

const block = [
  "  /**",
  "   * Campaign pages used to live under `/:lang/lp/:slug` and now sit at the",
  "   * root of the locale. Ads, QR codes and printed material carrying the old",
  "   * shape keep working — permanently, because the new URL is the canonical",
  "   * one and there is no plan to move back.",
  "   */",
  "  async redirects() {",
  "    return [",
  "      {",
  '        source: "/:lang(ka|en|ru)/lp/:slug",',
  '        destination: "/:lang/:slug",',
  "        permanent: true,",
  "      },",
  "    ];",
  "  },",
  "",
  "",
].join("\n");

writeFileSync(path, source.replace(marker, block + marker));
console.log("next.config patched");
