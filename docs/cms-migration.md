# Payload migration — what moves where

Content currently lives in two places: the i18n dictionaries (`src/i18n/dictionaries/*.json`) and
typed data modules (`src/lib/*.ts`). The plan is to move the editable parts into Payload once the
design is settled. This file records what goes where, so the migration is mechanical rather than
archaeological.

The data modules were shaped to match their future collections. **Page components read from
`getX()` helpers, never from the dictionaries directly for these entities** — so a migration
should replace the body of those helpers and leave the components untouched.

## Migration status

| Collection | Reads from Payload | Notes |
| --- | --- | --- |
| `posts` | ✅ | `lib/news.ts`. Client-safe parts split into `lib/news-shared.ts`. |
| `equipment` | ✅ | `lib/equipment.ts`. `photoPending` became a field. |
| `doctors` | ✅ | `lib/team.ts`. `published` replaced the hard-coded pending map; `isLead` replaced the hard-coded slug. |
| `faq` | ✅ | `lib/faq.ts`. |
| `services` | ✅ | `lib/services.ts`. The mega menu's categories are fetched in the layout and passed to `SiteHeader` and `SiteFooter` as props — a client component cannot await a query. |
| `landing-pages` | ✅ | `lib/landing-pages.ts`. One constrained, localized document per campaign; no generic page-builder blocks. |

All five now read from Payload. The migrated blocks can be deleted from the dictionaries in one
commit once the pages have been checked against the CMS in all three locales. What stays: UI
labels, section headings, form strings, and the five clinical direction headings
(`services.categories.*`).

### Globals

| Global | Reads from Payload | Notes |
| --- | --- | --- |
| `clinic-info` | ✅ | `lib/clinic.ts`. |
| `seo` | ✅ | `lib/seo.ts`. |

Both were defined, migrated, typed and visible in the admin for some time **without a single
reader** — every component went on importing `site.phone` and `dict.contact.address`, and every
`generateMetadata` took its strings from the dictionary. An editable field that changes nothing is
worse than a missing one: the clinic updates its number in the admin, the site keeps dialling the
old one, and nobody finds out until a patient calls a dead line. Both now have a read path, and
the seed fills them so the admin opens pre-populated rather than blank.

Three rules follow.

- **`getClinic(lang, fallback)` is the only read path for contact details.** The constants in
  `site.ts` are what renders when the global has never been saved — a lazily created global comes
  back empty. Do not import them into a component; add a fallback there and read it through
  `getClinic()` anyway.
- **One editable phone number.** `tel:` and `wa.me` both reject spaces, so the dialling forms are
  derived in `lib/clinic.ts`. Asking an editor to keep a readable and a diallable copy in step
  guarantees they will diverge, and the failure is silent — the right number on screen, the wrong
  one behind the link.
- **Every `seo` field falls back to the dictionary.** An editor who clears a box gets the shipped
  copy back, not an empty `<title>`. The `maxLength` caps are hard limits set well above the
  advisory lengths in the field descriptions, because the shipped Georgian copy already runs past
  the recommendation in a couple of places and a validation error is the wrong way to discover
  that. `npm run check:i18n` names the over-long ones.

What deliberately did **not** move:

- **The booking inbox.** `api/booking/route.ts` uses `BOOKING_INBOX`, falling back to
  `site.email`. Tying lead delivery to the public contact field would mean an editor tidying the
  address on the contact page silently reroutes — or loses — every booking request.
- **Machine-readable opening hours.** `hoursText` in the CMS is a sentence in three languages;
  parsing `ყოველდღე 9:00-დან 21:00-მდე` back into two timestamps is a guess. `site.hours` feeds
  `OpeningHoursSpecification`, and the admin field says to tell a developer when the real hours
  change.
- **Domain, site name, map coordinates, fee currency.** Deployment and commercial configuration.
  Changing any of them is a migration, not an edit.

### Who can do what

`src/access/roles.ts` holds `isAdmin`; `src/collections/Users.ts` uses it.

Content is open to any logged-in user — editing services and posts is the whole job.
Only account management is restricted, because it is the one failure that cannot be undone
from inside the admin panel:

| Operation | Who |
| --- | --- |
| Read users | Any logged-in user |
| Create a user | Administrators (or anyone, when the collection is empty — the bootstrap) |
| Update a user | Administrators, or that user editing themselves |
| Change a `role` | Administrators only (field-level) |
| Delete a user | Administrators, and never the last administrator (`beforeDelete`) |

The collection previously had no `access` block, which is not the same as having no rules:
Payload defaults an authenticated collection to "any logged-in user", so an editor could
delete the owner's account or set their own role to `admin`. The `role` field described a
model nothing enforced.

Two guards exist because their absence is unrecoverable rather than merely wrong: the
first account is forced to `admin` (the field defaults to `editor`, and the create-first-user
form renders that select), and the last remaining administrator cannot be deleted.

### Admin branding

The login screen, the sidebar mark and the favicon are the clinic's, not Payload's —
`admin.components.graphics` and `admin.meta` in `payload.config.ts`, rendering
`src/components/admin/Logo.tsx` and `Icon.tsx` from `public/brand/`.

Component paths in the config are strings, not imports. Payload compiles them into
`app/(payload)/admin/importMap.js`, so **run `npm run generate:importmap` after adding or renaming
any admin component** — otherwise Payload cannot resolve it and falls back silently.

### The `-shared` modules

`news-shared.ts` and `services-shared.ts` hold the parts a client component may import: types,
constant lists, and pure helpers. The modules that query Payload (`news.ts`, `services.ts`,
`equipment.ts`, `team.ts`, `faq.ts`, `cms.ts`) must never be imported from a `"use client"` file or
anything one renders.

This bit us twice, in both directions — once through `PostCard` inside `NewsList`, once through
`BookingForm` importing `categoryOrder`. The failure is always the same: `Can't resolve 'fs'`, with
an import trace ending in `[Client Component Browser]`. Read that trace bottom-up; the last
`.tsx` in it is the client component that pulled the server SDK in.

`import type { ... }` is safe either way — TypeScript erases it and no module edge survives. It is
the *value* imports that have to come from a `-shared` module.

### Service icons

`ServiceIcon` takes a plain string and falls back to a neutral glyph for a slug it does not know.
That is deliberate: slugs come from the CMS, so an editor can create a service whose icon does not
exist yet. Requiring the narrow union would move the failure to compile time, where nobody can fix
it — the slug does not exist until it is typed into the admin. A new service therefore looks
unfinished rather than broken, and adding the real icon is a normal commit.

## Collections

| Collection | Source today | Localised fields | Notes |
| --- | --- | --- | --- |
| `posts` | `src/lib/news.ts` | `title`, `excerpt`, `body` | Already per-field optional with a `ka` fallback — this is Payload's localisation model. `category`, `publishedAt`, `cover`, `slug` are not localised. |
| `equipment` | `src/lib/equipment.ts` + `technology.page.devices.*` | `summary`, `body`, `highlights` | `name`, `manufacturer`, `photo`, `services` stay unlocalised. Model names must **not** be localised — see the note at the top of `equipment.ts`. |
| `doctors` | `src/lib/team.ts` + `about.profiles.*` | `role`, `focus`, `bio`, `education`, `experience`, `training`, `languages` | `slug`, `photo` unlocalised. `profilePending` becomes a `published` flag. |
| `services` | `src/lib/services.ts` + `services.items.*` | `title`, `blurb`, `lead` | Keep `assertCategoriesCoverEveryService` behaviour as a validation hook — the guarantee it gives is worth keeping. |
| `faq` | `faq.*` in the dictionaries | `question`, `answer` | Straight list, simplest one to start with. |

Everything else in the dictionaries is UI chrome — button labels, section headings, meta
descriptions, form validation strings. **That should stay in the dictionaries.** It changes when
the design changes, not when the clinic has news, and `check:i18n` enforcing exact parity on it is
a feature.

## Why `"type": "module"` is in package.json

Do not remove it. Without it, Node treats `.ts` files in this project as CommonJS, so Payload's CLI
loads `payload.config.ts` with `require()` — and every Payload package is ESM-only. On Node 22.12
and later that surfaces as `ERR_REQUIRE_ASYNC_MODULE` (from the top-level `await` inside
`@payloadcms/richtext-lexical`), and disabling `require(esm)` only converts it into a plain
`ERR_REQUIRE_ESM`. Neither is fixable with a flag; the module system has to be right.

Everything else in the repo was already ESM: `tsconfig` is `module: esnext` with
`moduleResolution: bundler`, `next.config.ts` uses `import`/`export default`, and the remaining
config files are `.mjs`, which is explicitly ESM regardless of this setting. Payload 3's own
templates ship with `"type": "module"` for the same reason.

If other Node 24 oddities turn up, Node 22 LTS is the version Payload 3 is actually tested
against, and switching to it is a reasonable answer.

## Seeding

```
npm run seed
```

`scripts/seed.ts` reads the typed modules in `src/lib`, the three dictionaries (for contact details
and per-route meta) and `scripts/seed-data/content/*.json` (for the migrated prose), and writes it
all into Payload in three locales, uploading the images from `public/` as it goes. Roughly 300
translated strings; a manual pass would introduce errors nobody would notice until a patient read
them.

Two things about how it is launched, both of which cost an evening to find:

- It runs through `tsx`, not `payload run`. Payload's CLI only loads `.env`; this project keeps its
  values in `.env.local`, Next's convention. Under `payload run` the config was built with an
  undefined `DATABASE_URL` and the process exited silently with status 0 — no error, no output.
- The config is imported **dynamically**, inside `main()`. `payload.config.ts` reads
  `process.env.DATABASE_URL` when the module evaluates, and ES module imports are hoisted above the
  script body — so a static `import config from "@payload-config"` runs before the env file is
  loaded, no matter where the loading code sits. Do not turn it back into a static import.

It is safe to re-run: every document is looked up by slug and updated rather than duplicated. The
one exception is FAQ, which has no slug and is matched on the Georgian question — reword a question
in the admin and a re-run would create a duplicate. That is fine for a one-shot import and the
reason this should not be put on a schedule.

The two globals are written last and are the only fully idempotent part — a global is one document,
so a re-run overwrites it. Which also means **a re-run discards anything the client has edited in
`clinic-info` or `seo`**. Once the site is live, seed selectively or not at all.

### The migrated blocks have moved, not gone

Done, by `node scripts/split-dictionaries.mjs --write` (a one-shot codemod; delete it once the
result is committed). `services.items`, `team.members`, `faq.items`, `about.profiles`,
`about.leadProfile`, `technology.page.devices` and the `doctor` content fields now live in
`scripts/seed-data/content/{ka,en,ru}.json`.

They moved rather than being deleted because **this script is the only repeatable way to fill a
fresh database, and the dictionary was the only copy of that text.** Deleting it would have traded
a tidy dictionary for the loss of the import path — fine until the first `DROP DATABASE` on
staging.

What that buys: `check:i18n` no longer enforces three-locale parity on ~600 strings nobody renders,
so a translator's remaining work is real work, and the shipped dictionaries now describe the UI and
only the UI.

Two things follow.

- **Nothing in the archive is rendered.** To change a service description, edit it in the admin.
  Editing the archive changes nothing until someone re-seeds — which on a live install would
  overwrite the client's own edits.
- **The archive still needs three-locale parity**, because the seed indexes it by slug across
  locales. `check:i18n` verifies that separately and fails on a gap; a missing key there is a crash
  on a fresh database, not a missing translation.

The `stats` values were deleted outright rather than archived — see below.

### Counters

`stats.satisfiedValue` and friends are gone. The four figures now come from two places, and the
split is the point:

- **Counted.** Specialists and services are `COUNT(*)` over the CMS, built in `src/lib/stats.ts`.
  They were the strings `"5"` and `"16"`, which meant the first doctor an editor added made the
  site quietly wrong in three languages. And `"16"` sat under a label reading *treatment
  directions*, of which there are five — the number was the service count all along.
- **Claimed.** `satisfiedPercent` and `yearsOnMarket` are optional fields on `clinic-info`, and the
  counter does not render when they are unset. They were `"98"` and `"10"`, sourced from nobody, on
  a medical site. The seed deliberately leaves them empty: seeding them would re-publish the
  invention and make it look checked.

### Known gap: service categories

The five clinical directions (`services.categories.*` — title, blurb, lead) did not get a
collection. They are a fixed set that changes with the design rather than with the clinic's week,
so they stay in the dictionaries for now. If the client ever needs to edit them, the honest answer
is a sixth collection rather than a field on Services — the copy belongs to the category, not to
any one service in it.

## Images

Photographs go **into** Payload's `media` collection, not into `public/` with a link stored in the
CMS. The link-only version looks simpler and fails at the first thing the client actually wants to
do: replace a photo. That would mean a file drop into the repo and a deploy — which is the problem
the CMS is being installed to solve. `public/` is also tracked by git and overwritten on deploy, so
anything uploaded there disappears the next time we ship.

The upload directory therefore sits **outside the repository**, at `MEDIA_DIR`
(`/var/www/dentv2-media` on the VPS). Two consequences worth writing down:

- **Back it up separately.** A database dump does not contain the images. Losing the media
  directory loses every photo the clinic ever uploaded, and the database will still be full of
  references to them.
- **Deploys must not touch it.** If the deploy script does a clean checkout, confirm `MEDIA_DIR`
  is not underneath it.

What stays in `public/`: the logo, favicons, service icons, and the hero video. Those are design
assets — they change when we change the design, never when the clinic edits content. Putting them
in the CMS would give an editor a button that can only break the site.

Uploads are converted to WebP at quality 82 and get three derivative sizes (`thumbnail`, `card`,
`wide`), so a card never downloads a 1600px original to render at 400. Focal point is on: portraits
are cropped to 4:5 and device shots to 4:3, and the editor should decide what survives the crop.

## The one rule that matters

Post text is **not** in the dictionaries, and no editable list should be. `check:i18n` fails the
build on any key that exists in `ka.json` but not in `en.json` or `ru.json`. That is right for UI
labels and wrong for content: a clinic that writes one Georgian-only announcement would break the
build. `news.ts` therefore does its own per-field fallback, and the detail page shows a notice when
a reader is being served Georgian in an English or Russian session.

## Before launch

- Delete the sample post. `trios-scanner-arrived` in `news.ts` is marked `sample: true` — it is
  filler written to build the page against. A dated announcement nobody made is a claim, not a
  placeholder. The other three posts are factual and grounded in the clinic's own equipment, so
  they can ship as they are once a doctor has read them.
- Post cover images currently reuse interior and placeholder photography. Real covers go in
  `public/news/`.
- Equipment photos are still labelled stand-ins — see `docs/equipment-photos.md`.
- Nino Buluashvili's profile is still a placeholder — see `docs/team-profiles.md`.

## Two things worth deciding early

1. **Author attribution.** `BlogPosting.author` currently points at the clinic. On health content
   a named doctor is materially stronger, for readers and for search. If posts get a byline field,
   point `author` at that doctor's `Person` node on the about page — the node already exists.
2. **Pagination.** The list page filters client-side and renders every post. That is correct for
   four posts and wrong for forty. When the CMS starts producing volume, revisit
   `components/news/NewsList.tsx`: at that point a route per category and real pagination start
   earning their cost.
