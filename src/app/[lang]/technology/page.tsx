import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getDeviceCount, getDeviceGroups, getManufacturers } from "@/lib/equipment";
import { getSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import Reveal from "@/components/ui/Reveal";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import DeviceCard from "@/components/technology/DeviceCard";

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
  const t = dict.technology.page;
  const meta = await getSeo("technology", lang, {
    title: t.metaTitle,
    description: t.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/technology`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/technology`]),
        ["x-default", "/en/technology"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/technology`,
    },
  };
}

export default async function TechnologyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.technology.page;
  const [groups, manufacturers, deviceCount] = await Promise.all([
    getDeviceGroups(t.groups, locale),
    getManufacturers(locale),
    getDeviceCount(),
  ]);

  const cardLabels = {
    manufacturer: t.manufacturerLabel,
    usedFor: t.usedForLabel,
    highlights: t.highlightsLabel,
    photoPending: t.photoPendingLabel,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: dict.nav.technology,
        item: `${site.url}/${locale}/technology`,
      },
    ],
  };

  /* `MedicalDevice` rather than `Product`: nothing here is for sale, and
     the medical type is what carries `purpose`. Each entry links its
     manufacturer through `sameAs`, which is the whole reason this page
     earns anything in search — it ties the clinic to entities Google and
     the answer engines already have in their graph.

     The flat `deviceOrder` is walked instead of the grouped structure so
     the positions run 1..n across the page, matching reading order. */
  const equipmentLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t.title,
    url: `${site.url}/${locale}/technology`,
    numberOfItems: deviceCount,
    itemListElement: groups
      .flatMap((group) => group.items)
      .map((device, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MedicalDevice",
          name: device.name,
          description: device.summary,
          url: `${site.url}/${locale}/technology#${device.slug}`,
          brand: { "@type": "Brand", name: device.manufacturer.name },
          manufacturer: {
            "@type": "Organization",
            name: device.manufacturer.name,
            sameAs: device.manufacturer.url,
          },
          purpose: device.services.map((service) => service.title).join(", "),
        },
      })),
  };

  return (
    <>
      <PageHero
        eyebrow={dict.technology.label}
        title={t.title}
        lead={t.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[{ label: t.breadcrumbHome, href: `/${locale}` }, { label: dict.nav.technology }]}
        aside={
          <Reveal delay={160}>
            <div className="flex flex-col gap-8 border-t border-ivory-400 pt-8 lg:flex-row lg:items-center lg:justify-between">
              <dl className="flex items-center">
                <div className="pr-10">
                  <dt className="label-micro">{t.devicesLabel}</dt>
                  <dd className="mt-1 font-display text-3xl text-ink-900">{deviceCount}</dd>
                </div>
                <div className="border-l border-ivory-400 pl-10">
                  <dt className="label-micro">{t.manufacturersLabel}</dt>
                  <dd className="mt-1 font-display text-3xl text-ink-900">
                    {manufacturers.length}
                  </dd>
                </div>
              </dl>

              <nav aria-label={t.jumpLabel}>
                <ul className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <li key={group.slug}>
                      <a
                        href={`#${group.slug}`}
                        className="inline-flex rounded-full border border-ivory-600 bg-ivory-50 px-4 py-2 text-xs text-ink-700 transition-colors hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700"
                      >
                        {group.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </Reveal>
        }
      />

      {/* Capabilities before hardware. A model number means nothing to a
          patient until they know what it buys them, so the five outcomes
          lead and the devices that deliver them follow. These five moved
          here off the home page rather than being copied — the same block
          on two URLs would have made Google pick one of them for us. */}
      <section className="section relative overflow-hidden border-b border-ivory-400 bg-ivory-200">
        <div className="aura -left-40 top-1/4 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />

        <div className="shell relative">
          <Reveal className="max-w-3xl">
            <p className="eyebrow">{t.capabilitiesLabel}</p>
            <h2 className="mt-6 fluid-title font-display">{t.capabilitiesTitle}</h2>
            <p className="mt-6 text-base leading-relaxed text-ink-700">{dict.technology.lead}</p>
          </Reveal>

          <ol className="mt-14 grid grid-cols-1 gap-x-14 md:grid-cols-2">
            {dict.technology.items.map((item, index) => (
              <li key={item.index}>
                <Reveal delay={Math.min(index, 3) * 45}>
                  <div className="group grid h-full grid-cols-[3rem_1fr] gap-5 border-t border-ivory-400 py-7 transition-colors hover:border-accent-400 sm:grid-cols-[4rem_1fr] sm:gap-8">
                    <span className="font-display text-xl tabular-nums text-accent-700 transition-colors group-hover:text-accent-600">
                      {item.index}
                    </span>
                    <div>
                      <h3 className="font-display text-xl leading-snug sm:text-2xl">{item.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-ink-700">{item.text}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {groups.map((group, groupIndex) => (
        <section
          key={group.slug}
          id={group.slug}
          className={`section relative scroll-mt-20 overflow-hidden border-b border-ivory-400 ${
            groupIndex % 2 === 0 ? "bg-ivory-100" : "bg-ivory-200"
          }`}
        >
          <div className="shell relative">
            <Reveal className="max-w-3xl">
              <p className="eyebrow">{`0${groupIndex + 1}`}</p>
              <h2 className="mt-6 font-display text-3xl leading-snug lg:text-4xl">{group.title}</h2>
              <p className="mt-5 text-base leading-relaxed text-ink-700">{group.lead}</p>
            </Reveal>

            <div className="mt-14 space-y-16 lg:mt-16 lg:space-y-24">
              {group.items.map((device, deviceIndex) => (
                <DeviceCard
                  key={device.slug}
                  device={device}
                  flipped={deviceIndex % 2 === 1}
                  labels={cardLabels}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Sterilisation is a process, not a device you would choose between,
          so it closes the page as a band rather than pretending to be a
          ninth card. */}
      <section className="section relative overflow-hidden border-b border-ivory-400 bg-ivory-100">
        <div className="aura right-[-12rem] top-0 h-[28rem] w-[28rem] opacity-25" aria-hidden="true" />

        <div className="shell relative">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-5">
              <p className="eyebrow">{t.sterilisation.label}</p>
              <h2 className="mt-6 font-display text-3xl leading-snug lg:text-4xl">
                {t.sterilisation.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-700">{t.sterilisation.body}</p>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {t.sterilisation.items.map((item, index) => (
                  <li key={item} className="card flex h-full flex-col p-6">
                    <span className="font-display text-lg tabular-nums text-accent-700">
                      {`0${index + 1}`}
                    </span>
                    <p className="mt-3 text-base leading-relaxed text-ink-800">{item}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(equipmentLd) }}
      />
    </>
  );
}
