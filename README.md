# Total Charm Dent — dent-v2

Trilingual (ka / en / ru) marketing site for the Total Charm Dent clinic in Vake, Tbilisi.
Built with Next.js 16 (App Router, Turbopack) + Tailwind CSS v4.

## Getting started

```bash
cp .env.example .env.local   # DATABASE_URL and PAYLOAD_SECRET are required to boot
npm run dev        # http://localhost:3000 -> redirects to /ka
npm run build      # needs a reachable database — every page queries the CMS
npm run typecheck  # tsc --noEmit
npm run lint
npm run check:i18n # dictionary parity, meta lengths, asset existence
```

Deploying is **not** a `git push`: the build talks to Postgres, uploads live outside
the repo, and migrations do not run themselves. See `docs/deployment.md`.

## Current scope

**Complete and live at totalcharmdent.ge.** Every route below is built, routed and
CMS-backed; the admin panel is Georgian throughout and the clinic edits its own content.

| Route (× 3 locales) | Content source |
| --- | --- |
| `/` | home — hero, clinic, services, lead doctor, team, technology, FAQ, booking |
| `/about` | `doctors` — full profiles with education, experience, training, languages |
| `/services` + `/services/[category]` | `services` — 16 entries across 5 categories |
| `/technology` | `equipment` — devices by group, with manufacturer links |
| `/news` + `/news/[slug]` | `posts` — drafts/publish, per-post SEO |
| `/contact` | `clinic-info` globals + map |
| `/[slug]` | `landing-pages` — campaign pages, created from the panel |

Admin: 11 collections + 4 globals = 15 screens, grouped as
ყოველდღიური / საიტის შიგთავსი / მარკეტინგი / პარამეტრები. All labels live in
`src/admin/labels.ts`.

> **Editing `src/admin/labels.ts` changes what the manual documents.** The Georgian user
> manual (`docs/admin-manual-ka.md`) names every screen and field exactly as that file
> spells them. Rename a label there and the manual's chapter for that screen needs the same
> edit — otherwise staff read one name and see another.

## Documentation

| File | For |
| --- | --- |
| `docs/admin-manual-ka.md` | clinic staff — 15 chapters + 3 appendices, in Georgian |
| `docs/Total-Charm-Dent-sakhelmdzghvanelo.pdf` | the same manual, printable (43 pp) |
| `docs/TCD-swrafi-barati.pdf` | one-page quick card for the front desk |
| `docs/TCD-ra-ashenda.pdf` | handover sheet — what was built, for the client |
| `docs/deployment.md` | deploying; the build needs a reachable database |
| `docs/cms-migration.md` | which content lives in which collection |
| `docs/campaign-landing-pages.md` | the landing-page editing model |

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

## News

`/[lang]/news` (list, client-side category filter) and `/[lang]/news/[slug]` (detail).

`src/lib/news.ts` is a **stand-in for a Payload collection**, not a permanent home. Its field
names and localisation model mirror what `posts` will look like in the CMS, so migration should
replace the body of `getPosts` / `getPost` and leave the components alone.

Post text is deliberately **not** in the i18n dictionaries: `check:i18n` enforces exact key parity,
so one Georgian-only announcement would fail the build. `news.ts` does per-field fallback to `ka`
instead, and the detail page tells the reader when they are getting the Georgian text.

`docs/cms-migration.md` records which content moves to which collection, and what to delete before
launch (there is one sample post, flagged `sample: true`).

## The about page

`clinic` and `team` were two planned routes. They shipped as one — `/[lang]/about` — because a
clinic page without its doctors is a mission statement with nobody behind it, and a doctors page
without the clinic is five portraits with no reason to trust them. The nav went from five items
to four.

Three things follow from that and are easy to break:

- The home page's clinic section carries `id="about"`, not `id="clinic"`. `SECTION_IDS` in
  `SiteHeader.tsx` is compared against nav *keys*, so the id and the key have to match or the
  scroll-spy silently stops highlighting.
- Mission, vision, the lead doctor's bio and the long team paragraph render **only** on
  `/about`. The three home sections are teasers with their own short copy
  (`mission.teaserText`, `team.teaserLead`) and a link through.
- `profilePending` in `src/lib/team.ts` decides whether a doctor renders a full profile or a
  short "in preparation" note. See `docs/team-profiles.md` for where each profile was sourced,
  what was deliberately left out, and the questions still open with the client.

## Equipment

`src/lib/equipment.ts` is to the technology page what `services.ts` is to the services page:
eight devices in four groups, with model name, manufacturer, outbound link, photo slot and the
services each device is used in. Prose lives in `technology.page.devices[slug]` in the
dictionaries; model names never do — "Vatech EzRay Air" is the string the manufacturer and the
search index both use, so it stays Latin in all three locales.

Two consequences worth knowing:

- `getManufacturers()` replaced the hand-kept `site.brands` array. The outbound brand links on the
  home page are now derived from the devices themselves and cannot drift from them.
- The five capability claims (`technology.items`) render **only** on `/[lang]/technology`. The home
  section is a teaser that names the machines and links through. Do not put the five back on the
  home page — the same block on two URLs makes Google choose which one to rank.

Photos in `public/equipment/` are labelled stand-ins. See `docs/equipment-photos.md` for where each
real image comes from, the licence question, and the two items still open with the client (the CBCT
model number and the sterilisation vendor).

## Contact details and page meta

Two Payload globals, both read through a single helper each:

- `clinic-info` → `getClinic(lang, fallback)` in `src/lib/clinic.ts`. Phone, WhatsApp, email,
  address, hours, map link, consultation fees, social profiles.
- `seo` → `getSeo(route, lang, fallback)` and `getCategorySeo(slug, lang, fallback)` in
  `src/lib/seo.ts`. Title and description per route, used by every `generateMetadata`.

Both fall back to what the site shipped with — `site.ts` for contact details, the dictionary for
meta — so an unsaved global renders correctly rather than blank. `npm run seed` fills them, which
also means **re-running the seed on a live site discards whatever the client has edited in them**.

Three things that will bite:

- **Do not import `site.phone`, `site.email`, `site.maps`, `site.social` or `site.consultation`
  into a component.** They are `getClinic`'s fallbacks, not a second source of truth. That is the
  bug this replaced: the globals existed in the admin for weeks with no reader, so editing the
  clinic's number changed nothing on the site.
- **`SiteHeader` is a client component.** It takes `clinic` as a prop from the layout and imports
  only `import type { Clinic }`. A value import from `lib/clinic` there pulls the Payload SDK into
  the browser bundle and fails with `Can't resolve 'fs'`.
- **One editable phone number.** `phoneHref`, `whatsapp` and `whatsappHref` are derived from it in
  `lib/clinic.ts`, because two fields an editor has to keep in step will drift, and the failure is
  silent — right number on screen, wrong one behind the link.

`docs/cms-migration.md` records what deliberately stayed in code (the booking inbox, the
machine-readable opening hours, the domain and the map coordinates) and why.

### The counters

`src/lib/stats.ts` builds the four-figure row on the home page and `/about`. Two are counted from
the CMS (specialists, services) and cannot fall out of step with what the pages show. Two are
claims the clinic owns in `clinic-info` (`satisfiedPercent`, `yearsOnMarket`) and **do not render
when unset** — they were hard-coded `"98"` and `"10"` with nothing behind them, which is a
liability on a medical site. The row's CSS handles two, three or four cells.

### Dictionaries hold UI copy only

The service, doctor, device, profile and FAQ prose moved into
`scripts/seed-data/content/{ka,en,ru}.json`. The site never reads it — it exists so a fresh
database can be seeded. Change that text in the admin, not there.

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
