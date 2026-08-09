import "server-only";
import type { Locale } from "./config";

/**
 * NOTE: do not add a `satisfies` clause here - it would contextually type the
 * loaders and collapse the inferred dictionary shape to `unknown`.
 */
const dictionaries = {
  ka: () => import("./dictionaries/ka.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
};

/** The Georgian dictionary is the source of truth for the shape. */
export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ka"]>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = dictionaries[locale];
  return load() as Promise<Dictionary>;
}
