/**
 * „სახელმძღვანელო“ — the last entry in the admin sidebar.
 *
 * The manual is a static page served from `public/manual.html`, opened in a
 * new tab rather than rendered inside the admin shell. That is deliberate:
 * the manual has its own sidebar, contents and search, and nesting it inside
 * Payload's own sidebar would put two navigations on one screen.
 *
 * The page carries `noindex` and `robots.ts` disallows it — it is staff
 * documentation, not a page for patients.
 *
 * Registered in `payload.config.ts` under `admin.components.afterNavLinks`,
 * which means `npm run generate:importmap` has to run after any change to
 * that path, or Payload will not find this file.
 */
export function ManualNavLink() {
  return (
    <a
      href="/manual.html"
      target="_blank"
      rel="noopener noreferrer"
      title="იხსნება ახალ ჩანართში"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--base, 8px)",
        marginTop: "calc(var(--base, 8px) * 2)",
        paddingTop: "calc(var(--base, 8px) * 2)",
        borderTop: "1px solid var(--theme-elevation-100)",
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
        <path d="M2 3.2A1.2 1.2 0 0 1 3.2 2H6a2 2 0 0 1 2 2v9a1.6 1.6 0 0 0-1.6-1.6H3.2A1.2 1.2 0 0 1 2 10.2Z" />
        <path d="M14 3.2A1.2 1.2 0 0 0 12.8 2H10a2 2 0 0 0-2 2v9a1.6 1.6 0 0 1 1.6-1.6h3.2A1.2 1.2 0 0 0 14 10.2Z" />
      </svg>
      სახელმძღვანელო
    </a>
  );
}

export default ManualNavLink;
