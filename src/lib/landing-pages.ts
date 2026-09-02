import "server-only";

import { cache } from "react";

import type { Doctor, LandingPage, Media, Service } from "@/payload-types";
import type { Locale } from "@/i18n/config";
import { cms } from "./cms";
import { mediaUrl } from "./media";

export type LandingMediaAsset = {
  url: string;
  width: number;
  height: number;
  alt: string;
  objectPosition: string;
};

function isDocument<T extends { id: number }>(value: number | T | null | undefined): value is T {
  return Boolean(value && typeof value === "object" && "id" in value);
}

export const getLandingPage = cache(
  async (slug: string, locale: Locale): Promise<LandingPage | null> => {
    const payload = await cms();
    const result = await payload.find({
      collection: "landing-pages",
      locale,
      depth: 2,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      where: { slug: { equals: slug } },
    });

    return result.docs[0] ?? null;
  },
);

/** Current public routes to prerender. New slugs still render on demand. */
export async function getLandingPageSlugs(): Promise<string[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "landing-pages",
    locale: "ka",
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    select: { slug: true },
    where: { status: { not_equals: "draft" } },
  });

  return result.docs.map((doc) => doc.slug);
}

/** Only active pages explicitly approved for organic discovery enter sitemap. */
export async function getIndexableLandingPages(): Promise<
  Pick<LandingPage, "slug" | "updatedAt">[]
> {
  const payload = await cms();
  const result = await payload.find({
    collection: "landing-pages",
    locale: "ka",
    depth: 0,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    select: { slug: true, updatedAt: true },
    where: {
      and: [{ status: { equals: "active" } }, { indexable: { equals: true } }],
    },
  });

  return result.docs;
}

export function populatedMedia(value: number | Media | null | undefined): Media | null {
  return isDocument(value) ? value : null;
}

export function populatedDoctor(value: number | Doctor | null | undefined): Doctor | null {
  return isDocument(value) ? value : null;
}

export function populatedService(value: number | Service | null | undefined): Service | null {
  return isDocument(value) ? value : null;
}

export function populatedRedirect(value: number | LandingPage | null | undefined): LandingPage | null {
  return isDocument(value) ? value : null;
}

/**
 * Pick an upload derivative that is already close to its rendered size.
 * Next Image can then create the final responsive srcset without first
 * fetching a multi-megapixel original from Payload.
 */
export function landingMediaAsset(
  value: number | Media | null | undefined,
  preferred: "wide" | "card" = "wide",
): LandingMediaAsset | null {
  const media = populatedMedia(value);
  if (!media) return null;

  const size = media.sizes?.[preferred];
  const url = mediaUrl(media, size?.url);
  const width = size?.width || media.width || 0;
  const height = size?.height || media.height || 0;
  if (!url || !width || !height) return null;

  const focalX = typeof media.focalX === "number" ? media.focalX : 50;
  const focalY = typeof media.focalY === "number" ? media.focalY : 50;

  return {
    url,
    width,
    height,
    alt: media.alt,
    objectPosition: `${focalX}% ${focalY}%`,
  };
}
