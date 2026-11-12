import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import PageHero from "@/components/services/PageHero";
import { ArrowUpRight } from "@/components/ui/icons";
import { htmlLang, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { homeHref, route } from "@/lib/routes";
import { site } from "@/lib/site";

const certificate = {
  standard: "EN ISO 9001:2015",
  issuer: "TÜV AUSTRIA GMBH",
  number: "10001250017210",
  issuedOn: "2026-02-20",
  validUntil: "2029-02-19",
  pdf: "/documents/total-charm-dent-iso-9001-certificate.pdf",
  preview: "/images/certificates/total-charm-dent-iso-9001-certificate.webp",
  verification: "https://www.tuv.at/certcheck",
};

const standardUrl = "https://www.iso.org/standard/9001";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const { qualityCertification } = await getDictionary(lang);
  const { title, metaDescription } = qualityCertification.page;
  const canonical = route(lang, "certificate");

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...locales.map((locale) => [htmlLang[locale], route(locale, "certificate")]),
        ["x-default", route("en", "certificate")],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description: metaDescription,
      locale: htmlLang[lang].replace("-", "_"),
      url: canonical,
    },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const { lead, page } = dict.qualityCertification;
  const dateFormat = new Intl.DateTimeFormat(htmlLang[lang], { dateStyle: "long", timeZone: "UTC" });
  const details = [
    { label: page.standardLabel, value: certificate.standard },
    { label: page.issuerLabel, value: certificate.issuer },
    { label: page.numberLabel, value: certificate.number },
    {
      label: page.issuedLabel,
      value: <time dateTime={certificate.issuedOn}>{dateFormat.format(new Date(certificate.issuedOn))}</time>,
    },
    {
      label: page.validUntilLabel,
      value: <time dateTime={certificate.validUntil}>{dateFormat.format(new Date(certificate.validUntil))}</time>,
    },
    { label: page.scopeLabel, value: page.scope },
  ];

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lead={lead}
        crumbs={[{ label: dict.nav.home, href: homeHref(lang) }, { label: page.title }]}
        crumbLabel={page.breadcrumbLabel}
      />

      <section className="fit-pad bg-ivory-50" aria-labelledby="iso-explanation">
        <div className="shell grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <figure className="mx-auto w-full max-w-[32rem] lg:col-span-5">
            <div className="rounded-[1.5rem] border border-mist-200 bg-mist-50 p-3 shadow-soft sm:p-5">
              <Image
                src={certificate.preview}
                alt={page.previewAlt}
                width={1061}
                height={1500}
                sizes="(min-width: 1280px) 500px, (min-width: 1024px) 38vw, (min-width: 576px) 512px, 90vw"
                className="h-auto w-full border border-ivory-400 bg-white"
              />
            </div>
            <figcaption className="mt-5">
              <a href={certificate.pdf} className="btn-primary inline-flex">
                {page.openPdf}
              </a>
            </figcaption>
          </figure>

          <div className="max-w-2xl lg:col-span-7">
            <h2 id="iso-explanation" className="font-display text-3xl leading-tight text-brand-900 sm:text-4xl">
              {page.explanationTitle}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-700 sm:text-lg">
              <p>{page.explanation}</p>
              <p>{page.patientContext}</p>
            </div>
            <a href={standardUrl} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-700 hover:underline">
              {page.standardLink}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <h2 className="mt-10 font-display text-2xl text-brand-900 sm:text-3xl">{page.detailsTitle}</h2>
            <dl className="mt-4 border-t border-mist-200">
              {details.map(({ label, value }) => (
                <div key={label} className="grid gap-1 border-b border-mist-200 py-3 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                  <dt className="text-ink-600">{label}</dt>
                  <dd className="font-medium leading-relaxed text-brand-900">{value}</dd>
                </div>
              ))}
            </dl>
            <a href={certificate.verification} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent-700 hover:underline">
              {page.verifyLink}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
