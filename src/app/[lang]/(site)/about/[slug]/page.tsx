import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getDoctor, getDoctorIndex, getTeam } from "@/lib/team";
import { route } from "@/lib/routes";
import { site } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";
import RichText from "@/components/ui/RichText";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import Credentials, { LanguageChips } from "@/components/about/Credentials";
import TrackedView from "@/components/analytics/TrackedView";

/**
 * One doctor's page.
 *
 * **Why this route exists.** Doctors used to be anchors on `/about` and
 * nothing more, which meant a search for a doctor by name — a real and
 * common query for a clinic — had nowhere to land but a page about the
 * clinic, with that person somewhere down it. It also meant the meta fields
 * an editor would reasonably expect on a doctor had nowhere to go, since a
 * `<title>` belongs to a page.
 *
 * The anchors are kept. `/ka/about#archil-apkhadze` still resolves to the
 * same block on the about page it always did, so every shared link and
 * every internal jump keeps working; this page is an addition, not a move.
 *
 * Only published doctors get one. An unpublished profile renders a "in
 * preparation" note on the about page, and a URL whose entire content is a
 * note saying there is no content is a page worth not having — it would be
 * thin content in a sitemap, on a medical site, which is the specific thing
 * search engines discount hardest.
 */

export async function generateStaticParams() {
    return (await getDoctorIndex()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
    const { lang, slug } = await params;
    if (!isLocale(lang)) return {};

    const doctor = await getDoctor(slug, lang);
    if (!doctor?.published) return {};

    const dict = await getDictionary(lang);

    /* The editor's meta text wins; otherwise the name and role, which is
       what a person searching by name is looking at anyway. `focus` makes
       a better description than the first line of the bio — it is already
       written as a summary. */
    const title = doctor.metaTitle || `${doctor.name} — ${doctor.role}`;
    const description =
        doctor.metaDescription ||
        doctor.focus ||
        `${doctor.name}, ${doctor.role} ${dict.doctor.metaTitleSuffix}`;

    const path = `/about/${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: `/${lang}${path}`,
            languages: Object.fromEntries([
                ...locales.map((l) => [htmlLang[l], `/${l}${path}`]),
                ["x-default", `/en${path}`],
            ]),
        },
        openGraph: {
            type: "profile",
            siteName: site.name,
            title,
            description,
            locale: htmlLang[lang].replace("-", "_"),
            url: `/${lang}${path}`,
            images: doctor.photo ? [{ url: doctor.photo, alt: doctor.photoAlt }] : undefined,
        },
    };
}

export default async function DoctorPage({
    params,
}: {
    params: Promise<{ lang: string; slug: string }>;
}) {
    const { lang, slug } = await params;
    if (!isLocale(lang)) notFound();

    const locale = lang as Locale;
    const dict = await getDictionary(locale);
    const t = dict.about;

    const doctor = await getDoctor(slug, locale);
    if (!doctor?.published) notFound();

    /* Everyone else, for the strip at the foot of the page. The lead doctor
       is included here — from a colleague's page he is a colleague. */
    const colleagues = (await getTeam(locale)).filter(
        (member) => member.slug !== doctor.slug && member.published,
    );

    const aboutHref = route(locale, "about");
    const url = `${site.url}/${locale}/about/${doctor.slug}`;

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
            { "@type": "ListItem", position: 3, name: doctor.name, item: url },
        ],
    };

    /* `Person`, not `Physician` — in schema.org `Physician` descends from
       MedicalBusiness and describes a practice, not a human being. Same
       reasoning as the `ItemList` on the about page, and the two must agree:
       `@id` is this URL on both sides so a crawler resolves the entry in
       that list and this page to one entity rather than two.

       `mainEntityOfPage` is what an anchor could never carry — it says this
       page is *about* this person, which is the whole argument for the
       route existing. */
    const personLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": url,
        mainEntityOfPage: url,
        url,
        name: doctor.name,
        jobTitle: doctor.role,
        image: doctor.photo ? `${site.url}${doctor.photo}` : undefined,
        description: doctor.focus || undefined,
        knowsAbout: doctor.tags.length ? doctor.tags : undefined,
        knowsLanguage: doctor.languages.length ? doctor.languages : undefined,
        alumniOf: doctor.education.length
            ? doctor.education.map((item) => ({ "@type": "EducationalOrganization", name: item }))
            : undefined,
        worksFor: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
    };

    return (
        <>
            <TrackedView type="doctor" viewKey={`doctor-page:${doctor.slug}`} />

            <PageHero
                eyebrow={doctor.isLead ? dict.doctor.label : dict.team.label}
                title={doctor.name}
                lead={doctor.focus || doctor.role}
                crumbLabel={t.breadcrumbLabel}
                crumbs={[
                    { label: t.breadcrumbHome, href: `/${locale}` },
                    { label: dict.nav.about, href: aboutHref },
                    { label: doctor.name },
                ]}
            />

            <section className="section relative overflow-hidden border-b border-ivory-400 bg-ivory-100">
                <div className="aura -left-40 top-0 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />

                <div className="shell relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
                    <Reveal className="lg:col-span-5">
                        <div className="lg:sticky lg:top-28">
                            <figure className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift">
                                <Image
                                    src={doctor.photo}
                                    alt={doctor.photoAlt}
                                    fill
                                    /* The largest image on the page and the thing above the
                                       fold, so it is the LCP candidate — `priority`, unlike
                                       the same portrait in the team grid. */
                                    priority
                                    sizes="(min-width: 1024px) 38vw, 90vw"
                                    className="object-cover object-top"
                                />
                                <span
                                    className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-ink-900/10"
                                    aria-hidden="true"
                                />
                            </figure>

                            <p className="mt-6 text-sm tracking-wide text-accent-700">{doctor.role}</p>

                            {doctor.experienceYears && (
                                <div className="mt-6 flex items-baseline gap-4">
                                    <span className="font-display text-5xl leading-none text-accent-700">
                                        {doctor.experienceYears}
                                    </span>
                                    <span className="max-w-[8rem] text-sm leading-tight tracking-wide text-ink-600">
                                        {dict.doctor.experienceLabel}
                                    </span>
                                </div>
                            )}

                            <div className="mt-7">
                                <LanguageChips label={t.languagesLabel} languages={doctor.languages} />
                            </div>
                        </div>
                    </Reveal>

                    <div className="lg:col-span-7">
                        {doctor.tags.length > 0 && (
                            <Reveal>
                                <ul className="flex flex-wrap gap-2.5">
                                    {doctor.tags.map((tag) => (
                                        <li
                                            key={tag}
                                            className="rounded-full border border-accent-200 bg-accent-50 px-4 py-2 text-xs tracking-wide text-accent-700"
                                        >
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                        )}

                        {doctor.bio.length > 0 && (
                            <Reveal delay={100}>
                                <h2 className="mt-10 font-display text-2xl leading-snug lg:text-3xl">
                                    {dict.doctor.aboutDoctor}
                                </h2>
                                {/* The h2 above is the deepest heading so far, so a
                                    subheading in the bio renders as h3. */}
                                <RichText
                                    blocks={doctor.bio}
                                    baseLevel={2}
                                    className="mt-6 space-y-5"
                                    paragraphClassName="text-base leading-relaxed text-ink-700 sm:text-lg"
                                    headingClassName="pt-4 font-display text-xl leading-snug"
                                />
                            </Reveal>
                        )}

                        <Reveal delay={150}>
                            <div className="mt-12">
                                <Credentials
                                    groups={doctor}
                                    labels={{
                                        education: t.educationLabel,
                                        experience: t.experienceLabel,
                                        training: t.trainingLabel,
                                    }}
                                />
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {colleagues.length > 0 && (
                <section className="section relative border-b border-ivory-400 bg-ivory-200">
                    <div className="shell">
                        <Reveal>
                            <p className="eyebrow">{dict.team.label}</p>
                            <h2 className="mt-5 fluid-title font-display">{t.teamTitle}</h2>
                        </Reveal>

                        <ul className="mt-12 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                            {colleagues.map((member, index) => (
                                <li key={member.slug}>
                                    <Reveal delay={index * 45}>
                                        <a href={member.href} className="group block">
                                            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-300 shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
                                                <Image
                                                    src={member.photo}
                                                    alt={member.photoAlt}
                                                    fill
                                                    sizes="(min-width: 1024px) 22vw, 45vw"
                                                    className="object-cover object-top grayscale-[30%] transition-[transform,filter] duration-500 group-hover:scale-[1.04] group-hover:grayscale-0"
                                                />
                                                <span
                                                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ink-900/10"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                            <p className="mt-4 font-display text-lg leading-tight text-ink-900 transition-colors group-hover:text-accent-700">
                                                {member.name}
                                            </p>
                                            <p className="mt-1.5 text-sm tracking-wide text-accent-700">
                                                {member.role}
                                            </p>
                                        </a>
                                    </Reveal>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            <BookingCta dict={dict} lang={locale} />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
            />
        </>
    );
}
