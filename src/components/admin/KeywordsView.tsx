import Link from "next/link";
import type { AdminViewServerProps } from "payload";

import { locales, type Locale } from "@/i18n/config";
import { keywords as t, seo as seoLabels } from "@/admin/labels";

/**
 * „საკვანძო სიტყვები“ — one screen listing every page's focus keyword.
 *
 * **Why this screen exists.** The keyword itself is a note on each document,
 * which is the right place to *write* it. It is the wrong place to *read*
 * it: answering "what is this site working on?" meant opening eleven groups
 * in the SEO global plus every post, doctor and campaign page, one at a
 * time, in each of three languages. The field was delivered; the question it
 * was asked for was not.
 *
 * So this view reads the same values back in one table. It writes nothing —
 * every row links to the document that owns it, and editing still happens
 * there. A second place to edit the same value is a second place for it to
 * be wrong.
 *
 * **The empty cells are the point.** A blank column for English says nobody
 * has decided what the English page is for, which is exactly the kind of gap
 * that is invisible when the field is buried in a collapsed block.
 *
 * Registered as `admin.components.views.keywords` in `payload.config.ts`,
 * so `npm run generate:importmap` has to run after any change to that path.
 */

/** Keyed by locale, so a row can show all three languages side by side. */
type Row = {
  page: string;
  href: string;
  /** The page's public URL, when it has one. */
  url?: string;
  keyword: Partial<Record<Locale, string>>;
  /** Whether a Google title has been written — the same review pass. */
  hasTitle: Partial<Record<Locale, boolean>>;
};

type Group = { title: string; note: string; rows: Row[] };

/** The eleven fixed routes, in the order the SEO global presents them. */
const SEO_ROUTES: { field: string; label: string; path: string }[] = [
  { field: "home", label: seoLabels.home, path: "" },
  { field: "about", label: seoLabels.about, path: "/about" },
  { field: "services", label: seoLabels.services, path: "/services" },
  { field: "technology", label: seoLabels.technology, path: "/technology" },
  { field: "news", label: seoLabels.news, path: "/news" },
  { field: "contact", label: seoLabels.contact, path: "/contact" },
];

const SEO_CATEGORIES: { field: string; label: string; path: string }[] = [
  { field: "diagnosticsPlanning", label: seoLabels.catDiagnostics, path: "/services/diagnostics-planning" },
  { field: "therapyPrevention", label: seoLabels.catTherapy, path: "/services/therapy-prevention" },
  { field: "surgeryImplantation", label: seoLabels.catSurgery, path: "/services/surgery-implantation" },
  { field: "orthodontics", label: seoLabels.catOrthodontics, path: "/services/orthodontics" },
  { field: "aesthetic", label: seoLabels.catAesthetic, path: "/services/aesthetic" },
];

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export default async function KeywordsView({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult;
  const { payload, user } = req;

  /* Payload renders custom views inside the authenticated shell, but this
     component queries the database directly — so it checks for itself
     rather than trusting the wrapper. */
  if (!user) return null;

  /**
   * `locale: "all"`, and that is load-bearing.
   *
   * `localization.fallback` is on, so reading this global at `en` returns the
   * Georgian text wherever English is empty. That is right for the site — an
   * untranslated page shows Georgian rather than nothing — and wrong here:
   * it filled the English and Russian columns with the Georgian keyword and
   * made eleven undecided pages look finished. Since the blank cells are the
   * only reason to build this screen, the read has to be the raw one.
   *
   * It is also one query instead of three: `"all"` returns every localized
   * field as `{ ka, en, ru }`.
   */
  const seoAll = (await payload.findGlobal({
    slug: "seo",
    locale: "all",
    depth: 0,
  })) as unknown as Record<string, unknown>;

  const [posts, doctors, campaigns] = await Promise.all([
    payload.find({
      collection: "posts",
      locale: "all",
      depth: 0,
      limit: 200,
      sort: "-publishedAt",
      where: { _status: { equals: "published" } },
    }),
    payload.find({
      collection: "doctors",
      locale: "all",
      depth: 0,
      limit: 100,
      sort: "order",
      where: { published: { equals: true } },
    }),
    payload.find({
      collection: "landing-pages",
      locale: "all",
      depth: 0,
      limit: 200,
      sort: "-updatedAt",
    }),
  ]);

  /* `locale: "all"` returns every localized field as `{ ka, en, ru }`. */
  const perLocale = (value: unknown, pick: (v: unknown) => string) =>
    Object.fromEntries(
      locales.map((l) => [l, pick((value as Record<string, unknown> | null)?.[l])]),
    ) as Record<Locale, string>;

  const docRow = (
    doc: Record<string, unknown>,
    page: string,
    href: string,
    url: string,
  ): Row => {
    const keyword = perLocale(doc.focusKeyword, text);
    const title = perLocale(doc.metaTitle, text);
    return {
      page,
      href,
      url,
      keyword,
      hasTitle: Object.fromEntries(locales.map((l) => [l, Boolean(title[l])])),
    };
  };

  const seoRow = (field: string, label: string, path: string, inCategories: boolean): Row => {
    /* Under `locale: "all"` a group's own fields are the localized ones, so
       the shape is `home.focusKeyword.ka`, not `home.ka.focusKeyword`. */
    const parent = (
      inCategories
        ? (seoAll.categories as Record<string, unknown> | undefined)?.[field]
        : seoAll[field]
    ) as Record<string, unknown> | undefined;

    return {
      page: label,
      href: "/admin/globals/seo",
      url: path,
      keyword: perLocale(parent?.focusKeyword, text),
      hasTitle: Object.fromEntries(
        locales.map((l) => [l, Boolean(perLocale(parent?.title, text)[l])]),
      ),
    };
  };

  const groups: Group[] = [
    {
      title: t.groupFixed,
      note: t.groupFixedNote,
      rows: [
        ...SEO_ROUTES.map((r) => seoRow(r.field, r.label, r.path, false)),
        ...SEO_CATEGORIES.map((r) => seoRow(r.field, r.label, r.path, true)),
      ],
    },
    {
      title: t.groupPosts,
      note: t.groupPostsNote,
      rows: posts.docs.map((doc) => {
        const d = doc as unknown as Record<string, unknown>;
        const title = perLocale(d.title, text);
        return docRow(
          d,
          title.ka || title.en || title.ru || String(d.slug),
          `/admin/collections/posts/${d.id}`,
          `/news/${String(d.slug)}`,
        );
      }),
    },
    {
      title: t.groupDoctors,
      note: t.groupDoctorsNote,
      rows: doctors.docs.map((doc) => {
        const d = doc as unknown as Record<string, unknown>;
        const name = perLocale(d.name, text);
        return docRow(
          d,
          name.ka || name.en || name.ru || String(d.slug),
          `/admin/collections/doctors/${d.id}`,
          `/about/${String(d.slug)}`,
        );
      }),
    },
    {
      title: t.groupCampaigns,
      note: t.groupCampaignsNote,
      rows: campaigns.docs.map((doc) => {
        const d = doc as unknown as Record<string, unknown>;
        const seo = (d.seo ?? {}) as Record<string, unknown>;
        return {
          page: text(d.campaignName) || String(d.slug),
          href: `/admin/collections/landing-pages/${d.id}`,
          url: `/${String(d.slug)}`,
          keyword: perLocale(seo.focusKeyword, text),
          hasTitle: Object.fromEntries(
            locales.map((l) => [l, Boolean(perLocale(seo.metaTitle, text)[l])]),
          ),
        } as Row;
      }),
    },
  ];

  const allRows = groups.flatMap((g) => g.rows);
  const filled = allRows.filter((r) => (r.keyword.ka ?? "").length > 0).length;

  const cell: React.CSSProperties = {
    padding: "0.7rem 0.85rem",
    borderBottom: "1px solid var(--theme-elevation-100)",
    verticalAlign: "top",
    fontSize: "0.9rem",
    lineHeight: 1.45,
  };
  const head: React.CSSProperties = {
    ...cell,
    textAlign: "start",
    fontWeight: 600,
    fontSize: "0.75rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "var(--theme-elevation-500)",
    borderBottom: "1px solid var(--theme-elevation-200)",
  };
  const muted: React.CSSProperties = {
    color: "var(--theme-elevation-400)",
  };

  return (
    <div style={{ padding: "var(--gutter-h, 2rem)", maxWidth: "72rem", margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>{t.title}</h1>
      <p style={{ margin: "0 0 0.35rem", color: "var(--theme-elevation-600)", maxWidth: "48rem" }}>
        {t.intro}
      </p>
      <p style={{ margin: "0 0 2rem", color: "var(--theme-elevation-500)", maxWidth: "48rem", fontSize: "0.9rem" }}>
        {t.summary(filled, allRows.length)}
      </p>

      {groups.map((group) => (
        <section key={group.title} style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>
            {group.title}{" "}
            <span style={{ ...muted, fontWeight: 400, fontSize: "0.9rem" }}>
              ({group.rows.length})
            </span>
          </h2>
          <p style={{ margin: "0 0 0.9rem", ...muted, fontSize: "0.85rem" }}>{group.note}</p>

          {group.rows.length === 0 ? (
            <p style={{ ...muted, fontSize: "0.9rem" }}>{t.empty}</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...head, width: "26%" }}>{t.colPage}</th>
                    {locales.map((locale) => (
                      <th key={locale} style={head}>
                        {t.localeLabel[locale]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.href + row.page}>
                      <td style={cell}>
                        <Link
                          href={row.href}
                          style={{ color: "var(--theme-text)", textDecoration: "none", fontWeight: 500 }}
                        >
                          {row.page}
                        </Link>
                        {row.url !== undefined && (
                          <div style={{ ...muted, fontSize: "0.78rem", marginTop: "0.15rem" }}>
                            /ka{row.url}
                          </div>
                        )}
                      </td>
                      {locales.map((locale) => {
                        const keyword = row.keyword[locale];
                        return (
                          <td key={locale} style={cell}>
                            {keyword ? (
                              keyword
                            ) : (
                              <span style={muted} title={t.emptyCellHelp}>
                                —
                              </span>
                            )}
                            {/* Georgian only. Repeating this in all three
                                columns put the same grey line on the screen
                                forty times and buried the keywords it was
                                meant to sit beside — and Georgian is the
                                source language, so it is the one whose
                                missing title actually costs something. */}
                            {locale === "ka" && !row.hasTitle.ka && (
                              <div
                                style={{ ...muted, fontSize: "0.75rem", marginTop: "0.2rem" }}
                                title={t.noTitleHelp}
                              >
                                {t.noTitle}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <p
        style={{
          marginTop: "2.5rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--theme-elevation-100)",
          ...muted,
          fontSize: "0.85rem",
          maxWidth: "48rem",
        }}
      >
        {t.footnote}
      </p>
    </div>
  );
}
