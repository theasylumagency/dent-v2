import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getClinic } from "@/lib/clinic";
import { Phone, WhatsApp } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import BookingTrigger from "@/components/booking/BookingTrigger";

/**
 * Closing band for the services pages.
 *
 * The booking form itself is not repeated here. It is a client component
 * with its own validation and network state, and shipping a second copy of
 * it to every service page to sit below the fold buys nothing — the primary
 * action links to the form that already exists, and the phone and WhatsApp
 * routes are there for anyone who would rather not type.
 */
export default async function BookingCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const t = dict.services.page;
  const clinic = await getClinic(lang, dict.contact);

  return (
    <section className="section relative overflow-hidden border-t border-ivory-400 bg-ivory-200">
      <div className="aura -right-40 top-0 h-[28rem] w-[28rem] opacity-30" aria-hidden="true" />

      <div className="shell relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="eyebrow justify-center">{dict.contact.label}</p>
          <h2 className="mt-6 fluid-title font-display">{t.ctaTitle}</h2>
          <p className="mt-6 text-base leading-relaxed text-ink-700">{t.ctaLead}</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <BookingTrigger className="btn-primary w-full sm:w-auto">
              {dict.nav.book}
            </BookingTrigger>
            <a href={`tel:${clinic.phoneHref}`} className="btn-ghost w-full sm:w-auto">
              <Phone className="h-4 w-4 text-accent-600" />
              {clinic.phone}
            </a>
            <a
              href={clinic.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost w-full sm:w-auto"
            >
              <WhatsApp className="h-4 w-4 text-accent-600" />
              {dict.nav.whatsapp}
            </a>
          </div>

          <p className="mt-8 text-sm leading-relaxed text-ink-600">{t.consultationNote}</p>
        </Reveal>
      </div>
    </section>
  );
}
