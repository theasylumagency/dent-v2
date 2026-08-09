"use client";

import { useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries";
import { categoryOrder } from "@/lib/services";
import { site } from "@/lib/site";
import { ArrowUpRight, Phone } from "@/components/ui/icons";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

export default function BookingForm({ dict }: { dict: Dictionary }) {
  const t = dict.contact.form;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const statusRef = useRef<HTMLDivElement>(null);

  function validate(data: FormData): FieldErrors {
    const next: FieldErrors = {};

    const name = String(data.get("name") ?? "").trim();
    if (name.length < 2) next.name = t.invalidName;

    /* Deliberately permissive: Georgian numbers get written as
       "511 21 16 16", "+995 511 211616" and "0511211616" by different
       people, and rejecting any of those loses a patient over
       punctuation. Nine digits or more is the only real signal. */
    const digits = String(data.get("phone") ?? "").replace(/\D/g, "");
    if (digits.length < 9) next.phone = t.invalidPhone;

    const email = String(data.get("email") ?? "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = t.invalidEmail;

    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* Captured before the first await.
       React nulls `currentTarget` once the dispatch completes, so the
       original `event.currentTarget.reset()` after an await was reading
       from null — the reset threw every single time. */
    const form = event.currentTarget;
    const data = new FormData(form);

    const found = validate(data);
    setErrors(found);

    const firstInvalid = (["name", "phone", "email"] as const).find((field) => found[field]);
    if (firstInvalid) {
      /* Queried by name, not by [aria-invalid]: setErrors has not been
         flushed yet at this point, so the attribute is not on the DOM
         until after the next render. */
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      setStatus("sent");
      form.reset();
    } catch {
      /* A real failure state, reachable for the first time. The previous
         version resolved a timer and always claimed success — a patient
         could believe they were booked when nothing had been sent. */
      setStatus("error");
    } finally {
      statusRef.current?.focus();
    }
  }

  const describedBy = (field: keyof FieldErrors) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-name" className="label-micro mb-2">
            {t.name}
          </label>
          <input
            id="booking-name"
            name="name"
            required
            autoComplete="name"
            placeholder={t.namePlaceholder}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={describedBy("name")}
            className="field"
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-xs text-danger-700">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="booking-phone" className="label-micro mb-2">
            {t.phone}
          </label>
          <input
            id="booking-phone"
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
          {errors.phone && (
            <p id="phone-error" className="mt-1.5 text-xs text-danger-700">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Two qualifying questions. Each one removes a round of phone tag:
          without them every submission starts with "which treatment, and
          when can we reach you?" */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-service" className="label-micro mb-2">
            {t.service}
          </label>
          <select id="booking-service" name="service" defaultValue="" className="field">
            <option value="">{t.servicePlaceholder}</option>
            {categoryOrder.map((slug) => (
              <option key={slug} value={dict.services.categories[slug].title}>
                {dict.services.categories[slug].title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="booking-time" className="label-micro mb-2">
            {t.preferredTime}
          </label>
          <select id="booking-time" name="preferredTime" defaultValue="" className="field">
            <option value="">{t.timeAny}</option>
            <option value={t.timeMorning}>{t.timeMorning}</option>
            <option value={t.timeAfternoon}>{t.timeAfternoon}</option>
            <option value={t.timeEvening}>{t.timeEvening}</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="booking-email" className="label-micro mb-2">
          {t.email} <span className="lowercase tracking-normal">({t.optional})</span>
        </label>
        <input
          id="booking-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          aria-invalid={errors.email ? "true" : undefined}
          aria-describedby={describedBy("email")}
          className="field"
        />
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-danger-700">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="booking-message" className="label-micro mb-2">
          {t.message} <span className="lowercase tracking-normal">({t.optional})</span>
        </label>
        <textarea
          id="booking-message"
          name="message"
          rows={3}
          placeholder={t.messagePlaceholder}
          className="field resize-none"
        />
      </div>

      {/* Honeypot. Off-screen rather than display:none — some bots skip
          hidden inputs, most fill anything with a plausible name. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="booking-company">Company</label>
        <input id="booking-company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status === "sending"} className="btn-primary w-full disabled:opacity-60">
        {status === "sending" ? dict.common.loading : t.submit}
        <ArrowUpRight />
      </button>

      {/* Status and consent are separate elements on purpose. They used to
          share one live region, so a successful submission wiped the data
          -processing disclosure off the page. */}
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-sm outline-none"
      >
        {status === "sent" && <span className="text-accent-700">{t.success}</span>}
        {status === "error" && (
          <span className="text-danger-700">
            {t.error}{" "}
            <a
              href={`tel:${site.phoneHref}`}
              aria-label={`${t.errorCall}: ${site.phone}`}
              className="inline-flex items-center gap-1 underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {site.phone}
            </a>
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-600">{t.consent}</p>
    </form>
  );
}
