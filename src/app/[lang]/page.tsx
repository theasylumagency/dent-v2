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
import Contact from "@/components/home/Contact";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict} lang={locale} />
      <Clinic dict={dict} />
      <Services dict={dict} lang={locale} />
      <Atmosphere dict={dict} />
      <LeadDoctor dict={dict} />
      <Team dict={dict} />
      <Technology dict={dict} />
      {/* FAQ sits immediately before the form: it answers the last
          objections while the visitor is already at the booking step. */}
      <Faq dict={dict} />
      <Contact dict={dict} lang={locale} />
    </>
  );
}
