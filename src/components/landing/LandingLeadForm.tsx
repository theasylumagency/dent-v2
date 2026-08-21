import type { LandingPage } from "@/payload-types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { BookingOption } from "@/components/booking/types";
import BookingForm from "@/components/home/BookingForm";

export default function LandingLeadForm({
  campaign,
  dict,
  options,
  defaultService,
}: {
  campaign: LandingPage;
  dict: Dictionary;
  options: BookingOption[];
  defaultService?: string;
}) {
  const genericCopy = {
    ...dict.booking,
    loading: dict.common.loading,
    form: {
      ...dict.contact.form,
      submit: campaign.form.submitLabel,
    },
    title: campaign.form.title,
    intro: campaign.form.intro ?? "",
    successTitle: campaign.form.successTitle,
    successText: campaign.form.successText,
  };

  return (
    <section id="landing-lead-form" className="scroll-mt-24 border-b border-ivory-400 bg-ivory-100 py-20 sm:py-28">
      <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5 lg:pt-8">
          <p className="eyebrow">{campaign.header.ctaLabel}</p>
          <h2 className="mt-6 fluid-title font-display">{campaign.form.title}</h2>
          {campaign.form.intro ? (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-700">
              {campaign.form.intro}
            </p>
          ) : null}
        </div>
        <div className="card p-6 sm:p-9 lg:col-span-7">
          <BookingForm
            copy={genericCopy}
            options={options}
            idPrefix="landing-booking"
            fields={{
              showService: Boolean(campaign.form.showService),
              showPreferredTime: Boolean(campaign.form.showPreferredTime),
              showEmail: Boolean(campaign.form.showEmail),
              showMessage: Boolean(campaign.form.showMessage),
            }}
            defaultService={defaultService}
            landingContext={{
              landingSlug: campaign.slug,
              campaignName: campaign.campaignName,
            }}
          />
        </div>
      </div>
    </section>
  );
}
