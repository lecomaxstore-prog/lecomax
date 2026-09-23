"use client";

import { useEffect, useRef, useState } from "react";
import { DAILY_LESSONS, dailyText } from "./course/daily-lessons";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";
import { parisLearningDay } from "@/lib/learning-reminder-time";
import { readDailyProgress, recordDailyAttempt, resumeDailyLesson, type DailyEntry as Entry, type DailyProgress as Progress } from "./course/daily-progress";
import { DAILY_TEST_VERSION, gradeDailyTest } from "./course/daily-tests";
import DailyLessonTest from "./DailyLessonTest";

const STORAGE_KEY = "lecomax-daily-learning-v1";
const empty: Entry = { note: "", practiced: false, compared: false };

export default function DailyLearning({ lang, onAcademy }: { lang: CourseLanguage; onAcademy: () => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [progress, setProgress] = useState<Progress>({});
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [sync, setSync] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const syncRequest = useRef(0);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      const ids = DAILY_LESSONS.map(lesson => lesson.id);
      const clean = readDailyProgress(raw, ids);
      setProgress(clean);
      setSelected(resumeDailyLesson(clean, ids, parisLearningDay().date));
    } catch { setStorageError(true); }
    setReady(true);
    return () => { syncRequest.current += 1; };
  }, []);
  function save(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const lesson = DAILY_LESSONS[selected];
  const entry = progress[lesson.id] ?? empty;
  const completed = DAILY_LESSONS.filter(item => progress[item.id]?.completedOn).length;
  function update(patch: Partial<Entry>) { save({ ...progress, [lesson.id]: { ...entry, ...patch } }); }
  function move(nextStep: number) {
    setStep(nextStep);
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function choose(index: number) { syncRequest.current += 1; setSelected(index); setSync("idle"); move(0); }
  async function syncValidation(answers: number[]) {
    if (!gradeDailyTest(lesson.id, answers)?.passed || sync === "saving") return;
    const requestId = ++syncRequest.current;
    setSync("saving");
    try {
      const response = await fetch("/api/admin/learning-completion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "daily-test", version: DAILY_TEST_VERSION, lessonId: lesson.id, answers }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Learning day sync failed");
      if (requestId === syncRequest.current) setSync("saved");
    } catch { if (requestId === syncRequest.current) setSync("error"); }
  }
  function submitTest(answers: number[]) {
    const next = recordDailyAttempt(lesson.id, entry, answers, parisLearningDay().date);
    if (!next) return;
    save({ ...progress, [lesson.id]: next });
    if (next.completedOn) void syncValidation(answers);
  }
  const phases = [t("Comprendre", "Understand", "افهم"), t("Voir dans mon site", "See it in my site", "شاهده في موقعي"), t("Essayer", "Try it", "جرّب"), t("Retenir", "Remember", "تذكّر"), t("Test final", "Final test", "الاختبار النهائي")];
  if (!ready) return <p role="status">{t("Préparation de ta leçon…", "Preparing your lesson…", "جارٍ تجهيز درسك…")}</p>;
  return <section dir={lang === "ar" ? "rtl" : "ltr"} className="min-w-0 space-y-4" aria-label={t("Mes leçons quotidiennes", "My daily lessons", "دروسي اليومية")}>
    <header className="rounded-3xl bg-neutral-950 p-5 text-white sm:p-7">
      <p className="text-xs font-black uppercase tracking-wider text-green-400">{t("Mon petit cours du jour", "My small daily lesson", "درسي اليومي الصغير")}</p>
      <h2 className="mt-3 text-2xl font-black sm:text-3xl">{t("Aujourd’hui, une seule idée à comprendre.", "Today, just one idea to understand.", "اليوم، فكرة واحدة فقط لفهمها.")}</h2>
      <p className="mt-3 text-sm leading-7 text-white/80">{t("5 à 10 minutes environ. Une explication simple, un exemple de ton site et un petit exercice. Aucune connaissance nécessaire.", "About 5–10 minutes. A simple explanation, an example from your site and a small exercise. No prior knowledge needed.", "نحو 5 إلى 10 دقائق. شرح بسيط ومثال من موقعك وتمرين صغير. لا تحتاج إلى معرفة مسبقة.")}</p>
      <p className="mt-3 text-sm font-bold text-green-300">{completed} / {DAILY_LESSONS.length} {t("leçons validées par un test", "lessons validated by a test", "دروس معتمدة باختبار")}</p>
      <p className="mt-2 text-xs leading-5 text-white/65">{t("Un jour manqué ? Rien n’est perdu. Reprends où tu en es. Les jours indiquent un ordre, pas une date limite.", "Missed a day? Nothing is lost. Pick up where you left off. Days show an order, not a deadline.", "فاتك يوم؟ لا مشكلة. تابع من حيث توقفت. الأيام ترتيب للتعلم وليست مواعيد نهائية.")}</p>
    </header>
    {storageError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{t("Le navigateur ne peut pas sauvegarder ta progression. Garde une copie de tes notes avant de quitter.", "Your browser cannot save your progress. Keep a copy of your notes before leaving.", "تعذّر حفظ تقدمك في المتصفح. احتفظ بنسخة من ملاحظاتك قبل المغادرة.")}</p>}
    {selected > 0 && <details className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><summary className="min-h-11 cursor-pointer text-sm font-bold">{t("30 secondes pour revoir l’idée précédente", "30 seconds to recall the previous idea", "30 ثانية لمراجعة الفكرة السابقة")}</summary><p className="mt-2 text-sm leading-7">{dailyText(lang, DAILY_LESSONS[selected - 1].question)}</p><details className="mt-2"><summary className="cursor-pointer py-2 text-sm underline">{t("Me rappeler la réponse", "Remind me of the answer", "ذكّرني بالإجابة")}</summary><p className="text-sm leading-7">{dailyText(lang, DAILY_LESSONS[selected - 1].answer)}</p></details></details>}
    <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black text-emerald-700">{t("JOUR", "DAY", "اليوم")} {selected + 1} / {DAILY_LESSONS.length}{entry.completedOn ? " · ✓" : ""}</p>
      <h3 ref={heading} tabIndex={-1} className="mt-2 scroll-mt-40 text-2xl font-black outline-none">{dailyText(lang, lesson.title)}</h3>
      <p className="mt-3 text-sm text-neutral-600">{step + 1} / {phases.length} · {phases[step]}</p>
      <a href={`#files/${encodeURIComponent(lesson.file)}`} className="mt-3 flex min-h-12 flex-col justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900">{t("Ouvrir le vrai fichier de cette leçon →", "Open this lesson’s actual file →", "افتح الملف الحقيقي لهذا الدرس ←")}<span dir="ltr" className="mt-1 break-all font-mono text-xs font-normal">{lesson.file}</span></a>
      <p className={"mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold " + (entry.completedOn ? "bg-green-100 text-green-900" : "bg-neutral-100 text-neutral-700")}>{entry.completedOn ? t("✓ Validée · 3/3", "✓ Validated · 3/3", "✓ معتمد · 3/3") : entry.assessment ? t("À revoir · test non réussi", "Review needed · test not passed", "تحتاج مراجعة · لم تجتز الاختبار") : t("En cours · test à passer", "In progress · test pending", "قيد التعلم · الاختبار مطلوب")}</p>
      {entry.readOn && !entry.completedOn && !entry.assessment && <p className="mt-2 text-sm text-neutral-600">{t("Tu avais terminé la lecture. Tes notes sont conservées ; passe maintenant le test pour valider cette leçon.", "You previously finished reading. Your notes are kept; take the test to validate this lesson.", "سبق أن أنهيت القراءة. ملاحظاتك محفوظة؛ اجتز الاختبار لاعتماد هذا الدرس.")}</p>}
      <div className="mt-3 flex gap-2" aria-hidden="true">{phases.map((phase, index) => <span key={phase} className={"h-1.5 flex-1 rounded-full " + (index <= step ? "bg-green-500" : "bg-neutral-100")} />)}</div>
      <div className="mt-6 space-y-4 text-base leading-8">
        {step === 0 && <p>{dailyText(lang, lesson.idea)}</p>}
        {step === 1 && <><p>{dailyText(lang, lesson.example)}</p><div className="rounded-2xl bg-neutral-50 p-4"><p className="text-xs font-bold text-neutral-500">{t("Le fichier de ton site à reconnaître", "The file to recognise in your site", "الملف الذي تتعرف عليه في موقعك")}</p><code dir="ltr" className="mt-2 block break-all text-sm">{lesson.file}</code><p className="mt-2 text-sm text-neutral-500">{t("Tu n’as pas besoin de le modifier aujourd’hui.", "You do not need to edit it today.", "لا تحتاج إلى تعديله اليوم.")}</p></div></>}
        {step === 2 && <><p>{dailyText(lang, lesson.task)}</p><label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-green-50 p-4 text-sm"><input type="checkbox" checked={entry.practiced} disabled={Boolean(entry.completedOn)} onChange={event => update({ practiced: event.target.checked })} className="mt-1.5 h-5 w-5 shrink-0 accent-green-700" />{t("J’ai fait ce petit exercice.", "I have tried this small exercise.", "جرّبت هذا التمرين الصغير.")}</label></>}
        {step === 3 && <>
          <p className="font-bold">{dailyText(lang, lesson.question)}</p>
          <label htmlFor="daily-note" className="block text-sm text-neutral-600">{t("Mes notes personnelles (facultatif, non noté)", "My personal notes (optional, not graded)", "ملاحظاتي الشخصية (اختيارية، دون تقييم)")}</label>
          <textarea id="daily-note" value={entry.note} maxLength={1500} onChange={event => update({ note: event.target.value, compared: false })} rows={3} className="block w-full rounded-xl border border-neutral-300 p-3 text-base leading-7 focus:outline-green-600" />
          <details key={lesson.id} className="rounded-xl bg-emerald-50 p-4"><summary className="min-h-11 cursor-pointer text-sm font-bold">{t("Comparer avec une explication", "Compare with an explanation", "قارن مع الشرح")}</summary><p className="mt-2 text-sm leading-7">{dailyText(lang, lesson.answer)}</p></details>
        </>}
        {step === 4 && <DailyLessonTest key={lesson.id} lessonId={lesson.id} lang={lang} assessment={entry.assessment} practiced={entry.practiced} saving={sync === "saving"} onSubmit={submitTest} onReview={() => move(0)} onPractice={() => move(2)} />}
      </div>
      <div className="mt-6 flex justify-between gap-3 border-t pt-4"><button disabled={step === 0} onClick={() => move(step - 1)} className="min-h-12 rounded-xl border px-4 text-sm font-bold disabled:opacity-30">{t("Retour", "Back", "رجوع")}</button>{step < phases.length - 1 && <button onClick={() => move(step + 1)} className="min-h-12 rounded-xl bg-neutral-950 px-5 text-sm font-bold text-white">{t("Continuer", "Continue", "متابعة")} →</button>}</div>
    </article>
    {entry.completedOn && <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-5">
      <p className="font-black">{t("✓ Leçon terminée et validée par le test", "✓ Lesson completed and validated by the test", "✓ الدرس مكتمل ومعتمد بالاختبار")}</p>
      <p className="mt-2 text-sm font-semibold">3/3 · 100% · {entry.completedOn}</p>
      <p className="mt-2 text-sm leading-6">{t("Demain, reprends ce parcours. Tu peux aussi revoir cette leçon ou continuer maintenant.", "Return to this path tomorrow. You can also review this lesson or keep going now.", "عُد غدًا لهذا المسار. يمكنك أيضًا مراجعة الدرس أو المتابعة الآن.")}</p>
      {selected < DAILY_LESSONS.length - 1 ? <button onClick={() => choose(selected + 1)} className="mt-3 min-h-12 rounded-xl border border-green-300 bg-white p-3 text-start text-sm font-bold">{t("La prochaine idée : ", "Next idea: ", "الفكرة التالية: ")}{dailyText(lang, DAILY_LESSONS[selected + 1].title)} →</button> : <button onClick={onAcademy} className="mt-3 min-h-12 rounded-xl bg-neutral-950 px-4 text-sm font-bold text-white">{t("Continuer avec l’Académie →", "Continue with the Academy →", "تابع مع الأكاديمية ←")}</button>}
    </div>}
    {sync === "saving" && <p role="status" className="text-sm text-neutral-600">{t("Synchronisation du jour validé…", "Syncing your validated learning day…", "جارٍ مزامنة يوم التعلم المعتمد…")}</p>}
    {sync === "error" && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm"><p>{t("Le test est réussi, mais la synchronisation du jour a échoué. Le résultat reste dans ce navigateur si le stockage est disponible.", "You passed, but learning-day sync failed. Your result stays in this browser if storage is available.", "نجحت في الاختبار لكن تعذّرت مزامنة اليوم. تبقى نتيجتك في هذا المتصفح إذا كان التخزين متاحًا.")}</p><button onClick={() => entry.assessment && void syncValidation(entry.assessment.answers)} className="mt-3 min-h-12 rounded-xl border border-amber-300 bg-white px-4 font-bold">{t("Réessayer la synchronisation", "Retry sync", "أعد المزامنة")}</button></div>}
    {sync === "saved" && <p role="status" className="text-sm text-emerald-700">{t("Ton jour d’apprentissage a aussi été enregistré sur le serveur.", "Your learning day was also recorded on the server.", "سُجّل يوم تعلمك على الخادم أيضًا.")}</p>}
    <details className="rounded-2xl border bg-white p-4">
      <summary className="min-h-11 cursor-pointer font-bold">{t("Mon programme · revoir ou choisir un jour", "My programme · review or choose a day", "برنامجي · راجع يومًا أو اختره")}</summary>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2">{DAILY_LESSONS.map((item, index) => <li key={item.id}><button onClick={() => choose(index)} aria-current={index === selected ? "step" : undefined} className="min-h-12 w-full rounded-xl border p-3 text-start text-sm aria-[current=step]:border-green-600 aria-[current=step]:bg-green-50"><span className="me-2 font-bold">{progress[item.id]?.completedOn ? "✓" : index + 1}.</span>{dailyText(lang, item.title)}</button></li>)}</ol>
      <button onClick={onAcademy} className="mt-4 min-h-12 rounded-xl border px-4 py-3 text-sm font-bold">{t("Après ces 14 jours : les 192 leçons détaillées →", "After these 14 days: 192 detailed lessons →", "بعد هذه الأيام الـ14: 192 درسًا مفصلًا ←")}</button>
    </details>
    <p className="text-xs leading-5 text-neutral-500">{t("Notes et résultats sauvegardés dans ce navigateur. Les notes restent sur ton appareil. Après réussite, le serveur vérifie les réponses du test et enregistre le jour d’apprentissage (heure de Paris).", "Notes and results are saved in this browser. Notes stay on your device. After a pass, the server checks test answers and records the learning day (Paris time).", "تُحفظ الملاحظات والنتائج في هذا المتصفح وتبقى الملاحظات على جهازك. بعد النجاح يتحقق الخادم من إجابات الاختبار ويسجّل يوم التعلم بتوقيت باريس.")}</p>
  </section>;
}
