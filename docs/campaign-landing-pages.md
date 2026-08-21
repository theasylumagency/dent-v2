# Campaign landing pages

Supersedes the URL scheme and field list in
*Codex Brief — Campaign Landing Pages & Payload CMS.md*, which describes the
first implementation. The mechanics below are what the code actually does.

## URLs

A campaign is served from the root of its locale:

```
/ka/veneers-summer-2026
/en/veneers-summer-2026
/ru/veneers-summer-2026
```

The old `/:lang/lp/:slug` shape is kept alive by a permanent redirect in
`next.config.ts`, so ads and printed material carrying it still work.

Campaign slugs share a namespace with the real site routes. Next resolves a
static segment before a dynamic one, so `/ka/services` still reaches the
services page — but a campaign named `services` would then be unreachable and
invisible, with nothing to diagnose. `RESERVED_SLUGS` in
`src/lib/campaign-slug.ts` turns that into a validation error instead. **When a
new page is added under `src/app/[lang]/(site)`, add its segment to that list.**

## The editing model

An editor can publish a campaign with three things filled in:

1. **კამპანიის სახელი** — internal, never shown to a visitor.
2. **მთავარი სათაური** — the hero headline, in Georgian.
3. **სტატუსი** set to *აქტიური*.

Everything else is an optional override. The slug is transliterated from the
campaign name (`ვინირები — ზაფხული 2026` → `vinirebi-zapkhuli-2026`) and never
rewritten afterwards, so a typo fix in the name cannot break a live ad.

Blank fields are not holes. `src/lib/landing-copy.ts` resolves every visible
string against `dict.landing` in the locale dictionaries, so a two-field
campaign renders a complete page — reasons, next steps, form copy, closing CTA
— in all three languages. Anything the editor writes wins over the default.

Array sections (reasons, next steps) fall back **as a whole** rather than row by
row: two authored reasons plus one from the dictionary would read as an editing
mistake, and there is no sensible order to interleave them in.

## Localization

Georgian is the only locale a field is required in. Payload's own `required`
runs against whichever locale is being saved, which would mean an editor who
opens the English tab of a finished campaign can no longer save it. Validation
is keyed off `req.locale` instead — see `requiredInGeorgian` in
`src/collections/LandingPages.ts`. Untranslated locales fall back to Georgian,
which is Payload's `localization.fallback` behaviour for the whole site.

## Publishing states

| Status | What a visitor gets |
| --- | --- |
| მუშავდება (`draft`) | 404 |
| აქტიური (`active`) | The page |
| დასრულებული (`archived`) | Depends on **დასრულების შემდეგ** |

Archived behaviours: a *campaign ended* screen (default, text auto-filled), a
redirect to another campaign, or leaving the page public.

A redirect target is a CMS relationship, not a free-form URL, so the only
checks left are the ones the field cannot express: not itself, not a draft, and
not another redirect. Refusing to point at a redirect is stricter than walking
the chain and much easier to explain — every archived campaign lands on a real
page in exactly one hop.

## Indexing

`indexable` is off by default: a paid-campaign destination competing with the
clinic's own pages in organic search is a liability, not a win. Only
`active` **and** `indexable` campaigns enter `sitemap.xml`; everything else is
served `noindex`.

## Motion

Campaign pages animate more than the rest of the site — a visitor arrives from
an ad and decides in seconds. The hero animates **on load** (`.lp-rise`,
`.lp-settle`) because there is nothing above the fold to scroll into view;
everything below reuses the site's `Reveal` scroll observer. On phones,
`LandingMobileBar` follows the visitor with call, WhatsApp and form buttons —
it appears once the hero scrolls away and hides again while the form is on
screen.

All of it is scoped to `.js` for the same reason `.reveal` is: the served state
must be visible, so a blocked bundle degrades to a plain page rather than a
blank one.

## Deploying a change to this collection

Field changes are schema changes. After editing `LandingPages.ts`:

```bash
npm run migrate:create   # needs a running Postgres
npm run generate:types
```

Commit the generated `.ts` **and** `.json` in `src/migrations` — the JSON is the
snapshot the next migration diffs against, and dropping it makes the following
`migrate:create` produce a wrong delta. Then on the server, `npm run migrate`
before restarting.
