import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { site, whatsappHref } from "@/lib/site";
import { ArrowUpRight, Clock, Mail, Phone, Pin, WhatsApp } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import BookingForm from "./BookingForm";
import MapEmbed from "./MapEmbed";

export default function Contact({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <section
      id="contact"
      className="section-airy relative overflow-hidden border-t border-ivory-400 bg-ivory-200"
    >
      <div className="aura right-0 top-10 h-[26rem] w-[26rem] opacity-30" aria-hidden="true" />

      <div className="shell relative grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          <Reveal>
            <p className="eyebrow">{dict.contact.label}</p>
            <h2 className="mt-6 fluid-title font-display">{dict.contact.title}</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-700">
              {dict.contact.lead}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <dl className="card mt-12 divide-y divide-ivory-300 overflow-hidden">
              <div className="flex items-start gap-4 px-6 py-5">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <div>
                  <dt className="label-micro">{dict.contact.addressLabel}</dt>
                  <dd className="mt-1.5 text-base text-ink-800">{dict.contact.address}</dd>
                  <dd className="mt-2">
                    <a
                      href={site.maps}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent-700 transition-colors hover:text-accent-600"
                    >
                      {dict.contact.directions}
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4 px-6 py-5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <div>
                  <dt className="label-micro">{dict.contact.hoursLabel}</dt>
                  <dd className="mt-1.5 text-base text-ink-800">{dict.contact.hours}</dd>
                </div>
              </div>

              <div className="flex items-start gap-4 px-6 py-5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <div>
                  <dt className="label-micro">{dict.contact.phoneLabel}</dt>
                  <dd className="mt-1.5 text-base text-ink-800">
                    <a href={`tel:${site.phoneHref}`} className="transition-colors hover:text-accent-700">
                      {site.phone}
                    </a>
                  </dd>
                  <dd className="mt-1 text-sm text-ink-600">
                    <span className="sr-only">{dict.contact.phoneAltLabel}: </span>
                    <a
                      href={`tel:${site.phoneAltHref}`}
                      className="transition-colors hover:text-accent-700"
                    >
                      {site.phoneAlt}
                    </a>
                  </dd>
                  <dd className="mt-3">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ivory-600 bg-ivory-50 px-3.5 py-2 text-sm text-ink-800 transition-colors hover:border-accent-500 hover:text-accent-700"
                    >
                      <WhatsApp className="h-4 w-4 text-accent-600" />
                      {dict.contact.whatsappLabel}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4 px-6 py-5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <div>
                  <dt className="label-micro">{dict.contact.emailLabel}</dt>
                  <dd className="mt-1.5 text-base text-ink-800">
                    <a href={`mailto:${site.email}`} className="transition-colors hover:text-accent-700">
                      {site.email}
                    </a>
                  </dd>
                  <dd className="mt-2 flex gap-4 text-sm font-medium">
                    <a
                      href={site.social.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-700 transition-colors hover:text-accent-600"
                    >
                      Instagram
                    </a>
                    <a
                      href={site.social.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-700 transition-colors hover:text-accent-600"
                    >
                      Facebook
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={140}>
            <MapEmbed dict={dict} lang={lang} />
          </Reveal>
        </div>

        <Reveal delay={120} className="lg:col-span-6">
          <div className="card p-7 sm:p-9">
            <BookingForm dict={dict} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
