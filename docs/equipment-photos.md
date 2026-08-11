# Equipment photos — sourcing

`public/equipment/*.webp` are **labelled stand-ins**, not the real product shots. They exist so
the technology page has a real layout and a real aspect ratio, and so swapping in a photo is a
single file copy with no code change.

## How to replace one

1. Get the image (see the table below).
2. Resize to **1200 × 900** (4:3), convert to WebP, quality ~82.
3. Save over the existing file, keeping the filename exactly.
4. Set `photoPending: false` for that device in `src/lib/equipment.ts` — that is what removes the
   "photo coming" badge from the card.

The card uses `object-contain` on a padded ivory tile, so cut-outs on a white or transparent
background sit correctly without cropping. A photographed-in-situ shot works too, but then the
whole set should switch to `object-cover` at once rather than mixing the two.

## Where each one comes from

| File | Device | Source | Notes |
| --- | --- | --- | --- |
| `vatech-ezray-air.webp` | Vatech EzRay Air | vatech.com product page / press kit | Vatech publishes product renders per model. |
| `vatech-cbct.webp` | Vatech CBCT | vatech.com | **Model unconfirmed** — see below. |
| `trios-3-move.webp` | 3Shape TRIOS 3 Move+ | 3shape.com press area | 3Shape runs a press/media section with downloadable product imagery. |
| `ems-airflow-master.webp` | EMS AIRFLOW Prophylaxis Master Premium | ems-dental.com | Product imagery is generally distributor-gated; the local EMS distributor is usually the fastest route. |
| `philips-zoom-4.webp` | Philips Zoom WhiteSpeed | philips.com | Philips brand assets have explicit usage terms — read them before publishing. |
| `forestadent.webp` | FORESTADENT | forestadent.com | |
| `damon-ormco.webp` | Damon System | ormco.com | |
| `american-orthodontics.webp` | American Orthodontics | americanortho.com | |

## Two things to settle with the client

1. **Licence.** Manufacturer press photos are not automatically free to reuse on a commercial
   clinic site. Most manufacturers permit it for authorised users of the equipment, some require
   written approval, and terms differ per brand. The safest and best-looking option is photographing
   the actual units in the clinic — it also removes the licence question entirely and shows the real
   rooms a patient will sit in.

2. **The CBCT model.** The existing site says only "КТ Vatech" with no model number. Vatech sells
   several CBCT lines (Green X, PaX-i3D and others) and they are not interchangeable in spec.
   Confirm which unit is installed, then update `name` in `src/lib/equipment.ts` — the current
   `"Vatech CBCT"` is deliberately generic rather than a guess, but a model number is worth real
   search traffic.

## Also unresolved

The sterilisation line is named **Megalab** on the existing site. No manufacturer URL was
verifiable, so it renders as a closing band with no outbound link rather than pointing at a guessed
domain. If the vendor is confirmed, it can become a device card like the rest — add it to
`deviceOrder` and the copy to `technology.page.devices` in all three dictionaries.
