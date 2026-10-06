import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Content half of the sixth direction: the five prosthetics services, the
 * intraoral scanner linked to the three it is used for, and the services
 * page's meta description brought up to the new count.
 *
 * Data in a migration rather than in `npm run seed`, because seeding is for
 * an empty database and this one has to reach the live site, whose content
 * the clinic edits. `npm run migrate` is already a step of every deploy.
 *
 * Written to leave the clinic's own edits alone:
 *
 * - A service whose slug already exists is skipped, not overwritten.
 * - The scanner only gains links; nothing is removed from it.
 * - The meta description is replaced only where it still reads exactly
 *   what the seed put there. An edited one is the clinic's.
 *
 * The copy is a frozen snapshot of what `scripts/seed-data/content/*.json`
 * holds for these slugs on the day it was written — the two are kept in
 * step so a fresh database and the live one end up identical. Text comes
 * from the list the clinic's head sent (October 2026); details he has not
 * confirmed (visit counts, timelines, lab, prices) are deliberately absent.
 */

type Locale = 'ka' | 'en' | 'ru'
type Copy = { title: string; blurb: string; lead: string; points: string[] }

const SERVICES: ({ slug: string } & Record<Locale, Copy>)[] = [
  {
    slug: "crowns",
    ka: {
      title: "კერამიკული და ცირკონიის გვირგვინები",
      blurb: "დაზიანებული კბილის ფორმის, სიმტკიცისა და ფუნქციის აღდგენა.",
      lead: "გვირგვინი კბილს მთლიანად ფარავს და აღადგენს მის ფორმას, სიმტკიცესა და საღეჭ ფუნქციას, როცა კბილი იმდენად დაზიანებულია, რომ რესტავრაცია საკმარისი აღარ არის. ვამზადებთ კერამიკისა და ცირკონიის გვირგვინებს, ანაბეჭდს კი ინტრაორალური სკანერით ვიღებთ — ტრადიციული მასის ნაცვლად.",
      points: [
        "ციფრული ანაბეჭდი ინტრაორალური სკანერით",
        "შედეგის ციფრული დაგეგმვა მუშაობის დაწყებამდე",
        "დროებითი გვირგვინი მუდმივის მოლოდინში — კბილის გარეშე არ რჩებით",
        "კერამიკა ან ცირკონი — კლინიკური მდგომარეობისა და სასურველი შედეგის მიხედვით",
      ],
    },
    en: {
      title: "Ceramic and zirconia crowns",
      blurb: "Restoring the shape, strength and function of a damaged tooth.",
      lead: "A crown covers the whole tooth and restores its shape, strength and chewing function when the damage is too extensive for a restoration. We make ceramic and zirconia crowns and take the impression with an intraoral scanner instead of traditional impression paste.",
      points: [
        "Digital impression with an intraoral scanner",
        "The result is planned digitally before any work starts",
        "A temporary crown while the permanent one is made — you are never left without a tooth",
        "Ceramic or zirconia, chosen for the clinical situation and the result you want",
      ],
    },
    ru: {
      title: "Керамические и циркониевые коронки",
      blurb: "Восстановление формы, прочности и функции повреждённого зуба.",
      lead: "Коронка полностью покрывает зуб и восстанавливает его форму, прочность и жевательную функцию, когда повреждение слишком велико для реставрации. Мы изготавливаем керамические и циркониевые коронки, а слепок снимаем интраоральным сканером вместо традиционной слепочной массы.",
      points: [
        "Цифровой слепок интраоральным сканером",
        "Цифровое планирование результата до начала работы",
        "Временная коронка на период изготовления постоянной — вы не остаётесь без зуба",
        "Керамика или цирконий — в зависимости от клинической ситуации и желаемого результата",
      ],
    },
  },
  {
    slug: "bridges",
    ka: {
      title: "ხიდისებრი კონსტრუქციები",
      blurb: "ერთი ან რამდენიმე დაკარგული კბილის აღდგენა ფიქსირებული ხიდით.",
      lead: "ხიდი ერთი ან რამდენიმე დაკარგული კბილის ადგილს ავსებს და მეზობელ კბილებზე ან იმპლანტებზე მაგრდება. ეს ფიქსირებული კონსტრუქციაა — არ იხსნება და აღადგენს როგორც საღეჭ ფუნქციას, ისე ღიმილის მთლიანობას. ხიდის ტიპსა და მასალას გეგმის ეტაპზე ვარჩევთ.",
      points: [
        "ფიქსირებული კონსტრუქცია — მოსახსნელი პროთეზის გარეშე",
        "საყრდენად მეზობელი კბილები ან იმპლანტები",
        "ციფრული ანაბეჭდი და დაგეგმვა",
        "თანკბილვისა და ესთეტიკის გათვალისწინებით",
      ],
    },
    en: {
      title: "Dental bridges",
      blurb: "Replacing one or more missing teeth with a fixed bridge.",
      lead: "A bridge fills the gap left by one or more missing teeth and is anchored to the neighbouring teeth or to implants. It is a fixed restoration — it does not come out — and it restores both chewing function and the continuity of the smile. The type of bridge and the material are chosen at the planning stage.",
      points: [
        "A fixed restoration — no removable denture",
        "Supported by neighbouring teeth or by implants",
        "Digital impression and planning",
        "Planned around your bite and aesthetics",
      ],
    },
    ru: {
      title: "Мостовидные конструкции",
      blurb: "Восстановление одного или нескольких утраченных зубов несъёмным мостом.",
      lead: "Мост заполняет промежуток на месте одного или нескольких утраченных зубов и фиксируется на соседних зубах или на имплантах. Это несъёмная конструкция: она восстанавливает и жевательную функцию, и целостность улыбки. Тип моста и материал подбираются на этапе планирования.",
      points: [
        "Несъёмная конструкция — без съёмного протеза",
        "Опора на соседние зубы или импланты",
        "Цифровой слепок и планирование",
        "С учётом прикуса и эстетики",
      ],
    },
  },
  {
    slug: "implant-prosthetics",
    ka: {
      title: "იმპლანტზე დამაგრებული კონსტრუქციები",
      blurb: "გვირგვინი, ხიდი ან სრული ყბის კონსტრუქცია იმპლანტებზე.",
      lead: "იმპლანტი კბილის ფესვს ცვლის, ორთოპედიული კონსტრუქცია კი — თავად კბილს. იმპლანტზე ვამაგრებთ ცალკეულ გვირგვინს, ხიდს ან, კბილების სრული არარსებობისას, მთლიან კონსტრუქციას All-on-4 და All-on-6 პროტოკოლით. იმპლანტაციასა და პროთეზირებას ერთი გუნდი გეგმავს, ამიტომ კონსტრუქციის ფორმა და პოზიცია წინასწარაა გათვლილი.",
      points: [
        "ცალკეული გვირგვინი, ხიდი ან სრული ყბის კონსტრუქცია",
        "იმპლანტაცია და პროთეზირება — ერთ ციფრულ გეგმაში",
        "დროებითი კონსტრუქცია იმპლანტისა და გვირგვინის 3D მოდელით, მუდმივის მოლოდინში",
        "Straumann, DENTIUM და Bredent SKY სისტემები",
      ],
    },
    en: {
      title: "Implant-supported restorations",
      blurb: "A crown, a bridge or a full-arch restoration on implants.",
      lead: "An implant replaces the root of a tooth; the prosthetic restoration replaces the tooth itself. On implants we fix a single crown, a bridge or, when all teeth are missing, a full-arch restoration using the All-on-4 and All-on-6 protocols. Implantation and prosthetics are planned by one team, so the shape and position of the restoration are worked out in advance.",
      points: [
        "A single crown, a bridge or a full-arch restoration",
        "Implantation and prosthetics in one digital plan",
        "A temporary restoration made from 3D models of the implant and crown while the permanent one is made",
        "Straumann, DENTIUM and Bredent SKY systems",
      ],
    },
    ru: {
      title: "Конструкции на имплантах",
      blurb: "Коронка, мост или конструкция на всю челюсть на имплантах.",
      lead: "Имплант заменяет корень зуба, а ортопедическая конструкция — сам зуб. На имплантах мы фиксируем одиночную коронку, мост или, при полном отсутствии зубов, конструкцию на всю челюсть по протоколам All-on-4 и All-on-6. Имплантацию и протезирование планирует одна команда, поэтому форма и положение конструкции просчитаны заранее.",
      points: [
        "Одиночная коронка, мост или конструкция на всю челюсть",
        "Имплантация и протезирование — в одном цифровом плане",
        "Временная конструкция по 3D-моделям импланта и коронки на период изготовления постоянной",
        "Системы Straumann, DENTIUM и Bredent SKY",
      ],
    },
  },
  {
    slug: "removable-dentures",
    ka: {
      title: "მოსახსნელი პროთეზები",
      blurb: "საღეჭი ფუნქციისა და ღიმილის აღდგენა მოსახსნელი კონსტრუქციით.",
      lead: "მოსახსნელი პროთეზი აღადგენს საღეჭ ფუნქციასა და ღიმილის იერს, როცა რამდენიმე ან ყველა კბილი აკლია. ის ფიქსირებული კონსტრუქციის ალტერნატივაა — რომელი გამოსავალი ჯობს თქვენს შემთხვევაში, ექიმი გეგმის ეტაპზე აგიხსნით.",
      points: [
        "საღეჭი ფუნქციისა და ღიმილის იერის აღდგენა",
        "ინდივიდუალური დამზადება თქვენი ყბის ფორმის მიხედვით",
        "ფიქსირებულ ალტერნატივებთან შედარება გეგმის ეტაპზე",
      ],
    },
    en: {
      title: "Removable dentures",
      blurb: "Restoring chewing and the smile with a removable denture.",
      lead: "A removable denture restores chewing function and the look of the smile when several or all teeth are missing. It is an alternative to a fixed restoration — the doctor will explain at the planning stage which option suits your case better.",
      points: [
        "Chewing function and the look of the smile restored",
        "Made individually to the shape of your jaw",
        "Compared with fixed alternatives at the planning stage",
      ],
    },
    ru: {
      title: "Съёмные протезы",
      blurb: "Восстановление жевания и улыбки съёмной конструкцией.",
      lead: "Съёмный протез восстанавливает жевательную функцию и вид улыбки, когда отсутствуют несколько или все зубы. Это альтернатива несъёмной конструкции — какой вариант лучше подходит в вашем случае, врач объяснит на этапе планирования.",
      points: [
        "Восстановление жевательной функции и вида улыбки",
        "Индивидуальное изготовление по форме вашей челюсти",
        "Сравнение с несъёмными вариантами на этапе планирования",
      ],
    },
  },
  {
    slug: "full-mouth-rehabilitation",
    ka: {
      title: "კომპლექსური რეაბილიტაცია",
      blurb: "კბილების ფუნქციისა და ესთეტიკის აღდგენა ერთიანი გეგმით.",
      lead: "როცა საქმე ერთ კბილს სცდება — რამდენიმე კბილი აკლია, ნაწილი დაზიანებულია ან თანკბილვაა დარღვეული — მკურნალობას ერთ მთლიანობად ვგეგმავთ. გეგმას გუნდი კონსილიუმზე ადგენს და ის ითვალისწინებს ფუნქციას, ოკლუზიას, ესთეტიკასა და სახის საერთო ჰარმონიას. Digital Smile Design-ით მომავალ შედეგს მკურნალობის დაწყებამდე ხედავთ.",
      points: [
        "ერთიანი წერილობითი გეგმა ეტაპებით, ვადებითა და ღირებულებით",
        "Digital Smile Design — შედეგის ვიზუალიზაცია მკურნალობამდე",
        "გვირგვინები, ხიდები, ვინირები და იმპლანტზე დამაგრებული კონსტრუქციები — საჭიროების მიხედვით",
        "ფუნქციის, ოკლუზიის, ესთეტიკისა და სახის ჰარმონიის გათვალისწინებით",
      ],
    },
    en: {
      title: "Full-mouth rehabilitation",
      blurb: "Restoring function and aesthetics with one combined plan.",
      lead: "When the problem goes beyond a single tooth — several teeth are missing, others are damaged or the bite has changed — we plan the treatment as a whole. The plan is drawn up by the team at a case conference and takes into account function, the bite, aesthetics and the overall harmony of the face. With Digital Smile Design you see the future result before treatment begins.",
      points: [
        "One written plan with stages, timelines and costs",
        "Digital Smile Design — the result visualised before treatment",
        "Crowns, bridges, veneers and implant-supported restorations, as the case requires",
        "Planned around function, the bite, aesthetics and facial harmony",
      ],
    },
    ru: {
      title: "Комплексная реабилитация",
      blurb: "Восстановление функции и эстетики по единому плану.",
      lead: "Когда проблема выходит за пределы одного зуба — нескольких зубов нет, часть повреждена или нарушен прикус, — мы планируем лечение как единое целое. План составляет команда на консилиуме с учётом функции, окклюзии, эстетики и общей гармонии лица. С Digital Smile Design будущий результат вы видите ещё до начала лечения.",
      points: [
        "Единый письменный план с этапами, сроками и стоимостью",
        "Digital Smile Design — визуализация результата до лечения",
        "Коронки, мосты, виниры и конструкции на имплантах — по показаниям",
        "С учётом функции, окклюзии, эстетики и гармонии лица",
      ],
    },
  },
]

/** The intraoral scanner, and the new services it is used in. */
const SCANNER = 'trios-3-move'
const SCANNER_SERVICES = ['crowns', 'bridges', 'implant-prosthetics']

const SERVICES_META: Record<Locale, { from: string; to: string }> = {
  ka: {
    from: "Total Charm Dent-ის 16 სტომატოლოგიური სერვისი ხუთ მიმართულებად: დიაგნოსტიკა და ციფრული დაგეგმვა, თერაპია, ქირურგია და იმპლანტაცია, ორთოდონტია და ესთეტიკური სტომატოლოგია. ვაკე, თბილისი.",
    to: "Total Charm Dent-ის 21 სტომატოლოგიური სერვისი ექვს მიმართულებად: დიაგნოსტიკა და ციფრული დაგეგმვა, თერაპია, ქირურგია და იმპლანტაცია, პროთეზირება, ორთოდონტია და ესთეტიკური სტომატოლოგია. ვაკე, თბილისი.",
  },
  en: {
    from: "The 16 dental services of Total Charm Dent across five directions: diagnostics and digital planning, therapy, surgery and implantation, orthodontics and aesthetic dentistry. Vake, Tbilisi.",
    to: "The 21 dental services of Total Charm Dent across six directions: diagnostics and digital planning, therapy, surgery and implantation, prosthodontics, orthodontics and aesthetic dentistry. Vake, Tbilisi.",
  },
  ru: {
    from: "16 стоматологических услуг Total Charm Dent по пяти направлениям: диагностика и цифровое планирование, терапия, хирургия и имплантация, ортодонтия и эстетическая стоматология. Ваке, Тбилиси.",
    to: "21 стоматологическая услуга Total Charm Dent по шести направлениям: диагностика и цифровое планирование, терапия, хирургия и имплантация, протезирование, ортодонтия и эстетическая стоматология. Ваке, Тбилиси.",
  },
}

const localized = (copy: Copy) => ({
  title: copy.title,
  blurb: copy.blurb,
  lead: copy.lead,
  whatsIncluded: copy.points.map((text) => ({ text })),
})

async function serviceId(payload: MigrateUpArgs['payload'], req: MigrateUpArgs['req'], slug: string) {
  const found = await payload.find({
    collection: 'services',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    req,
  })
  return found.docs[0]?.id
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  /* After everything already there, so no existing service moves. Order
     only ranks services within their direction, but it is one sequence
     across the collection, so the new ones continue it. */
  const all = await payload.find({ collection: 'services', limit: 500, depth: 0, req })
  let order = all.docs.reduce((max, doc) => Math.max(max, Number(doc.order) || 0), 0)

  for (const service of SERVICES) {
    if (await serviceId(payload, req, service.slug)) {
      payload.logger.info(`  · ${service.slug} exists, left as it is`)
      continue
    }

    order += 1
    const created = await payload.create({
      collection: 'services',
      locale: 'ka',
      data: { slug: service.slug, category: 'prosthetics', order, ...localized(service.ka) },
      req,
    })

    for (const locale of ['en', 'ru'] as const) {
      await payload.update({
        collection: 'services',
        id: created.id,
        locale,
        data: localized(service[locale]),
        req,
      })
    }
    payload.logger.info(`  · ${service.slug} created`)
  }

  /* The scanner's card on the technology page lists what it is used for,
     and the prosthetics page lists the machines its services use — both
     read this one relationship. */
  const scanner = await payload.find({
    collection: 'equipment',
    where: { slug: { equals: SCANNER } },
    limit: 1,
    depth: 0,
    req,
  })
  const device = scanner.docs[0]
  if (device) {
    const current = (Array.isArray(device.services) ? device.services : []).map((entry) =>
      typeof entry === 'object' && entry !== null ? entry.id : entry,
    )
    const additions: (number | string)[] = []
    for (const slug of SCANNER_SERVICES) {
      const id = await serviceId(payload, req, slug)
      if (id !== undefined && !current.includes(id as never)) additions.push(id)
    }
    if (additions.length > 0) {
      await payload.update({
        collection: 'equipment',
        id: device.id,
        data: { services: [...current, ...additions] as never },
        req,
      })
    }
  }

  for (const locale of ['ka', 'en', 'ru'] as const) {
    const seo = await payload.findGlobal({ slug: 'seo', locale, depth: 0, req })
    const group = seo.services ?? {}
    if (group.description?.trim() !== SERVICES_META[locale].from) continue
    await payload.updateGlobal({
      slug: 'seo',
      locale,
      data: { services: { ...group, description: SERVICES_META[locale].to } },
      req,
    })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  const ids: (number | string)[] = []
  for (const service of SERVICES) {
    const id = await serviceId(payload, req, service.slug)
    if (id !== undefined) ids.push(id)
  }

  const scanner = await payload.find({
    collection: 'equipment',
    where: { slug: { equals: SCANNER } },
    limit: 1,
    depth: 0,
    req,
  })
  const device = scanner.docs[0]
  if (device && Array.isArray(device.services)) {
    const kept = device.services
      .map((entry) => (typeof entry === 'object' && entry !== null ? entry.id : entry))
      .filter((id) => !ids.includes(id))
    await payload.update({
      collection: 'equipment',
      id: device.id,
      data: { services: kept as never },
      req,
    })
  }

  for (const id of ids) {
    await payload.delete({ collection: 'services', id, req })
  }

  for (const locale of ['ka', 'en', 'ru'] as const) {
    const seo = await payload.findGlobal({ slug: 'seo', locale, depth: 0, req })
    const group = seo.services ?? {}
    if (group.description?.trim() !== SERVICES_META[locale].to) continue
    await payload.updateGlobal({
      slug: 'seo',
      locale,
      data: { services: { ...group, description: SERVICES_META[locale].from } },
      req,
    })
  }
}
