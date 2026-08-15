# Total Charm Dent — Homepage Technology Redesign

## Objective

Replace the existing homepage `Technology` teaser with a cinematic, scroll-linked editorial section.

This section is **not an equipment catalogue**.

Its purpose is to communicate:

- precision
- modern clinical standards
- controlled treatment
- trust
- technological sophistication

The full `/[lang]/technology` page remains the place for detailed equipment information.

Do **not** redesign or modify unrelated homepage sections.

---

# 1. Existing project

Homepage:

`src/app/[lang]/page.tsx`

Current technology component:

`src/components/home/Technology.tsx`

The homepage already renders:

```tsx
<Technology dict={dict} lang={locale} />
```

Keep that public API unless there is a strong implementation reason to change it.

The current project does not yet include Motion.

Install:

```bash
npm install motion
```

For hooks such as `useScroll`, `useTransform`, and `useReducedMotion`, import from:

```tsx
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
```

The animated component must be a client component.

Do not convert the whole homepage to a client component.

---

# 2. Component architecture

Keep:

```text
src/components/home/Technology.tsx
```

as the server-facing wrapper.

Create:

```text
src/components/home/TechnologyExperience.tsx
```

with:

```tsx
"use client";
```

Recommended structure:

```text
Technology.tsx
 └─ prepares localized copy / URLs
    └─ TechnologyExperience.tsx
       ├─ Intro
       ├─ Scene 01 — CBCT
       ├─ Scene 02 — Digital scan
       ├─ Scene 03 — AIRFLOW
       ├─ Scene 04 — Zoom
       └─ Finale
```

Do not build four cards.

All scenes belong to one continuous visual environment.

---

# 3. Equipment

Homepage sequence:

### 01
Vatech CBCT

### 02
3Shape TRIOS 3 Move+

### 03
EMS AIRFLOW Prophylaxis Master Premium

### 04
Philips Zoom WhiteSpeed / Zoom 4

Do **not** use iTero unless it is explicitly confirmed later.

Do not alter the canonical equipment names in:

`src/lib/equipment.ts`

Homepage-specific editorial imagery may be separate from the documentary images used by the full Technology page.

---

# 4. Homepage image assets

Create a dedicated location:

```text
/public/images/home/technology/
```

Target filenames:

```text
cbct.webp
trios-3-move.webp
airflow.webp
zoom-4.webp
```

Centralize these paths in one scene configuration object/array so images can be replaced later without touching animation logic.

Do not scatter image paths throughout JSX.

If the final TRIOS image is not supplied yet, temporarily use the existing corresponding equipment image rather than pretending the generated iTero image is the correct machine.

---

# 5. Visual language

Background:

deep navy / near-charcoal.

Do not change the site's global light theme.

This dark environment exists only inside this section.

Brand blue:

```css
#7AC7EF
```

Already represented by:

```css
var(--color-accent-300)
```

Use it for:

- restrained glow
- line work
- circular brand geometry
- micro labels
- transitional accents

Do not use bright neon.

Do not create sci-fi HUD graphics.

Do not add fake medical data.

The mood is:

```text
slow
precise
controlled
editorial
premium
quiet
```

Not:

```text
flashy
futuristic
energetic
tech-demo
```

---

# 6. Overall desktop structure

Outer scroll section:

```text
≈ 450vh
```

Inside:

```text
100svh sticky viewport
```

Suggested structure:

```tsx
<section ref={sectionRef} className="relative h-[450vh] ...">
  <div className="sticky top-0 h-svh overflow-hidden">
    ...
  </div>
</section>
```

On smaller screens use approximately:

```text
320–330vh
```

Do not hard-code viewport assumptions that break with mobile browser chrome.

Prefer `svh` where appropriate.

---

# 7. Scroll progress

Use section-relative scroll progress:

```tsx
const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ["start start", "end end"],
});
```

Avoid scroll event listeners and React state updates on every scroll frame.

Drive visual properties directly from MotionValues using `useTransform`.

Keep all principal scene layers mounted and animate:

- opacity
- scale
- translate
- clip-path where explicitly specified

rather than repeatedly mounting/unmounting the entire section.

---

# 8. Scene ranges

Use approximately these ranges:

```text
0.00 – 0.10  Intro
0.10 – 0.30  CBCT
0.30 – 0.48  CBCT → TRIOS
0.48 – 0.65  TRIOS
0.65 – 0.78  AIRFLOW
0.78 – 0.91  Zoom
0.91 – 1.00  Finale
```

These values are the design baseline.

Minor tuning after browser testing is allowed.

Do not fundamentally change the choreography.

---

# 9. FRAME 00 — Intro

Initial environment:

- deep navy background
- no visible machine at first
- large fragment of Total Charm Dent circular brand geometry
- geometry opacity approximately 8–12%

Text:

```text
ტექნოლოგია
```

Headline:

```text
სიზუსტე შემთხვევითი არ არის.
```

Supporting copy:

```text
თანამედროვე ტექნოლოგია გვეხმარება დავინახოთ მეტი,
დავგეგმოთ ზუსტად და თითოეული გადაწყვეტილება
უფრო გააზრებულად მივიღოთ.
```

Intro should enter calmly.

Suggested motion:

```text
opacity 0 → 1
translateY 18px → 0
```

On exit:

```text
opacity 1 → 0
translateY 0 → -16px
```

No dramatic entrance.

---

# 10. FRAME 01 — CBCT

Micro label:

```text
01
DIAGNOSTICS
```

Headline:

```text
ვხედავთ მეტს.
```

Copy:

```text
სამგანზომილებიანი დიაგნოსტიკა
მკურნალობის სწორად დაგეგმვისთვის.
```

Image composition desktop:

- machine on right/centre-right
- approximately 78–82% of available viewport height
- allowed to approach the centre line
- large negative space remains for text
- subtle vertical blue light behind device

Suggested image motion:

```text
opacity: 0.15 → 1
scale: 1.05 → 1
```

Avoid obvious sliding.

Lighting should feel like the machine is being revealed from darkness.

---

# 11. Signature transition — CBCT → TRIOS

This is the section's one major branded transition.

Use a large circular mask derived from the Total Charm Dent logo geometry.

At first:

- CBCT fills visual field
- small/medium circular area reveals TRIOS

As scroll continues:

```text
circle radius → expands beyond viewport
```

Inside circle:

```text
TRIOS
```

Outside circle:

```text
CBCT
```

Eventually TRIOS replaces the whole image.

A CSS `clip-path: circle(...)` driven by a MotionValue is acceptable.

Use this signature mask **once only**.

Do not repeat it between every scene.

---

# 12. FRAME 02 — 3Shape TRIOS 3 Move+

Micro label:

```text
02
DIGITAL PLANNING
```

Headline:

```text
ვგეგმავთ ზუსტად.
```

Copy:

```text
ციფრული სკანირება მკურნალობის დაგეგმვას
უფრო ნათელს და პროგნოზირებადს ხდის.
```

Desktop composition:

- machine positioned farther right than CBCT
- more negative space
- monitor becomes primary focus point
- monitor should roughly align vertically with headline area

The overall device stays almost still.

If useful, allow only an extremely subtle difference between image motion and monitor focus.

Do not create fake software animation inside the monitor.

---

# 13. FRAME 03 — EMS AIRFLOW

Micro label:

```text
03
PRECISION CARE
```

Headline:

```text
ვმუშაობთ ფაქიზად.
```

Copy:

```text
ზუსტი და კონტროლირებადი ტექნოლოგია —
მეტი კომფორტისთვის.
```

This scene intentionally changes scale.

Do not show AIRFLOW like another full product shot.

Use a large editorial crop focusing on:

- transparent chamber
- liquid/reservoir
- metal
- glass
- white surfaces
- handpiece detail

Desktop image can extend beyond the right viewport edge.

Suggested entrance:

```text
scale: 1.10–1.12 → 1.02–1.03
opacity: 0 → 1
```

TRIOS should primarily dissolve out.

Avoid expensive animated blur unless absolutely necessary.

---

# 14. FRAME 04 — Philips Zoom 4

Micro label:

```text
04
AESTHETIC TECHNOLOGY
```

Headline:

```text
დეტალებს მნიშვნელობა აქვს.
```

Copy:

```text
თანამედროვე მიდგომა —
მეტი კონტროლით ესთეტიკურ პროცედურებში.
```

The treatment head/light is the visual focus.

The machine begins comparatively dark.

As the scene becomes active:

```text
light glow: low → controlled active glow
```

Use the brand blue family.

Do not flash.

Do not pulse.

This is the visual climax of the sequence.

---

# 15. AIRFLOW → Zoom visual bridge

Use the cool blue highlight from the AIRFLOW reservoir/details as a visual match into the Zoom treatment light.

This can be achieved through:

- opacity overlap
- a controlled radial glow
- scale change

Do not implement a literal lens flare.

The transition should feel like a match cut, not an effect preset.

---

# 16. FRAME 05 — Finale

Remove all technical UI:

- numbers
- English micro labels
- model references

Visual background becomes calm again.

Primary statement:

```text
ტექნოლოგია მხოლოდ ინსტრუმენტია.
```

Secondary statement:

```text
მთავარია, როგორ ვიყენებთ მას.
```

CTA:

```text
ტექნოლოგიების ნახვა →
```

CTA destination:

```text
/[lang]/technology
```

Use the project's existing localized route helper.

CTA should look secondary/editorial, not like the primary booking CTA.

---

# 17. Desktop composition

Target breakpoint:

```text
lg and above
```

General conceptual grid:

```text
text zone:   ~36–40%
visual zone: ~60–64%
```

Do not implement this as visible rigid columns.

Images are free to cross the conceptual centre line.

Text should use existing site typography.

Do not introduce another font.

Use the existing `font-display` stack for major headlines.

Respect the project's existing Georgian typography corrections.

---

# 18. Large scene numbers

`01`, `02`, `03`, `04`

may appear as oversized background typography.

Approximate desktop size:

```text
120–160px
```

Opacity:

```text
~5–10%
```

They should be barely perceptible.

They are atmosphere, not navigation.

---

# 19. Mobile design

Do not simply shrink the desktop composition.

Below `lg`:

- visual area approximately upper 55–58%
- copy approximately lower 42–45%
- images may crop much more aggressively
- text stays readable on the dark background
- apply a smooth image-to-background gradient if required

Approximate outer scroll length:

```text
320vh
```

---

# 20. Mobile Intro

Copy may be shortened to:

```text
ვხედავთ მეტს, ვგეგმავთ ზუსტად
და ვმუშაობთ მეტი კონტროლით.
```

Large circular logo fragment may remain in the background.

Keep substantial breathing room.

---

# 21. Mobile CBCT

Show the device large.

Approximate visual width:

```text
80–90vw
```

Copy underneath:

```text
01 · DIAGNOSTICS
ვხედავთ მეტს.
სამგანზომილებიანი დიაგნოსტიკა
მკურნალობის სწორად დაგეგმვისთვის.
```

Motion:

```text
scale 1.04 → 1
small upward drift only
```

---

# 22. Mobile signature transition

Keep the circular CBCT → TRIOS mask.

Shorten its duration relative to desktop.

This is the only complex mobile transition.

---

# 23. Mobile TRIOS

Crop primarily around:

- monitor
- scanner
- upper device structure

The digital dental model should remain visible.

Do not add a separate animated UI layer.

---

# 24. Mobile AIRFLOW

Use an aggressive detail crop.

This scene should show material quality and precision rather than the full machine.

Text:

```text
03 · PRECISION CARE
ვმუშაობთ ფაქიზად.
ზუსტი და კონტროლირებადი ტექნოლოგია —
მეტი კომფორტისთვის.
```

---

# 25. Mobile Zoom

Treatment light occupies a strong part of the visual area.

Use gradual controlled illumination.

No flicker.

Text:

```text
04 · AESTHETIC TECHNOLOGY
დეტალებს მნიშვნელობა აქვს.
თანამედროვე მიდგომა —
მეტი კონტროლით ესთეტიკურ პროცედურებში.
```

---

# 26. Mobile Finale

Return to almost empty navy space.

Centered or near-centred:

```text
ტექნოლოგია მხოლოდ ინსტრუმენტია.

მთავარია, როგორ ვიყენებთ მას.
```

Then:

```text
ტექნოლოგიების ნახვა →
```

Give this state enough breathing room before the next homepage section begins.

---

# 27. Reduced motion

Accessibility is mandatory.

Respect:

```css
prefers-reduced-motion: reduce
```

Do not leave a reduced-motion user scrolling through 450vh of nearly static sticky content.

For reduced motion provide a normal document-flow alternative:

```text
Intro
CBCT image + copy
TRIOS image + copy
AIRFLOW image + copy
Zoom image + copy
Final statement + CTA
```

No sticky choreography.

No circular mask animation.

No scale animation.

Simple static or very light opacity treatment only.

---

# 28. Semantic structure

Even though this is visually cinematic, HTML must remain meaningful.

Use:

```html
<section>
<h2>
<h3>
<p>
<a>
```

appropriately.

Do not encode essential copy into images.

Every meaningful image needs localized `alt`.

Decorative logo geometry should have:

```html
aria-hidden="true"
```

---

# 29. Internationalization

The site supports:

```text
ka
en
ru
```

Do not hard-code Georgian strings inside the client component.

Add the new homepage technology copy to all three dictionaries.

Preferred structure:

```json
"technology": {
  ...
  "homeExperience": {
    "intro": {},
    "scenes": {
      "cbct": {},
      "trios": {},
      "airflow": {},
      "zoom": {}
    },
    "finale": {}
  }
}
```

Keep technical micro-labels localizable too even if the initial English wording is intentionally retained across languages.

The project i18n checker must continue to pass.

---

# 30. Full Technology page

Do not remove or weaken:

```text
/[lang]/technology
```

The detailed equipment page remains authoritative.

Homepage is only the editorial teaser.

Do not move the detailed equipment copy back onto the homepage.

---

# 31. Performance

This section contains several large images and scroll-linked effects.

Requirements:

- use `next/image`
- supply accurate `sizes`
- use WebP/AVIF-compatible source assets
- do not mark every image `priority`
- preload only what is genuinely needed for the beginning of the sequence
- avoid animated box-shadow where possible
- prefer transform and opacity
- avoid multiple simultaneous animated blurs
- do not update React state continuously from scroll position
- no requestAnimationFrame loop written manually unless absolutely necessary

The animation should remain smooth on a normal modern mobile device.

---

# 32. Do not use AnimatePresence as a slideshow by default

This experience is scroll-linked, not time-based.

Prefer permanently mounted layered scenes driven directly by MotionValues.

Use React state only where there is a clear semantic reason.

This prevents scroll progress from causing unnecessary React mount/unmount cycles.

---

# 33. Styling

Prefer Tailwind utilities and a small amount of component-specific CSS only where necessary for:

- mask geometry
- gradients
- complex responsive positioning

Do not dump hundreds of lines of section-specific CSS into `globals.css`.

Global design tokens already exist and should be reused.

If a new dark background token is useful, add it deliberately rather than repeating arbitrary hex colours throughout JSX.

---

# 34. Remove from the current homepage section

The redesigned homepage must no longer show the existing:

- eight-equipment text grid
- four icon tile card
- manufacturer link cloud
- care checklist card

These concepts belong to the full Technology page.

Do not delete the underlying data used by the Technology page.

Only replace the homepage presentation.

---

# 35. Interaction restraint

Do not add:

- carousel controls
- pagination dots
- scroll hijacking
- mouse-follow effects
- draggable elements
- autoplay timers
- horizontal scroll
- fake progress dashboards

The browser's normal vertical scroll drives the experience.

---

# 36. Acceptance criteria

The implementation is complete when:

### Desktop
- intro occupies a calm opening state
- CBCT appears as the first monumental object
- CBCT → TRIOS uses one branded circular reveal
- AIRFLOW changes the visual scale with a close crop
- Zoom provides the visual light climax
- finale returns the section to calm typography

### Mobile
- text never competes with the machine
- only one complex mask transition remains
- images crop intentionally rather than looking like desktop screenshots
- section does not feel excessively long

### Accessibility
- reduced-motion experience works in normal document flow
- all copy is available as HTML
- keyboard/focus behaviour remains normal

### Engineering
Run successfully:

```bash
npm run lint
npm run typecheck
npm run check:i18n
npm run build
```

No new console errors.

No unrelated redesign.

---

# 37. Important implementation philosophy

The target is **not to demonstrate Motion**.

The target is to make Motion almost disappear.

A visitor should remember:

```text
precision
control
technology
confidence
```

—not:

```text
that website had a lot of animations
```

When uncertain between two animation options, choose the quieter one.