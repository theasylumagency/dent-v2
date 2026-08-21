import { readFileSync, writeFileSync } from "node:fs";

const blocks = {
  ka: {
    ctaDefault: "დატოვე ნომერი",
    call: "დარეკვა",
    reasonsHeading: "რატომ დაგვიტოვოთ ნომერი",
    reasons: [
      { title: "უფასო კონსულტაცია", text: "პირველი შეხვედრა და მკურნალობის გეგმის განხილვა უფასოა — გადაწყვეტილებას ამის შემდეგ იღებთ." },
      { title: "დაგირეკავთ იმავე დღეს", text: "სამუშაო საათებში, 9:00 – 21:00. ღამით გამოგზავნილ მოთხოვნას დილით ვპასუხობთ." },
      { title: "ნათელი ფასი", text: "ღირებულებას კონსულტაციაზევე გეტყვით, ფარული დანამატების გარეშე." },
    ],
    stepsHeading: "რა ხდება შემდეგ",
    stepsIntro: "ფორმის გაგზავნა ჯერ არ ნიშნავს დაჯავშნილ ვიზიტს — ჯერ დაგირეკავთ და ერთად შევარჩევთ დროს.",
    steps: [
      { title: "დაგირეკავთ", text: "მოკლედ დაგისვამთ რამდენიმე კითხვას, რომ სწორ ექიმთან მოგახვედროთ." },
      { title: "შევათანხმებთ დროს", text: "შემოგთავაზებთ თავისუფალ საათებს და ავირჩევთ თქვენთვის მოსახერხებელს." },
      { title: "კონსულტაცია კლინიკაში", text: "დათვალიერება, გეგმა და ღირებულება — ერთ შეხვედრაზე." },
    ],
    formTitle: "დატოვეთ ნომერი",
    formIntro: "ორი ველი — სახელი და ტელეფონი. დანარჩენს ტელეფონში შევათანხმებთ.",
    formSubmit: "გამოგზავნა",
    formSuccessTitle: "მოთხოვნა მიღებულია",
    formSuccessText: "მადლობა. დაგირეკავთ სამუშაო საათებში, 9:00 – 21:00.",
    finalCtaTitle: "მზად ხართ პირველი ნაბიჯისთვის?",
    finalCtaText: "დატოვეთ ნომერი და დანარჩენს ჩვენ მოვაგვარებთ.",
    finalCtaButton: "დატოვე ნომერი",
    endedTitle: "კამპანია დასრულდა",
    endedText: "ეს შეთავაზება აღარ მოქმედებს, თუმცა კლინიკა კვლავ გელოდებათ.",
    endedCta: "მთავარ გვერდზე",
  },
  en: {
    ctaDefault: "Leave your number",
    call: "Call",
    reasonsHeading: "Why leave your number",
    reasons: [
      { title: "Free consultation", text: "The first visit and the treatment plan discussion cost nothing — you decide afterwards." },
      { title: "We call back the same day", text: "Working hours are 9:00 – 21:00. Requests sent overnight are answered in the morning." },
      { title: "A clear price", text: "You get the full cost at the consultation itself, with nothing added later." },
    ],
    stepsHeading: "What happens next",
    stepsIntro: "Sending the form is not a confirmed appointment yet — we call first and pick a time together.",
    steps: [
      { title: "We call you", text: "A few short questions, so you reach the right dentist straight away." },
      { title: "We agree on a time", text: "You get the free slots and choose whichever one suits you." },
      { title: "Consultation at the clinic", text: "Examination, treatment plan and price — all in one visit." },
    ],
    formTitle: "Leave your number",
    formIntro: "Two fields — your name and phone. We sort out the rest on the call.",
    formSubmit: "Send",
    formSuccessTitle: "Request received",
    formSuccessText: "Thank you. We will call you during working hours, 9:00 – 21:00.",
    finalCtaTitle: "Ready for the first step?",
    finalCtaText: "Leave your number and we take care of the rest.",
    finalCtaButton: "Leave your number",
    endedTitle: "This campaign has ended",
    endedText: "The offer is no longer running, but the clinic is still here for you.",
    endedCta: "Go to the home page",
  },
  ru: {
    ctaDefault: "Оставить номер",
    call: "Позвонить",
    reasonsHeading: "Почему стоит оставить номер",
    reasons: [
      { title: "Бесплатная консультация", text: "Первый приём и обсуждение плана лечения бесплатны — решение вы принимаете после." },
      { title: "Перезвоним в тот же день", text: "Рабочие часы: 9:00 – 21:00. На ночные заявки отвечаем утром." },
      { title: "Понятная цена", text: "Стоимость называем сразу на консультации, без скрытых доплат." },
    ],
    stepsHeading: "Что будет дальше",
    stepsIntro: "Отправка формы — ещё не подтверждённая запись: сначала мы позвоним и вместе выберем время.",
    steps: [
      { title: "Мы вам позвоним", text: "Зададим пару коротких вопросов, чтобы вы сразу попали к нужному врачу." },
      { title: "Согласуем время", text: "Предложим свободные часы, а вы выберете удобный." },
      { title: "Консультация в клинике", text: "Осмотр, план лечения и стоимость — за один приём." },
    ],
    formTitle: "Оставьте номер",
    formIntro: "Два поля — имя и телефон. Остальное обсудим по телефону.",
    formSubmit: "Отправить",
    formSuccessTitle: "Заявка принята",
    formSuccessText: "Спасибо. Мы позвоним в рабочие часы, 9:00 – 21:00.",
    finalCtaTitle: "Готовы сделать первый шаг?",
    finalCtaText: "Оставьте номер — остальное мы возьмём на себя.",
    finalCtaButton: "Оставить номер",
    endedTitle: "Кампания завершена",
    endedText: "Это предложение больше не действует, но клиника по-прежнему вас ждёт.",
    endedCta: "На главную",
  },
};

for (const [locale, block] of Object.entries(blocks)) {
  const path = `src/i18n/dictionaries/${locale}.json`;
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed.landing) {
    console.log(`${locale}: already present, skipping`);
    continue;
  }

  const rendered = JSON.stringify(block, null, 2)
    .split("\n")
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join("\n");

  const closing = raw.lastIndexOf("}");
  const body = raw.slice(0, closing).replace(/\s*$/, "");
  const next = `${body},\n  "landing": ${rendered}\n}\n`;

  JSON.parse(next);
  writeFileSync(path, next);
  console.log(`${locale}: landing block added`);
}
