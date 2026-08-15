import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Clinic } from "@/lib/clinic";
import { Phone, WhatsApp } from "@/components/ui/icons";
import BookingTrigger from "@/components/booking/BookingTrigger";

/**
 * Persistent call / message / book bar, mobile and tablet only.
 *
 * On a clinic site the phone is the primary conversion, and it was
 * previously only reachable at `xl` and above — a patient on a phone had
 * no way to dial without scrolling to the footer. Calling is listed
 * first because it is the action most people arrive wanting.
 *
 * Deliberately a server component: three links, no state, no JS. It sits
 * below the mobile drawer (z-40) so opening the menu covers it.
 */
export default function MobileActionBar({
  dict,
  clinic,
}: {
  dict: Dictionary;
  lang: Locale;
  clinic: Clinic;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory-500 bg-ivory-50/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 px-4 py-2.5">
        <a
          href={`tel:${clinic.phoneHref}`}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          aria-label={`${dict.nav.call} ${clinic.phone}`}
        >
          <Phone className="h-5 w-5" />
        </a>

        <a
          href={clinic.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          aria-label={dict.nav.whatsapp}
        >
          <WhatsApp className="h-5 w-5" />
        </a>

        <BookingTrigger className="btn-primary w-full !py-3.5">
          {dict.nav.book}
        </BookingTrigger>
      </div>
    </div>
  );
}
