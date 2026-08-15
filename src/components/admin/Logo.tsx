/**
 * The mark on the admin login screen.
 *
 * A plain `<img>` rather than `next/image`: this renders inside Payload's
 * own admin shell, which is not the site's layout and does not carry its
 * image configuration. The file is a small SVG served straight from
 * `public/`, so there is nothing for the optimiser to do anyway.
 */
export function Logo() {
  return (
    <img
      src="/brand/logo.svg"
      alt="Total Charm Dent"
      width={240}
      height={64}
      style={{ width: "auto", height: 64, maxWidth: "100%" }}
    />
  );
}

export default Logo;
