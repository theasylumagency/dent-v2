import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { route } from "@/lib/nav";
import { site, whatsappHref } from "@/lib/site";
import { Phone, WhatsApp } from "@/components/ui/icons";

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
export default function MobileActionBar({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory-500 bg-ivory-50/95 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2 px-4 py-2.5">
        <a
          href={`tel:${site.phoneHref}`}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          aria-label={`${dict.nav.call} ${site.phone}`}
        >
          <Phone className="h-5 w-5" />
        </a>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ivory-600 bg-ivory-50 text-accent-700 transition-colors active:bg-accent-50"
          aria-label={dict.nav.whatsapp}
        >
          <WhatsApp className="h-5 w-5" />
        </a>

        <Link href={route(lang, "contact")} className="btn-primary w-full !py-3.5">
          {dict.nav.book}
        </Link>
      </div>
    </div>
  );
}
