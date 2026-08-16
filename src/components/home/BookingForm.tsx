"use client";

import { useEffect, useRef, useState } from "react";

import type { BookingCopy, BookingOption } from "@/components/booking/types";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

export default function BookingForm({
  copy,
  options,
  onClose,
}: {
  copy: BookingCopy;
  options: BookingOption[];
  onClose: () => void;
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
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      form.reset();
      setErrors({});
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const describedBy = (field: keyof FieldErrors) => (errors[field] ? `${field}-error` : undefined);

  if (status === "sent") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="flex min-h-[26rem] flex-col items-center justify-center text-center outline-none">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent-300 bg-accent-50 text-2xl text-accent-700" aria-hidden="true">
          ✓
        </span>
        <h3 className="mt-6 font-display text-3xl text-ink-900">{copy.successTitle}</h3>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-600">{copy.successText}</p>
        <button type="button" onClick={onClose} className="btn-primary mt-8">
          {copy.successClose}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="booking-form">
      <div>
        <label htmlFor="booking-name" className="label-micro mb-2">
          {t.name} <span aria-hidden="true">*</span>
        </label>
        <input
          data-booking-initial-focus
          id="booking-name"
          name="name"
          required
          autoComplete="name"
          placeholder={t.namePlaceholder}
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={describedBy("name")}
          className="field"
        />
        {errors.name ? <p id="name-error" className="mt-1.5 text-xs text-danger-700">{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="booking-phone" className="label-micro mb-2">
          {t.phone} <span aria-hidden="true">*</span>
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
        {errors.phone ? <p id="phone-error" className="mt-1.5 text-xs text-danger-700">{errors.phone}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-service" className="label-micro mb-2">{t.service}</label>
          <select id="booking-service" name="service" defaultValue="" className="field">
            <option value="">{t.servicePlaceholder}</option>
            {options.map((option) => <option key={option.value} value={option.label}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="booking-time" className="label-micro mb-2">{t.preferredTime}</label>
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
          {t.email} <span className="normal-case tracking-normal">({t.optional})</span>
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
        {errors.email ? <p id="email-error" className="mt-1.5 text-xs text-danger-700">{errors.email}</p> : null}
      </div>

      <div>
        <label htmlFor="booking-message" className="label-micro mb-2">
          {t.message} <span className="normal-case tracking-normal">({t.optional})</span>
        </label>
        <textarea id="booking-message" name="message" rows={3} placeholder={t.messagePlaceholder} className="field resize-none" />
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="booking-company">Company</label>
        <input id="booking-company" name="company" tabIndex={-1} autoComplete="off" />
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
