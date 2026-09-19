"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { allSections, answerLabel, fieldsFor, FORM_VERSION, isVisible, optionalSections, sections, validateAnswers, type Answers, type Field, type Question, type Section } from "@/lib/strategy/schema";
import type { Snapshot } from "@/lib/strategy/handler";

type Draft = { answers: Answers; step: number };
type SaveState = "saved" | "saving" | "error" | "conflict";
const api = "/api/strategy";
const storageKey = (id: number) => "tcd-strategy-draft-v1-" + id;
function Arrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function FieldInput({ field, answers, onChange, disabled }: { field: Field; answers: Answers; onChange: (id: string, value: string | string[]) => void; disabled: boolean }) {
  const value = answers[field.id];
  const selected = Array.isArray(value) ? value : [];
  const toggle = (option: string) => {
    if (field.kind === "single") return onChange(field.id, option);
    if (selected.includes(option)) return onChange(field.id, selected.filter(item => item !== option));
    const next = field.exclusive?.includes(option) ? [option] : [...selected.filter(item => !field.exclusive?.includes(item)), option];
    if (!field.max || next.length <= field.max) onChange(field.id, next);
  };
  if (field.kind === "text" || field.kind === "textarea") return <div className="strategy-field">
    <label htmlFor={field.id}>{field.label}</label>
    {field.kind === "textarea" ? <textarea id={field.id} value={typeof value === "string" ? value : ""} onChange={e => onChange(field.id, e.target.value)} maxLength={4000} rows={5} disabled={disabled} /> : <input id={field.id} type="text" value={typeof value === "string" ? value : ""} onChange={e => onChange(field.id, e.target.value)} maxLength={1200} disabled={disabled} autoComplete="off" />}
  </div>;
  return <fieldset className="strategy-field" disabled={disabled}>
    <legend>{field.label}</legend>
    {field.max ? <p className="strategy-field-hint">მაქსიმუმ {field.max} არჩევანი · მონიშნულია {selected.length}</p> : null}
    <div className="strategy-options">{field.options?.map(option => {
      const checked = field.kind === "multi" ? selected.includes(option.value) : value === option.value;
      const limit = field.kind === "multi" && !checked && !field.exclusive?.includes(option.value) && !!field.max && selected.length >= field.max;
      return <label key={option.value} className={"strategy-option" + (checked ? " is-selected" : "") + (limit ? " is-limited" : "")}>
        <input type={field.kind === "multi" ? "checkbox" : "radio"} name={field.id} value={option.value} checked={checked} disabled={disabled || limit} onChange={() => toggle(option.value)} />
        <span>{option.label}</span>{field.ranked && checked && option.value !== "unknown" ? <span className="strategy-rank">{selected.indexOf(option.value) + 1}</span> : null}
      </label>;
    })}</div>
    {field.ranked && selected.length > 1 ? <div className="strategy-order"><span>პრიორიტეტების რიგი</span>{selected.map((item, index) => <div key={item}><span>{index + 1}. {field.options?.find(option => option.value === item)?.label}</span><button type="button" disabled={disabled || index === 0} aria-label={(field.options?.find(option => option.value === item)?.label ?? "") + " — ერთი პოზიციით წინ"} onClick={() => {
      const reordered = [...selected]; [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]; onChange(field.id, reordered);
    }}>↑</button></div>)}</div> : null}
    {value && (typeof value === "string" || selected.length > 0) ? <button className="strategy-clear" type="button" onClick={() => onChange(field.id, field.kind === "multi" ? [] : "")}>არჩევანის გასუფთავება</button> : null}
  </fieldset>;
}
function QuestionCard({ question, answers, onChange, disabled }: { question: Question; answers: Answers; onChange: (id: string, value: string | string[]) => void; disabled: boolean }) {
  return <section className="strategy-question"><div className="strategy-question-heading">
    {question.number ? <span className="strategy-question-number">{String(question.number).padStart(2, "0")}</span> : null}
    <div><h2>{question.title}</h2>{question.hint ? <p>{question.hint}</p> : null}</div>
  </div>{question.fields.filter(field => isVisible(field.when, answers)).map(field => <FieldInput key={field.id} field={field} answers={answers} onChange={onChange} disabled={disabled} />)}</section>;
}

export default function StrategyForm() {
  const [phase, setPhase] = useState<"loading" | "locked" | "ready" | "unavailable">("loading");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [draft, setDraft] = useState<Draft>({ answers: {}, step: -1 });
  const [editVersion, setEditVersion] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [busy, setBusy] = useState(false);
  const [accessLink, setAccessLink] = useState("");
  const [accessError, setAccessError] = useState("");
  const current = useRef<Snapshot | null>(null);
  const latest = useRef<Draft>({ answers: {}, step: -1 });
  const version = useRef(0);
  const dirty = useRef(false);
  const blocked = useRef(false);
  const pending = useRef<Promise<boolean> | null>(null);
  const booted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const backup = useCallback(() => {
    if (!current.current) return;
    try { sessionStorage.setItem(storageKey(current.current.id), JSON.stringify({ ...latest.current, revision: current.current.revision })); } catch { /* Server persistence remains available. */ }
  }, []);
  const accept = useCallback((data: Snapshot, recover = true) => {
    current.current = data;
    let next: Draft = { answers: data.answers, step: data.step };
    let hasRecovery = false;
    blocked.current = false;
    if (recover && data.status !== "submitted") {
      try {
        const cached = JSON.parse(sessionStorage.getItem(storageKey(data.id)) || "null");
        const valid = cached && validateAnswers(cached.answers);
        if (valid && Number.isInteger(cached.step) && cached.step >= -1 && cached.step <= 5) {
          if (JSON.stringify(valid) !== JSON.stringify(data.answers) || cached.step !== data.step) {
            next = { answers: valid, step: cached.step }; hasRecovery = true;
            if (cached.revision !== data.revision) blocked.current = true;
          }
        }
      } catch { /* Ignore malformed or inaccessible recovery data. */ }
    }
    if (!recover || data.status === "submitted") {
      try { sessionStorage.removeItem(storageKey(data.id)); } catch { /* Storage may be disabled. */ }
    }
    latest.current = next; dirty.current = hasRecovery;
    setDraft(next); setSnapshot(data); setPhase("ready");
    setSaveState(blocked.current ? "conflict" : hasRecovery ? "saving" : "saved");
    if (hasRecovery && !blocked.current) setEditVersion(value => value + 1);
  }, []);
  const load = useCallback(async (token?: string, recover = true) => {
    setAccessError("");
    try {
      const response = await fetch(api, token ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), cache: "no-store" } : { cache: "no-store" });
      if (response.status === 401) { setPhase("locked"); setAccessError(token ? "ბმული არ მოქმედებს ან მისი ვადა ამოიწურა. გთხოვთ, დაუკავშირდეთ კითხვარის გამომგზავნს." : ""); return; }
      if (!response.ok) { setPhase("unavailable"); return; }
      accept(await response.json(), recover);
    } catch { setPhase("unavailable"); }
  }, [accept]);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("access") ?? undefined;
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    void load(token);
  }, [load]);
  const persist = useCallback(async (submit = false): Promise<boolean> => {
    if (pending.current) { const result = await pending.current; if (!result || !submit) return result; }
    if (blocked.current || !current.current) return false;
    if (!dirty.current && !submit) return true;
    const operation = async () => {
      setSaveState("saving");
      do {
        const savedVersion = version.current;
        const data = latest.current;
        try {
          const response = await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, revision: current.current!.revision, formVersion: FORM_VERSION, submit }) });
          if (!response.ok) {
            if (response.status === 409) { blocked.current = true; setSaveState("conflict"); }
            else if (response.status === 401) { setPhase("locked"); setAccessError("ბმულის მოქმედების ვადა ამოიწურა ან წვდომა გაუქმდა. მიმდინარე პასუხების ასლი შეგიძლიათ ჩამოტვირთოთ."); setSaveState("error"); }
            else setSaveState("error");
            return false;
          }
          const updated: Snapshot = await response.json();
          current.current = updated; setSnapshot(updated);
          if (savedVersion === version.current || updated.status === "submitted") {
            dirty.current = false;
            try { sessionStorage.removeItem(storageKey(updated.id)); } catch { /* Server save succeeded. */ }
          } else backup();
          if (updated.status === "submitted") { latest.current = { answers: updated.answers, step: updated.step }; setDraft(latest.current); dirty.current = false; setSaveState("saved"); return true; }
        } catch { setSaveState("error"); return false; }
      } while (dirty.current);
      setSaveState("saved"); return true;
    };
    pending.current = operation();
    try { return await pending.current; } finally { pending.current = null; }
  }, [backup]);
  useEffect(() => {
    if (!editVersion || blocked.current) return;
    const timer = window.setTimeout(() => { void persist(); }, 800);
    return () => window.clearTimeout(timer);
  }, [editVersion, persist]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty.current) event.preventDefault(); };
    const online = () => { if (dirty.current) void persist(); };
    window.addEventListener("beforeunload", warn); window.addEventListener("online", online);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("online", online); };
  }, [persist]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [draft.step, phase, snapshot?.status]);
  const update = (next: Draft) => {
    latest.current = next; dirty.current = true; version.current += 1;
    setDraft(next); setSaveState("saving"); backup(); setEditVersion(value => value + 1);
  };
  const changeAnswer = (id: string, value: string | string[]) => {
    const values = { ...latest.current.answers, [id]: value };
    const visible = new Set(allSections.flatMap(section => fieldsFor(section, values)).map(field => field.id));
    update({ ...latest.current, answers: Object.fromEntries(Object.entries(values).filter(([key]) => visible.has(key))) });
  };
  const go = async (step: number) => { setBusy(true); if (await persist()) { update({ ...latest.current, step }); await persist(); } setBusy(false); };
  const submit = async () => { setBusy(true); if (await persist()) await persist(true); setBusy(false); };
  const download = () => {
    const content = { title: "Total Charm Dent — კითხვარის პასუხები", saved: !dirty.current, sections: allSections.filter(section => isVisible(section.when, latest.current.answers)).map(section => ({ title: section.title, answers: fieldsFor(section, latest.current.answers).map(field => ({ question: field.label, answer: answerLabel(field, latest.current.answers[field.id]) })) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "total-charm-dent-questionnaire.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const openLink = async (event: React.FormEvent) => {
    event.preventDefault(); let token = accessLink.trim();
    try { if (token.includes("#")) token = new URLSearchParams(new URL(token).hash.slice(1)).get("access") || ""; } catch { token = ""; }
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { setAccessError("გთხოვთ, ჩასვათ კითხვარის მოწვევის სრული ბმული."); return; }
    setBusy(true); await load(token); setAccessLink(""); setBusy(false);
  };
  const step = draft.step;
  const completed = snapshot?.status === "submitted";
  const activeSection = step >= 0 && step < 4 ? sections[step] : null;
  const disabled = busy || saveState === "conflict";
  const unanswered = sections.flatMap(section => section.questions).filter(question => !question.fields.some(field => {
    const value = draft.answers[field.id]; return isVisible(field.when, draft.answers) && (Array.isArray(value) ? value.length > 0 : !!value?.trim());
  })).map(question => question.number);
  const summary = (section: Section, index: number) => <section className="strategy-summary" key={section.title}>
    <div className="strategy-summary-heading"><h2>{section.title}</h2><button type="button" disabled={disabled} onClick={() => void go(index < 4 ? index : 4)}>შეცვლა</button></div>
    <dl>{fieldsFor(section, draft.answers).map(field => <div key={field.id}><dt>{field.label}</dt><dd className={!draft.answers[field.id] ? "is-unanswered" : ""}>{answerLabel(field, draft.answers[field.id])}</dd></div>)}</dl>
  </section>;

  return <div className="strategy-shell">
    <header className="strategy-header"><div className="strategy-brand"><Image src="/brand/icon.svg" width="40" height="40" alt="" /><span>TOTAL CHARM <strong>DENT</strong></span></div><span className="strategy-private"><span aria-hidden="true">◌</span> სამუშაო სივრცე</span></header>
    <main id="strategy-main" className={"strategy-main" + (step === -1 || phase !== "ready" || completed ? " strategy-main-intro" : "")}>
      {phase === "loading" ? <div className="strategy-state" role="status"><span className="strategy-eyebrow">TOTAL CHARM DENT</span><h1 ref={heading} tabIndex={-1}>ვამზადებთ თქვენს კითხვარს…</h1></div> : null}
      {phase === "locked" || phase === "unavailable" ? <div className="strategy-state">
        <span className="strategy-eyebrow">კლინიკის სამუშაო კითხვარი</span><h1 ref={heading} tabIndex={-1}>{phase === "locked" ? "შემოსვლა მოწვევით" : "კავშირი დროებით შეფერხდა"}</h1>
        <p>{phase === "locked" ? "კითხვარის გასახსნელად გამოიყენეთ თქვენთვის გამოგზავნილი პირადი ბმული." : "კავშირი ვერ დამყარდა. გთხოვთ, ცოტა ხანში სცადოთ ხელახლა."}</p>
        <form onSubmit={openLink} className="strategy-access"><label htmlFor="invitation">მოწვევის ბმული</label><input id="invitation" type="password" value={accessLink} onChange={event => setAccessLink(event.target.value)} autoComplete="off" required /><button className="strategy-primary" disabled={busy} type="submit">გახსნა <Arrow /></button></form>
        {accessError ? <p role="alert" className="strategy-error-text">{accessError}</p> : null}
        {phase === "unavailable" ? <button className="strategy-secondary" onClick={() => void load()}>ხელახლა ცდა</button> : null}
        {snapshot ? <button className="strategy-text-button" onClick={download}>ჩემი პასუხების ასლის ჩამოტვირთვა</button> : null}
      </div> : null}
      {phase === "ready" && completed ? <div className="strategy-success"><div className="strategy-success-mark" aria-hidden="true">✓</div><span className="strategy-eyebrow">შემდეგი ნაბიჯი ერთად</span>
        <h1 ref={heading} tabIndex={-1}>მადლობა,<br />ინფორმაცია მიღებულია.</h1><p>თქვენს პასუხებს შევაჯერებთ ვებგვერდისა და ციფრული არხების ანალიზთან და მოვამზადებთ განვითარების გეგმას.</p><p>თუ რაიმეს დაზუსტება დაგვჭირდება, მოკლე ჩამონათვალით დაგიკავშირდებით.</p>
        <div className="strategy-receipt">ჩანაწერი №{snapshot?.id} · {snapshot?.completedAt ? new Date(snapshot.completedAt).toLocaleDateString("ka-GE") : ""}</div><button className="strategy-secondary" onClick={download}>პასუხების ასლის ჩამოტვირთვა</button>
      </div> : null}
      {phase === "ready" && !completed ? <>
        {step === -1 ? <div className="strategy-intro-grid"><div className="strategy-intro-copy">
          <span className="strategy-eyebrow">ციფრული განვითარების სტრატეგია</span><h1 ref={heading} tabIndex={-1}>ერთად დავგეგმოთ<br /><em>შემდეგი ნაბიჯი.</em></h1>
          <p className="strategy-lead">რამდენიმე კითხვა თქვენი კლინიკის შესახებ — რომ ვებგვერდი და კომუნიკაცია რეალურ საჭიროებებს მოვარგოთ.</p>
          <div className="strategy-intro-facts"><span>13 კითხვა</span><span>4 მოკლე ნაწილი</span><span>დაახლოებით 15–20 წუთი</span></div>
          <button className="strategy-primary" disabled={disabled} onClick={() => void go(0)}>დაწყება <Arrow /></button><p className="strategy-small">ზუსტი მონაცემები აუცილებელი არ არის. შეგიძლიათ მიუთითოთ თქვენი შეფასება ან აირჩიოთ „არ გვაქვს ინფორმაცია“.</p>
        </div><aside className="strategy-intro-card"><span className="strategy-eyebrow">რას გავივლით</span><ol>{sections.map((section, index) => <li key={section.title}><span>0{index + 1}</span><div><h2>{section.title}</h2><p>{["რის განვითარება გვსურს", "ვისთან და რაზე ვსაუბრობთ", "როგორ გვპოულობენ და გვიკავშირდებიან", "როგორ ვიმუშაოთ ერთად"][index]}</p></div></li>)}</ol><div className="strategy-note">პასუხები ავტომატურად ინახება. იმავე მოწვევის ბმულით გაგრძელებას სხვა მოწყობილობიდანაც შეძლებთ.</div></aside></div> :
        <div className="strategy-workspace"><aside className="strategy-sidebar"><span className="strategy-eyebrow">თქვენი ხედვა მნიშვნელოვანია</span><h2>შემდეგი ნაბიჯი<br />იწყება აქ.</h2>
          <nav aria-label="კითხვარის ნაწილები"><ol>{sections.map((section, index) => <li key={section.title}><button type="button" disabled={disabled} aria-current={step === index ? "step" : undefined} onClick={() => void go(index)}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</button></li>)}</ol></nav><div className="strategy-note">ყველა კითხვაზე პასუხი აუცილებელი არ არის. შეავსეთ ის, რაც ამ ეტაპზე იცით.</div>
        </aside><div className="strategy-content">
          <div className="strategy-progress-label"><span>{step < 4 ? "ნაწილი " + (step + 1) + " / 4" : step === 4 ? "დამატებით · სურვილისამებრ" : "პასუხების გადახედვა"}</span><span>{step < 4 ? Math.round(step / 4 * 100) : 100}%</span></div>
          <div className="strategy-progress" role="progressbar" aria-label="ძირითადი ნაწილების გავლა" aria-valuenow={Math.min(step, 4)} aria-valuemin={0} aria-valuemax={4}><span style={{ width: Math.min(step, 4) / 4 * 100 + "%" }} /></div>
          <div className="strategy-step-heading"><h1 ref={heading} tabIndex={-1}>{activeSection?.title ?? (step === 4 ? "გსურთ რაიმეს დამატება?" : "გადავხედოთ პასუხებს")}</h1><p>{activeSection?.description ?? (step === 4 ? "ეს ნაწილი სრულიად არასავალდებულოა. შეგიძლიათ პირდაპირ გადახედვასა და გაგზავნაზე გადახვიდეთ." : "სურვილის შემთხვევაში შეცვალეთ პასუხები. გამოტოვებული კითხვები გაგზავნას არ შეგიშლით ხელს.")}</p></div>
          {activeSection ? activeSection.questions.map(question => <QuestionCard key={question.number} question={question} answers={draft.answers} onChange={changeAnswer} disabled={disabled} />) : null}
          {step === 4 ? optionalSections.filter(section => isVisible(section.when, draft.answers)).map(section => <details className="strategy-optional" key={section.title}><summary>{section.title}<span aria-hidden="true">+</span></summary><p>{section.description}</p>{section.questions.map(question => <QuestionCard key={question.title} question={question} answers={draft.answers} onChange={changeAnswer} disabled={disabled} />)}</details>) : null}
          {step === 5 ? <>{unanswered.length ? <div className="strategy-note">პასუხი არ არის მითითებული კითხვებზე: {unanswered.join(", ")}. მათი გამოტოვება შეგიძლიათ.</div> : null}{sections.map(summary)}{optionalSections.filter(section => isVisible(section.when, draft.answers) && fieldsFor(section, draft.answers).some(field => draft.answers[field.id])).map((section, index) => summary(section, index + 4))}</> : null}
          <div className="strategy-actions"><button className="strategy-secondary" disabled={disabled} onClick={() => void go(step - 1)}><Arrow back /> უკან</button><button className="strategy-primary" disabled={disabled} onClick={() => step === 5 ? void submit() : void go(step + 1)}>{busy ? "ინახება…" : step === 5 ? "ინფორმაციის გაგზავნა" : step === 3 ? "დამატებითი ინფორმაცია" : step === 4 ? "გადახედვა და გაგზავნა" : "გაგრძელება"}<Arrow /></button></div>
          {step === 3 ? <button className="strategy-text-button" disabled={disabled} onClick={() => void go(5)}>დამატებითი კითხვების გამოტოვება და გადახედვა</button> : null}
        </div></div>}
        <div className={"strategy-save-status " + (saveState === "error" || saveState === "conflict" ? "has-error" : "")} role="status" aria-live="polite">
          {saveState === "saved" ? "✓ ცვლილებები შენახულია" : saveState === "saving" ? "ცვლილებები ინახება…" : saveState === "error" ? "შენახვა ვერ მოხერხდა. არ დახუროთ გვერდი — სცადეთ ხელახლა ან ჩამოტვირთეთ პასუხები." : "პასუხები სხვა მოწყობილობიდან შეიცვალა. მიმდინარე ასლი ჩამოტვირთეთ და გახსენით სერვერზე შენახული ვერსია."}
          {saveState === "error" ? <><button onClick={() => void persist()}>ხელახლა შენახვა</button><button onClick={download}>პასუხების ასლის ჩამოტვირთვა</button></> : null}
          {saveState === "conflict" ? <><button onClick={download}>მიმდინარე ასლის ჩამოტვირთვა</button><button onClick={() => void load(undefined, false)}>სერვერზე შენახულის გახსნა</button></> : null}
        </div>
        <div className="strategy-privacy"><p>გთხოვთ, არ მიუთითოთ პაციენტების სახელები, საკონტაქტო ან სამედიცინო მონაცემები.</p><p>პასუხებს ნახავენ სტრატეგიაზე მომუშავე ადმინისტრატორები. შენახვის დაგეგმილი ბოლო ვადა: {snapshot ? new Date(snapshot.deleteAfter).toLocaleDateString("ka-GE") : ""}. წაშლის მოთხოვნა: {snapshot?.privacyContact}.</p></div>
      </> : null}
    </main><footer className="strategy-footer"><span>Total Charm Dent</span><span>ყურადღებით დაგეგმილი განვითარება</span></footer>
  </div>;
}
