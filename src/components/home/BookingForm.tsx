"use client";

import { useEffect, useRef, useState } from "react";

import type { BookingCopy, BookingOption } from "@/components/booking/types";
import { trackBookingComplete, type LandingAnalyticsContext } from "@/lib/analytics";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

export default function BookingForm({
  copy,
  options,
  onClose,
  idPrefix = "booking",
  fields,
  defaultService,
  landingContext,
}: {
  copy: BookingCopy;
  options: BookingOption[];
  onClose?: () => void;
  idPrefix?: string;
  fields?: {
    showService?: boolean;
    showPreferredTime?: boolean;
    showEmail?: boolean;
    showMessage?: boolean;
  };
  defaultService?: string;
  landingContext?: LandingAnalyticsContext;
}) {
  const t = copy.form;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "sent" || status === "error") statusRef.current?.focus();
  }, [status]);

  function validate(data: FormData): FieldErrors {
    const next: FieldErrors = {};
    const name = String(data.get("name") ?? "").trim();
    if (name.length < 2) next.name = t.invalidName;

    const digits = String(data.get("phone") ?? "").replace(/\D/g, "");
    if (digits.length < 9) next.phone = t.invalidPhone;

    const email = String(data.get("email") ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = t.invalidEmail;
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);

    const firstInvalid = (["name", "phone", "email"] as const).find((field) => found[field]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const payload: Record<string, FormDataEntryValue | string> = Object.fromEntries(data);
      if (defaultService && !payload.service) payload.service = defaultService;

      if (landingContext) {
        payload.landingSlug = landingContext.landingSlug;
        if (landingContext.campaignName) payload.campaignName = landingContext.campaignName;

        const search = new URLSearchParams(window.location.search);
        for (const key of [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ] as const) {
          const value = search.get(key)?.trim().slice(0, 200);
          if (value) payload[key] = value;
        }
      }

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { accepted?: boolean };
      if (!response.ok || result.accepted !== true) throw new Error(`Request failed: ${response.status}`);

      form.reset();
      setErrors({});
      setStatus("sent");
      trackBookingComplete(landingContext);
    } catch {
      setStatus("error");
    }
  }

  const fieldId = (field: string) => `${idPrefix}-${field}`;
  const errorId = (field: keyof FieldErrors) => `${idPrefix}-${field}-error`;
  const describedBy = (field: keyof FieldErrors) => (errors[field] ? errorId(field) : undefined);
  const visibility = {
    showService: fields?.showService ?? true,
    showPreferredTime: fields?.showPreferredTime ?? true,
    showEmail: fields?.showEmail ?? true,
    showMessage: fields?.showMessage ?? true,
  };

  if (status === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex min-h-[26rem] flex-col items-center justify-center text-center outline-none">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent-300 bg-accent-50 text-2xl text-accent-700" aria-hidden="true">
          ✓
        </span>
        <h3 className="mt-6 font-display text-3xl text-ink-900">{copy.successTitle}</h3>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-600">{copy.successText}</p>
        {onClose ? (
          <button type="button" onClick={onClose} className="btn-primary mt-8">
            {copy.successClose}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="booking-form">
      <div>
        <label htmlFor={fieldId("name")} className="label-micro mb-2">
          {t.name} <span aria-hidden="true">*</span>
        </label>
        <input
          data-booking-initial-focus
          id={fieldId("name")}
          name="name"
          required
          autoComplete="name"
          placeholder={t.namePlaceholder}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={describedBy("name")}
          className="field"
        />
        {errors.name ? <p id={errorId("name")} className="mt-1.5 text-xs text-danger-700">{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor={fieldId("phone")} className="label-micro mb-2">
          {t.phone} <span aria-hidden="true">*</span>
        </label>
        <input
          id={fieldId("phone")}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          placeholder={t.phonePlaceholder}
          aria-invalid={errors.phone ? "true" : undefined}
          aria-describedby={describedBy("phone")}
          className="field"
        />
        {errors.phone ? <p id={errorId("phone")} className="mt-1.5 text-xs text-danger-700">{errors.phone}</p> : null}
      </div>

      {visibility.showService || visibility.showPreferredTime ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {visibility.showService ? (
            <div className={visibility.showPreferredTime ? undefined : "sm:col-span-2"}>
              <label htmlFor={fieldId("service")} className="label-micro mb-2">{t.service}</label>
              <select id={fieldId("service")} name="service" defaultValue={defaultService ?? ""} className="field">
                <option value="">{t.servicePlaceholder}</option>
                {options.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}
              </select>
            </div>
          ) : null}
          {visibility.showPreferredTime ? (
            <div className={visibility.showService ? undefined : "sm:col-span-2"}>
              <label htmlFor={fieldId("time")} className="label-micro mb-2">{t.preferredTime}</label>
              <select id={fieldId("time")} name="preferredTime" defaultValue="" className="field">
                <option value="">{t.timeAny}</option>
                <option value={t.timeMorning}>{t.timeMorning}</option>
                <option value={t.timeAfternoon}>{t.timeAfternoon}</option>
                <option value={t.timeEvening}>{t.timeEvening}</option>
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      {visibility.showEmail ? <div>
        <label htmlFor={fieldId("email")} className="label-micro mb-2">
          {t.email} <span className="normal-case tracking-normal">({t.optional})</span>
        </label>
        <input
          id={fieldId("email")}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={describedBy("email")}
          className="field"
        />
        {errors.email ? <p id={errorId("email")} className="mt-1.5 text-xs text-danger-700">{errors.email}</p> : null}
      </div> : null}

      {visibility.showMessage ? <div>
        <label htmlFor={fieldId("message")} className="label-micro mb-2">
          {t.message} <span className="normal-case tracking-normal">({t.optional})</span>
        </label>
        <textarea id={fieldId("message")} name="message" rows={3} placeholder={t.messagePlaceholder} className="field resize-none" />
      </div> : null}

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={fieldId("company")}>Company</label>
        <input id={fieldId("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status === "sending"} className="btn-primary w-full disabled:opacity-60">
        {status === "sending" ? copy.loading : t.submit}
      </button>

      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className="min-h-5 text-sm outline-none">
        {status === "error" ? <span className="text-danger-700">{t.error}</span> : null}
      </div>
      <p className="text-xs leading-relaxed text-ink-600">{t.consent}</p>
    </form>
  );
}
