export const FORM_VERSION = "2026-09-19-v1";
export type Answers = Record<string, string | string[]>;
export type Option = { value: string; label: string };
export type Condition = { key: string; values: string[] };
export type Field = {
  id: string; label: string; kind: "single" | "multi" | "text" | "textarea";
  options?: Option[]; max?: number; ranked?: boolean; exclusive?: string[];
  when?: Condition[]; hint?: string;
};
export type Question = { number?: number; title: string; hint?: string; fields: Field[] };
export type Section = { title: string; description: string; questions: Question[]; when?: Condition[] };
const options = (labels: string[]): Option[] => labels.map((label, index) => ({ value: String(index), label }));
const unknown = { value: "unknown", label: "არ გვაქვს ინფორმაცია" };
const other = { value: "other", label: "სხვა" };
const unsure = { value: "unknown", label: "ერთად განსაზღვრა გვჭირდება" };
const single = (id: string, label: string, labels: string[]): Field => ({
  id, label, kind: "single", options: [...options(labels), unknown],
});
const text = (id: string, label: string, when?: Condition[]): Field => ({ id, label, kind: "text", when });
const multi = (id: string, label: string, labels: string[], max?: number): Field => ({
  id, label, kind: "multi", options: [...options(labels), other, unknown], max, exclusive: ["unknown"],
});
const otherText = (key: string): Field => text(key + "Other", "სხვა — გთხოვთ, დააზუსტოთ", [{ key, values: ["other"] }]);
export const services: Option[] = [
  { value: "implants", label: "იმპლანტაცია" }, { value: "prosthetics", label: "პროთეზირება" },
  { value: "orthodontics", label: "ორთოდონტია" }, { value: "aesthetic", label: "ესთეტიკური სტომატოლოგია" },
  { value: "therapy", label: "თერაპიული სტომატოლოგია" }, { value: "hygiene", label: "ჰიგიენა და პროფილაქტიკა" },
  { value: "children", label: "ბავშვთა სტომატოლოგია" }, { value: "surgery", label: "ქირურგია" }, other,
];
const languages: Option[] = [{ value: "ka", label: "ქართული" }, { value: "en", label: "ინგლისური" }, { value: "ru", label: "რუსული" }, other];
const yes = ["კი", "ნაწილობრივ", "არა"];
export const sections: Section[] = [
  {
    title: "მიზანი და პრიორიტეტები", description: "დავიწყოთ იმით, რაც კლინიკისთვის ყველაზე მნიშვნელოვანია.",
    questions: [
      { number: 1, title: "მომდევნო 3–6 თვეში რომელი შედეგი იქნება თქვენთვის ყველაზე მნიშვნელოვანი?", hint: "აირჩიეთ მთავარი შედეგი და, სურვილის შემთხვევაში, ერთი დამატებითი. არჩევის რიგი აღნიშნავს პრიორიტეტს.", fields: [
        { ...multi("goals", "სასურველი შედეგები", ["მეტი ახალი პაციენტი", "მეტი პაციენტი კონკრეტულ მომსახურებაზე", "არსებული პაციენტების დაბრუნება ან მკურნალობის გაგრძელება", "თავისუფალი საათების უკეთ შევსება", "კლინიკის ცნობადობისა და ნდობის გაძლიერება", "მომართვების უკეთ დამუშავება და მეტი ჩაწერა"], 2), ranked: true },
        otherText("goals"), text("goalTarget", "თუ უკვე გაქვთ კონკრეტული სამიზნე, მიუთითეთ შედეგი და ვადა (სურვილისამებრ)"),
      ] },
      { number: 2, title: "რომელი მომსახურებების განვითარება გსურთ პირველ რიგში?", hint: "მაქსიმუმ სამი. მონიშნეთ პრიორიტეტის მიხედვით; რიგის შეცვლაც შეგიძლიათ.", fields: [
        { id: "priorities", label: "პრიორიტეტული მომსახურებები", kind: "multi", options: [...services, unsure], max: 3, ranked: true, exclusive: ["unknown"] },
        otherText("priorities"),
        single("priorityReason", "რატომ არის პირველი მიმართულება პრიორიტეტული? (სურვილისამებრ)", ["თავისუფალი რესურსი", "მაღალი მოთხოვნა", "ბიზნესისთვის მნიშვნელოვანი მიმართულება", "ახალი მომსახურება", "სხვა"]),
      ] },
      { number: 3, title: "ამ მიმართულებებზე რამდენი დამატებითი პაციენტის მიღება შეგიძლიათ თვეში?", hint: "მიახლოებითი შეფასებაც საკმარისია. მომსახურების არჩევის შემდეგ აქ შესაბამისი ველები გამოჩნდება.", fields: [
        ...services.map(service => ({ ...single("capacity_" + service.value, service.label, ["დამატებით მიღება ამ ეტაპზე ვერ ხერხდება", "დაახლოებით 1–5", "დაახლოებით 6–10", "დაახლოებით 11–20", "21 ან მეტი"]), when: [{ key: "priorities", values: [service.value] }] })),
        text("restrictions", "არის მომსახურება, აუდიტორია ან დაპირება, რომლის რეკლამირებაც არ გსურთ? (სურვილისამებრ)"),
      ] },
    ],
  },
  {
    title: "პაციენტები და არჩევის მიზეზები", description: "ვისთან გვინდა საუბარი და რა არის მათთვის მნიშვნელოვანი?",
    questions: [
      { number: 4, title: "ვის მოზიდვას ისურვებდით პირველ რიგში?", hint: "აირჩიეთ მაქსიმუმ ორი ჯგუფი.", fields: [
        multi("audience", "სასურველი აუდიტორია", ["კლინიკის ახლოს მცხოვრები ან მომუშავე ადამიანები", "თბილისის სხვა უბნების მცხოვრებლები", "საქართველოს სხვა ქალაქებიდან და რეგიონებიდან", "საქართველოში მცხოვრები უცხოელები", "მკურნალობისთვის უცხოეთიდან ჩამომსვლელები"], 2),
        otherText("audience"), text("locations", "მნიშვნელოვანი უბნები, ქალაქები ან ქვეყნები (სურვილისამებრ)"),
      ] },
      { number: 5, title: "რომელ ენებზე შეგიძლიათ პაციენტის მომსახურება?", fields: [
        { id: "languages", label: "მომსახურების ენები", kind: "multi", options: [...languages, unknown], exclusive: ["unknown"] },
        otherText("languages"),
        ...languages.map(language => ({ ...single("language_" + language.value, language.label + " — მომსახურების შესაძლებლობა", ["ადმინისტრატორთან მიმოწერა და ჩაწერა", "ექიმის კონსულტაცია და მკურნალობის გეგმის ახსნა", "ორივე"]), when: [{ key: "languages", values: [language.value] }] })),
      ] },
      { number: 6, title: "თქვენი დაკვირვებით, რატომ ირჩევენ პაციენტები თქვენს კლინიკას?", hint: "მაქსიმუმ სამი მიზეზი.", fields: [
        multi("advantages", "კლინიკის არჩევის მიზეზები", ["კონკრეტული ექიმის გამოცდილება ან რეპუტაცია", "პაციენტების ან სხვა ექიმების რეკომენდაცია", "კონკრეტული მომსახურების გამოცდილება", "პროცესის გასაგები ახსნა და ყურადღებიანი მომსახურება", "ტექნოლოგია ან აღჭურვილობა", "მდებარეობა ან სამუშაო საათები", "ფასი ან გადახდის პირობები", "სასურველ ენაზე მომსახურება"], 3),
        otherText("advantages"), text("evidence", "ერთი მაგალითი ან საჯარო ბმული, რომელიც ამ უპირატესობას აჩვენებს (სურვილისამებრ)"),
      ] },
      { number: 7, title: "რა უშლის ყველაზე ხშირად ხელს ადამიანს ვიზიტზე ჩაწერაში ან მკურნალობის დაწყებაში?", hint: "აირჩიეთ მაქსიმუმ სამი.", fields: [
        multi("barriers", "შესაძლო დაბრკოლებები", ["ფასი", "შიში ან შფოთვა", "დრო ან მოუხერხებელი გრაფიკი", "მდებარეობა", "მკურნალობის საჭიროების ან პროცესის გაურკვევლობა", "ნდობის ნაკლებობა", "პასუხის ან თავისუფალი ვიზიტის ლოდინი"], 3), otherText("barriers"),
      ] },
    ],
  },
  {
    title: "არსებული გამოცდილება და მომართვები", description: "ზუსტი სტატისტიკა აუცილებელი არ არის — თქვენი დაკვირვებაც გამოგვადგება.",
    questions: [
      { number: 8, title: "დაახლოებით რამდენი ახალი პაციენტი გყავთ თვეში?", hint: "სასურველია ბოლო სამი დასრულებული თვის საშუალო. ვგულისხმობთ პირველად მოსულ პაციენტს, და არა მხოლოდ მომართვას.", fields: [
        single("newPatients", "ახალი პაციენტები თვეში", ["0", "1–20", "21–50", "51–100", "101 ან მეტი"]),
        { ...single("patientBasis", "პასუხის საფუძველი", ["აღრიცხული მონაცემი", "მიახლოებითი შეფასება"]), when: [{ key: "newPatients", values: ["0", "1", "2", "3", "4"] }] },
        text("patientPeriod", "თუ სხვა პერიოდს გულისხმობთ, მიუთითეთ (სურვილისამებრ)"),
      ] },
      { number: 9, title: "თქვენი ინფორმაციით, პირველად საიდან იგებენ ახალი პაციენტები კლინიკის შესახებ?", fields: [
        multi("sources", "კლინიკის აღმოჩენის წყაროები", ["პაციენტის, ნაცნობის ან ოჯახის წევრის რეკომენდაცია", "ექიმის ან სხვა კლინიკის რეკომენდაცია", "Google-ის ძიება", "Google Maps", "Facebook", "Instagram", "სხვა ვებგვერდი ან ონლაინ წყარო", "კლინიკასთან გავლა / აბრა"]),
        otherText("sources"), text("mainSource", "რომელ წყაროს მიიჩნევთ ყველაზე მნიშვნელოვანად? (სურვილისამებრ)"),
        single("sourceBasis", "როგორ ადგენთ წყაროს?", ["აღირიცხება სისტემურად", "აღირიცხება ნაწილობრივ", "ეს მხოლოდ ჩვენი შეფასებაა"]),
      ] },
      { number: 10, title: "როგორ ამუშავებთ ახალ მომართვას?", fields: [
        multi("contactChannels", "სად შემოდის მომართვები?", ["ტელეფონი", "Messenger", "Instagram", "WhatsApp", "ვებგვერდის ფორმა", "ელფოსტა"]), otherText("contactChannels"),
        single("responder", "ვინ პასუხობს?", ["ადმინისტრატორი", "რამდენიმე თანამშრომელი", "ექიმი", "სხვა"]),
        single("responseTime", "ონლაინ შეტყობინებაზე პასუხის დრო სამუშაო საათებში", ["10 წუთზე ნაკლები", "10–29 წუთი", "30–59 წუთი", "1–3 საათი", "3 საათზე მეტი"]),
      ] },
      { number: 11, title: "რომელი მონაცემები აღირიცხება დღეს?", fields: [
        ...["ახალი მომართვების რაოდენობა", "ვიზიტზე ჩაწერა", "რეალურად შემდგარი ვიზიტი", "გაუქმება ან გამოუცხადებლობა", "მკურნალობის დაწყება", "პაციენტის მოზიდვის წყარო"].map((label, index) => single("tracking_" + index, label, yes)),
        text("trackingTool", "აღრიცხვის ინსტრუმენტის სახელი (სურვილისამებრ)"),
      ] },
    ],
  },
  {
    title: "კონტენტი და თანამშრომლობა", description: "როგორ მოვაწყოთ თანამშრომლობა თქვენთვის მოსახერხებლად?",
    questions: [
      { number: 12, title: "რა მასალისა და დროის გამოყოფა შეგიძლიათ კონტენტისთვის?", fields: [
        multi("content", "რა შესაძლებლობები გვაქვს?", ["კლინიკისა და გუნდის არსებული ფოტოები", "ექიმების მოკლე პროფესიული პასუხები", "ტექსტების სამედიცინო გადამოწმება", "მოკლე ვიდეოჩაწერა", "კლინიკური შემთხვევების განხილვა გამოქვეყნების ნებართვის შემოწმების შემდეგ", "ახალი ფოტო/ვიდეოგადაღება"]), otherText("content"),
        single("contentTime", "სავარაუდო დრო კვირაში", ["15 წუთამდე", "15–30 წუთი", "31–60 წუთი", "60 წუთზე მეტი"]),
      ] },
      { number: 13, title: "ვისთან შევძლებთ საკითხების დაზუსტებას კლინიკის მხრიდან?", hint: "საკმარისია სახელი ან თანამდებობა. ერთი ადამიანი შეიძლება რამდენიმე საკითხში დაგვეხმაროს. თუ ჯერ არ არის განსაზღვრული, ველი შეგიძლიათ გამოტოვოთ.", fields: [
        text("coordinator", "მთავარი საკონტაქტო პირი"), text("contact", "ერთი სასურველი საკონტაქტო არხი"),
        text("medicalReviewer", "ვინ გადაამოწმებს სამედიცინო შინაარსს?"), text("contentApprover", "ვინ დაადასტურებს კონტენტის საბოლოო ვერსიას?"),
        single("approvalTime", "რამდენ სამუშაო დღეში იქნება მოსახერხებელი პასუხი?", ["1 დღეში", "2 დღეში", "3–5 დღეში", "შეთანხმება გვჭირდება"]),
      ] },
    ],
  },
];
export const optionalSections: Section[] = [
  { title: "არსებული აუდიტორია და სეზონურობა", description: "თუ გაქვთ დაკვირვება ამ საკითხებზე.", questions: [{ title: "არსებული გამოცდილება", fields: [
    text("currentGeography", "დღეს ძირითადად საიდან არიან პაციენტები?"), text("currentLanguages", "რომელ ენებზე ურთიერთობენ?"),
    text("currentDemand", "რომელი მომსახურებებია ყველაზე მოთხოვნადი?"), text("seasonality", "რომელი თვეებია უფრო დატვირთული ან ნაკლებად დატვირთული?"),
  ] }] },
  { title: "ექიმის წინა გამოცდილება", description: "თუ საერთაშორისო გამოცდილების კომუნიკაციაში გამოყენება თქვენთვის საინტერესოა.", when: [{ key: "audience", values: ["4"] }, { key: "advantages", values: ["0"] }], questions: [{ title: "წინა პრაქტიკა", fields: [
    text("doctorBackground", "რომელ ქვეყნებსა და ქალაქებში, რა წლებში და რა მიმართულებით მუშაობდა ექიმი?"),
    single("formerPatients", "დღეს მოდიან თუ არა ყოფილი პაციენტები ან მათი რეკომენდაციით ახალი ადამიანები?", ["რეგულარულად", "ზოგჯერ", "იშვიათად", "არა"]),
    text("backgroundLinks", "არსებობს საჯარო მასალა ამ გამოცდილების შესახებ? ბმული ან აღწერა"),
    text("formerCommunication", "ყოფილ პაციენტებთან კომუნიკაციის რა არხი არსებობს და გარკვეულია თუ არა მისი გამოყენების თანხმობა?"),
  ] }] },
  { title: "პაციენტების შემდგომი კომუნიკაცია", description: "პაციენტების პირადი მონაცემების მითითება საჭირო არ არის.", questions: [{ title: "შემდგომი კომუნიკაცია", fields: [
    { ...multi("followup", "იყენებთ რომელიმე შეხსენებას?", ["ვიზიტის შეხსენება", "პროფილაქტიკის შეხსენება", "მკურნალობის გაგრძელების შეხსენება", "გაუქმებული ვიზიტის შემდგომი კომუნიკაცია"]), options: [...options(["ვიზიტის შეხსენება", "პროფილაქტიკის შეხსენება", "მკურნალობის გაგრძელების შეხსენება", "გაუქმებული ვიზიტის შემდგომი კომუნიკაცია"]), { value: "none", label: "ასეთი სისტემა არ გვაქვს" }, unknown], exclusive: ["none", "unknown"] },
    text("followupProcess", "არსებობს ერთიანი აღრიცხვა, პასუხისმგებელი პირი და შეთანხმებული კომუნიკაციის წესი?"),
  ] }] },
  { title: "წინა მარკეტინგული გამოცდილება", description: "რაც უკვე სცადეთ, დაგვეხმარება შემდეგი ნაბიჯების არჩევაში.", questions: [{ title: "გამოცდილება", fields: [
    text("pastMarketing", "რა მარკეტინგული აქტივობები სცადეთ ბოლო 12 თვეში და როდის?"),
    text("marketingResults", "რომელი შედეგი დადასტურდა მომართვებით ან ვიზიტებით და რომელი ეფუძნება შთაბეჭდილებას?"),
    text("avoidRepeating", "რისი გამეორება არ გსურთ და რატომ?"),
  ] }] },
  { title: "არსებული მასალები", description: "ამ ეტაპზე საკმარისია აღწერა.", questions: [{ title: "კონტენტის არქივი", fields: [
    text("archive", "სად არის ფოტო/ვიდეომასალები და ვის შეუძლია მათი მოწოდება?"),
    single("consent", "პაციენტის ფოტო/ვიდეოს საჯარო გამოყენების თანხმობა დოკუმენტირებულია?", ["კი", "ნაწილობრივ", "არა", "შესამოწმებელია"]),
  ] }] },
  { title: "დამატებითი ინფორმაცია", description: "რაც თქვენთვის მნიშვნელოვანია და ჯერ არ გვიკითხავს.", questions: [{ title: "დამატებით", fields: [
    text("alternatives", "რომელ სხვა კლინიკებს განიხილავენ პაციენტები თქვენთან ერთად? მაქსიმუმ სამი (სურვილისამებრ)"),
    { id: "notes", label: "რა საკითხი გამოგვრჩა, რომელიც გეგმაზე გავლენას მოახდენდა?", kind: "textarea" },
  ] }] },
];
export const allSections = [...sections, ...optionalSections];
export function isVisible(when: Condition[] | undefined, answers: Answers): boolean {
  return !when || when.some(({ key, values }) => {
    const answer = answers[key];
    return Array.isArray(answer) ? values.some(value => answer.includes(value)) : values.includes(answer);
  });
}
export function fieldsFor(section: Section, answers: Answers): Field[] {
  if (!isVisible(section.when, answers)) return [];
  return section.questions.flatMap(question => question.fields).filter(field => isVisible(field.when, answers));
}
export function cleanAnswers(answers: Answers): Answers {
  const clean: Answers = {};
  for (const section of allSections) for (const field of fieldsFor(section, answers)) {
    const value = answers[field.id];
    if (typeof value === "string" && value.trim()) clean[field.id] = value.trim();
    if (Array.isArray(value) && value.length) clean[field.id] = value;
  }
  return clean;
}
export function validateAnswers(input: unknown): Answers | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const fields = new Map(allSections.flatMap(section => section.questions.flatMap(question => question.fields)).map(field => [field.id, field]));
  const answers: Answers = {};
  for (const [id, value] of Object.entries(input)) {
    const field = fields.get(id);
    if (!field) return null;
    if (field.kind === "multi") {
      if (!Array.isArray(value) || value.some(item => typeof item !== "string") || value.length > (field.max ?? 20)) return null;
      if (new Set(value).size !== value.length || value.some(item => !field.options?.some(option => option.value === item))) return null;
      if (value.length > 1 && value.some(item => field.exclusive?.includes(item))) return null;
      answers[id] = value;
    } else {
      if (typeof value !== "string" || value.length > (field.kind === "textarea" ? 4000 : 1200)) return null;
      if (field.kind === "single" && value && !field.options?.some(option => option.value === value)) return null;
      answers[id] = value;
    }
  }
  return cleanAnswers(answers);
}
export function answerLabel(field: Field, value: string | string[] | undefined): string {
  if (!value || (Array.isArray(value) && !value.length)) return "პასუხი არ არის მითითებული";
  const label = (item: string) => field.options?.find(option => option.value === item)?.label ?? item;
  return Array.isArray(value) ? value.map((item, index) => (field.ranked ? (index + 1) + ". " : "") + label(item)).join("; ") : label(value);
}
