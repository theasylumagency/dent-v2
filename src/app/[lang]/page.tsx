import { notFound } from "next/navigation";

import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import Hero from "@/components/home/Hero";
import Clinic from "@/components/home/Clinic";
import Services from "@/components/home/Services";
import Atmosphere from "@/components/home/Atmosphere";
import LeadDoctor from "@/components/home/LeadDoctor";
import Team from "@/components/home/Team";
import Technology from "@/components/home/Technology";
import Faq from "@/components/home/Faq";
import FinalBookingCta from "@/components/home/FinalBookingCta";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict} lang={locale} />
      <Clinic dict={dict} lang={locale} />
      <Services dict={dict} lang={locale} />
      <Atmosphere dict={dict} />
      <LeadDoctor dict={dict} lang={locale} />
      <Team dict={dict} lang={locale} />
      <Technology dict={dict} lang={locale} />
      {/* FAQ answers the last practical questions before the final action. */}
      <Faq dict={dict} lang={locale} />
      <FinalBookingCta dict={dict} lang={locale} />
    </>
  );
}
