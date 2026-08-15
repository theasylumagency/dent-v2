# Doctor profiles — what is sourced, what is missing

The clinic's existing site publishes a name and a job title for four of the five doctors, and
nothing else. That is not enough for an about page: a grid of portraits with "Orthodontist"
underneath is exactly the page a patient skips.

Three of the four were reconstructed from the doctors' own public professional listings. The
facts were extracted and rewritten; no prose was copied, and nothing that could not be sourced
was invented.

## Where each profile came from

| Doctor | Source | Status |
| --- | --- | --- |
| Archil Apkhadze | CV supplied by the doctor, August 2026 | Sourced |
| Shorena Shioshvili | dentos.ge/shorena-shioshvili-845 | Sourced |
| Nino Buluashvili | — | **Missing** — renders a "profile in preparation" note |
| Salome Gabunia | dentos.ge/salome-gabunia-1260 | Sourced |
| Nino Osadze | blitsdental.com/ge/team/25/nino-osadze | Sourced |

## Deliberate omissions

- **Employment at other clinics in Tbilisi.** Several sources — including the chief doctor's own
  CV, which lists a Tbilisi practice for 2022–2026 — name current posts at other clinics in the
  city. Those lines were left out for all five doctors. They are true, but a clinic's own about
  page is not the place to advertise a competitor, and a patient reading "works at X" here will
  reasonably wonder which clinic they are actually booking. Moscow posts from 2002–2018 were
  kept: they are history rather than a competing option.
- **The long tail of the chief doctor's CV.** His course list runs to roughly sixty entries.
  Twelve are published — the international congresses and named professors — because a wall of
  sixty is read as noise and skipped entirely. The full CV is on file if anyone asks for it.
- **Languages that were not stated.** Only languages named on the source were listed. It is
  tempting to assume English for everyone; a wrong claim here is the kind a patient discovers in
  the chair.
- **Dates the source rendered as `30 November -0001`.** One source stores undated entries with a
  placeholder year. Those entries are listed without dates rather than with a fabricated one.

## Questions for the clinic

**For Nino Buluashvili (blocking — her profile is a placeholder until these come back):**

1. University and graduation year.
2. Residency or specialisation in orthodontics — where and when.
3. Which bracket systems does she work with (FORESTADENT, Damon, aligners)? This links her
   directly to the equipment page.
4. Courses and congresses, with years.
5. Languages.

**For Archil Apkhadze — answered by his CV. Two points left:**

6. **Languages.** The CV does not list them. Georgian and Russian are published on the strength
   of sixteen years of practice in Moscow and a Russian-language dissertation. If he speaks
   English — the Gothenburg, London, Bologna and Seoul courses suggest he might — say so and it
   goes in.
7. **His title.** He asked for "candidate of medical sciences" rather than "of dental sciences";
   that is now what all three locales say.

**For everyone:**

10. Are the sourced profiles accurate and approved for publication? Each doctor should confirm
    their own — this is their professional record, and it is going out under the clinic's name.
11. Georgian Dental Association membership or state certification numbers, if they wish to
    publish them. On a medical site these are the strongest single trust signal there is.
12. Consultation photos: the current portraits are fine, but if any doctor has been
    photographed since, newer is better.

## When answers arrive

Fill in `about.profiles[slug]` in all three dictionaries (`ka` first — it is the source of
truth for the shape), then set `profilePending[slug]` to `false` in `src/lib/team.ts`. That flag
is the only thing standing between a placeholder note and a rendered profile. Run
`npm run check:i18n` afterwards to confirm the three dictionaries still agree.
