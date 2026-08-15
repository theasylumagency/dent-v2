import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig } from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where uploaded files land.
 *
 * **Outside the repository, deliberately.** `public/` is tracked by git and
 * gets overwritten on every deploy, so anything the client uploaded there
 * would vanish the next time we shipped. `MEDIA_DIR` lets the VPS point at
 * a persistent path (`/var/www/dentv2-media`) that sits outside the deploy
 * and can be backed up on its own schedule.
 *
 * The local default is `<repo>/media`, which is gitignored — fine for
 * development, and it fails loudly in the right way if someone forgets to
 * set `MEDIA_DIR` in production, because the folder simply starts empty
 * rather than silently mixing uploads into the build output.
 */
const staticDir = process.env.MEDIA_DIR || path.resolve(dirname, "../../media");

export const Media: CollectionConfig = {
    slug: "media",

    access: {
        read: () => true,
    },

    admin: {
        useAsTitle: "internalName",
        description:
            "Photographs and images used across the site. Brand assets — the logo, icons and the hero video — deliberately stay in the codebase: they change with the design, not with the content.",
    },

    upload: {
        staticDir,
        mimeTypes: ["image/*"],

        /* Generated once on upload rather than on every request. The names
           match how the images are actually used, so a card never has to
           download a 1600px original to render at 400. */
        imageSizes: [
            { name: "thumbnail", width: 480, height: undefined, position: "centre" },
            { name: "card", width: 900, height: undefined, position: "centre" },
            { name: "wide", width: 1600, height: undefined, position: "centre" },
        ],

        /* Portraits are cropped to 4:5 and devices to 4:3 in the layout;
           a focal point lets the editor decide what survives the crop
           instead of leaving it to the centre of the frame. */
        focalPoint: true,

        formatOptions: {
            format: "webp",
            options: { quality: 82 },
        },
    },

    fields: [
        {
            name: "internalName",
            type: "text",
            required: false,
            admin: {
                description: "For finding it in the library. Not shown on the site.",
            },
        },
        {
            name: "alt",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description:
                    "Describe what is in the picture, for screen readers and image search. Not a caption — 'Nino Osadze, prosthodontist', not 'doctor photo'.",
            },
        },
        {
            name: "caption",
            type: "text",
            localized: true,
            required: false,
        },
    ],
};
