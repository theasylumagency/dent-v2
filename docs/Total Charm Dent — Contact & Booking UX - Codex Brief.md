# Total Charm Dent — Contact & Booking UX / Codex Brief

## მიზანი

ამ ეტაპზე Homepage-ის ბოლო სექციაში Contact და Visit Booking გაერთიანებულია. საჭიროა მათი ფუნქციური გაყოფა:

- **Booking** გახდეს საიტის გლობალური მოქმედება და ხელმისაწვდომი იყოს სხვადასხვა გვერდიდან drawer-ის საშუალებით.
- **Contact** გადავიდეს ცალკე `/contact` გვერდზე.
- Homepage დასრულდეს ძლიერი, მაგრამ მშვიდი **Booking CTA** სექციით.
- არსებული interactive map აღარ იყოს Homepage-ის ნაწილი.
- Contact გვერდზე map ჩაიტვირთოს lazy-load-ით, viewport-ს მიახლოებისას.

მთელი გამოცდილება უნდა შეესაბამებოდეს Total Charm Dent-ის ვიზუალურ ხასიათს: premium, მშვიდი, სუფთა, confidence without pressure.

---

# 1. GLOBAL BOOKING DRAWER

## Trigger

ყველა `დაჯავშნე ვიზიტი` CTA უნდა ხსნიდეს ერთსა და იმავე global booking drawer-ს.

Drawer უნდა შეიძლებოდეს გამოყენებული იყოს:

- Header-იდან
- Homepage final CTA-დან
- Services გვერდებიდან
- Doctors გვერდებიდან
- Contact გვერდიდან
- მომავალში სხვა შესაბამისი CTA-ებიდან

არ გადავიდეს ცალკე Booking page-ზე.

---

## Desktop behaviour

Drawer შემოვიდეს **მარჯვნიდან**.

რეკომენდებული სიგანე:

`440–480px`

ოპტიმალური საწყისი მნიშვნელობა:

`460px`

Background დარჩეს ხილული მსუბუქი dim/overlay-ით.

Drawer არ უნდა გამოიყურებოდეს როგორც აგრესიული popup.

---

## Mobile behaviour

Mobile-ზე გამოიყენოს თითქმის full-screen drawer / sheet.

ფორმას უნდა ჰქონდეს კომფორტული scroll.

Close button მუდმივად ადვილად ხელმისაწვდომი იყოს.

---

## Closing behaviour

Drawer-ის დახურვა უნდა იყოს მაქსიმალურად მარტივი.

უნდა იხურებოდეს:

- `×` ღილაკით
- Desktop-ზე `Esc`-ით
- Desktop-ზე backdrop click-ით
- Browser Back-ის გამოყენებისას, თუ drawer ღიაა, ჯერ დაიხუროს drawer და მომხმარებელი არ გავიდეს გვერდიდან

არ გამოიყენო confirmation dialog ტიპის:

> დარწმუნებული ხართ, რომ გსურთ გასვლა?

Drawer უნდა აღიქმებოდეს როგორც shortcut და არა როგორც conversion trap.

---

## Accessibility / UX

Drawer-ის გახსნისას:

- background scroll დაიბლოკოს
- keyboard focus გადავიდეს drawer-ში
- focus იყოს trapped drawer-ის ფარგლებში
- drawer-ის დახურვისას focus დაბრუნდეს იმ ელემენტზე, საიდანაც გაიხსნა

Close button იყოს ვიზუალურად მკაფიო და საკმარისი hit-area-ით.

Drawer **არასოდეს გაიხსნას ავტომატურად**.

არ გამოიყენო timer popup, exit-intent popup ან სხვა forced behaviour.

---

# 2. FORM DRAFT PRESERVATION

თუ მომხმარებელი ფორმას ნაწილობრივ შეავსებს და შემთხვევით დახურავს drawer-ს:

- იმავე browsing session-ში ხელახლა გახსნისას შეყვანილი ინფორმაცია აღდგეს
- page refresh-ის შემდეგ persistence აუცილებელი არ არის
- localStorage-ში გრძელვადიანი შენახვა არ გვჭირდება
- წარმატებული submission-ის შემდეგ draft სრულად გასუფთავდეს

შესაძლებელია session-level state ან sessionStorage.

---

# 3. BOOKING DRAWER CONTENT

Drawer-ში არ გვჭირდება:

- navigation
- logo repetition
- დამატებითი მენიუ
- doctor selector
- promotional banners
- ზედმეტი explanatory copy

სტრუქტურა:

### Title

**დაჯავშნე ვიზიტი**

### Intro

**დატოვეთ თქვენი მონაცემები და ჩვენი გუნდი დაგიკავშირდებათ ვიზიტის დროის შესათანხმებლად.**

---

# 4. BOOKING FORM

ფორმის საბოლოო სტრუქტურა:

### სახელი *

Placeholder:

`თქვენი სახელი`

---

### ტელეფონი *

Placeholder:

`+995 5XX XX XX XX`

ქართული ნომერი იყოს primary UX, თუმცა validation-მა საერთაშორისო ნომერიც არ უნდა დაბლოკოს.

---

### მიმართულება

Dropdown.

Default selected option:

**ჯერ არ ვიცი**

ეს ვარიანტი აუცილებლად დარჩეს.

მომხმარებელს არ მოვთხოვოთ წინასწარ საკუთარი პრობლემის დიაგნოსტირება.

დანარჩენი dropdown options წამოვიდეს საიტზე არსებული სერვისების / მიმართულებების მონაცემებიდან, თუ ტექნიკურად შესაძლებელია.

---

### როდის დაგირეკოთ?

არსებული UX პრინციპი შევინარჩუნოთ.

Default შეიძლება იყოს:

**ნებისმიერ დროს**

დანარჩენი ვარიანტები უნდა შეესაბამებოდეს უკვე არსებულ ბიზნეს-ლოგიკას.

---

### ელ. ფოსტა — არასავალდებულო

Label:

**ელ. ფოსტა (არასავალდებულო)**

Placeholder:

`you@example.com`

---

### შეტყობინება — არასავალდებულო

Label:

**შეტყობინება (არასავალდებულო)**

Placeholder:

**მოკლედ აღწერეთ, რა გაინტერესებთ**

Textarea.

---

# 5. FORM CTA

Button:

**დაჯავშნე ვიზიტი**

არ გამოიყენო external-link arrow `↗`.

ეს მოქმედება არის form submission და არა navigation.

---

# 6. SUCCESS STATE

Successful submission-ის შემდეგ ფორმა ჩანაცვლდეს სუფთა success state-ით.

### Heading

**მოთხოვნა მიღებულია**

### Text

**მადლობა. ჩვენი გუნდი დაგიკავშირდებათ ვიზიტის დროის შესათანხმებლად.**

არ გამოიყენო ზედმეტი animation ან confetti.

შეიძლება იყოს ძალიან მსუბუქი confirmation icon / check animation.

Success state-ში შესაძლებელი იყოს drawer-ის მარტივად დახურვა.

---

# 7. ERROR STATES

Validation იყოს inline და მშვიდი.

არ გამოიყენო aggressive red blocks.

აუცილებელი ველები:

- სახელი
- ტელეფონი

ელფოსტა და შეტყობინება optional.

Network/server error-ის შემთხვევაში მომხმარებელს არ დავაკარგვინოთ შეყვანილი ინფორმაცია.

მაგალითი:

**მოთხოვნის გაგზავნა ვერ მოხერხდა. სცადეთ ხელახლა რამდენიმე წამში.**

თუ submission ხელახლა წარმატებით შესრულდება, normal success state გამოვიდეს.

---

# 8. HOMEPAGE — REMOVE CURRENT CONTACT SECTION

Homepage-ის არსებული გაერთიანებული:

**Contact + Booking + Map**

სექცია გაუქმდეს.

Homepage-ზე interactive map აღარ ჩაიტვირთოს.

ეს შეამცირებს საწყის გვერდზე არასაჭირო map script-ის / third-party dependency-ის დატვირთვას.

---

# 9. HOMEPAGE — NEW FINAL BOOKING CTA

Homepage დასრულდეს დამოუკიდებელი Booking CTA სექციით.

მისი ამოცანაა არა ინფორმაციის ჩვენება, არამედ ერთი მკაფიო მოქმედება.

### Heading

**დაგეგმეთ ვიზიტი**

### Supporting copy

შეიძლება გამოყენებული იყოს:

**დატოვეთ თქვენი მონაცემები და ჩვენი გუნდი დაგიკავშირდებათ ვიზიტის დროის შესათანხმებლად.**

### Primary CTA

**დაჯავშნე ვიზიტი**

→ opens global booking drawer.

### Secondary link

მეორადი, ნაკლებად აქცენტირებული:

**დაგვიკავშირდით →**

→ `/contact`

Primary CTA მკაფიოდ უნდა დომინირებდეს secondary action-ზე.

---

# 10. NEW `/contact` PAGE

შეიქმნას ცალკე Contact page.

Page-ის მთავარი ამოცანებია:

1. სწრაფად მისცეს მომხმარებელს საკონტაქტო ინფორმაცია
2. აჩვენოს რეალური კლინიკის შესასვლელი
3. დაეხმაროს ფიზიკურად მოძებნაში
4. საჭიროების შემთხვევაში გახსნას იგივე Booking drawer

---

# 11. CONTACT PAGE — HERO

Desktop-ზე გამოიყენოს split layout.

## Left column

### Heading

**დაგვიკავშირდით**

### Short copy

**თუ გსურთ ვიზიტის დაგეგმვა ან გაქვთ შეკითხვა, დაგვიკავშირდით თქვენთვის მოსახერხებელი გზით.**

შემდეგ გამოჩნდეს:

- მისამართი
- ტელეფონი
- სამუშაო საათები
- ელფოსტა, თუ საბოლოოდ გამოიყენება საჯარო საკონტაქტო არხად

ტელეფონი იყოს clickable `tel:` link.

ელფოსტა — `mailto:`.

### CTA

**დაჯავშნე ვიზიტი**

→ global booking drawer.

---

# 12. CONTACT HERO IMAGE

Hero-ის მარჯვენა მხარეს გამოიყენოს მოწოდებული **რეალური კლინიკის ექსტერიერის ფოტო**.

ფაილი:

`exterior.jpeg`

ფოტოს ფუნქციაა:

- რეალური ადგილის იდენტიფიცირება
- ნდობის გაძლიერება
- მომხმარებლის დახმარება კლინიკის ქუჩაში პოვნაში

არ გამოვიყენოთ იგი full-width cinematic hero-დ.

რეკომენდებული crop desktop-ზე:

- დაახლოებით `4:5`
- ან `3:4`

აქცენტი:

- მთავარი შესასვლელი
- Total Charm Dent-ის აბრა
- შენობის ცნობადი ნაწილი

შესაძლებლობის ფარგლებში crop-ით შემცირდეს:

- ზედმეტი ზედა სართული
- ზედმეტი ასფალტი
- არასაჭირო გარემო

არ მოხდეს ფოტოს ისეთი რედაქტირება, რომელიც რეალურ ლოკაციას შეცვლის ან მომხმარებელს დააბნევს.

`object-fit: cover`

საჭიროების შემთხვევაში `object-position` ხელით დარეგულირდეს.

---

# 13. CONTACT PAGE — LOCATION SECTION

Hero-ის შემდეგ:

## Heading

**როგორ მოგვაგნოთ**

აქ განთავსდეს interactive map.

Map **არ ჩაიტვირთოს initial page load-ზე**, თუ ამის თავიდან აცილება შესაძლებელია.

გამოიყენე lazy loading / viewport-based loading.

მაგალითად:

`IntersectionObserver`

Map-ის ჩატვირთვა დაიწყოს მაშინ, როდესაც Location section viewport-ს მიუახლოვდება.

მომხმარებელს არ უნდა დასჭირდეს:

**„რუკის ჩატვირთვა“**

ღილაკზე დაჭერა.

ანუ:

- Homepage-ზე map საერთოდ არ იტვირთება
- Contact page-ზე იტვირთება ავტომატურად, მაგრამ მხოლოდ საჭიროებისას

ეს გვაძლევს კარგ performance/UX ბალანსს.

---

# 14. LOCATION DETAILS

Map-ს ახლდეს:

- სრული მისამართი
- **გახსენი Google Maps-ში**
- საჭიროების შემთხვევაში პარკინგის ინფორმაცია
- საჭიროების შემთხვევაში შესასვლელის მოკლე განმარტება

Google Maps external link ახალ tab-ში შეიძლება გაიხსნას.

External-link icon აქ ლოგიკურია.

---

# 15. CONTACT DETAILS REPETITION

Contact page-ზე არ შევქმნათ მეორე დიდი contact-information section, თუ იგივე ინფორმაცია უკვე Hero-ში ჩანს.

საჭიროების შემთხვევაში Location section-ის შემდეგ შეიძლება არსებობდეს მხოლოდ მცირე compact information row:

`ტელეფონი · ელფოსტა · სამუშაო საათები`

მაგრამ repetition არ უნდა გახდეს ვიზუალურად მძიმე.

---

# 16. CONTACT PAGE — FINAL CTA

გვერდის ბოლოს ისევ Booking CTA.

### Heading

**გსურთ ვიზიტის დაგეგმვა?**

### Text

**დატოვეთ თქვენი მონაცემები და ჩვენი გუნდი დაგიკავშირდებათ დროის შესათანხმებლად.**

### CTA

**დაჯავშნე ვიზიტი**

→ იგივე global booking drawer.

არ შეიქმნას მეორე booking form პირდაპირ Contact page-ში.

---

# 17. VISUAL DIRECTION

შევინარჩუნოთ არსებული Total Charm Dent-ის visual system.

ძირითადი გარემო:

- warm ivory
- soft beige
- graphite
- white
- brand blue `#7AC7EF`

Brand blue იყოს აქცენტი და არა მთელი გვერდის ფონი.

განსაკუთრებით Contact გვერდზე ეს მნიშვნელოვანია, რადგან რეალურ exterior photo-ში უკვე ძალიან ძლიერი ლურჯი აბრაა.

UI-მ ეს ლურჯი უნდა დააბალანსოს და არა გააორმაგოს.

---

# 18. DRAWER VISUAL STYLE

Booking drawer:

- warm white / ivory background
- generous spacing
- restrained borders
- existing border-radius system
- existing typography
- subtle shadow only if necessary
- no exaggerated glassmorphism
- no heavy gradients
- no excessive animation

Opening/closing animation იყოს სწრაფი და მშვიდი.

რეკომენდებული duration:

`220–320ms`

Respect:

`prefers-reduced-motion`

---

# 19. RESPONSIVE

ყველა ცვლილება სრულად responsive იყოს.

### Desktop

- Contact hero split layout
- drawer right side
- Location map შეიძლება ფართო landscape ფორმატში

### Tablet

- split layout შეიძლება გადავიდეს უფრო კომპაქტურ grid-ში

### Mobile

Contact hero:

1. ტექსტი / contact details
2. CTA
3. exterior image

Location section:

1. heading
2. map
3. address / Maps action

Booking drawer mobile-ზე გახდეს თითქმის full-screen.

---

# 20. HEADER / NAVIGATION

Navigation-ში იყოს ცალკე:

**კონტაქტი**

→ `/contact`

Header-ის primary Booking CTA:

**დაჯავშნე ვიზიტი**

→ global drawer.

Booking CTA-მ არ უნდა გადაიყვანოს `/contact` გვერდზე.

Contact და Booking ორი განსხვავებული user intent-ია.

---

# 21. ARCHITECTURE

Booking drawer შეიქმნას reusable global component-ად.

სასურველი ლოგიკა:

```text
BookingProvider / global state
        ↓
openBooking()
closeBooking()
        ↓
BookingDrawer
```

ნებისმიერი CTA-დან შესაძლებელი იყოს იგივე drawer-ის გახსნა.

არ მოხდეს drawer/form markup-ის დუბლირება თითოეულ გვერდზე.

თუ პროექტში უკვე არსებობს შესაბამისი state-management pattern, გამოიყენე არსებული არქიტექტურა ახალი dependency-ის დამატების ნაცვლად.

---

# 22. DATA / SUBMISSION

შეინარჩუნე არსებული booking backend/API behaviour, თუ უკვე არსებობს.

UI refactor-ის გამო booking submission არ უნდა გატყდეს.

თუ არსებული Homepage form უკვე დაკავშირებულია backend-ს:

- იგივე endpoint
- იგივე validation/business logic
- იგივე admin flow

გამოიყენე ახალ global drawer-ში.

არ შეცვალო backend contract მხოლოდ UI-ის გადაკეთების გამო, თუ ამის ტექნიკური აუცილებლობა არ არსებობს.

---

# 23. SEO

ახალი `/contact` გვერდი იყოს server-rendered/indexable ჩვეულებრივი გვერდი.

ჰქონდეს შესაბამისი:

- title
- description
- canonical
- contact/location semantics

საკონტაქტო მონაცემები იყოს HTML-ში და არა მხოლოდ map iframe/widget-ში.

მისამართი, ტელეფონი და სამუშაო საათები crawler-ისთვის ტექსტურად წაკითხვადი უნდა დარჩეს.

---

# 24. PERFORMANCE

ძირითადი performance მიზანი:

**Map dependency აღარ მოხვდეს Homepage-ის initial load-ში.**

Contact page-ზეც map dependency ჩაიტვირთოს მხოლოდ Location section-ს მიახლოებისას.

Exterior image გამოიყენოს შესაბამისი Next.js image optimization, თუ პროექტი `next/image`-ს იყენებს.

არ ჩაიტვირთოს ზედმეტად დიდი original image mobile-ზე.

გამოიყენე responsive `sizes`.

---

# 25. DO NOT

არ გააკეთო:

- automatic booking popup
- forced modal
- difficult-to-find close button
- doctor selector
- Homepage map
- map „Load map“ button
- duplicate booking forms
- giant Contact page
- aggressive conversion copy
- exit-intent behaviour
- newsletter-style popup behaviour
- unnecessary new dependencies

---

# FINAL USER FLOW

```text
Homepage / Service / Doctor / Contact
                ↓
        „დაჯავშნე ვიზიტი“
                ↓
        Global Booking Drawer
                ↓
            Form submit
                ↓
        „მოთხოვნა მიღებულია“
                ↓
Clinic contacts patient to agree appointment time
```

Contact intent:

```text
Navigation
    ↓
კონტაქტი
    ↓
/contact
    ↓
Contact details + real exterior photo
    ↓
როგორ მოგვაგნოთ
    ↓
Lazy-loaded map + Google Maps
```

---

## საბოლოო პრინციპი

**Booking უნდა იყოს ყოველთვის ხელმისაწვდომი, მაგრამ არასოდეს მომაბეზრებელი.  
Contact გვერდმა უნდა უპასუხოს „სად ხართ და როგორ დაგიკავშირდეთ?“ კითხვას.  
Booking drawer-მა კი მხოლოდ ერთ რამეს უნდა აკეთებდეს — ვიზიტის დაწყება გახადოს მაქსიმალურად მარტივი.**