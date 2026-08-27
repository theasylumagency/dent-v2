/**
 * A checkbox column that reads as an answer, not as a data type.
 *
 * Payload renders a `checkbox` field in the list view as the literal strings
 * `true` and `false`. In the doctors list those two columns decide whether a
 * profile is on the site at all, and "false" is not what a receptionist reads
 * as "hidden" — it is what a developer reads as a boolean.
 *
 * Registered per field via `admin.components.Cell`. After adding or moving
 * this file run `npm run generate:importmap`: Payload compiles the component
 * list into `app/(payload)/admin/importMap.js` and silently renders nothing
 * for a component that is missing from it.
 */
export function YesNoCell({ cellData }: { cellData?: unknown }) {
  const on = Boolean(cellData);

  return (
    <span
      aria-label={on ? "კი" : "არა"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "999px",
        fontSize: "0.9rem",
        lineHeight: 1,
        /* Deliberately not red for "off": an unpublished doctor is a normal
           working state, not an error. Muted reads as "not yet". */
        background: on ? "rgba(56, 161, 105, 0.16)" : "transparent",
        color: on ? "#38A169" : "var(--theme-elevation-400)",
      }}
    >
      {on ? "✓" : "—"}
    </span>
  );
}

export default YesNoCell;
