# Total Charm Dent — dent-v2

Trilingual (ka / en / ru) marketing site for the Total Charm Dent clinic in Vake, Tbilisi.
Built with Next.js 16 (App Router, Turbopack) + Tailwind CSS v4.

## Getting started

```bash
npm run dev        # http://localhost:3000 -> redirects to /ka
npm run build
npm run typecheck  # tsc --noEmit
npm run lint
npm run check:i18n # dictionary parity + asset existence
```

## Current scope

Delivered so far: **home page + top navigation structure**. Everything else is scaffolded
but not yet routed.

| Section | Component | Source of content |
| --- | --- | --- |
| Hero (framed video) | `components/home/Hero.tsx` | new copy, brand line from the existing site |
| Clinic / mission / vision / stats | `components/home/Clinic.tsx` | existing "ტოტალ შარმ დენტი" page |
| Services (5 directions) | `components/home/Services.tsx` | category copy from the client; service names from the existing "სტომატოლოგია" page |
| Atmosphere band | `components/home/Atmosphere.tsx` | placeholder photo |
| Chief doctor | `components/home/LeadDoctor.tsx` | existing site |
| Team (4) | `components/home/Team.tsx` | existing site |
| Technology + care | `components/home/Technology.tsx` | existing site |
| Contact + booking | `components/home/Contact.tsx` | existing contact page |

## Internationalisation

Custom implementation, no external library.

- `src/proxy.ts` — redirects `/` to `/ka`, `/en` or `/ru` using the `tcd-locale` cookie,
  then `Accept-Language`, then the default (`ka`).
- `src/i18n/config.ts` — locale list, labels, `withLocale()` path helper.
- `src/i18n/dictionaries/{ka,en,ru}.json` — all copy. `ka.json` is the source of truth for
  the shape; `npm run check:i18n` fails if the others drift.
- `src/i18n/dictionaries.ts` — server-only loader. **Do not add a `satisfies` clause to the
  loader map** — it contextually types the loaders and collapses `Dictionary` to `unknown`.
- Every route lives under `src/app/[lang]/`. `generateStaticParams` pre-renders all three
  locales; `generateMetadata` emits per-locale canonical + `hreflang` alternates.

Adding a language: add it to `locales` in `src/i18n/config.ts`, drop in a new dictionary,
add the loader entry, then run `npm run check:i18n`.

## Navigation

`src/lib/routes.ts` holds a `routeReady` map. While a sub-page is `false`, its link resolves
to the matching home-page anchor so nothing 404s. When a real route lands, flip the flag —
every link in the header, mega menu, mobile drawer, home page and footer updates at once.

It lives in its own module rather than in `nav.ts` so that `services.ts` can resolve hrefs
without the two importing each other.

## Service taxonomy

The 16 services are grouped into **five clinical directions** (`categoryOrder` in
`src/lib/services.ts`). The home page and the mega menu lead with these; the exhaustive
16-item list belongs on the services page.

Every service belongs to exactly one category. `assertCategoriesCoverEveryService()` runs at
module load and throws if a slug is orphaned or double-counted, so adding a service to
`serviceOrder` without filing it under a category fails fast rather than silently dropping it
from the navigation.

## Design system

The site is **light only** — a warm ivory page with the client's blue. There is no dark mode
and no dark surface anywhere; `colorScheme` is pinned to `light` in the layout viewport.

`src/app/globals.css` defines the tokens:

- Accent `#7AC7EF` (client's colour) is `--color-accent-300`, with a 50–700 ramp.
- Warm ivory surfaces `ivory-50 … ivory-400` (`ivory-100` is the page).
- Warm ink type `ink-900 … ink-500`.
- Warm-tinted shadows `shadow-soft`, `shadow-lift`, `shadow-glow` — neutral grey shadows
  look dirty over ivory.
- Type: Manrope (Latin + Cyrillic) with Noto Sans Georgian as the per-glyph fallback for
  body; Cormorant Garamond with Noto Serif Georgian for display. Georgian, Latin and
  Cyrillic each render in a family designed for that script. Headings sit at weight 400 —
  a 300-weight serif goes faint against ivory.
- Utilities: `.shell`, `.eyebrow`, `.card`, `.glass`, `.aura`, `.grain`, `.reveal`,
  `.btn-primary`, `.btn-ghost`, `.fluid-display`, `.fluid-title`.

### Contrast rules

Every ink step clears 4.5:1 against `ivory-200`, the darkest surface any of them sits on —
including `ink-500`, which carries small uppercase labels and so cannot be a decorative grey.

The brand blue needs more care, because `#7AC7EF` on ivory is only ~1.9:1:

| Use | Token | Why |
| --- | --- | --- |
| Text, links, eyebrows, numerals | `accent-600` / `accent-700` | 4.9:1 and 7.0:1 on ivory-100 |
| Fills, borders, rings, hover states | `accent-300` / `accent-200` | decorative, never carries text |
| Primary button | `accent-300` fill + `ink-900` label | 8.7:1 — white on brand blue would be 1.9:1 |

Reach for `accent-300` when you want the brand colour *seen*, and `accent-600` when it has to
be *read*.

## Assets

Originals live in `/source` and are **not** served. Optimised copies are in `/public`:

- `public/media/hero.mp4` — 1600px H.264, ~2 MB, transcoded from `source/total-charm-hero.mp4`
- `public/doctors/*.webp` — 900px portraits
- `public/services/*.webp` — line-art icons, auto-trimmed to a 360px square
- `public/interior/*.webp`, `public/brand/logo.svg`

## Open items for the client

1. **Phone number** — `src/lib/site.ts` has a placeholder (`+995 322 000 000`).
2. **Counter values** — `stats.satisfiedValue` (98%) and `stats.yearsValue` (10+) in the
   dictionaries are estimates; the live site animates them from 0 and the targets were not
   readable in the markup.
3. **Photography** — `public/placeholder/*` are labelled stand-ins for the atmosphere band
   and the contact map/exterior card. Replace them and drop the `placeholder` block in
   `src/lib/site.ts`.
4. **Booking form** — `components/home/BookingForm.tsx` currently fakes a submit. Wire it to
   a real endpoint or CRM.
5. **Domain** — `site.url` assumes `totalcharmdent.ge`.
