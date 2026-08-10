/**
 * Service and category icons.
 *
 * Drawn for this project on a 24px grid at stroke-width 1.5, matching the
 * UI icons in `ui/icons.tsx` (16px grid, 1.1) so the two sets read as one
 * family. They replace the supplied illustration set, which is beautiful
 * but drawn for ~200px display: at the 80px a card gives it, its 2px
 * hairlines resolve to under half a pixel, and thickening them enough to
 * survive destroys the delicacy that made them worth having. Those files
 * are better used large — a service detail page hero, for instance.
 *
 * Everything here is stroke-only and uses `currentColor`, so colour,
 * hover and size are controlled entirely from CSS.
 */

const TOOTH =
  "M8.6 3.1C6.1 3.1 4.4 5 4.4 7.7c0 1.5.4 2.8 1 4 .4.8.6 1.7.7 2.6.2 1.8.5 3.5 1.2 5.1.5 1.1 1.6 1.1 2.1 0 .5-1.2.8-2.4 1-3.7.2-.9.5-1.8.9-2.5.4-.7 1.3-.7 1.7 0 .4.7.7 1.6.9 2.5.2 1.3.5 2.5 1 3.7.5 1.1 1.6 1.1 2.1 0 .7-1.6 1-3.3 1.2-5.1.1-.9.3-1.8.7-2.6.6-1.2 1-2.5 1-4 0-2.7-1.7-4.6-4.2-4.6-1.4 0-2.3.6-3.4.6s-2-.6-3.4-.6z";

/** Crown only — used where a gum line has to sit under the tooth. */
const CROWN =
  "M8.9 4.6C7 4.6 5.7 6 5.7 8c0 1.1.3 2.1.8 3 .3.6.4 1.3.5 1.9.1 1.1.3 2.2.8 3.2h8.4c.5-1 .7-2.1.8-3.2.1-.6.2-1.3.5-1.9.5-.9.8-1.9.8-3 0-2-1.3-3.4-3.2-3.4-1 0-1.7.4-2.6.4s-1.6-.4-2.6-.4z";

const SHIELD = "M12 2.4l7.6 2.8v5.4c0 4.8-3.2 8.8-7.6 10.9-4.4-2.1-7.6-6.1-7.6-10.9V5.2z";

/** Scaled insets need their stroke scaled back up, or they go spindly. */
const inset = (scale: number, d: string) => (
  <g
    transform={`translate(12 11.4) scale(${scale}) translate(-12 -12)`}
    strokeWidth={1.5 / scale}
  >
    <path d={d} />
  </g>
);

const bracketArch = (
  <>
    <path d="M3.6 9.6c1.4-3.6 4.6-5.9 8.4-5.9s7 2.3 8.4 5.9" />
    <path d="M6.5 12.4h11" />
    <path d="M8.4 10.2h2.2v4.4H8.4zM13.4 10.2h2.2v4.4h-2.2z" />
    <path d="M3.6 12.4h2.9M17.5 12.4h2.9" />
    <path d="M12 15.8v4.5" />
  </>
);

const ICONS = {
  /* --- five clinical directions ----------------------------------- */
  "diagnostics-planning": (
    <>
      <path d={TOOTH} />
      <path d="M3 6.5V4.4c0-.8.6-1.4 1.4-1.4h2.1" />
      <path d="M21 6.5V4.4c0-.8-.6-1.4-1.4-1.4h-2.1" />
      <path d="M3 17.5v2.1c0 .8.6 1.4 1.4 1.4h2.1" />
      <path d="M21 17.5v2.1c0 .8-.6 1.4-1.4 1.4h-2.1" />
    </>
  ),
  "therapy-prevention": (
    <>
      <path d={SHIELD} />
      {inset(0.44, TOOTH)}
    </>
  ),
  "surgery-implantation": (
    <>
      <path d="M8.6 2.6h6.8a1.4 1.4 0 0 1 1.4 1.4v2.2a1.4 1.4 0 0 1-1.4 1.4H8.6A1.4 1.4 0 0 1 7.2 6.2V4a1.4 1.4 0 0 1 1.4-1.4z" />
      <path d="M9.6 9.4h4.8M9.9 12h4.2M10.2 14.6h3.6M10.5 17.2h3" />
      <path d="M12 7.6v13.8" />
    </>
  ),
  orthodontics: bracketArch,
  aesthetic: (
    <>
      <path d={TOOTH} />
      <path d="M18.4 3.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" />
    </>
  ),

  /* --- sixteen services -------------------------------------------- */
  diagnostics: (
    <>
      <path d={TOOTH} />
      <path d="M16.9 18.1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.1 17.2l2.3 2.5" />
    </>
  ),
  "therapy-adults": (
    <>
      <path d={TOOTH} />
      <path d="M12 9.2c1.1 1.4 1.8 2.4 1.8 3.3a1.8 1.8 0 0 1-3.6 0c0-.9.7-1.9 1.8-3.3z" />
    </>
  ),
  "therapy-children": (
    <>
      <path d={TOOTH} />
      <path d="M10 9.8v1.3M14 9.8v1.3" />
      <path d="M10.1 13.4a2.4 2.4 0 0 0 3.8 0" />
    </>
  ),
  surgery: (
    <>
      <path d={TOOTH} />
      <path d="M17.8 2.6l3.6 3.6-6.6 3z" />
      <path d="M14.8 9.2l-1.8 1.8" />
    </>
  ),
  implantation: (
    <>
      <path d="M9.6 4.6h4.8" />
      <path d="M9.6 7.4h4.8M9.9 10.2h4.2M10.2 13h3.6M10.5 15.8h3" />
      <path d="M12 3.2v18.2" />
      <path d="M9.4 18.6h5.2" />
    </>
  ),
  periodontology: (
    <>
      <path d={CROWN} />
      <path d="M2.6 18.6c2.4 0 2.4-2.2 4.8-2.2s2.4 2.2 4.8 2.2 2.4-2.2 4.8-2.2 2.4 2.2 4.4 2.2" />
    </>
  ),
  aligners: (
    <>
      <path d="M4.2 8.4c0-2.6 3.5-4.4 7.8-4.4s7.8 1.8 7.8 4.4c0 4.6-2.4 9.2-4.6 11.2-1 .9-1.6-1.6-3.2-1.6s-2.2 2.5-3.2 1.6C6.6 17.6 4.2 13 4.2 8.4z" />
      <path d="M6.8 9.2c0-1.4 2.3-2.4 5.2-2.4s5.2 1 5.2 2.4" />
    </>
  ),
  veneers: (
    <>
      <path d={TOOTH} />
      <path d="M9 6.4c1.9-.7 4.1-.7 6 0 .5.2.8.7.8 1.3v5.6c0 2.4-1.7 4.3-3.8 4.3s-3.8-1.9-3.8-4.3V7.7c0-.6.3-1.1.8-1.3z" />
    </>
  ),
  "digital-modelling": (
    <>
      <path d={TOOTH} />
      <path d="M3 8.4h18M3 15.6h18M8.4 2.6v18.8M15.6 2.6v18.8" />
    </>
  ),
  forestadent: (
    <>
      <path d="M2.6 12h18.8" />
      <path d="M8.6 8.6h6.8v6.8H8.6z" />
      <path d="M8.6 10.2H6.8M8.6 13.8H6.8M15.4 10.2h1.8M15.4 13.8h1.8" />
    </>
  ),
  damon: (
    <>
      <path d="M2.6 12h18.8" />
      <path d="M8 8.8h8a1.6 1.6 0 0 1 1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6v-3.2A1.6 1.6 0 0 1 8 8.8z" />
      <path d="M6.4 11.3h11.2" />
    </>
  ),
  whitening: (
    <>
      <path d={TOOTH} />
      <path d="M3.6 2.5l.71 1.39 1.39.71-1.39.71-.71 1.39-.71-1.39-1.39-.71 1.39-.71z" />
      <path d="M20.4 2.5l.71 1.39 1.39.71-1.39.71-.71 1.39-.71-1.39-1.39-.71 1.39-.71z" />
      <path d="M20.6 10l.48.92.92.48-.92.48-.48.92-.48-.92-.92-.48.92-.48z" />
    </>
  ),
  tomography: (
    <>
      <path d="M12 21.4c-5.2 0-9.4-4.2-9.4-9.4S6.8 2.6 12 2.6s9.4 4.2 9.4 9.4-4.2 9.4-9.4 9.4z" />
      <path d="M12 2.6v18.8M2.6 12h18.8" />
      <path d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z" />
    </>
  ),
  restoration: (
    <>
      <path d={TOOTH} />
      <path d="M10.1 9.4h3.8a1 1 0 0 1 1 1v2.8a1 1 0 0 1-1 1h-3.8a1 1 0 0 1-1-1v-2.8a1 1 0 0 1 1-1z" />
      <path d="M10.4 12.6l2.2-2.2M12.2 13.8l2.4-2.4" />
    </>
  ),
  visiograph: (
    <>
      <path d="M3.4 5.4h17.2a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H3.4A1.4 1.4 0 0 1 2 15.9V6.8a1.4 1.4 0 0 1 1.4-1.4z" />
      {inset(0.5, TOOTH)}
    </>
  ),
} as const;

export type ServiceIconName = keyof typeof ICONS;

export function hasServiceIcon(name: string): name is ServiceIconName {
  return name in ICONS;
}

export default function ServiceIcon({
  name,
  className = "h-10 w-10",
}: {
  name: ServiceIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
