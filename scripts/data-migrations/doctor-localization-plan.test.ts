import assert from "node:assert/strict";
import test from "node:test";
import type { Doctor } from "../../src/payload-types";
import sourceProfiles from "./doctors-2026-10.json";
import { planDoctor } from "./doctor-localization-plan";

const rowFields = ["education", "experience", "training", "tags", "languages"] as const;
const locales = ["en", "ru"] as const;
const georgian = /\p{Script=Georgian}/u;

function fixture(index: number) {
  const { slug, data } = sourceProfiles[index];
  const lists = Object.fromEntries(rowFields.map((field) => [
    field, data[field]?.map((text, id) => ({ id: `ka-${id}`, text })) ?? [],
  ]));
  return {
    ...data, ...lists, slug,
    bio: { root: { children: data.bio?.map((text) => ({ type: "paragraph", children: [{ type: "text", text }] })) ?? [] } },
  } as unknown as Doctor;
}

test("localize the Georgian profile import in both editions, including individual qualifications and SEO", () => {
  for (const [index, { data }] of sourceProfiles.entries()) {
    const source = fixture(index);
    for (const locale of locales) {
      for (const target of [{} as Doctor, structuredClone(source)]) {
        const { patch, review } = planDoctor(source, target, locale);
        assert.deepEqual(review, [], source.slug);
        if (data.name) {
          assert.ok(patch.name && patch.role && patch.metaTitle && patch.metaDescription);
          assert.ok(patch.metaTitle.length <= 65 && patch.metaDescription.length <= 175);
          assert.ok(patch.bio);
        }
        assert.doesNotMatch(JSON.stringify(patch), georgian);
        assert.deepEqual(planDoctor(source, { ...target, ...patch }, locale), { patch: {}, review: [] });
        assert.equal(patch.education?.length, source.education?.length);
      }
    }
  }
});

test("preserve edited translations and row IDs, without transferring Georgian row IDs to a new edition", () => {
  const source = fixture(2);
  const existing = { name: "Clinic’s preferred spelling", training: [
    { id: "en-1", text: "Independently edited course" },
    { id: "en-2", text: source.training![1].text },
  ] } as Doctor;
  const { patch, review } = planDoctor(source, existing, "en");
  assert.equal(patch.name, undefined);
  assert.deepEqual(patch.training?.[0], existing.training![0]);
  assert.equal(patch.training?.[1].id, "en-2");
  assert.match(patch.training![1].text, /Dentsply/);
  assert.ok(patch.education?.every((row) => !row.id));
  assert.ok(review.some((note) => note.startsWith("training:")));
});

test("new or changed source facts require review and never inherit another dentist’s course", () => {
  const source = fixture(2);
  source.education = [{ text: "ახალი ჩანაწერი" }];
  source.training = fixture(3).training;
  const { patch, review } = planDoctor(source, {} as Doctor, "ru");
  assert.equal(patch.education, undefined);
  assert.equal(patch.training, undefined);
  assert.ok(patch.name);
  assert.equal(review.length, 2);
});

test("current clinical role takes precedence over the older profile import", () => {
  const source = fixture(7);
  source.role = "ექიმი თერაპევტი-ჰიგიენისტი";
  const { patch } = planDoctor(source, { role: "ექიმი ჰიგიენისტი" } as Doctor, "ru");
  assert.equal(patch.role, "Стоматолог-терапевт, гигиенист");
});
