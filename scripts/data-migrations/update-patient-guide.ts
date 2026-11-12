import { readFile, access } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import type { Payload } from "payload";

import { locales, type Locale } from "../../src/i18n/config";
import { toBlocks } from "../../src/lib/rich-text";
import { migrationConfig } from "./update-doctors-2026-10";

const root = fileURLToPath(new URL("../../", import.meta.url));
const posts = [
  {
    slug: "lost-tooth-replacement-options",
    source: "lost-tooth-replacement-options",
    cover: "images/guides/lost-tooth-replacement-options.webp",
    alt: "სარედაქციო ილუსტრაცია — ექიმი პაციენტს კბილის აღდგენის ვარიანტებს მოდელით უხსნის",
  },
  {
    slug: "cbct-implant-planning",
    source: "why-is-dental-implantation-planned",
    cover: "equipment/vatech-cbct.webp",
    alt: "კლინიკის კონუსურ-სხივური ტომოგრაფი Vatech",
  },
  {
    slug: "airflow-instead-of-scaling",
    source: "airflow-instead-of-scaling",
    cover: "equipment/ems-airflow-master.webp",
    alt: "კლინიკის პროფესიული წმენდის მოწყობილობა EMS AIRFLOW",
  },
  {
    slug: "whitening-what-to-expect",
    source: "whitening-what-to-expect",
    cover: "equipment/philips-zoom-4.webp",
    alt: "კლინიკის კბილების გათეთრების მოწყობილობა Philips Zoom",
  },
  {
    slug: "trios-scanner-arrived",
    source: "trios-scanner-arrived",
    cover: "equipment/trios-3-move.webp",
    alt: "კლინიკის ინტრაორალური სკანერი 3Shape TRIOS",
  },
] as const;

const element = { direction: "ltr" as const, format: "" as const, indent: 0, version: 1 };
const textNode = (text: string, format = 0) =>
  ({ type: "text", text, format, detail: 0, mode: "normal", style: "", version: 1 });

function inline(line: string, locale: Locale) {
  const nodes = [];
  let cursor = 0;
  for (const match of line.matchAll(/\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*/g)) {
    if (match.index > cursor) nodes.push(textNode(line.slice(cursor, match.index)));
    if (match[3]) {
      nodes.push(textNode(match[3], 1));
    } else {
      const [, label, url] = match;
      if (!url.startsWith(`/${locale}/`)) throw new Error(`Unexpected article link: ${url}`);
      nodes.push({
        ...element,
        type: "link",
        fields: { linkType: "custom", url, newTab: false },
        children: [textNode(label)],
      });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) nodes.push(textNode(line.slice(cursor)));
  return nodes;
}

function parseArticle(markdown: string, locale: Locale) {
  const [heading, first, ...sections] = markdown.trim().split(/\r?\n\s*\r?\n/);
  if (!heading?.startsWith("# ") || !first || !sections.length) {
    throw new Error("Expected a title, opening paragraph and article body");
  }
  const children = [first, ...sections].map((section) => {
    const subheading = section.match(/^(#{2,3}) (.+)$/);
    if (subheading) {
      return { ...element, type: "heading", tag: `h${subheading[1].length}`, children: inline(subheading[2], locale) };
    }
    const lines = section.split(/\r?\n/);
    if (lines.every((line) => line.startsWith("- "))) {
      return {
        ...element, type: "list", tag: "ul", listType: "bullet", start: 1,
        children: lines.map((line, index) => ({
          ...element, type: "listitem", value: index + 1, children: inline(line.slice(2), locale),
        })),
      };
    }
    return { ...element, type: "paragraph", textFormat: 0, children: inline(lines.join(" "), locale) };
  });
  return { title: heading.slice(2), intro: first.replace(/\s+/g, " "), body: { root: { ...element, type: "root", children } } };
}

const excerpts = {
  "lost-tooth-replacement-options": "ხიდი, იმპლანტი თუ მოსახსნელი პროთეზი? გაიგეთ, რით განსხვავდება ვარიანტები და რა უნდა ჰკითხოთ ექიმს კონსულტაციაზე.",
  "cbct-implant-planning": "როგორ ეხმარება 3D ტომოგრაფია ექიმს ძვლის, ნერვის არხისა და იმპლანტის შესაძლო მდებარეობის შეფასებაში.",
  "airflow-instead-of-scaling": "რას აშორებს AIRFLOW და როდის სჭირდება გამაგრებულ კბილის ქვას ულტრაბგერითი ან ხელის ინსტრუმენტი.",
  "whitening-what-to-expect": "როგორ იზომება კბილის ფერის ცვლილება და რა გავლენას ახდენს გათეთრება ბუნებრივ კბილებსა და რესტავრაციებზე.",
  "trios-scanner-arrived": "როგორ იღებს TRIOS კბილების ციფრულ მოდელს და როდის შეიძლება ექიმმა ტრადიციული ანაბეჭდი შეარჩიოს.",
};

const lookup = { locale: "ka", fallbackLocale: false, depth: 0, limit: 2 } as const;
const write = { locale: "ka", fallbackLocale: false, depth: 0, overrideLock: false } as const;

const coverAlts = {
  "lost-tooth-replacement-options": {
    en: "Illustration of a dentist discussing tooth replacement with a patient using a teaching model",
    ru: "Иллюстрация: стоматолог показывает пациенту на модели, как можно восстановить зуб",
  },
  "cbct-implant-planning": { en: "The clinic’s Vatech cone-beam CT scanner", ru: "Конусно-лучевой томограф Vatech в клинике" },
  "airflow-instead-of-scaling": { en: "The clinic’s EMS AIRFLOW dental cleaning device", ru: "Аппарат EMS AIRFLOW для профессиональной чистки зубов" },
  "whitening-what-to-expect": { en: "The clinic’s Philips Zoom whitening device", ru: "Аппарат Philips Zoom для отбеливания зубов" },
  "trios-scanner-arrived": { en: "The clinic’s 3Shape TRIOS intraoral scanner", ru: "Внутриротовой сканер 3Shape TRIOS в клинике" },
};

async function getCover(payload: Payload, filePath: string, alt: string, translations: { en: string; ru: string }) {
  const filename = basename(filePath);
  const { docs } = await payload.find({
    ...lookup, collection: "media", where: { filename: { equals: filename } },
  });
  if (docs.length > 1) throw new Error(`Duplicate media filename: ${filename}`);
  const media = docs[0] ?? await payload.create({
    ...write, collection: "media", filePath,
    data: { internalName: filename.replace(/\.webp$/, ""), alt },
  });
  for (const locale of ["en", "ru"] as const) {
    const localized = await payload.findByID({
      ...write, collection: "media", id: media.id, locale,
    });
    if (!localized.alt) {
      await payload.update({
        ...write, collection: "media", id: media.id, locale, data: { alt: translations[locale] },
      });
    }
  }
  return media.id;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (args.length > 1 || (mode && !["--check-db", "--add-draft", "--update-existing"].includes(mode))) {
    throw new Error("Usage: npm run data:patient-guide [-- --check-db | --add-draft | --update-existing]");
  }
  const selected = mode === "--add-draft" ? posts.slice(0, 1) : mode === "--update-existing" ? posts.slice(1) : posts;
  const articles = await Promise.all(selected.map(async (post) => {
    const filePath = resolve(root, "public", post.cover);
    await access(filePath);
    const editions = await Promise.all(locales.map(async (locale) => {
      const directory = locale === "ka" ? "docs/blog" : `docs/blog/${locale}`;
      const markdown = await readFile(resolve(root, directory, `${post.source}.md`), "utf8");
      const { title, intro, body } = parseArticle(markdown, locale);
      const blocks = toBlocks(body, locale);
      const excerpt = locale === "ka" ? excerpts[post.slug] : intro;
      if (!excerpt || excerpt.length > 175 || blocks.length < 3) {
        throw new Error(`Incomplete article or invalid description: ${locale}/${post.slug}`);
      }
      return { locale, title, body, blocks, excerpt };
    }));
    return { ...post, editions, filePath };
  }));

  if (!mode) {
    console.table(articles.flatMap(({ slug, editions, cover }) =>
      editions.map(({ locale, title, blocks }) =>
        ({ url: `/${locale}/news/${slug}`, title, blocks: blocks.length, cover }))));
    return;
  }

  for (const file of [".env.local", ".env"]) {
    try {
      await access(resolve(root, file));
    } catch {
      continue;
    }
    process.loadEnvFile(resolve(root, file));
    break;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  process.env.PAYLOAD_DROP_DATABASE = "false";
  const { default: config } = await import("@payload-config");
  const { getPayload, createLocalReq, initTransaction, commitTransaction, killTransaction } = await import("payload");
  const payload = await getPayload({
    config: migrationConfig(await config, mode !== "--check-db"), disableOnInit: true, cron: false,
  });
  try {
    // Inspect all requested posts before writing any of them.
    const targets = await Promise.all(articles.map(async (article) => {
      const where = { slug: { equals: article.slug } };
      const { docs } = await payload.find({ ...lookup, collection: "posts", draft: true, where });
      if (docs.length > 1) throw new Error(`Duplicate slug: ${article.slug}`);
      const existing = docs[0];
      if (mode === "--update-existing" && existing?._status !== "published") {
        throw new Error(`Expected a published post without a pending draft: ${article.slug}`);
      }
      return { article, existing };
    }));

    if (mode === "--check-db") {
      console.table(targets.map(({ article, existing }) => ({
        slug: article.slug, status: existing?._status ?? "missing",
      })));
      return;
    }

    for (const { article, existing } of targets) {
      if (mode === "--add-draft" && existing?._status === "published") {
        console.log(`Already published: ${article.slug}`);
        continue;
      }
      const cover = await getCover(payload, article.filePath, article.alt, coverAlts[article.slug]);
      const draft = mode === "--add-draft";
      const req = await createLocalReq({}, payload);
      if (!await initTransaction(req)) throw new Error("A database transaction is required");
      try {
        let id = existing?.id;
        for (const { locale, title, excerpt, body, blocks } of article.editions) {
          const fields = { title, excerpt, metaTitle: title.length <= 65 ? title : null, metaDescription: excerpt };
          const options = { ...write, req, locale, collection: "posts" as const, draft };
          if (id === undefined) {
            const created = await payload.create({
              ...options,
              data: {
                ...fields, body, cover, slug: article.slug, category: "guide",
                publishedAt: new Date().toISOString(), _status: "draft",
              },
            });
            id = created.id;
            continue;
          }

          const current = await payload.findByID({ ...options, id });
          if (draft && current.title && current.excerpt && toBlocks(current.body, locale).length) continue;
          if (!draft && current.cover === cover &&
              Object.entries(fields).every(([key, value]) => current[key as keyof typeof current] === value) &&
              isDeepStrictEqual(toBlocks(current.body, locale), blocks)) continue;
          await payload.update({
            ...options, id,
            data: { ...fields, body, ...(draft ? {} : { cover }), _status: draft ? "draft" : "published" },
          });
        }
        await commitTransaction(req);
      } catch (error) {
        await killTransaction(req);
        throw error;
      }
      console.log(`${draft ? "Draft ready" : "Published versions ready"}: ${article.slug} (ka, en, ru)`);
    }
  } finally {
    await payload.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
