# October 2026 doctor content migration

Run from the project root with the intended database configured. Environment loading
matches `scripts/seed.ts`: existing process variables take priority, then the first
existing file of `.env.local` / `.env`. Payload config is imported afterward.

Preview (no writes):

```sh
npm run data:update-doctors
```

Production apply (on the production server, with its environment and persistent
`MEDIA_DIR` configured):

```sh
npm run data:update-doctors -- --apply
```

The dry run uses read-only PostgreSQL connections. Both modes disable automatic
schema pushes, database creation, extension creation, production schema migrations,
startup callbacks, scheduled jobs, and automatic type generation. A configured
`PAYLOAD_DROP_DATABASE` is forcibly disabled. No raw SQL is used.

The migration queries each doctor by its unique slug. Only supplied Georgian
fields are compared and changed; unchanged records receive no writes. Payload
array row IDs and additional Lexical metadata do not trigger needless rewrites.
Publication, lead status, ordering, experience years, other fields, and EN/RU text
are preserved for existing doctors. **Photos are shared across locales**, so new
photo relationships are visible in all languages. New profiles are unpublished,
with the schema's default ordering. Missing Osadze is skipped because her CV may
not supply the required name and role.

The approved copy is in `doctors-2026-10.json`. The user authorized shortening two
SEO values to fit the existing schema:

- Merkvilishvili's title: `ნინო მერკვილიშვილი — თერაპევტი, პაროდონტოლოგი | Total Charm Dent`
- Togonidze's description: `ანა ტოგონიძე — Total Charm Dent-ის ექიმი სტომატოლოგი-თერაპევტი. თერაპიული სტომატოლოგია, ენდოდონტია, ესთეტიკური რესტავრაცია და ლორწოვანი გარსის დაავადებების მკურნალობა.`

All other supplied medical content is retained. No schema changes or validation
bypasses are used. Unsupported field shapes or over-limit text fail that doctor
before uploading or writing anything for that profile.

Keep the seven canonical files in `source/doctors/`. Each is checked before use,
uploaded through Payload Media once under `doctor-<slug>-2026`, and reused on
subsequent runs. Existing files/media are never deleted. Reused media must be a
valid image with a readable file in the configured local media directory. Only
the Georgian alt text of canonical official media can be updated. Missing source
files produce `MISSING_SOURCE_PHOTO`; ambiguous media names fail for manual review.

Buluashvili's existing photo relationship is preserved. If her doctor is missing,
the migration reuses media named `doctor-nino-buluashvili` or matching the existing
`nino-buluashvili.webp` filename. If neither exists, it uploads that existing
portrait from `public/doctors/`, under `doctor-nino-buluashvili`.

One failure does not stop the remaining doctors. The final summary reports
`CREATED`, `UPDATED`, `UNCHANGED`, `MISSING_SOURCE_PHOTO`, `SKIPPED`, and `ERROR`.
In dry run these are planned statuses. Missing/skipped/error results return a
nonzero exit code. If a doctor write fails after a successful media upload, the
media is retained and reused on retry. The unique doctor slug is the final guard
against concurrent duplicate creation; run a single migration process at a time
because media `internalName` is not a unique schema field.

Validation:

```sh
npm run typecheck
npm run lint
node --import tsx --test scripts/data-migrations/update-doctors-2026-10.test.ts
npm run data:update-doctors
```

The automated tests use an in-memory Payload substitute and temporary image
fixtures. They do not connect to any database or perform a production apply.
After applying, review new profiles in Payload before publishing. This CLI has
no running Next.js cache context; the existing revalidation hook logs a skip.
Refresh the running site's cache through the normal publishing/deploy workflow.

Implementation verification on 2026-10-27: typecheck and all 11 migration tests
passed; lint for the migration directory passed. Full-project lint reports an
existing `prefer-rest-params` error at `src/lib/analytics/providers.ts:44`, plus
existing warnings. All seven supplied portraits have readable JPEG metadata.
The two shortened SEO values are 64 and 167 characters, within the existing
65/175 limits; all other supplied fields were compared against the request.

The development dry run was attempted, but PostgreSQL refused the connection
at `localhost:5432`. No current doctor/media records could be read and no apply
was executed. The frozen seed snapshot contains Archil Apkhadze, Shorena
Shioshvili, Nino Buluashvili, Salome Gabunia, and Nino Osadze. **This is not a
live database inventory.** If the database still matches that snapshot, this
migration will create Sofio Kotoreishvili, Nino Merkvilishvili, Ana Tsurtsumia,
Ana Togonidze, Ana Batsanadze, and Tsira Gulua, and update Buluashvili and Osadze.
The next successful dry run is the authoritative create/update/media plan.
