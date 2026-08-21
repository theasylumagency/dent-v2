import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { LandingCopy } from "@/lib/landing-copy";
import { media, site } from "@/lib/site";

export default function LandingEnded({ copy, lang }: { copy: LandingCopy; lang: Locale }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col bg-ivory-100">
      <header className="border-b border-ivory-400 bg-ivory-50">
        <div className="shell flex min-h-20 items-center">
          <Link href={`/${lang}`} aria-label={site.name}>
            <Image src={media.logo} alt={site.name} width={200} height={175} unoptimized className="h-12 w-auto" />
          </Link>
        </div>
      </header>
      <section className="shell flex flex-1 items-center py-20">
        <div className="max-w-3xl">
          <p className="eyebrow">{site.name}</p>
          <h1 className="mt-7 fluid-title font-display">{copy.ended.title}</h1>
          {copy.ended.text ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">{copy.ended.text}</p>
          ) : null}
          <Link href={`/${lang}`} className="btn-primary mt-9">
            {copy.ended.ctaLabel}
          </Link>
        </div>
      </section>
      <footer className="border-t border-ivory-400 bg-ivory-50 py-8">
        <div className="shell text-xs text-ink-600">© {new Date().getFullYear()} {site.name}</div>
      </footer>
    </main>
  );
}
