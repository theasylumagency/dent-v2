import { postgresAdapter } from "@payloadcms/db-postgres";
import {
    BoldFeature,
    FixedToolbarFeature,
    HeadingFeature,
    InlineToolbarFeature,
    ItalicFeature,
    lexicalEditor,
    LinkFeature,
    OrderedListFeature,
    ParagraphFeature,
    UnorderedListFeature,
} from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { keywords as keywordLabels } from "./admin/labels";
import { payloadKa } from "./admin/payload-ka";
import { AnalyticsAggregates } from "./collections/AnalyticsAggregates";
import { AuditLogs } from "./collections/AuditLogs";
import { BookingRequests } from "./collections/BookingRequests";
import { Cases } from "./collections/Cases";
import { Doctors } from "./collections/Doctors";
import { Equipment } from "./collections/Equipment";
import { Faq } from "./collections/Faq";
import { LandingPages } from "./collections/LandingPages";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Services } from "./collections/Services";
import { Users } from "./collections/Users";
import { AnalyticsSettings } from "./globals/AnalyticsSettings";
import { BookingSettings } from "./globals/BookingSettings";
import { ClinicInfo } from "./globals/ClinicInfo";
import { Seo } from "./globals/Seo";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * A missing value here is a broken deployment, not a default to paper over.
 * Both of these are read while this module evaluates, so the error surfaces
 * at boot with the variable's name in it — see `.env.example`.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `${name} is not set. Copy .env.example to .env.local (development) or set it in the server environment (production).`,
        );
    }
    return value;
}

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },

        /* Browser tab and favicon. Without this the admin shows Payload's
           own mark, which is confusing for a clinic employee who was told to
           log in to "the site". */
        meta: {
            titleSuffix: " · Total Charm Dent",
            icons: [{ rel: "icon", type: "image/svg+xml", url: "/brand/icon.svg" }],
        },

        /* Paths are resolved against `importMap.baseDir` above, so they
           start at `src/`. Run `npm run generate:importmap` after changing
           them — Payload compiles this list into
           `app/(payload)/admin/importMap.js` and will not find a component
           that is missing from it.

           `YesNoCell` is referenced from the field configs rather than here
           (`admin.components.Cell` on the checkbox fields in Doctors and
           Equipment), but the same rule applies to it. */
        components: {
            graphics: {
                Logo: "/components/admin/Logo#Logo",
                Icon: "/components/admin/Icon#Icon",
            },

            /* Two entries under the four groups.
               „საკვანძო სიტყვები“ is a read-only view over the SEO fields of
               every page — see `KeywordsView` for why it is a screen of its
               own rather than a column somewhere.
               „სახელმძღვანელო“ is `public/manual.html`, opened in its own tab:
               it carries its own contents and search, so it is a page, not a
               panel screen. `robots.ts` disallows it and it sets `noindex`. */
            afterNavLinks: [
                "/components/admin/KeywordsNavLink#KeywordsNavLink",
                "/components/admin/ManualNavLink#ManualNavLink",
            ],

            /* `/admin/keywords`. A custom view, not a collection: it owns no
               data and writes nothing — every row links back to the document
               that holds the value. */
            views: {
                keywords: {
                    Component: "/components/admin/KeywordsView#default",
                    path: "/keywords",
                    meta: { title: keywordLabels.title },
                },
            },
        },
    },

    /**
     * The admin panel speaks Georgian.
     *
     * Payload ships 43 languages and Georgian is not among them — and it
     * cannot be added, because `AcceptedLanguages` is a closed union in
     * `@payloadcms/translations`. What *is* supported is overriding an
     * existing language's dictionary, so the panel stays on "English" and
     * that English is written in Georgian. The strings live in
     * `src/admin/payload-ka.ts`; everything this project names itself —
     * collections, fields, groups — lives in `src/admin/labels.ts`.
     *
     * `fallbackLanguage: "en"` is what makes a browser set to Georgian land
     * here rather than on a half-translated other language.
     *
     * A browser set to one of Payload's real 43 (Russian, most plausibly
     * here) still gets that language. If the clinic ever needs Georgian
     * enforced for everyone regardless of browser, add:
     *
     *     import { en } from "@payloadcms/translations/languages/en";
     *     …
     *     supportedLanguages: { en },
     */
    i18n: {
        fallbackLanguage: "en",
        translations: { en: payloadKa },
    },

    /**
     * Sidebar order.
     *
     * This array is the nav, twice over: it sets the order of entries inside
     * a group, and — because Payload creates a group the first time it meets
     * one — the order of the groups themselves. Globals are appended after
     * collections, so a global always lands at the end of whichever group it
     * joins.
     *
     * Every entry declares `admin.group`. That is not tidiness: an entry
     * without one falls into Payload's built-in "Collections" / "Globals"
     * buckets, which always render first. One omission is enough to put an
     * English heading back at the top of the panel.
     *
     * Services stays declared before Equipment, which holds a relationship
     * into it.
     */
    collections: [
        /* ყოველდღიური — the screen the clinic opens every day, first. */
        BookingRequests,

        /* საიტის შიგთავსი */
        Posts,
        Services,
        Doctors,
        /* After Doctors, which it holds a relationship into — the same
           reason Services is declared before Equipment. */
        Cases,
        Equipment,
        Faq,
        Media,

        /* მარკეტინგი */
        LandingPages,
        AnalyticsAggregates,

        /* პარამეტრები */
        Users,
        AuditLogs,
    ],

    /* Settings rather than content — one document each, no list view.
       ClinicInfo joins the content group and Seo the marketing one; only the
       last two are actually administrator territory. */
    globals: [ClinicInfo, Seo, BookingSettings, AnalyticsSettings],

    /**
     * The toolbar is trimmed to exactly what `toBlocks` in `lib/cms.ts`
     * renders — nothing more, nothing less.
     *
     * A button that produces nothing on the page is worse than a missing
     * one: the editor uses it, sees it in the preview, publishes, and the
     * work is gone with no error anywhere. Payload's default set offers
     * fourteen block-level features; the converter handled two, so
     * checklists, quotes, inline images, alignment and horizontal rules
     * were all silently dropped. Rather than teach the renderer five more
     * shapes this site's design has no style for, the toolbar now offers
     * the six things it does render.
     *
     * **Headings are H2 and H3 only, and that is deliberate.** Every page
     * already carries exactly one H1 from its own template — the hero, the
     * page hero, or the article title. An H1 typed into body text would
     * give the page a second one, which is precisely the outline damage
     * that heading control was asked for in order to prevent. H4–H6 are
     * left out because the design has two subheading sizes; a third would
     * look identical to the second while claiming a different rank.
     *
     * The level chosen here is relative, not final: `components/ui/RichText`
     * shifts it to sit under whatever heading the surrounding page has
     * already used, so the same bio is H4/H5 in a team profile and H2/H3 in
     * an article.
     *
     * Adding a feature here means adding a case to `toBlocks`, and a style
     * to `RichText`. The three move together.
     */
    editor: lexicalEditor({
        features: () => [
            ParagraphFeature(),
            HeadingFeature({ enabledHeadingSizes: ["h2", "h3"] }),
            BoldFeature(),
            ItalicFeature(),
            UnorderedListFeature(),
            OrderedListFeature(),
            LinkFeature(),

            /* Both toolbars, not just the floating one. Payload ships the
               inline toolbar alone — it appears only once text is already
               selected, which is a discoverability problem for anyone who
               does not already know the feature is there. The client asked
               to be given heading control that the editor has had all
               along; a toolbar visible before you select anything is most
               of what that request was actually about. */
            FixedToolbarFeature(),
            InlineToolbarFeature(),
        ],
    }),

    localization: {
        locales: [
            {
                label: "ქართული",
                code: "ka",
            },
            {
                label: "English",
                code: "en",
            },
            {
                label: "Русский",
                code: "ru",
            },
        ],
        defaultLocale: "ka",
        fallback: true,
    },

    /* Fails loudly rather than falling back to "".
       An empty secret does not stop Payload from booting — it signs every
       admin session token with a value an attacker can guess in one try, on
       a site whose admin panel is public. The old `|| ""` turned a missing
       environment variable into a silent authentication bypass, which is the
       one failure mode that must never be quiet. */
    secret: requireEnv("PAYLOAD_SECRET"),

    db: postgresAdapter({
        pool: {
            connectionString: requireEnv("DATABASE_URL"),
        },
    }),

    typescript: {
        outputFile: path.resolve(dirname, "payload-types.ts"),
    },

    sharp,
});
