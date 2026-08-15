import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getFaq } from "@/lib/faq";
import { getClinic } from "@/lib/clinic";
import { Phone, WhatsApp } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";

/**
 * Frequently asked questions.
 *
 * Two jobs. It closes the questions that otherwise become a phone call
 * before anyone books ("does it hurt", "what does it cost"), and it is
 * the only content type on the page that answer engines — featured
 * snippets, and increasingly AI search — can quote directly. Hence the
 * FAQPage graph, emitted here rather than in the layout so it only ever
 * describes a page that actually shows these questions.
 *
 * Built on <details>/<summary>: open/close, keyboard operation and the
 * expanded state are all native, and every answer is present in the DOM
 * for crawlers whether or not it is open.
 *
 * Consultation fees quoted in the answers are the clinic's confirmed
 * figures (50 ₾ first visit, 25 ₾ follow-up). They now live in the CMS, so
 * a price change is an edit in the admin rather than a deploy — but the
 * figure is written into the prose of one answer in three locales, and the
 * numeric fields in `clinic-info` feed the structured data separately. Both
 * have to be edited. The admin description on the fee fields says so.
 *
 * TODO(client): the clinical answers are drawn from copy already approved
 * elsewhere on this page, but should still get a sign-off from the chief
 * doctor before launch.
 */
export default async function Faq({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const [items, clinic] = await Promise.all([getFaq(lang), getClinic(lang, dict.contact)]);
  if (!items.length) return null;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section id="faq" className="section relative overflow-hidden bg-ivory-100">
      <div className="aura -left-40 top-1/3 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />

      <div className="shell relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">{dict.faq.label}</p>
          <h2 className="mt-6 fluid-title font-display">{dict.faq.title}</h2>
          <p className="mt-6 text-base leading-relaxed text-ink-700">{dict.faq.lead}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`tel:${clinic.phoneHref}`} className="btn-ghost !py-3 !text-sm">
              <Phone className="h-4 w-4 text-accent-600" />
              {clinic.phone}
            </a>
            <a
              href={clinic.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost !py-3 !text-sm"
            >
              <WhatsApp className="h-4 w-4 text-accent-600" />
              {dict.nav.whatsapp}
            </a>
          </div>
        </Reveal>

        <div className="lg:col-span-8">
          <ul className="border-t border-ivory-400">
            {items.map((item, index) => (
              <li key={item.q} className="border-b border-ivory-400">
                <Reveal delay={Math.min(index, 5) * 40}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-left [&::-webkit-details-marker]:hidden">
                      <h3 className="font-display text-xl leading-snug transition-colors group-open:text-accent-700 sm:text-2xl">
                        {item.q}
                      </h3>
                      <span
                        className="relative mt-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ivory-600 text-accent-700 transition-colors group-open:border-accent-500 group-open:bg-accent-50"
                        aria-hidden="true"
                      >
                        <span className="absolute h-px w-3 bg-current" />
                        <span className="absolute h-3 w-px bg-current transition-transform duration-300 group-open:scale-y-0" />
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-7 pr-12 text-base leading-relaxed text-ink-700">
                      {item.a}
                    </p>
                  </details>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </section>
  );
}
