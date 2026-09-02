/**
 * An upload relationship may be an id, a populated document or missing.
 * Use the media record's edit time for both originals and derivatives:
 * replacing a file under the same name must change Next Image's cache key.
 * Page revalidation alone does not invalidate optimized image bytes.
 */
export function mediaUrl(value: unknown, derivativeUrl?: string | null): string {
  if (!value || typeof value !== "object") return "";

  const media = value as { url?: unknown; updatedAt?: unknown };
  const url = derivativeUrl || String(media.url ?? "");
  if (!url || typeof media.updatedAt !== "string" || !media.updatedAt) return url;

  const [source, fragment] = url.split("#", 2);
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${encodeURIComponent(media.updatedAt)}${fragment ? `#${fragment}` : ""}`;
}
