import type { Dictionary } from "@/i18n/dictionaries";

export const teamOrder = [
  "archil-apkhadze",
  "shorena-shioshvili",
  "nino-buluashvili",
  "salome-gabunia",
  "nino-osadze",
] as const;

export type TeamSlug = (typeof teamOrder)[number];

const photos: Record<TeamSlug, string> = {
  "archil-apkhadze": "/doctors/Archil-Apkhadze.webp",
  "shorena-shioshvili": "/doctors/shorena-shioshvili.webp",
  "nino-buluashvili": "/doctors/nino-buluashvili.webp",
  "salome-gabunia": "/doctors/salome-gabunia.webp",
  "nino-osadze": "/doctors/nino-osadze.webp",
};

export type Member = {
  slug: TeamSlug;
  name: string;
  role: string;
  photo: string;
};

export function getTeam(dict: Dictionary, options?: { excludeLead?: boolean }): Member[] {
  return teamOrder
    .filter((slug) => !(options?.excludeLead && slug === "archil-apkhadze"))
    .map((slug) => ({
      slug,
      name: dict.team.members[slug].name,
      role: dict.team.members[slug].role,
      photo: photos[slug],
    }));
}

export const leadPhoto = photos["archil-apkhadze"];
