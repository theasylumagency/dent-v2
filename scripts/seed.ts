/**
 * One-shot importer: current content → Payload.
 *
 *   npm run seed
 *
 * Reads what the site renders today — the typed modules in `src/lib` and the
 * three i18n dictionaries — and writes it into Payload in all three locales,
 * uploading the images from `public/` on the way. Nothing is retyped by hand,
 * which matters: there are roughly 300 translated strings here and a manual
 * pass would introduce errors nobody would catch until a patient read them.
 *
 * Safe to re-run. Every document is looked up by slug first and updated
 * rather than duplicated, so a partial failure can be fixed and the script
 * run again.
 *
 * After this succeeds the dictionaries still contain the migrated content.
 * That is deliberate — leave it until the data layer is switched over and
 * verified, then delete the migrated blocks in one commit.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "..");
const publicDir = path.join(root, "public");

/* --------------------------------------------------------------------------
   Environment, before anything reads it.

   `payload.config.ts` reads `process.env.DATABASE_URL` at module-evaluation
   time. A static `import config from "@payload-config"` would therefore run
   *before* this block — ES module imports are hoisted — and build the adapter
   with an undefined connection string. The config is imported dynamically
   inside `main()` for exactly that reason; do not turn it back into a static
   import.

   `.env.local` first, because that is the file Next uses and the one the
   project actually keeps its values in. Payload's own CLI only looks for
   `.env`, which is why running this through `payload run` failed silently.
   -------------------------------------------------------------------------- */
for (const file of [".env.local", ".env"]) {
  const envPath = path.join(root, file);
  if (fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
    console.log(`env: ${file}`);
    break;
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local — see .env.example for the format.",
  );
  process.exit(1);
}

type Locale = "ka" | "en" | "ru";
const LOCALES: Locale[] = ["ka", "en", "ru"];

/**
 * Two sources, and the split is the point.
 *
 * `dict` is the shipped UI dictionary — still the home of the contact strings
 * and the per-route meta this script seeds into the globals.
 *
 * `archive` is `scripts/seed-data/content/*.json`: the service, doctor,
 * device, profile and FAQ prose that used to live in the dictionary and now
 * lives in Payload. It was moved here by `scripts/split-dictionaries.mjs`
 * rather than deleted, because this script is the only repeatable way to fill
 * a fresh database and the dictionary was the only copy of that text.
 *
 * Nothing in `archive` is rendered by the site. If a string needs changing,
 * change it in the admin — editing it here changes nothing until someone
 * re-seeds, which on a live install would overwrite the client's own edits.
 */
const readJson = (...segments: string[]) =>
  JSON.parse(fs.readFileSync(path.join(root, ...segments), "utf8"));

const dict = Object.fromEntries(
  LOCALES.map((locale) => [locale, readJson("src/i18n/dictionaries", `${locale}.json`)]),
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- locale JSON is runtime seed input with heterogeneous nested records.
) as Record<Locale, any>;

if (!fs.existsSync(path.join(root, "scripts/seed-data/content/ka.json"))) {
  console.error(
    "scripts/seed-data/content/ is missing.\n" +
      "That content is still inside the i18n dictionaries. Move it first:\n\n" +
      "  node scripts/split-dictionaries.mjs --write\n",
  );
  process.exit(1);
}

const archive = Object.fromEntries(
  LOCALES.map((locale) => [locale, readJson("scripts/seed-data/content", `${locale}.json`)]),
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- archived seed JSON intentionally mirrors several collection shapes.
) as Record<Locale, any>;

/* --------------------------------------------------------------------------
   Lexical

   Payload's rich text wants a Lexical document, not a string. This is the
   minimum viable shape — a root with paragraph and heading children. Written
   by hand rather than pulled from a converter because the input here is
   already structured (arrays of paragraphs, or {type, text} blocks), and a
   Markdown round-trip would only add a parser that can get it wrong.
   -------------------------------------------------------------------------- */

type Block = { type: "h2" | "p"; text: string };

const textNode = (text: string) => ({
  type: "text",
  text,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const lexical = (blocks: Block[]) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: blocks.map((block) => ({
      type: block.type === "h2" ? "heading" : "paragraph",
      ...(block.type === "h2" ? { tag: "h2" } : { textFormat: 0 }),
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [textNode(block.text)],
    })),
  },
});

const paragraphs = (texts: string[]) =>
  lexical(texts.filter(Boolean).map((text) => ({ type: "p" as const, text })));

/** Payload array fields take rows, not bare strings. */
const rows = (items: readonly string[] | undefined) =>
  (items ?? []).map((text) => ({ text }));

/** Meta pair for one service category, as the `seo` global wants it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- this helper receives the runtime dictionary parsed above.
const metaOf = (d: any, slug: string) => ({
  title: d.services.categories[slug].metaTitle,
  description: d.services.categories[slug].metaDescription,
});

/* ------------------------------------------------------------------------ */

async function main() {
  /* Dynamic, so it evaluates after the env block above. See the note there. */
  const { default: config } = await import("@payload-config");

  console.log("Connecting to Payload…");
  const payload = await getPayload({ config });
  console.log("Connected.\n");

  /** Uploads a file from `public/` once and remembers its id. */
  const mediaCache = new Map<string, number | string>();

  async function upload(
    publicPath: string,
    alt: Record<Locale, string>,
    internalName: string,
  ) {
    const cached = mediaCache.get(publicPath);
    if (cached) return cached;

    const filePath = path.join(publicDir, publicPath.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing image: ${publicPath}`);
    }

    const existing = await payload.find({
      collection: "media",
      where: { internalName: { equals: internalName } },
      limit: 1,
    });

    let id = existing.docs[0]?.id;

    if (!id) {
      const created = await payload.create({
        collection: "media",
        locale: "ka",
        data: { internalName, alt: alt.ka },
        filePath,
      });
      id = created.id;
      for (const locale of ["en", "ru"] as const) {
        await payload.update({
          collection: "media",
          id,
          locale,
          data: { alt: alt[locale] },
        });
      }
      console.log(`  ↑ media ${internalName}`);
    }

    mediaCache.set(publicPath, id);
    return id;
  }

  /**
   * Create-or-update by slug, then fill in the other two locales.
   *
   * `base` is everything unlocalised plus the Georgian text; `translated`
   * returns only the localised fields for a given locale.
   */
  async function upsert(
    collection: "posts" | "services" | "equipment" | "doctors",
    slug: string,
    base: Record<string, unknown>,
    /** Return `null` for a locale to leave it untranslated and let Payload's
        own fallback serve the Georgian text. */
    translated: (locale: Locale) => Record<string, unknown> | null,
  ) {
    const found = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      limit: 1,
      locale: "ka",
    });

    const id =
      found.docs[0]?.id ??
      (
        await payload.create({
          collection,
          locale: "ka",
          data: { ...base, ...translated("ka"), slug } as never,
        })
      ).id;

    if (found.docs[0]) {
      await payload.update({
        collection,
        id,
        locale: "ka",
        data: { ...base, ...translated("ka") } as never,
      });
    }

    for (const locale of ["en", "ru"] as const) {
      const data = translated(locale);
      if (!data) continue;
      await payload.update({ collection, id, locale, data: data as never });
    }

    return id;
  }

  /* --- services --------------------------------------------------------- */

  const { seedServices } = await import("./seed-data/services.js");
  const serviceIds = new Map<string, number | string>();

  console.log("services");
  for (const [index, service] of seedServices.entries()) {
    const slug = service.slug;
    const id = await upsert(
      "services",
      slug,
      { category: service.category, order: index },
      (locale) => {
        const item = archive[locale].services.items[slug];
        return {
          title: item.title,
          blurb: item.blurb,
          lead: item.lead ?? "",
          whatsIncluded: rows(item.points),
        };
      },
    );
    serviceIds.set(slug, id);
    console.log(`  · ${slug}`);
  }

  /* --- equipment -------------------------------------------------------- */

  /* From the snapshot, not `lib/equipment.ts` — that module reads from
     Payload now. Text still comes from the dictionaries, which have not been
     stripped yet. */
  const { seedEquipment } = await import("./seed-data/equipment.js");

  console.log("equipment");
  for (const [index, device] of seedEquipment.entries()) {
    const alt = `${device.name} — ${device.manufacturerName}`;
    const photo = await upload(
      device.photo,
      { ka: alt, en: alt, ru: alt },
      `equipment-${device.slug}`,
    );

    await upsert(
      "equipment",
      device.slug,
      {
        name: device.name,
        group: device.group,
        order: index,
        manufacturerName: device.manufacturerName,
        manufacturerUrl: device.manufacturerUrl,
        photo,
        /* Most seeded images are labelled stand-ins. Individual entries can
           opt out once a real, approved photograph is available. */
        photoPending: device.photoPending ?? true,
        services: device.services.map((slug) => serviceIds.get(slug)).filter(Boolean),
      },
      (locale) => {
        const copy = archive[locale].technology.page.devices[device.slug];
        return {
          summary: copy.summary,
          body: paragraphs(copy.body),
          highlights: rows(copy.highlights),
        };
      },
    );
    console.log(`  · ${device.slug}`);
  }

  /* --- doctors ---------------------------------------------------------- */

  const { seedDoctors } = await import("./seed-data/doctors.js");

  console.log("doctors");
  for (const [index, entry] of seedDoctors.entries()) {
    const { slug, isLead } = entry;

    const photo = await upload(
      entry.photo,
      Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          `${archive[locale].team.members[slug].name} — ${archive[locale].team.members[slug].role}`,
        ]),
      ) as Record<Locale, string>,
      `doctor-${slug}`,
    );

    await upsert(
      "doctors",
      slug,
      {
        order: index,
        isLead,
        published: entry.published,
        photo,
        experienceYears: isLead ? archive.ka.doctor.experienceValue : "",
      },
      (locale) => {
        const member = archive[locale].team.members[slug];
        const d = archive[locale];

        if (isLead) {
          return {
            name: member.name,
            role: member.role,
            focus: d.doctor.credentials,
            bio: paragraphs([d.doctor.bio1, d.doctor.bio2]),
            tags: rows(d.doctor.tags),
            education: rows(d.about.leadProfile.education),
            experience: rows(d.about.leadProfile.experience),
            training: rows(d.about.leadProfile.training),
            languages: rows(d.about.leadProfile.languages),
          };
        }

        const profile = d.about.profiles[slug];
        return {
          name: member.name,
          role: member.role,
          focus: profile.focus,
          bio: profile.bio ? paragraphs([profile.bio]) : paragraphs([]),
          education: rows(profile.education),
          experience: rows(profile.experience),
          training: rows(profile.training),
          languages: rows(profile.languages),
        };
      },
    );
    console.log(`  · ${slug}${entry.published ? "" : " (unpublished — profile pending)"}`);
  }

  /* --- posts ------------------------------------------------------------ */

  /* From the frozen snapshot, not from `lib/news.ts` — that module now reads
     from Payload, and seeding out of it would be a circle. See the note at
     the top of `seed-data/posts.ts`. */
  const { seedPosts } = await import("./seed-data/posts.js");

  console.log("posts");
  for (const post of seedPosts) {
    const cover = await upload(
      post.cover,
      { ka: post.coverAlt, en: post.coverAlt, ru: post.coverAlt },
      `post-${post.slug}`,
    );

    await upsert(
      "posts",
      post.slug,
      {
        category: post.category,
        publishedAt: new Date(post.publishedAt).toISOString(),
        cover,
        _status: "published",
      },
      /* The initial posts exist in Georgian only, so `en` and `ru` are left
         empty and Payload's `fallback: true` serves the Georgian text —
         exactly what the site did before the migration. Writing Georgian
         into the other two locales would look identical to a reader but
         would mark them as translated, and the detail page could no longer
         tell anyone that no translation exists. */
      (locale) =>
        locale === "ka"
          ? { title: post.title, excerpt: post.excerpt, body: lexical(post.body) }
          : null,
    );
    console.log(`  · ${post.slug}`);
  }

  /* --- faq -------------------------------------------------------------- */

  console.log("faq");
  const faqItems: { q: string; a: string }[] = archive.ka.faq.items;

  for (const [index, item] of faqItems.entries()) {
    /* FAQ has no slug, so the Georgian question is the identity. If a
       question is reworded in the admin, re-running the seed would create a
       duplicate — acceptable for a one-shot import, and the reason this is
       not something to run on a schedule. */
    const found = await payload.find({
      collection: "faq",
      where: { question: { equals: item.q } },
      limit: 1,
      locale: "ka",
    });

    const id =
      found.docs[0]?.id ??
      (
        await payload.create({
          collection: "faq",
          locale: "ka",
          data: { question: item.q, answer: item.a, order: index },
        })
      ).id;

    for (const locale of ["en", "ru"] as const) {
      const translated = archive[locale].faq.items[index];
      await payload.update({
        collection: "faq",
        id,
        locale,
        data: { question: translated.q, answer: translated.a },
      });
    }
    console.log(`  · ${item.q.slice(0, 48)}…`);
  }

  /* --- globals ----------------------------------------------------------- */

  /* Both globals are written last and are the only part of the seed that is
     purely idempotent — a global is one document, so a re-run overwrites
     rather than duplicating.

     They are seeded at all because an empty admin form invites an editor to
     author from scratch, and what we want is for them to edit. `getClinic`
     and `getSeo` both fall back to the shipped copy, so an unseeded install
     still renders correctly; this just makes the fields agree with what is
     on the page. */

  console.log("\nclinic-info");
  /* Imported rather than retyped: `site` holds the very values `getClinic`
     falls back to, so seeding from it guarantees the CMS and the fallback
     start out identical. Relative + `.js`, matching the seed-data imports —
     tsx resolves it to the `.ts`. */
  const { site } = await import("../src/lib/site.js");

  await payload.updateGlobal({
    slug: "clinic-info",
    locale: "ka",
    data: {
      phone: site.phone,
      phoneAlt: site.phoneAlt,
      whatsappSameAsPhone: true,
      email: site.email,
      address: dict.ka.contact.address,
      mapsUrl: site.maps,
      hoursText: dict.ka.contact.hours,
      consultationFirst: site.consultation.first,
      consultationRepeat: site.consultation.repeat,
      /* `satisfiedPercent` and `yearsOnMarket` are deliberately not seeded.
         They were "98" and "10" in the dictionaries, sourced from nobody. An
         empty field asks the clinic for a real number; a seeded one would
         re-publish the invention and look like it had been checked. The
         counters do not render until they are filled in. */
      facebook: site.social.facebook,
      instagram: site.social.instagram,
      google: site.social.google,
    },
  });
  for (const locale of ["en", "ru"] as const) {
    await payload.updateGlobal({
      slug: "clinic-info",
      locale,
      data: {
        address: dict[locale].contact.address,
        hoursText: dict[locale].contact.hours,
      },
    });
  }
  console.log("  · contact details");

  console.log("\nseo");
  for (const locale of LOCALES) {
    const d = dict[locale];
    await payload.updateGlobal({
      slug: "seo",
      locale,
      data: {
        home: { title: d.meta.title, description: d.meta.description },
        about: { title: d.about.metaTitle, description: d.about.metaDescription },
        services: { title: d.services.page.metaTitle, description: d.services.page.metaDescription },
        technology: {
          title: d.technology.page.metaTitle,
          description: d.technology.page.metaDescription,
        },
        news: { title: d.news.metaTitle, description: d.news.metaDescription },
        contact: { title: d.contact.page.metaTitle, description: d.contact.page.metaDescription },
        categories: {
          diagnosticsPlanning: metaOf(d, "diagnostics-planning"),
          therapyPrevention: metaOf(d, "therapy-prevention"),
          surgeryImplantation: metaOf(d, "surgery-implantation"),
          orthodontics: metaOf(d, "orthodontics"),
          aesthetic: metaOf(d, "aesthetic"),
        },
      },
    });
    console.log(`  · ${locale}`);
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
