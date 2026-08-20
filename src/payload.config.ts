import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Doctors } from "./collections/Doctors";
import { AnalyticsAggregates } from "./collections/AnalyticsAggregates";
import { AuditLogs } from "./collections/AuditLogs";
import { Equipment } from "./collections/Equipment";
import { Faq } from "./collections/Faq";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Services } from "./collections/Services";
import { Users } from "./collections/Users";
import { ClinicInfo } from "./globals/ClinicInfo";
import { AnalyticsSettings } from "./globals/AnalyticsSettings";
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
           that is missing from it. */
        components: {
            graphics: {
                Logo: "/components/admin/Logo#Logo",
                Icon: "/components/admin/Icon#Icon",
            },
        },
    },

    /* Content first, plumbing last — this is the order of the admin
       sidebar, and an editor opens Posts far more often than Users.
       Services is declared before Equipment because Equipment holds a
       relationship into it. */
    collections: [Posts, Services, Equipment, Doctors, Faq, Media, Users, AnalyticsAggregates, AuditLogs],

    /* Settings rather than content — one document each, no list view. */
    globals: [ClinicInfo, Seo, AnalyticsSettings],

    editor: lexicalEditor(),

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
