/**
 * The small mark in the admin sidebar, beside the collection list.
 *
 * Payload renders this at roughly 20–24px, so it uses the compact
 * `brand/icon.svg` rather than the full wordmark — the logo reduced to that
 * size becomes an illegible smudge.
 */
export function Icon() {
  return (
    <img
      src="/brand/icon.svg"
      alt="Total Charm Dent"
      width={24}
      height={24}
      style={{ width: 24, height: 24 }}
    />
  );
}

export default Icon;
