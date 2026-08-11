import type { Dictionary } from "@/i18n/dictionaries";
import { serviceHref, serviceOrder, type ServiceSlug } from "./services";

/**
 * The clinic's equipment, as data.
 *
 * Same split as `services.ts`: everything that does not change between
 * locales lives here (model name, manufacturer, outbound link, photo,
 * which services the device serves), and the prose lives in
 * `technology.page.devices[slug]` in the dictionaries.
 *
 * Model names stay Latin in all three locales on purpose. "Vatech EzRay
 * Air" is the string a patient will find on the manufacturer's site and the
 * string search engines have indexed; transliterating it into Georgian or
 * Cyrillic breaks that match for no reader benefit. The old site did
 * transliterate one of them ("КТ Vatech") and it reads as a typo.
 */

export const deviceOrder = [
  "vatech-ezray-air",
  "vatech-cbct",
  "trios-3-move",
  "ems-airflow-master",
  "philips-zoom-4",
  "forestadent",
  "damon-ormco",
  "american-orthodontics",
] as const;

export type DeviceSlug = (typeof deviceOrder)[number];

/* --------------------------------------------------------------------------
   Four groups, ordered the way a treatment actually runs: you are
   diagnosed, then cleaned, then finished aesthetically. Orthodontics sits
   last because it is a parallel track rather than a step in that sequence.

   These are not the five `categoryOrder` directions from `services.ts`.
   Equipment does not map onto clinical directions one-to-one — the TRIOS
   scanner alone feeds diagnostics, aesthetics and orthodontics — so
   forcing the two taxonomies to share slugs would only invite someone to
   assume a relationship that is not there.
   -------------------------------------------------------------------------- */

export const deviceGroupOrder = [
  "diagnostics",
  "hygiene",
  "aesthetics",
  "orthodontics",
] as const;

export type DeviceGroupSlug = (typeof deviceGroupOrder)[number];

export type Manufacturer = { name: string; url: string };

type DeviceRecord = {
  group: DeviceGroupSlug;
  /** Model name as the manufacturer writes it. Never translated. */
  name: string;
  manufacturer: Manufacturer;
  /**
   * Photo slot under `public/equipment/`. Labelled stand-ins are committed
   * so the layout is real and swapping in a press photo is a single file
   * copy — see `docs/equipment-photos.md` for the source per device.
   */
  photo: string;
  /** True while `photo` is still a labelled stand-in rather than the real thing. */
  photoPending: boolean;
  /**
   * Services this device is actually used in. Drives the cross-links on the
   * card, so a patient reading about a scanner can jump straight to the
   * treatment it belongs to.
   */
  services: readonly ServiceSlug[];
};

const devices: Record<DeviceSlug, DeviceRecord> = {
  "vatech-ezray-air": {
    group: "diagnostics",
    name: "Vatech EzRay Air",
    manufacturer: { name: "Vatech", url: "https://www.vatech.com/" },
    photo: "/equipment/vatech-ezray-air.webp",
    photoPending: true,
    services: ["visiograph", "diagnostics"],
  },
  "vatech-cbct": {
    group: "diagnostics",
    name: "Vatech CBCT",
    manufacturer: { name: "Vatech", url: "https://www.vatech.com/" },
    photo: "/equipment/vatech-cbct.webp",
    photoPending: true,
    services: ["tomography", "diagnostics", "implantation"],
  },
  "trios-3-move": {
    group: "diagnostics",
    name: "3Shape TRIOS 3 Move+",
    manufacturer: { name: "3Shape", url: "https://www.3shape.com/" },
    photo: "/equipment/trios-3-move.webp",
    photoPending: true,
    services: ["digital-modelling", "veneers", "aligners"],
  },
  "ems-airflow-master": {
    group: "hygiene",
    name: "EMS AIRFLOW Prophylaxis Master Premium",
    manufacturer: { name: "EMS Dental", url: "https://www.ems-dental.com/" },
    photo: "/equipment/ems-airflow-master.webp",
    photoPending: true,
    services: ["periodontology", "therapy-adults", "therapy-children"],
  },
  "philips-zoom-4": {
    group: "aesthetics",
    name: "Philips Zoom WhiteSpeed (Zoom 4)",
    manufacturer: { name: "Philips", url: "https://www.philips.com/" },
    photo: "/equipment/philips-zoom-4.webp",
    photoPending: true,
    services: ["whitening"],
  },
  forestadent: {
    group: "orthodontics",
    name: "FORESTADENT",
    manufacturer: { name: "FORESTADENT", url: "https://www.forestadent.com/" },
    photo: "/equipment/forestadent.webp",
    photoPending: true,
    services: ["forestadent", "orthodontics"],
  },
  "damon-ormco": {
    group: "orthodontics",
    name: "Damon System",
    manufacturer: { name: "Ormco", url: "https://ormco.com/" },
    photo: "/equipment/damon-ormco.webp",
    photoPending: true,
    services: ["damon", "orthodontics"],
  },
  "american-orthodontics": {
    group: "orthodontics",
    name: "American Orthodontics",
    manufacturer: { name: "American Orthodontics", url: "https://americanortho.com/" },
    photo: "/equipment/american-orthodontics.webp",
    photoPending: true,
    services: ["orthodontics"],
  },
};

/**
 * TODO(client): the sterilisation line is named "Megalab" on the existing
 * site, but no manufacturer URL was verifiable. It is rendered as a closing
 * band without an outbound link rather than pointed at a guessed domain —
 * a wrong `sameAs` is worse than none, because structured data asserts it
 * as fact. Confirm the vendor and add it to `devices` if it should carry a
 * card of its own.
 */

/**
 * Fails at module load rather than at render if a device points at a
 * service that does not exist, or if a group ends up empty. Both are silent
 * failures otherwise: a bad service slug renders a link to nowhere, and an
 * empty group renders a heading with nothing under it.
 */
function assertEquipmentIsCoherent() {
  for (const slug of deviceOrder) {
    for (const service of devices[slug].services) {
      if (!(serviceOrder as readonly string[]).includes(service)) {
        throw new Error(`Device "${slug}" points at unknown service "${service}".`);
      }
    }
  }
  for (const group of deviceGroupOrder) {
    if (!deviceOrder.some((slug) => devices[slug].group === group)) {
      throw new Error(`Device group "${group}" has no devices.`);
    }
  }
}

assertEquipmentIsCoherent();

export type Device = {
  slug: DeviceSlug;
  name: string;
  manufacturer: Manufacturer;
  photo: string;
  photoPending: boolean;
  summary: string;
  body: string[];
  highlights: string[];
  services: { slug: ServiceSlug; title: string; href: string }[];
};

export type DeviceGroup = {
  slug: DeviceGroupSlug;
  title: string;
  lead: string;
  items: Device[];
};

export function getDevice(dict: Dictionary, lang: string, slug: DeviceSlug): Device {
  const record = devices[slug];
  const copy = dict.technology.page.devices[slug];

  return {
    slug,
    name: record.name,
    manufacturer: record.manufacturer,
    photo: record.photo,
    photoPending: record.photoPending,
    summary: copy.summary,
    body: copy.body,
    highlights: copy.highlights,
    services: record.services.map((service) => ({
      slug: service,
      title: dict.services.items[service].title,
      href: serviceHref(lang, service),
    })),
  };
}

export function getDeviceGroups(dict: Dictionary, lang: string): DeviceGroup[] {
  return deviceGroupOrder.map((group) => ({
    slug: group,
    title: dict.technology.page.groups[group].title,
    lead: dict.technology.page.groups[group].lead,
    items: deviceOrder
      .filter((slug) => devices[slug].group === group)
      .map((slug) => getDevice(dict, lang, slug)),
  }));
}

/**
 * Distinct manufacturers, in first-appearance order. Vatech supplies two of
 * the devices, so a naive map over `deviceOrder` would list it twice.
 *
 * This replaced the hand-kept `site.brands` array: the outbound links and
 * the equipment they refer to were two lists that had to be edited
 * together, and one of them was already missing Vatech, 3Shape and EMS.
 */
export function getManufacturers(): Manufacturer[] {
  const seen = new Map<string, Manufacturer>();
  for (const slug of deviceOrder) {
    const { manufacturer } = devices[slug];
    if (!seen.has(manufacturer.url)) seen.set(manufacturer.url, manufacturer);
  }
  return [...seen.values()];
}
