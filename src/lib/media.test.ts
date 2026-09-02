import assert from "node:assert/strict";
import test from "node:test";
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
