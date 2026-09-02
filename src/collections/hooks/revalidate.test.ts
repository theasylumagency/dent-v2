import "next/dist/server/node-environment-baseline";
import assert from "node:assert/strict";
import test from "node:test";
import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";
import { getImplicitTags } from "next/dist/server/lib/implicit-tags";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { Doctors } from "../Doctors";
import { Media } from "../Media";
import { locales } from "../../i18n/config";

// Use the installed Next version's real route tags, including route groups.
// Merely asserting calls to revalidatePath misses patterns that cannot match
// a prerendered page (and was the cause of the stale profile regression).
const publicRoutes = [
  ["/[lang]/(site)/page", ""],
  ["/[lang]/(site)/about/page", "/about"],
  ["/[lang]/(site)/about/[slug]/page", "/about/archil-apkhadze"],
  ["/[lang]/(site)/about/[slug]/page", "/about/renamed-doctor"],
  ["/[lang]/(site)/about/[slug]/page", "/about/colleague"],
  ["/[lang]/(site)/contact/page", "/contact"],
  ["/[lang]/[slug]/page", "/implant-campaign"],
];

for (const collection of [Doctors, Media]) {
  for (const event of ["afterChange", "afterDelete"] as const) {
    test(`${collection.slug} ${event} invalidates every public use without another document save`, async () => {
      const store = { incrementalCache: {}, pendingRevalidatedTags: [] } as unknown as WorkStore;
      const args = {
        collection,
        doc: { id: 1, slug: "renamed-doctor", url: "/api/media/file/portrait.webp" },
        previousDoc: { id: 1, slug: "archil-apkhadze", url: "/api/media/file/portrait.webp" },
        operation: "update",
        req: { user: null },
      };

      await workAsyncStorage.run(store, async () => {
        for (const hook of collection.hooks?.[event] ?? []) {
          await hook(args as Parameters<CollectionAfterChangeHook>[0] & Parameters<CollectionAfterDeleteHook>[0]);
        }
      });

      const invalidated = new Set(store.pendingRevalidatedTags?.map(({ tag }) => tag));
      const isInvalidated = async (page: string, url: string) => {
        const { tags } = await getImplicitTags(page, url, null);
        return tags.some((tag) => invalidated.has(tag));
      };

      for (const locale of locales) {
        for (const [page, suffix] of publicRoutes) {
          const url = `/${locale}${suffix}`;
          assert.equal(await isInvalidated(page, url), true, `${url} must get fresh data`);
        }
      }
      assert.equal(await isInvalidated("/sitemap.xml/route", "/sitemap.xml"), true);
      assert.equal(await isInvalidated("/(payload)/admin/[[...segments]]/page", "/admin"), false);
    });
  }
}
