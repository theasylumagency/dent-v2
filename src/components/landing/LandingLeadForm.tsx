import type { LandingPage } from "@/payload-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { BookingOption } from "@/components/booking/types";
import type { LandingCopy } from "@/lib/landing-copy";
import BookingForm from "@/components/home/BookingForm";
import Reveal from "@/components/ui/Reveal";

export default function LandingLeadForm({
  campaign,
  copy,
  dict,
  options,
  defaultService,
}: {
  campaign: LandingPage;
  copy: LandingCopy;
  dict: Dictionary;
  options: BookingOption[];
  defaultService?: string;
}) {
  const formCopy = {
    ...dict.booking,
    loading: dict.common.loading,
    form: {
      ...dict.contact.form,
      submit: copy.form.submitLabel,
    },
    title: copy.form.title,
    intro: copy.form.intro,
    successTitle: copy.form.successTitle,
    successText: copy.form.successText,
  };

  return (
    <section
      id="landing-lead-form"
      className="scroll-mt-24 border-b border-ivory-400 bg-ivory-100 py-20 sm:py-28"
    >
      <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5 lg:pt-8">
          <p className="eyebrow">{copy.headerCta}</p>
          <h2 className="mt-6 fluid-title font-display">{copy.form.title}</h2>
          {copy.form.intro ? (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-700">{copy.form.intro}</p>
          ) : null}
        </Reveal>
        <Reveal delay={120} className="card p-6 sm:p-9 lg:col-span-7">
          <BookingForm
            copy={formCopy}
            options={options}
            idPrefix="landing-booking"
            fields={{
              showService: Boolean(campaign.form?.showService),
              showPreferredTime: Boolean(campaign.form?.showPreferredTime),
              showEmail: Boolean(campaign.form?.showEmail),
              showMessage: Boolean(campaign.form?.showMessage),
            }}
            defaultService={defaultService}
            landingContext={{
              landingSlug: campaign.slug,
              campaignName: campaign.campaignName,
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
