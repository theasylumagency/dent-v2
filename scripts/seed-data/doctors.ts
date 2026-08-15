/**
 * Frozen snapshot of the team structure.
 *
 * `src/lib/team.ts` now queries Payload. Text still comes from the
 * dictionaries; what lives here is the shape — who exists, in what order,
 * which photo, and whether their profile is ready to publish.
 *
 * `published: false` is Nino Buluashvili's outstanding profile. See
 * `docs/team-profiles.md` for the questions still open with the clinic.
 */

export type SeedDoctor = {
  slug: string;
  photo: string;
  isLead: boolean;
  published: boolean;
};

export const seedDoctors: SeedDoctor[] = [
  { slug: "archil-apkhadze", photo: "/doctors/Archil-Apkhadze.webp", isLead: true, published: true },
  {
    slug: "shorena-shioshvili",
    photo: "/doctors/shorena-shioshvili.webp",
    isLead: false,
    published: true,
  },
  {
    slug: "nino-buluashvili",
    photo: "/doctors/nino-buluashvili.webp",
    isLead: false,
    published: false,
  },
  { slug: "salome-gabunia", photo: "/doctors/salome-gabunia.webp", isLead: false, published: true },
  { slug: "nino-osadze", photo: "/doctors/nino-osadze.webp", isLead: false, published: true },
];
