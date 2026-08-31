import Link from "next/link";

/**
 * „საკვანძო სიტყვები“ — sidebar entry for the overview screen.
 *
 * It sits in `afterNavLinks` rather than inside the „მარკეტინგი“ group, next
 * to „Google-ის ტექსტები“ where it belongs conceptually. Payload builds its
 * nav groups from collections and globals only, and this is neither — it is
 * a read-only view over both. `afterNavLinks` is the one place a custom view
 * can appear at all.
 *
 * Rendered above `ManualNavLink`, which carries the separator that closes
 * the sidebar.
 *
 * Registered in `payload.config.ts` under `admin.components.afterNavLinks`,
 * which means `npm run generate:importmap` has to run after any change to
 * that path, or Payload will not find this file.
 */
export function KeywordsNavLink() {
  return (
    <Link
      href="/admin/keywords"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--base, 8px)",
        marginTop: "calc(var(--base, 8px) * 2)",
        color: "var(--theme-elevation-600)",
        textDecoration: "none",
        fontSize: "1rem",
        lineHeight: 1.4,
      }}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flex: "none" }}
      >
        <circle cx="7" cy="7" r="4.5" />
        <path d="M10.4 10.4 14 14" />
      </svg>
      საკვანძო სიტყვები
    </Link>
  );
}

export default KeywordsNavLink;
