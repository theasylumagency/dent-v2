import type { Dictionary } from "@/i18n/dictionaries";
import type { LandingPage } from "@/payload-types";

/**
 * Every visible string on a campaign page, already resolved.
 *
 * The collection asks an editor for a campaign name and a headline and lets
 * them stop there. That only works if something fills the gaps, and this is
 * that something: each field falls back to `dict.landing`, which is written
 * per locale and reviewed like any other site copy. A campaign published with
 * two fields filled in is a finished page, not a page with holes in it.
 *
 * Resolution happens once, on the server, and the result is handed to the
 * section components — so no component has to know which half of a value
 * came from the CMS.
 */

export type LandingItem = { id: string; title: string; text: string };

export type LandingCopy = {
  headerCta: string;
  heroCta: string;
  call: string;
  reasonsHeading: string;
  reasons: LandingItem[];
  stepsHeading: string;
  stepsIntro: string;
  steps: LandingItem[];
  form: {
    title: string;
    intro: string;
    submitLabel: string;
    successTitle: string;
    successText: string;
  };
  finalCta: { title: string; text: string; buttonLabel: string };
  ended: { title: string; text: string; ctaLabel: string };
};

type Row = { id?: string | null; title?: string | null; text?: string | null };

/** Blank, whitespace and `null` all mean "use the default". */
function filled(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function pick(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const value = filled(candidate);
    if (value) return value;
  }
  return "";
}

/**
 * An array field falls back as a whole rather than row by row. Mixing two
 * authored reasons with one from the dictionary would read as an editing
 * mistake, and there is no sensible order to interleave them in.
 */
function rows(
  authored: Row[] | null | undefined,
  fallback: readonly { title: string; text: string }[],
  key: string,
): LandingItem[] {
  const written = (authored ?? [])
    .map((row, index) => ({
      id: filled(row?.id) || `${key}-${index}`,
      title: filled(row?.title),
      text: filled(row?.text),
    }))
    .filter((row) => row.title || row.text);

  if (written.length) return written;

  return fallback.map((row, index) => ({ id: `${key}-default-${index}`, ...row }));
}

export function landingCopy(campaign: LandingPage, dict: Dictionary): LandingCopy {
  const t = dict.landing;
  const heroCta = pick(campaign.hero?.ctaLabel, t.ctaDefault);

  return {
    heroCta,
    headerCta: pick(campaign.header?.ctaLabel, heroCta),
    call: t.call,

    reasonsHeading: t.reasonsHeading,
    reasons: rows(campaign.reasons, t.reasons, "reason"),

    stepsHeading: pick(campaign.stepsHeading, t.stepsHeading),
    stepsIntro: pick(campaign.stepsIntro, t.stepsIntro),
    steps: rows(campaign.steps, t.steps, "step"),

    form: {
      title: pick(campaign.form?.title, t.formTitle),
      intro: pick(campaign.form?.intro, t.formIntro),
      submitLabel: pick(campaign.form?.submitLabel, t.formSubmit),
      successTitle: pick(campaign.form?.successTitle, t.formSuccessTitle),
      successText: pick(campaign.form?.successText, t.formSuccessText),
    },

    finalCta: {
      title: pick(campaign.finalCta?.title, t.finalCtaTitle),
      text: pick(campaign.finalCta?.text, t.finalCtaText),
      buttonLabel: pick(campaign.finalCta?.buttonLabel, heroCta, t.finalCtaButton),
    },

    ended: {
      title: pick(campaign.ended?.title, campaign.hero?.headline, t.endedTitle),
      text: pick(campaign.ended?.text, t.endedText),
      ctaLabel: pick(campaign.ended?.ctaLabel, t.endedCta),
    },
  };
}
