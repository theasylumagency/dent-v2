/**
 * Frozen snapshot of the equipment structure.
 *
 * `src/lib/equipment.ts` now queries Payload, so the seed reads the shape of
 * the initial catalogue from here instead. Text still comes from the
 * dictionaries, which have not been stripped yet.
 *
 * As with the posts snapshot: this file is a bootstrap for an empty database,
 * not the live content. After seeding, edits belong in the admin panel.
 */

export type SeedDevice = {
  slug: string;
  name: string;
  group: "diagnostics" | "hygiene" | "aesthetics" | "orthodontics";
  manufacturerName: string;
  manufacturerUrl: string;
  photo: string;
  /** Service slugs this device is used in. */
  services: string[];
};

export const seedEquipment: SeedDevice[] = [
  {
    slug: "vatech-ezray-air",
    name: "Vatech EzRay Air",
    group: "diagnostics",
    manufacturerName: "Vatech",
    manufacturerUrl: "https://www.vatech.com/",
    photo: "/equipment/vatech-ezray-air.webp",
    services: ["visiograph", "diagnostics"],
  },
  {
    slug: "vatech-cbct",
    name: "Vatech CBCT",
    group: "diagnostics",
    manufacturerName: "Vatech",
    manufacturerUrl: "https://www.vatech.com/",
    photo: "/equipment/vatech-cbct.webp",
    services: ["tomography", "diagnostics", "implantation"],
  },
  {
    slug: "trios-3-move",
    name: "3Shape TRIOS 3 Move+",
    group: "diagnostics",
    manufacturerName: "3Shape",
    manufacturerUrl: "https://www.3shape.com/",
    photo: "/equipment/trios-3-move.webp",
    services: ["digital-modelling", "veneers", "aligners"],
  },
  {
    slug: "ems-airflow-master",
    name: "EMS AIRFLOW Prophylaxis Master Premium",
    group: "hygiene",
    manufacturerName: "EMS Dental",
    manufacturerUrl: "https://www.ems-dental.com/",
    photo: "/equipment/ems-airflow-master.webp",
    services: ["periodontology", "therapy-adults", "therapy-children"],
  },
  {
    slug: "philips-zoom-4",
    name: "Philips Zoom WhiteSpeed (Zoom 4)",
    group: "aesthetics",
    manufacturerName: "Philips",
    manufacturerUrl: "https://www.philips.com/",
    photo: "/equipment/philips-zoom-4.webp",
    services: ["whitening"],
  },
  {
    slug: "forestadent",
    name: "FORESTADENT",
    group: "orthodontics",
    manufacturerName: "FORESTADENT",
    manufacturerUrl: "https://www.forestadent.com/",
    photo: "/equipment/forestadent.webp",
    services: ["forestadent", "orthodontics"],
  },
  {
    slug: "damon-ormco",
    name: "Damon System",
    group: "orthodontics",
    manufacturerName: "Ormco",
    manufacturerUrl: "https://ormco.com/",
    photo: "/equipment/damon-ormco.webp",
    services: ["damon", "orthodontics"],
  },
  {
    slug: "american-orthodontics",
    name: "American Orthodontics",
    group: "orthodontics",
    manufacturerName: "American Orthodontics",
    manufacturerUrl: "https://americanortho.com/",
    photo: "/equipment/american-orthodontics.webp",
    services: ["orthodontics"],
  },
];
