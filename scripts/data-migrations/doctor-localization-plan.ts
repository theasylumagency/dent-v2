import type { Doctor } from "../../src/payload-types";
import copy from "./doctor-translations.json";

type Locale = "en" | "ru";
const georgian = /\p{Script=Georgian}/u;
const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s*([-–—·])\s*/gu, "$1").replace(/\s+/gu, " ");
const scalarFields = ["name", "role", "focus", "metaTitle", "metaDescription"] as const;
const listFields = ["education", "training", "tags", "experience", "languages"] as const;
type Rows = Doctor["training"];
type Patch = Partial<Pick<Doctor, (typeof scalarFields)[number] | (typeof listFields)[number] | "bio">>;

const profiles: Record<string, string[][]> = copy.profiles;

/** Each profile's entries are keyed by its original text, so reordered CV
 * rows still match. International course names retain their advertised titles. */
function glossary(slug: string, locale: Locale) {
  const entries = new Map<string, string>();
  entries.set("TMD", locale === "en" ? "TMD" : "Дисфункция ВНЧС");
  for (const [ka, en, ru] of [...copy.common, ...(profiles[slug] ?? [])]) {
    entries.set(normalize(ka), locale === "en" ? en : ru);
  }
  return (value: string): string | undefined => {
    const exact = entries.get(normalize(value));
    if (exact) return exact;
    const parts = value.split("·");
    if (parts.length < 2) return undefined;
    const translated = parts.map((part) => entries.get(normalize(part)));
    return translated.every(Boolean) ? translated.join(" · ") : undefined;
  };
}
type Translate = ReturnType<typeof glossary>;

/** Keep existing target row IDs. A row copied from KA needs a fresh ID in the target locale. */
function localizeRows(source: Rows, target: Rows, translate: Translate, review: (reason: string) => void) {
  const originals = source ?? [];
  const current = target ?? [];
  const sourceKeys = new Set(originals.map((row) => normalize(row.text)));
  const translated = originals.map((row) => translate(row.text));
  if (!current.length) {
    if (!originals.length) return;
    const missing = originals.filter((_, i) => !translated[i]);
    if (missing.length) {
      review(missing.map((row) => row.text).join(" / "));
      return;
    }
    return translated.map((text) => ({ text: text! }));
  }
  let changed = false;
  const next = current.map((row) => {
    if (!georgian.test(row.text)) return row;
    const replacement = sourceKeys.has(normalize(row.text)) && translate(row.text);
    if (!replacement) {
      review(row.text);
      return row;
    }
    changed = true;
    return { ...row, text: replacement };
  });
  // Append a missing qualification only when every existing row can be matched
  // to a source row. An independently worded translation could be the same course.
  if (current.length < originals.length) {
    const known = new Set(translated.filter((text): text is string => !!text).map(normalize));
    if (translated.every(Boolean) && next.every((row) => known.has(normalize(row.text)))) {
      const present = new Set(next.map((row) => normalize(row.text)));
      for (const text of translated) {
        if (text && !present.has(normalize(text))) {
          next.push({ text });
          present.add(normalize(text));
          changed = true;
        }
      }
    } else {
      review("Compare the existing list with the Georgian entries.");
    }
  }
  return changed ? next : undefined;
}

type Bio = NonNullable<Doctor["bio"]>;
type TextNode = { text?: string; children?: TextNode[] };
function textNodes(node: TextNode): TextNode[] {
  return typeof node.text === "string" ? [node] : (node.children ?? []).flatMap(textNodes);
}

function localizeBio(source: Doctor["bio"], target: Doctor["bio"], translate: Translate, review: (reason: string) => void) {
  const originals = source ? textNodes(source.root as TextNode).map((node) => normalize(node.text!)) : [];
  const hasTarget = target && textNodes(target.root as TextNode).some((node) => node.text?.trim());
  const base = hasTarget ? target : source;
  if (!base || (!hasTarget && !originals.length)) return;
  const result: Bio = structuredClone(base);
  let changed = false;
  const nodes = textNodes(result.root as TextNode);
  for (const node of nodes) {
    if (!node.text?.trim() || (hasTarget && !georgian.test(node.text))) continue;
    const replacement = originals.includes(normalize(node.text)) && translate(node.text);
    if (!replacement) {
      review(node.text);
      return;
    }
    node.text = replacement;
    changed = true;
  }
  return changed ? result : undefined;
}

export function planDoctor(source: Doctor, current: Doctor, locale: Locale) {
  const translate = glossary(source.slug, locale);
  const patch: Patch = {};
  const review: string[] = [];
  for (const field of scalarFields) {
    const target = current[field]?.trim();
    if (target && !georgian.test(target)) continue;
    const ka = source[field]?.trim();
    if (!ka && !target) continue;
    const text = ka && translate(ka);
    if (!text || (target && normalize(target) !== normalize(ka!) && !translate(target))) {
      review.push(`${field}: ${target || ka}`);
      continue;
    }
    patch[field] = text;
  }
  for (const field of listFields) {
    const rows = localizeRows(source[field], current[field], translate, (why) => review.push(`${field}: ${why}`));
    if (rows) patch[field] = rows;
  }
  const bio = localizeBio(source.bio, current.bio, translate, (why) => review.push(`bio: ${why}`));
  if (bio) patch.bio = bio;
  return { patch, review };
}
