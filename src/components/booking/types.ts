export type BookingOption = { value: string; label: string };

export type BookingCopy = {
  title: string;
  intro: string;
  close: string;
  successTitle: string;
  successText: string;
  successClose: string;
  loading: string;
  form: {
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    service: string;
    servicePlaceholder: string;
    preferredTime: string;
    timeAny: string;
    timeMorning: string;
    timeAfternoon: string;
    timeEvening: string;
    message: string;
    messagePlaceholder: string;
    optional: string;
    submit: string;
    consent: string;
    error: string;
    invalidName: string;
    invalidPhone: string;
    invalidEmail: string;
  };
};
