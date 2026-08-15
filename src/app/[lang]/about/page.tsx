import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLeadDoctor, getTeam } from "@/lib/team";
import { getSeo } from "@/lib/seo";
import { getClinic } from "@/lib/clinic";
import { getServiceCount } from "@/lib/services";
import { buildStats } from "@/lib/stats";
import { media, site } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import DoctorProfile from "@/components/about/DoctorProfile";
import Credentials, { LanguageChips } from "@/components/about/Credentials";

/* `generateStaticParams` is not repeated here — the `[lang]` layout already
   declares it, and a page only needs its own when it adds a segment. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const t = dict.about;
  const meta = await getSeo("about", lang, {
    title: t.metaTitle,
    description: t.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/about`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/about`]),
        ["x-default", "/en/about"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/about`,
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.about;
  const [lead, profiles, clinic, serviceCount] = await Promise.all([
    getLeadDoctor(locale),
    getTeam(locale),
    getClinic(locale, dict.contact),
    getServiceCount(),
  ]);

  /* The specialist count is derived from the same two queries that render
     the profiles below, so the number and the faces can never disagree. */
  const stats = buildStats({
    labels: dict.stats,
    clinic,
    doctorCount: (lead ? 1 : 0) + profiles.length,
    serviceCount,
  });

  const jumps = [
    { id: "mission", label: t.jumpMission },
    ...(lead ? [{ id: lead.slug, label: t.jumpLead }] : []),
    { id: "team", label: t.jumpTeam },
  ];

  const profileLabels = {
    focus: t.focusLabel,
    education: t.educationLabel,
    experience: t.experienceLabel,
    training: t.trainingLabel,
    languages: t.languagesLabel,
    pendingLabel: t.pendingLabel,
    pendingText: t.pendingText,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.nav.about,
        item: `${site.url}/${locale}/about`,
      },
    ],
  };

  /* `Person`, not `Physician` — in schema.org `Physician` descends from
     MedicalBusiness and describes a practice, not a human being. The
     clinic itself is already published as a `Dentist` from the layout, so
     `worksFor` points these people at that node rather than repeating it.

     The pending doctor is included with name and job title only. Emitting
     an `alumniOf` we do not have would be an assertion of fact, and
     structured data is exactly the wrong place to guess. */
  const peopleLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.teamTitle,
    url: `${site.url}/${locale}/about`,
    itemListElement: [...(lead ? [lead] : []), ...profiles].map((doctor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: doctor.name,
        jobTitle: doctor.role,
        image: doctor.photo ? `${site.url}${doctor.photo}` : undefined,
        url: `${site.url}/${locale}/about#${doctor.slug}`,
        worksFor: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
        /* An unpublished profile is published as name and job title only.
           Emitting an `alumniOf` we do not have would be an assertion of
           fact, and structured data is the wrong place to guess. */
        ...(doctor.published
          ? {
              description: doctor.focus,
              knowsAbout: doctor.tags.length ? doctor.tags : undefined,
              knowsLanguage: doctor.languages,
              alumniOf: doctor.education.map((item) => ({
                "@type": "EducationalOrganization",
                name: item,
              })),
            }
          : {}),
      },
    })),
  };

  return (
    <>
      <PageHero
        eyebrow={dict.nav.about}
        title={t.title}
        lead={t.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[{ label: t.breadcrumbHome, href: `/${locale}` }, { label: dict.nav.about }]}
        aside={
          <Reveal delay={160}>
            <nav aria-label={t.jumpLabel} className="border-t border-ivory-400 pt-8">
              <ul className="flex flex-wrap gap-2">
                {jumps.map((jump) => (
                  <li key={jump.id}>
                    <a
                      href={`#${jump.id}`}
                      className="inline-flex rounded-full border border-ivory-600 bg-ivory-50 px-4 py-2 text-xs text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                    >
                      {jump.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        }
      />

      {/* Mission and vision. These moved off the home page rather than
          being copied — the home section is now a short teaser that links
          here, so the same two paragraphs never sit on two URLs. */}
      <section
        id="mission"
        className="section relative scroll-mt-20 overflow-hidden border-b border-ivory-400 bg-ivory-100"
      >
        <div className="aura -right-32 top-20 h-[28rem] w-[28rem] opacity-30" aria-hidden="true" />

        <div className="shell relative">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift">
                <Image
                  src={media.interior[0]}
                  alt={dict.mission.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
                  aria-hidden="true"
                />
              </div>
            </Reveal>

            <div className="lg:col-span-7">
              <Reveal>
                <p className="eyebrow">{t.missionLabel}</p>
                <h2 className="mt-6 fluid-title font-display">{t.missionTitle}</h2>
              </Reveal>

              <Reveal delay={120}>
                <div className="mt-10 space-y-8">
                  <div className="relative border-l-2 border-accent-400 pl-6">
                    <p className="label-micro text-accent-700">{dict.mission.missionLabel}</p>
                    <p className="mt-3 text-base leading-relaxed text-ink-700">
                      {dict.mission.missionText}
                    </p>
                  </div>

                  <div className="relative border-l-2 border-accent-400 pl-6">
                    <p className="label-micro text-accent-700">{dict.mission.visionLabel}</p>
                    <p className="mt-3 text-base leading-relaxed text-ink-700">
                      {dict.mission.visionText}
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={180}>
                {/* The last-child rule catches an odd count: two of the four
                    figures are optional claims, and an orphan in a 2×2 card
                    left a visible empty cell. It spans instead. */}
                <dl className="card mt-12 grid grid-cols-2 divide-x divide-y divide-ivory-300 overflow-hidden [&>*:last-child:nth-child(odd)]:col-span-2">
                  {stats.map((stat) => (
                    <div key={stat.key} className="flex flex-col-reverse px-6 py-7">
                      <dt className="mt-2 text-xs leading-relaxed tracking-wide text-ink-600">
                        {stat.label}
                      </dt>
                      <dd className="font-display text-3xl text-ink-900">
                        {stat.value}
                        <span className="text-accent-600">{stat.suffix}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>

          {/* The clinic's five commitments, from the original Total Charm
              page. They lived on the old home page and lost their slot when
              it was restructured into teasers — rendered nowhere for a while,
              which made them a quiet content regression rather than copy
              anyone decided to drop.

              They belong here rather than on the technology page: none of
              them is about a machine. They are what the mission paragraph
              above means in practice, so they close that section instead of
              opening a new one — no extra band, no break in the page's
              ivory rhythm. */}
          <Reveal delay={220}>
            <div className="mt-20 border-t border-ivory-400 pt-14 lg:mt-24">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <p className="eyebrow">{dict.care.label}</p>
                  <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
                    {dict.care.title}
                  </h2>
                </div>

                <ul className="divide-y divide-ivory-400 border-y border-ivory-400 lg:col-span-8">
                  {dict.care.items.map((item, index) => (
                    <li key={item} className="flex gap-5 py-5">
                      <span className="label-micro shrink-0 pt-1 tabular-nums text-accent-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-base leading-relaxed text-ink-700">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Lead doctor. The long-form bio lives here; the home page keeps the
          portrait, the years and the one-line credential. Rendered only if
          somebody is flagged as chief doctor in the admin. */}
      {lead && (
        <section
          id={lead.slug}
          className="section relative scroll-mt-20 overflow-hidden border-b border-ivory-400 bg-ivory-200"
        >
          <div className="aura -left-40 top-0 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />

          <div className="shell relative grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-20">
            <Reveal className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift">
                <Image
                  src={lead.photo}
                  alt={lead.photoAlt}
                  fill
                  sizes="(min-width: 1024px) 38vw, 90vw"
                  className="object-cover object-top"
                />
                <div
                  className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
                  aria-hidden="true"
                />
              </div>
            </Reveal>

            <div className="lg:col-span-7">
              <Reveal>
                <p className="eyebrow">{dict.doctor.label}</p>
                <h2 className="mt-6 fluid-title font-display">{lead.name}</h2>
                <p className="mt-3 text-sm tracking-wide text-accent-700">{lead.role}</p>
              </Reveal>

              {lead.experienceYears && (
                <Reveal delay={100}>
                  <div className="mt-8 flex items-baseline gap-4">
                    <span className="font-display text-5xl leading-none text-accent-700 lg:text-6xl">
                      {lead.experienceYears}
                    </span>
                    <span className="max-w-[8rem] text-sm leading-tight tracking-wide text-ink-600">
                      {dict.doctor.experienceLabel}
                    </span>
                  </div>
                </Reveal>
              )}

              <Reveal delay={150}>
                <p className="mt-8 font-display text-xl leading-relaxed text-ink-800">
                  {lead.focus}
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-700">
                  {lead.bio.map((block) => (
                    <p key={block.text}>{block.text}</p>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={250}>
                <ul className="mt-8 flex flex-wrap gap-2.5">
                  {lead.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-xs tracking-wide text-accent-700"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>

          {/* Full credentials, in the same component the profiles below use.
              Kept out of the two-column block above so the twelve training
              entries get the page width rather than a 7-column gutter. */}
          <div className="shell relative mt-14 lg:mt-20">
            <Reveal>
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-8">
                  <Credentials groups={lead} labels={profileLabels} />
                </div>
                <div className="lg:col-span-4">
                  <LanguageChips label={t.languagesLabel} languages={lead.languages} />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section
        id="team"
        className="section relative scroll-mt-20 overflow-hidden border-b border-ivory-400 bg-ivory-100"
      >
        <div className="shell relative">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">{dict.team.label}</p>
              <h2 className="mt-6 fluid-title font-display">{t.teamTitle}</h2>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <p className="text-base leading-relaxed text-ink-700 lg:pt-4">{dict.team.lead}</p>
            </Reveal>
          </div>

          <div className="mt-16 space-y-16 lg:mt-20 lg:space-y-24">
            {profiles.map((profile, index) => (
              <DoctorProfile
                key={profile.slug}
                profile={profile}
                flipped={index % 2 === 1}
                labels={profileLabels}
              />
            ))}
          </div>
        </div>
      </section>

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(peopleLd) }}
      />
    </>
  );
}
