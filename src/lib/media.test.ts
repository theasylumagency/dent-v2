import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { mediaUrl } from "./media";

const photo = { url: "/api/media/file/portrait.webp", updatedAt: "2026-09-02T11:07:15.546Z" };

test("replacing the same filename changes the image cache key and repeated reads remain cacheable", () => {
  const first = mediaUrl(photo);
  assert.equal(mediaUrl({ ...photo }), first);
  assert.notEqual(mediaUrl({ ...photo, updatedAt: "2026-09-02T12:00:00.000Z" }), first);
  const parsed = new URL(first, "https://totalcharmdent.ge");
  assert.equal(parsed.pathname, photo.url);
  assert.equal(parsed.searchParams.get("v"), photo.updatedAt);
});

test("campaign derivatives use the parent upload's edit time", () => {
  const derivative = "/api/media/file/portrait-900x1351.webp";
  const parsed = new URL(mediaUrl(photo, derivative), "https://totalcharmdent.ge");
  assert.equal(parsed.pathname, derivative);
  assert.equal(parsed.searchParams.get("v"), photo.updatedAt);
  assert.equal(mediaUrl(photo, null), mediaUrl(photo));
});

test("existing queries and fragments survive versioning", () => {
  const parsed = new URL(mediaUrl({ ...photo, url: `${photo.url}?download=1#preview` }), "https://totalcharmdent.ge");
  assert.equal(parsed.searchParams.get("download"), "1");
  assert.equal(parsed.searchParams.get("v"), photo.updatedAt);
  assert.equal(parsed.hash, "#preview");
});

test("missing uploads and older documents without timestamps keep their fallback behavior", () => {
  for (const value of [undefined, null, 9, {}, { updatedAt: photo.updatedAt }, { url: null }]) {
    assert.equal(mediaUrl(value), "");
  }
  assert.equal(mediaUrl({ url: photo.url }), photo.url);
});

test("resolved production config renders versioned uploads while keeping other local queries blocked", async () => {
  // Test the fully resolved config: Next adds a query-blocking localPatterns
  // default during loading, which cannot be caught by URL-only unit tests.
  const require = createRequire(import.meta.url);
  const loadConfig = require("next/dist/server/config").default as typeof import("next/dist/server/config").default;
  const loader = require("next/dist/shared/lib/image-loader").default as typeof import("next/dist/shared/lib/image-loader").default;
  const { getImgProps } = require("next/dist/shared/lib/get-img-props") as typeof import("next/dist/shared/lib/get-img-props");
  const { hasLocalMatch } = require("next/dist/shared/lib/match-local-pattern") as typeof import("next/dist/shared/lib/match-local-pattern");
  const { PHASE_PRODUCTION_BUILD } = require("next/constants") as typeof import("next/constants");
  const config = await loadConfig(PHASE_PRODUCTION_BUILD, fileURLToPath(new URL("../../", import.meta.url)), { silent: true });

  const sources = [
    mediaUrl(photo),
    mediaUrl(photo, "/api/media/file/portrait-900x1351.webp"),
    "/api/media/file/totcharm_dentinner11.webp?v=2026-08-27T06%3A17%3A49.973Z",
    "/media/hero-poster.webp",
    "/doctors/Archil-Apkhadze.webp",
  ];
  for (const src of sources) {
    assert.equal(hasLocalMatch(config.images.localPatterns, src), true, src);
    const { props } = getImgProps(
      { src, width: 900, height: 1200, alt: "Test image" },
      { imgConf: config.images, defaultLoader: loader },
    );
    assert.equal(new URL(props.src, "https://totalcharmdent.ge").searchParams.get("url"), src);
  }
  for (const src of ["/media/hero-poster.webp?v=1", "/api/booking?v=1", "/api/media/other?v=1"]) {
    assert.equal(hasLocalMatch(config.images.localPatterns, src), false, src);
  }
});
