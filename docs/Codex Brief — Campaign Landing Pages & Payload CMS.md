> **Superseded in part.** Campaigns now live at `/:lang/:slug`, not
> `/:lang/lp/:slug`, and almost every field described below is optional with a
> dictionary-backed default. See `docs/campaign-landing-pages.md` for what the
> code does today; this brief is kept for the reasoning behind it.

# Codex Brief — Campaign Landing Pages & Payload CMS

## Objective

Build a reusable, campaign-specific Landing Page system for **Total Charm Dent**.

This is **not** a standalone `/booking` page and must not be implemented as a single generic form page.

The goal is to create a controlled conversion-focused landing page system where each advertising campaign can have:

- its own permanent URL;
- its own campaign-specific copy;
- configurable header;
- configurable hero layout;
- optional desktop and mobile hero imagery;
- campaign-specific trust/content sections;
- a configurable booking form;
- attribution from UTM parameters;
- its own lifecycle: Draft / Active / Archived;
- historical preservation after the campaign ends.

The system must be manageable from **Payload CMS without developer intervention for every new campaign**.

Do not turn this into a generic drag-and-drop page builder. We want a deliberately constrained campaign landing-page template that preserves the Total Charm Dent brand and conversion structure.

---

# 1. Before touching code

First inspect the current repository and existing implementation.

In particular review:

- `AGENTS.md`
- `src/payload.config.ts`
- `src/collections/Media.ts`
- `src/collections/Doctors.ts`
- `src/collections/Services.ts`
- `src/collections/hooks/revalidate.ts`
- `src/components/home/BookingForm.tsx`
- `src/components/booking/*`
- `src/app/api/booking/route.ts`
- `src/lib/analytics/*`
- `src/app/[lang]/layout.tsx`
- `src/app/sitemap.ts`
- `src/proxy.ts`
- `docs/cms-migration.md`
- `docs/deployment.md`
- `src/migrations/*`

`AGENTS.md` is authoritative: this project uses **Next.js 16.3.0**, and APIs/conventions may differ from older Next.js versions.

Before changing routing, layouts, caching, metadata, dynamic params or revalidation, read the relevant installed Next.js documentation under:

`node_modules/next/dist/docs/`

Do not rely on remembered conventions from older Next.js versions.

Current stack:

- Next.js 16.3.0
- React 19.2.x
- Payload CMS 3.86.x
- PostgreSQL
- TypeScript
- Tailwind CSS
- existing GA4 / Meta analytics integration
- existing Resend booking delivery

---

# 2. Core architectural decisions

These are product decisions, not implementation suggestions.

## 2.1 One CMS document = one campaign landing page

Create a new Payload collection:

`landing-pages`

Each campaign is a separate document.

Examples:

- `/ka/lp/veneers-summer-2026`
- `/ka/lp/implant-consultation-2026`
- `/ka/lp/aligners-september-2026`

Equivalent localized pages must exist under:

- `/ka/lp/[slug]`
- `/en/lp/[slug]`
- `/ru/lp/[slug]`

The same campaign uses the same slug across locales.

The URL is part of the campaign history. Old campaign URLs must not disappear simply because a new campaign is created.

Do not repurpose an old campaign slug for an unrelated campaign.

---

## 2.2 Landing pages must not inherit normal website chrome

A campaign landing page must **not** show the normal:

- full navigation;
- Services menu;
- About;
- News;
- normal SiteHeader;
- normal SiteFooter navigation;
- MobileActionBar;
- global booking drawer trigger.

Its conversion path should remain deliberately narrow.

The landing page gets its own lightweight header and minimal footer.

Because `src/app/[lang]/layout.tsx` currently renders the normal site chrome globally, refactor layouts cleanly rather than hiding elements with CSS.

Recommended architecture:

```text
src/app/[lang]/layout.tsx
    shared locale/html/body/fonts/analytics only

src/app/[lang]/(site)/layout.tsx
    normal website chrome:
    SiteHeader
    SiteFooter
    MobileActionBar
    BookingProvider
    normal site data requirements

src/app/[lang]/(site)/page.tsx
src/app/[lang]/(site)/about/...
src/app/[lang]/(site)/contact/...
src/app/[lang]/(site)/news/...
src/app/[lang]/(site)/services/...
src/app/[lang]/(site)/technology/...

src/app/[lang]/lp/[slug]/page.tsx
    campaign landing page
```

Next.js route groups must preserve all existing public URLs.

Do not create URL regressions for the current website.

Also move any **homepage-specific preload logic** out of the common locale layout. The current home hero poster must not be unnecessarily preloaded on campaign landing pages.

Preserve existing normal-site metadata, structured data and behavior after this refactor.

---

# 3. Payload collection: `landing-pages`

Use Payload localization for visitor-facing copy.

## 3.1 Campaign / internal metadata

Required fields:

### `campaignName`
- text
- required
- not localized
- used as the admin title
- internal/admin-facing name

Example:

`Veneers — Summer 2026`

### `slug`
- text
- required
- unique
- indexed if appropriate
- not localized
- URL-safe validation

Example:

`veneers-summer-2026`

### `status`
Select:

- `draft`
- `active`
- `archived`

Default:

`draft`

### Optional dates

- `startsAt`
- `endsAt`

These are useful campaign metadata.

Do not make scheduling unnecessarily complicated. `status` remains the primary editorial control.

If automatic date handling is implemented, document it clearly and make the behavior deterministic.

---

# 4. Archived campaign behavior

Archived campaigns must remain represented in the CMS.

Add:

### `archivedBehavior`

Options:

- `keep-public`
- `ended-page`
- `redirect`

### If `redirect`

Add a conditional relationship:

`redirectTarget`

Relationship:

`landing-pages`

Do not use a freely editable external URL for this field.

This avoids accidental/open redirects.

Do not allow obvious self-redirects. Protect against redirect loops where reasonably possible.

### Public behavior

#### Draft
Public request → `404`

#### Active
Render normally.

#### Archived + `keep-public`
Render the old landing page.

#### Archived + `ended-page`
Show a minimal branded “campaign ended” state.

Allow localized:

- ended title;
- ended text;
- optional CTA label.

CTA may lead to the main site or booking/contact flow as appropriate.

#### Archived + `redirect`
Redirect to the selected landing page.

Use an appropriate permanent/temporary redirect semantics based on current Next.js guidance and campaign intent. Document the choice.

---

# 5. Header configuration

Do not reuse or heavily parameterize the large normal `SiteHeader`.

Create a dedicated landing header component.

The brand logo remains a fixed design asset and is **not CMS-editable**.

Add a `header` group.

### `preset`

Options:

#### `minimal`
- logo
- phone
- CTA

#### `brand`
- logo
- optional short trust message
- phone
- CTA

#### `ultra-minimal`
- logo
- CTA

### Additional fields

- `trustText` — localized, optional
- `showPhone` — boolean
- `ctaLabel` — localized
- CTA anchors to the page's lead form

The header can vary from campaign to campaign.

Keep it visually restrained and consistent with the Total Charm Dent design system.

---

# 6. Hero configuration

The Hero must be campaign-specific.

Add a `hero` group.

### Layout

Controlled presets only:

- `copy-only`
- `image-right`
- `image-left`
- `full-bleed`
- `centered-editorial`

Do not build arbitrary layout controls.

### Copy

Localized fields:

- `eyebrow` — optional
- `headline` — required
- `subheadline` — optional
- `ctaLabel`

The hero must communicate **one campaign-specific promise**, not generic clinic positioning.

---

# 7. Hero imagery

Hero image is optional.

If the selected layout does not require an image, the landing page must work perfectly without one.

Use the existing Payload `media` collection.

Do **not**:

- create another upload collection;
- store uploaded campaign images inside `public/`;
- store filesystem paths manually.

The current Media collection already provides:

- persistent `MEDIA_DIR`;
- WebP conversion;
- derivative image sizes;
- focal-point handling.

### `desktopImage`

Relationship to:

`media`

Optional.

Admin description should clearly say approximately:

> Recommended desktop hero: 1920 × 1200 px, 16:10. Upload WebP, JPEG or PNG; Payload will optimize the image. Keep the original reasonably compressed, ideally under 2 MB. Keep important subjects away from extreme edges because responsive cropping may occur.

### `mobileImage`

Relationship to:

`media`

Optional.

Admin description:

> Optional dedicated mobile crop. Recommended: 1080 × 1350 px, 4:5. If omitted, the desktop image will be reused and cropped responsively using the media focal point.

The mobile image is deliberately optional.

Use responsive `next/image` rendering, correct `sizes`, aspect handling and Payload image sizes.

Do not download a full-resolution original to render a small mobile image.

If a campaign hero image is the LCP element, use appropriate loading/fetch priority based on the actual rendered layout. Do not globally preload every campaign image.

### Scope

For this implementation, **image/no-image is enough**.

Do not expand the Media collection to video uploads merely because the architecture could support video later.

---

# 8. Landing page content structure

The landing page should use a controlled, conversion-focused sequence.

Each major section may have an `enabled` boolean where appropriate, but editors should not be able to arbitrarily rearrange the entire page.

Recommended structure:

## 8.1 Hero

Campaign-specific promise + booking/lead action.

---

## 8.2 Why leave your number?

A concise trust/value section.

Payload field:

`reasons`

Array:
- minimum approximately 2
- maximum 4

Each item localized:

- title
- text

Typical use:

- individual consultation;
- modern diagnostics;
- understandable treatment plan.

Do not seed invented claims.

---

## 8.3 Problem → Solution

Optional group:

- enabled
- eyebrow
- title
- body

Localized.

This content must be campaign-specific.

Example intent:

A veneers campaign explains concerns around shape, color and smile aesthetics.

An implant campaign uses completely different content.

---

## 8.4 Doctor / clinical trust

Optional.

Fields:

- enabled
- localized section heading/intro
- relationship to `doctors`

Use the existing doctor record for:

- name;
- role;
- photo;
- credentials/content already available in the CMS.

Do not duplicate the doctor's profile text into the landing-page document unless a campaign-specific short introduction is genuinely required.

This block is about one relevant practitioner, not the entire team.

---

## 8.5 “What happens next?”

This is important for reducing friction.

Use exactly three concise steps.

Suggested structure:

1. Visitor submits their contact details.
2. The clinic contacts them and clarifies the request.
3. They agree on a convenient appointment time.

Localized fields.

The copy should make clear that:

**submitting the form is not itself a final confirmed appointment.**

Do not imply that a time slot is booked automatically when the system does not actually provide real-time scheduling.

---

## 8.6 Social proof

Optional.

Maximum 3 items.

Each item may contain:

- quote
- patient/display name
- source label

Localized where necessary.

Do not seed fake reviews.

Do not invent a Google rating.

Only show ratings/reviews that the clinic can substantiate.

---

## 8.7 Clinic / environment

Optional.

Fields:

- enabled
- image relationship to `media`
- localized title
- localized short text

Clinic address/contact information should come from the existing shared clinic data where possible rather than being duplicated into every campaign.

This section establishes that this is a real clinic in Tbilisi and lets the visitor understand where they would be going.

---

## 8.8 Final CTA

Localized:

- title
- text
- button label

By default the button should scroll back to the **same lead form** rather than create a second independent form instance.

Avoid duplicated DOM IDs and duplicated form state.

---

# 9. Booking form

Do not create a second booking backend.

The project already has:

`POST /api/booking`

Keep it as the single booking-delivery endpoint.

The current implementation already includes:

- server-side validation;
- honeypot;
- rate limiting;
- Resend delivery;
- delivery failure handling;
- first-party aggregate increment;
- analytics completion tracking.

Preserve all of this.

Refactor shared form logic if needed, but do not copy/paste a separate inconsistent implementation.

The existing website booking drawer and homepage booking behavior must continue to work unchanged.

---

# 10. Landing form configuration

Add a `form` group to the campaign.

### Always required

- Name
- Phone

These cannot be disabled.

### Optional visibility controls

- `showService`
- `showPreferredTime`
- `showEmail`
- `showMessage`

### Default service

Optional relationship:

`defaultService` → `services`

For example, a veneers campaign may preselect the appropriate service.

The visitor should not be forced through unnecessary fields when the campaign itself already tells us what they are interested in.

### Campaign-specific copy

Allow localized:

- form title / intro
- submit button label
- success title
- success text

Reuse existing dictionary strings for generic:

- labels;
- validation messages;
- loading;
- generic errors;
- consent copy,

unless there is a clear reason to make a particular campaign string editable.

Do not duplicate all existing UI dictionary strings into Payload.

---

# 11. Campaign attribution

The landing URL identifies the landing page but does not identify the ad source.

Capture a whitelist of attribution parameters from the incoming URL.

At minimum:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

Also preserve the landing-page slug.

Optional click identifiers such as `gclid` / `fbclid` may be supported only if useful and handled conservatively.

Do not blindly store arbitrary query parameters.

### Submission

Pass attribution metadata to `/api/booking` as hidden/non-user-editable form metadata.

Extend the server-side booking payload safely.

Treat all submitted values as untrusted input.

Apply:

- trimming;
- reasonable max lengths;
- HTML escaping in the booking email.

The existing `escapeHtml` behavior must remain in place.

### Booking email

The booking notification should clearly include, where available:

- Landing page / slug
- UTM Source
- UTM Medium
- UTM Campaign
- UTM Content
- UTM Term

This allows the clinic/marketing team to know where the request originated.

Do not trust a client-submitted display name as an authorization/security boundary.

---

# 12. Analytics

Preserve existing semantics:

Successful booking only:

- GA4 `generate_lead`
- Meta standard `Lead`

These must still fire **only after the server confirms that the booking request was actually accepted**.

For landing pages, add useful non-PII context where supported, such as:

- `landing_slug`
- campaign identifier/name

Optional useful events:

- landing CTA click
- landing form interaction

Do not send to GA4 or Meta:

- patient name;
- phone;
- email;
- message;
- other PII.

UTM/campaign analytics must remain marketing metadata only.

Do not change a failed booking request into an analytics conversion.

---

# 13. CMS localization

Public campaign copy must use Payload localization.

Locales remain:

- Georgian (`ka`)
- English (`en`)
- Russian (`ru`)

Default locale:

`ka`

These should be localized:

- header trust copy;
- headlines;
- subheadlines;
- section copy;
- reasons;
- steps;
- testimonials;
- CTA copy;
- form campaign copy;
- SEO title/description;
- campaign-ended copy.

These should normally remain unlocalized:

- `campaignName`
- `slug`
- `status`
- dates
- layout/preset selectors
- relationships
- behavior settings
- analytics identifiers

---

# 14. SEO / indexing

These pages are primarily paid-campaign destinations, not organic content pages.

Add an explicit:

`indexable`

boolean.

Default:

`false`

When `false`:

- emit `noindex`;
- do not include the campaign in the sitemap.

When `true`:

- allow indexing;
- generate correct localized canonical URL;
- expose appropriate hreflang alternates;
- include in sitemap only when publicly active/indexable.

Add localized campaign SEO fields:

- `metaTitle`
- `metaDescription`

Optional:

- `socialImage` relationship to `media`

Fallback order for social image can be:

1. campaign social image;
2. desktop hero image;
3. appropriate existing site fallback.

Canonical URLs should be generated from the actual campaign route and should not be a free-text CMS field.

Archived pages should behave consistently with their archive behavior.

A redirecting archived page should not create competing canonical/indexable content.

---

# 15. Metadata and structured data

Landing pages need their own `generateMetadata`.

Do not inherit homepage-specific title, description, canonical or OG image.

Preserve:

- site metadata base;
- locale behavior;
- favicon/manifest;
- established brand conventions.

Do not blindly duplicate all homepage Dentist JSON-LD into every landing page if it adds no value.

If structured data is emitted, it must stay truthful and derived from existing clinic/service/doctor data.

---

# 16. Revalidation / new campaigns without deploys

An editor must be able to create a new campaign in Payload and make it accessible without adding code or performing a new deployment.

Create a server-side helper, for example:

`src/lib/landing-pages.ts`

Follow the existing project's server/client module separation.

Do not import the Payload server SDK into `"use client"` components.

Use existing revalidation conventions from:

`src/collections/hooks/revalidate.ts`

The `landing-pages` collection should revalidate:

`/lp/[slug]`

for every locale after:

- create;
- update;
- delete.

Slug changes must invalidate both:

- the new URL;
- the previous URL.

Use the existing revalidation helper where possible rather than inventing a second cache system.

Ensure dynamic slug handling does not require the slug to have existed at build time.

Follow the installed Next.js 16 documentation for the correct implementation.

---

# 17. Access control

Follow the project's current content-editing access model.

Editors who are allowed to manage site content should be able to manage landing pages.

Unauthenticated/public Payload reads must not expose drafts accidentally.

Public routing behavior is authoritative:

- Draft → unavailable publicly
- Active → public
- Archived → public/ended/redirect according to configuration

If REST/API access rules are used, ensure they match this intention rather than exposing every CMS document.

---

# 18. Design requirements

The landing pages must visually belong to Total Charm Dent.

Use the existing:

- typography;
- spacing system;
- color tokens;
- buttons;
- borders;
- image treatment;
- motion principles.

The page should feel:

**quiet luxury + conversion discipline**

Not like a generic performance-marketing template.

Do not introduce:

- countdown timers;
- fake scarcity;
- “LIMITED OFFER!!!” styling;
- oversized bright promotional banners;
- manipulative popups;
- fake testimonials;
- fake ratings;
- excessive animations;
- a dozen competing CTA styles.

The brand blue remains part of the established visual system, not a loud conversion gimmick.

Mobile is a first-class layout, not an afterthought.

---

# 19. Accessibility

Maintain the standards already present in the booking flow.

Requirements:

- semantic headings;
- proper labels;
- keyboard accessibility;
- visible focus state;
- no inaccessible click-only divs;
- meaningful image alt text from Media;
- correct status/error announcements;
- sufficient contrast;
- reduced-motion behavior where relevant;
- no duplicate form IDs.

The landing form must retain strong client + server validation.

---

# 20. Performance

Campaign landing pages should be lighter than the main site.

Avoid loading:

- normal site navigation JS;
- booking drawer code that is not used;
- homepage hero video;
- homepage hero poster;
- unnecessary doctor/team data;
- full services navigation data;
- normal footer/navigation data.

Use server components wherever appropriate.

Keep client components limited to genuinely interactive elements.

For Hero images:

- use `next/image`;
- use appropriate Payload derivative;
- define `sizes`;
- prevent layout shift;
- prioritize only an actual above-the-fold/LCP image.

Do not introduce an expensive generic page-builder runtime.

---

# 21. Migration requirements — critical

This task changes the Payload/PostgreSQL schema, therefore it requires a committed migration.

## 21.1 Do not rewrite migration history

Do not:

- edit old migrations to “include” the new collection;
- squash existing migrations;
- delete old migration files;
- recreate the database;
- treat `seed` as schema migration.

Existing production/staging data must remain intact.

---

## 21.2 Existing migration history

Important:

`src/migrations/20260815_193656.ts`

already adds:

- `clinic_info.satisfied_percent`
- `clinic_info.years_on_market`

Therefore **do not generate another migration for those fields**.

`docs/deployment.md` currently contains an outdated note claiming this migration is still missing.

Update the documentation and remove/correct that stale statement.

The later analytics/audit migration must also remain untouched.

---

## 21.3 Generate a new additive migration

After the new Payload schema is complete:

```bash
npm run generate:types
npm run migrate:create
```

Use a clear migration name if the CLI supports it, e.g.:

`campaign_landing_pages`

Inspect the generated migration before accepting it.

The new migration should only contain schema changes actually required by this feature, such as:

- landing page tables;
- localized fields;
- relationships;
- enums/select values;
- indexes;
- any necessary relationship/join structures.

It must not unexpectedly:

- drop existing tables;
- drop unrelated columns;
- recreate old schema;
- rename unrelated fields;
- duplicate an already-applied migration.

If Payload proposes destructive changes unrelated to this feature, investigate schema drift instead of accepting them.

---

## 21.4 Migration index

Ensure the new migration is correctly registered in:

`src/migrations/index.ts`

if the Payload CLI does not do this automatically.

Do not hand-edit generated files unnecessarily.

---

## 21.5 `payload-types.ts`

`src/payload-types.ts` is generated.

After collection/schema changes, regenerate it and commit the generated result.

Do not manually maintain LandingPage TypeScript interfaces that duplicate generated Payload types without a good reason.

---

## 21.6 Admin import map

Only if custom Payload admin React components are introduced, run:

```bash
npm run generate:importmap
```

Do not add a custom admin component merely to display upload guidance if normal Payload field descriptions are sufficient.

A custom image preview/crop helper is welcome only if it stays small and materially improves the editor experience.

Do not allow that enhancement to turn this task into a custom CMS UI project.

---

## 21.7 Test migration safely

Use the development/local database — never production — to test.

Starting from the current schema/migration head:

1. apply the new migration;
2. confirm existing data remains;
3. create a landing-page document;
4. read it from the frontend;
5. run a production build.

If practical, inspect/test the generated `down` migration as well.

Do not drop the development database simply to make the migration pass.

---

## 21.8 Do not seed production

Do not use:

```bash
npm run seed
```

as part of this deployment.

No fake/sample landing campaign needs to be committed to the production seed.

The existing project documentation already warns that re-seeding a live database may overwrite CMS-edited globals/content.

Schema migration and content seeding are separate concerns.

---

# 22. Deployment order

The existing production principle remains:

**migrate before build**

because Next.js build-time rendering reads from Payload/PostgreSQL.

Routine deployment after this feature should remain conceptually:

```bash
git pull
npm ci
npm run migrate
npm run build
# restart process manager
```

Do not change this into build-before-migrate.

Update `docs/deployment.md` if necessary so it accurately reflects the final migration state.

---

# 23. Suggested component/module structure

Exact naming may be adjusted to fit the repo, but keep responsibilities separated.

For example:

```text
src/collections/LandingPages.ts

src/lib/landing-pages.ts

src/components/landing/
    LandingHeader.tsx
    LandingHero.tsx
    LandingReasons.tsx
    LandingProblemSolution.tsx
    LandingDoctor.tsx
    LandingSteps.tsx
    LandingTestimonials.tsx
    LandingClinic.tsx
    LandingLeadForm.tsx
    LandingFinalCta.tsx
    LandingEnded.tsx

src/app/[lang]/lp/[slug]/page.tsx
```

Do not create one 1,500-line component.

Do not abstract tiny pieces purely for abstraction's sake either.

---

# 24. Form reuse requirement

The new landing form and the current site booking form must share the same server contract.

If substantial client-side validation/submission logic would otherwise be duplicated, refactor it into a reusable shared layer.

However:

- keep the existing drawer behavior working;
- keep existing copy working;
- keep current success/error semantics;
- keep rate limiting;
- keep honeypot protection;
- keep Resend delivery;
- keep analytics semantics.

The campaign system must extend the current booking infrastructure, not replace it.

---

# 25. Expected admin experience

A clinic editor should be able to:

1. Open **Landing Pages** in Payload.
2. Create a new campaign.
3. Enter internal campaign name.
4. Choose slug.
5. Choose Draft / Active / Archived.
6. Choose header preset.
7. Enter campaign-specific hero copy.
8. Choose whether Hero has an image.
9. Upload/select desktop image.
10. Optionally upload/select a dedicated mobile image.
11. Clearly see recommended image dimensions/aspect ratios in the admin.
12. Fill campaign content sections.
13. Select a doctor if relevant.
14. Configure the short lead form.
15. Configure SEO/social metadata.
16. Save/activate.
17. Immediately use the resulting language-specific URL in Meta/Google Ads.
18. Archive the campaign later without deleting its history.

No code change should be required for steps 1–18.

---

# 26. Acceptance criteria

Do not consider the feature complete until all of the following are true.

### Routing
- `/ka/lp/[slug]`, `/en/lp/[slug]`, `/ru/lp/[slug]` work.
- Existing website routes have not changed.
- New campaign slugs created after deployment can resolve without another deploy.

### Layout
- Landing page does not render normal SiteHeader.
- Landing page does not render normal SiteFooter navigation.
- Landing page does not render MobileActionBar.
- Landing page does not load homepage-specific Hero media.

### CMS
- Landing Pages appears in Payload admin.
- Campaign status works.
- Header preset works.
- Hero layout works.
- Desktop image works.
- Optional mobile image works.
- Desktop fallback works when mobile image is absent.
- Admin shows clear upload dimension/format guidance.
- Localization works across KA / EN / RU.

### Form
- Existing normal-site booking still works.
- Landing form uses `/api/booking`.
- Name and phone remain mandatory.
- Configurable optional fields work.
- Default service works.
- Honeypot still works.
- Rate limiting still works.
- Delivery failure still produces a visible error.
- Success is shown only after confirmed server acceptance.

### Attribution
Given a URL such as:

```text
/ka/lp/veneers-summer-2026
?utm_source=facebook
&utm_medium=paid_social
&utm_campaign=veneers_summer_2026
&utm_content=video_a
```

a successful booking notification must make the campaign attribution understandable.

No patient PII is sent to GA4/Meta.

### Analytics
- Existing GA4 `generate_lead` still fires after success.
- Existing Meta `Lead` still fires after success.
- Failed submissions are not counted as successful leads.
- Landing/campaign context is included where safely appropriate.

### Lifecycle
- Draft → public 404.
- Active → normal landing page.
- Archived keep-public → preserved.
- Archived ended-page → branded ended state.
- Archived redirect → correct target.
- Slug changes invalidate the old cached path.

### SEO
- Paid landing pages default to `noindex`.
- Non-indexable pages are not in sitemap.
- Indexable active pages have correct canonical/meta.
- Landing metadata does not inherit homepage title/description accidentally.

### Performance
- No unnecessary normal-site navigation payload.
- Responsive hero images use appropriate sizes.
- No obvious CLS introduced.
- Mobile layout works at small viewport widths.

### Migration
- New migration exists and is committed.
- Existing migration files are untouched except where truly necessary.
- Existing clinic fields are not duplicated.
- Migration applies cleanly from current migration head.
- Existing CMS data survives.
- `payload-types.ts` matches the new schema.

---

# 27. Validation before finishing

Run at minimum:

```bash
npm run generate:types
npm run typecheck
npm run lint
npm run check:i18n
npm run build
```

Also generate and inspect the migration.

If custom Payload admin components were added:

```bash
npm run generate:importmap
```

Apply the migration against the local/dev Postgres database and smoke-test the feature.

Manually verify at least:

- one desktop viewport;
- one mobile viewport;
- one active campaign;
- one draft campaign;
- one archived behavior;
- one form submission with UTM parameters;
- the original booking drawer/form;
- main homepage;
- Services page;
- Contact page.

---

# 28. Final implementation report

When finished, report:

1. files added;
2. files modified;
3. Payload schema added;
4. migration created;
5. migration SQL/schema effect in plain English;
6. routing/layout refactor performed;
7. booking endpoint changes;
8. analytics/UTM changes;
9. commands run and their results;
10. any remaining limitation or manual deployment step.

Do not merely say “implemented”.

Call out anything that could affect deployment or existing CMS data.

Most importantly: **do not make destructive migration choices silently.**