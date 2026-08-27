import path from "path";
import { fileURLToPath } from "url";
import type { CollectionConfig } from "payload";

import { groups, media as t } from "@/admin/labels";

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

    labels: { singular: t.singular, plural: t.plural },

    access: {
        read: () => true,
    },

    admin: {
        group: groups.content,
        useAsTitle: "internalName",
        /* `filename` first, because for an upload collection Payload renders
           that column as the image itself. A picture library listed as rows
           of text is a picture library nobody browses — the previous default
           showed name, alt and caption and not one thumbnail. */
        defaultColumns: ["filename", "internalName", "alt", "updatedAt"],
        description: t.description,
    },

    hooks: {
        /**
         * Never leave an upload nameless.
         *
         * `internalName` is what the list view and every relationship picker
         * show, and it was optional — so an upload made in a hurry appeared
         * as a bare id in the media library and as nothing at all in the
         * dropdown where a doctor's photo is chosen. Falling back to the
         * file name is not a great title, but it is always better than none,
         * and the editor can still overwrite it.
         */
        beforeChange: [
            ({ data }) => {
                const named = typeof data.internalName === "string" && data.internalName.trim();
                if (named) return data;

                const filename = typeof data.filename === "string" ? data.filename : "";
                if (!filename) return data;

                return { ...data, internalName: filename.replace(/\.[^.]+$/, "") };
            },
        ],
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
            label: t.internalName,
            required: false,
            admin: { description: t.internalNameHelp },
        },
        {
            name: "alt",
            type: "text",
            label: t.alt,
            localized: true,
            required: true,
            admin: { description: t.altHelp },
        },
        {
            name: "caption",
            type: "text",
            label: t.caption,
            localized: true,
            required: false,
            admin: { description: t.captionHelp },
        },
    ],
};
