import Image from "next/image";
import Link from "next/link";

import type { LandingPage } from "@/payload-types";
import type { Locale } from "@/i18n/config";
import { media, site } from "@/lib/site";

export default function LandingEnded({ campaign, lang }: { campaign: LandingPage; lang: Locale }) {
  const title = campaign.ended?.title || campaign.hero.headline;
  const text = campaign.ended?.text || campaign.hero.subheadline;

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
          <h1 className="mt-7 fluid-title font-display">{title}</h1>
          {text ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-700">{text}</p> : null}
          {campaign.ended?.ctaLabel ? (
            <Link href={`/${lang}`} className="btn-primary mt-9">
              {campaign.ended.ctaLabel}
            </Link>
          ) : null}
        </div>
      </section>
      <footer className="border-t border-ivory-400 bg-ivory-50 py-8">
        <div className="shell text-xs text-ink-600">© {new Date().getFullYear()} {site.name}</div>
      </footer>
    </main>
  );
}
