import type { Locale } from "@/i18n/config";
import { cms, mediaAlt, mediaUrl, toBlocks, toStrings } from "./cms";
import type { Block } from "./news-shared";
import { serviceHref, type CategorySlug } from "./services-shared";

/**
 * The clinic's equipment, read from Payload's `equipment` collection.
 *
 * The exported shapes are unchanged from the version that held the catalogue
 * inline, so `Technology.tsx` and `DeviceCard.tsx` only had to start awaiting
 * these functions.
 *
 * Model names are still not localised — that decision now lives in the
 * collection (`name` has no `localized: true`) rather than in a comment here.
 * The reasoning is the same: "Vatech EzRay Air" is the string the
 * manufacturer and the search index both use.
 */

export const deviceGroupOrder = ["diagnostics", "hygiene", "aesthetics", "orthodontics"] as const;
export type DeviceGroupSlug = (typeof deviceGroupOrder)[number];

export type Manufacturer = { name: string; url: string };

type DevicePhotoFit = "contain" | "cover";

export type Device = {
  slug: string;
  group: DeviceGroupSlug;
  name: string;
  manufacturer: Manufacturer;
  photo: string;
  photoAlt: string;
  photoPending: boolean;
  photoFit: DevicePhotoFit;
  summary: string;
  body: Block[];
  highlights: string[];
  services: { slug: string; title: string; href: string }[];
};

export type DeviceGroup = {
  slug: DeviceGroupSlug;
  title: string;
  lead: string;
  items: Device[];
};

type EquipmentDoc = {
  slug: string;
  name: string;
  group: DeviceGroupSlug;
  manufacturerName: string;
  manufacturerUrl: string;
  photo?: unknown;
  photoPending?: boolean;
  summary: string;
  body?: unknown;
  highlights?: unknown;
  services?: unknown;
};

/* Real local product photography can replace a seeded CMS placeholder
   without waiting for every deployed database to be reseeded. The TRIOS
   image is a full-frame editorial shot, so it fills the card rather than
   inheriting the padding used for transparent product cut-outs. */
const localPhotoOverrides: Partial<
  Record<string, { src: string; fit: DevicePhotoFit }>
> = {
  "trios-3-move": {
    src: "/images/home/technology/trios-3-move.webp",
    fit: "cover",
  },
};

/** A relationship comes back as an id or a populated doc, depending on depth. */
function relatedServices(value: unknown, lang: Locale) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry): entry is { slug: string; title: string; category: CategorySlug } =>
      Boolean(entry && typeof entry === "object" && "slug" in entry),
    )
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      /* The category comes from the populated document — it decides which
         page the anchor lives on, and it is an editor's field now. */
      href: serviceHref(lang, entry.slug, entry.category),
    }));
}

async function findDevices(lang: Locale): Promise<Device[]> {
  const payload = await cms();

  const result = await payload.find({
    collection: "equipment",
    locale: lang,
    /* 2, so the `services` relationship arrives populated with its title —
       the device card links to each service by name. */
    depth: 2,
    limit: 200,
    sort: "order",
  });

  return (result.docs as unknown as EquipmentDoc[]).map((doc) => {
    const photoOverride = localPhotoOverrides[doc.slug];

    return {
      slug: doc.slug,
      group: doc.group,
      name: doc.name,
      manufacturer: { name: doc.manufacturerName, url: doc.manufacturerUrl },
      photo: photoOverride?.src ?? mediaUrl(doc.photo),
      photoAlt: mediaAlt(doc.photo, `${doc.name} — ${doc.manufacturerName}`),
      photoPending: photoOverride ? false : Boolean(doc.photoPending),
      photoFit: photoOverride?.fit ?? "contain",
      summary: doc.summary,
      body: toBlocks(doc.body, lang),
      highlights: toStrings(doc.highlights),
      services: relatedServices(doc.services, lang),
    };
  });
}

export async function getDeviceGroups(
  groupCopy: Record<DeviceGroupSlug, { title: string; lead: string }>,
  lang: Locale,
): Promise<DeviceGroup[]> {
  const devices = await findDevices(lang);

  return (
    deviceGroupOrder
      .map((group) => ({
        slug: group,
        title: groupCopy[group].title,
        lead: groupCopy[group].lead,
        items: devices.filter((device) => device.group === group),
      }))
      /* A group with nothing in it renders a heading over empty space. An
         editor can leave a group unused, so this is handled here rather than
         asserted at module load as it was when the list lived in code. */
      .filter((group) => group.items.length > 0)
  );
}

/**
 * The five devices the home page shows, in the order it shows them.
 *
 * An editorial choice, and deliberately a commit rather than a checkbox —
 * same reasoning as `categoryOrder` in `services-shared.ts`. Which
 * machines carry the home page is a decision about what the page argues,
 * and the first slug in this list is the one that gets the large tile.
 *
 * Chosen for what a patient half-recognises and finds reassuring, not for
 * what is clinically most important: a CBCT scanner and an intraoral
 * scanner read as "serious equipment" to someone who cannot evaluate
 * either. The bracket systems are deliberately absent — three boxes of
 * brackets photograph as three boxes.
 *
 * Missing slugs are skipped rather than throwing, and the list is topped
 * up from the catalogue if it comes back short, so renaming a device in
 * the CMS degrades to a different device on the home page instead of an
 * empty section.
 */
export const homeShowcase = [
  "vatech-cbct",
  "trios-3-move",
  "philips-zoom-4",
  "ems-airflow-master",
  "vatech-ezray-air",
] as const;

const SHOWCASE_COUNT = 5;

export async function getShowcaseDevices(lang: Locale): Promise<Device[]> {
  const devices = await findDevices(lang);
  const bySlug = new Map(devices.map((device) => [device.slug, device]));

  const picked = homeShowcase
    .map((slug) => bySlug.get(slug))
    .filter((device): device is Device => Boolean(device));

  if (picked.length >= SHOWCASE_COUNT) return picked.slice(0, SHOWCASE_COUNT);

  const chosen = new Set(picked.map((device) => device.slug));
  const filler = devices.filter((device) => !chosen.has(device.slug));
  return [...picked, ...filler].slice(0, SHOWCASE_COUNT);
}

export async function getDeviceCount(): Promise<number> {
  const payload = await cms();
  const result = await payload.count({ collection: "equipment" });
  return result.totalDocs;
}

/**
 * Distinct manufacturers, in catalogue order. Two devices share Vatech, so a
 * naive map would list it twice.
 */
export async function getManufacturers(lang: Locale): Promise<Manufacturer[]> {
  const devices = await findDevices(lang);
  const seen = new Map<string, Manufacturer>();
  for (const device of devices) {
    if (!seen.has(device.manufacturer.url)) seen.set(device.manufacturer.url, device.manufacturer);
  }
  return [...seen.values()];
}
