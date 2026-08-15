import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/routes";
import BookingTrigger from "@/components/booking/BookingTrigger";
import { ArrowUpRight } from "@/components/ui/icons";

export default function FinalBookingCta({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const copy = dict.contact.homeCta;

  return (
    <section className="on-dark relative isolate overflow-hidden bg-brand-900 py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_130%_at_100%_0%,rgba(18,74,112,0.75),transparent_62%),linear-gradient(135deg,#082033,#04121d)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 -top-52 h-[34rem] w-[34rem] rounded-full border border-accent-300/10" aria-hidden="true" />

      <div className="shell text-center">
        <p className="eyebrow justify-center">{copy.label}</p>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05]">
          {copy.title}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory-200/78 sm:text-lg">
          {copy.lead}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <BookingTrigger className="btn-primary w-full sm:w-auto">{copy.primary}</BookingTrigger>
          <Link href={route(lang, "contact")} className="group inline-flex items-center gap-2 px-5 py-3 text-sm text-ivory-200 transition-colors hover:text-accent-200">
            {copy.secondary}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
