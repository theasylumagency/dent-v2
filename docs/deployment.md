# Deploying

Not a `git push` and done. This is a Next.js app with a Postgres-backed CMS, a
persistent upload directory and a build step that talks to the database — four
things that each need to exist before the first deploy, and two of them cannot be
fixed afterwards without data loss.

Read this once before the first deploy. After that, "Routine deploy" at the bottom
is the whole procedure.

## The one that surprises people

**`next build` needs a reachable database.** Every page is statically generated and
every page queries Payload — services, doctors, equipment, the FAQ, both globals. A
build with no `DATABASE_URL`, or one pointing at an empty database, does not warn:
it fails, or it succeeds and ships a site with no content baked in.

So the order is *migrate, seed, then build* — not build then migrate.

## Before the first deploy

### 1. The domain

`site.url` in `src/lib/site.ts` is `https://totalcharmdent.ge`. It feeds canonical
URLs, `hreflang`, the sitemap, Open Graph and the `Dentist` structured data. If the
real domain differs, every one of those points at a site that is not this one.
Change it before the first build, not after Google has crawled it.

### 2. Environment

Copy `.env.example` and fill it in. `PAYLOAD_SECRET` and `DATABASE_URL` now throw at
boot when missing, so a typo shows up immediately with the variable's name rather
than as a broken login three days later.

`MEDIA_DIR` deserves its own thought — see below.

### 3. The upload directory

`MEDIA_DIR` must be an absolute path **outside the repository**, e.g.
`/var/www/dentv2-media`, writable by the Node process.

Two things follow, and both bite silently:

- **A database dump does not contain the images.** Back this directory up on its own
  schedule. Losing it leaves a database full of references to files that no longer
  exist.
- **The deploy must not touch it.** If deploying by clean checkout, confirm the path
  is not underneath the checkout.

The development default is `<repo>/media`, which is gitignored.

### 4. Migrations

`push` is off outside development, so Payload will not create tables for you. The
committed migrations in `src/migrations/` are the schema.

```bash
npm run migrate
```

**There is one migration still to generate.** `satisfiedPercent` and `yearsOnMarket`
were added to the `clinic-info` global after the last migration was written. Run this
once, locally, and commit the result:

```bash
npm run generate:types
npm run migrate:create
```

Without it those two columns do not exist in production, and `getClinic()` runs on
every page.

### 5. Content

The dictionaries no longer hold the migrated prose — it lives in
`scripts/seed-data/content/`. If `scripts/split-dictionaries.mjs` has not been run
yet, run it and commit before anything else; `npm run seed` refuses to start without
that directory.

```bash
node scripts/split-dictionaries.mjs --write
npm run seed
```

`npm run seed` is safe to re-run **on an empty or development database only**. The two
globals are one document each, so a re-run overwrites them — including anything the
clinic has edited. Once the site is live, do not seed.

### 6. The first admin user

Visit `/admin` on the deployed site. Payload offers a create-first-user screen while
the `users` collection is empty, and only while it is empty.

That account is saved as an **administrator** regardless of what the role select on
that form says — a `beforeChange` hook on `users` forces it. The field defaults to
`editor`, and an install whose only account cannot create accounts has no way out
except SQL.

Everything after that is role-gated: administrators manage accounts, editors change
content and their own password. An editor cannot promote themselves, and the last
administrator cannot be deleted.

### 7. Node

Payload 3 is tested against Node 22 LTS. Node 24 has produced module-resolution
oddities in this project before — see the `"type": "module"` note in
`cms-migration.md`. Pin 22 on the server.

## Routine deploy

```bash
git pull
npm ci
npm run migrate      # no-op when there is nothing new
npm run build
# restart the process manager
```

`npm start` serves it. Put a reverse proxy in front for TLS.

Consider adding `output: "standalone"` to `next.config.ts` if the server is tight on
space — it emits a self-contained `.next/standalone` that does not need
`node_modules` at runtime. Not required.

## Known gaps to close before launch

Not deployment mechanics, but do not go live without deciding on them.

- **Legal pages.** The footer's privacy and terms links are inert spans. The booking
  form collects a name, phone and email, so a published privacy notice is required
  under Georgia's personal data protection law.
- **Placeholder photography.** `public/placeholder/` and `public/equipment/` are
  labelled stand-ins. See `docs/equipment-photos.md`.
- **The sample post.** `trios-scanner-arrived` is flagged `sample: true` — filler
  written to build the page against. A dated announcement nobody made is a claim.
- **Unpublished figures.** `satisfiedPercent` and `yearsOnMarket` are empty by design.
  Fill them in the admin only if they can be substantiated; the counters stay hidden
  until then.
- **Nino Buluashvili's profile** is still a placeholder — see `docs/team-profiles.md`.
