/**
 * Frozen snapshot of the service catalogue structure.
 *
 * Order is the order the clinic's original site listed them in; `category`
 * is the clinical direction each belongs to. Text still comes from the
 * dictionaries. As with the other snapshots: a bootstrap for an empty
 * database, not the live content.
 */

export type SeedService = {
  slug: string;
  category:
    | "diagnostics-planning"
    | "therapy-prevention"
    | "surgery-implantation"
    | "orthodontics"
    | "aesthetic";
};

export const seedServices: SeedService[] = [
  { slug: "diagnostics", category: "diagnostics-planning" },
  { slug: "therapy-adults", category: "therapy-prevention" },
  { slug: "therapy-children", category: "therapy-prevention" },
  { slug: "surgery", category: "surgery-implantation" },
  { slug: "implantation", category: "surgery-implantation" },
  { slug: "periodontology", category: "therapy-prevention" },
  { slug: "orthodontics", category: "orthodontics" },
  { slug: "aligners", category: "orthodontics" },
  { slug: "veneers", category: "aesthetic" },
  { slug: "digital-modelling", category: "diagnostics-planning" },
  { slug: "forestadent", category: "orthodontics" },
  { slug: "damon", category: "orthodontics" },
  { slug: "whitening", category: "aesthetic" },
  { slug: "tomography", category: "diagnostics-planning" },
  { slug: "restoration", category: "aesthetic" },
  { slug: "visiograph", category: "diagnostics-planning" },
];
