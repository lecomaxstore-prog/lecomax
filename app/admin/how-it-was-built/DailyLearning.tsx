"use client";

import { useEffect, useRef, useState } from "react";
import { DAILY_LESSONS, dailyText } from "./course/daily-lessons";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";
import { parisLearningDay } from "@/lib/learning-reminder-time";
import { readDailyProgress, recordDailyAttempt, recordTrainingDay, resumeDailyLesson, type DailyEntry as Entry, type DailyProgress as Progress } from "./course/daily-progress";
import { DAILY_TEST_VERSION, gradeDailyTest } from "./course/daily-tests";
import DailyLessonTest from "./DailyLessonTest";
import DailyCodeExample from "./DailyCodeExample";
import { DailyDashboard, LessonOutline } from "./DailyDashboard";
import styles from "./DailyLearning.module.css";

const STORAGE_KEY = "lecomax-daily-learning-v1";
const empty: Entry = { note: "", practiced: false, compared: false };

export default function DailyLearning({ lang, onAcademy }: { lang: CourseLanguage; onAcademy: () => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [progress, setProgress] = useState<Progress>({});
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [sync, setSync] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const syncRequest = useRef(0);
  useEffect(() => {
    const date = parisLearningDay().date;
    setToday(date);
    try {
      const clean = readDailyProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"), DAILY_LESSONS.map(lesson => lesson.id));
      setProgress(clean);
      setSelected(resumeDailyLesson(clean, DAILY_LESSONS.map(lesson => lesson.id), date));
    } catch { setStorageError(true); }
    setReady(true);
    const updateDay = () => setToday(parisLearningDay().date);
    const timer = setInterval(updateDay, 60_000);
    window.addEventListener("focus", updateDay);
    return () => { syncRequest.current += 1; clearInterval(timer); window.removeEventListener("focus", updateDay); };
  }, []);
  function save(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const lesson = DAILY_LESSONS[selected];
  const entry = progress[lesson.id] ?? empty;
  const trainingDays = new Set(Object.values(progress).flatMap(item => item.trainedDays ?? []));
  const trained = entry.trainedDays?.includes(today) ?? false;
  const explored = DAILY_LESSONS.filter(item => progress[item.id]?.trainedDays?.length || progress[item.id]?.completedOn).length;
  const completed = DAILY_LESSONS.filter(item => progress[item.id]?.completedOn).length;
  function update(patch: Partial<Entry>) { save({ ...progress, [lesson.id]: { ...entry, ...patch } }); }
  function move(nextStep: number) {
    setStep(nextStep);
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function choose(index: number) { syncRequest.current += 1; setSelected(index); setSync("idle"); move(0); }
  function markTraining(checked: boolean) {
    const date = parisLearningDay().date;
    setToday(date);
    save({ ...progress, [lesson.id]: recordTrainingDay(entry, date, checked) });
  }
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
  const phases = [t("Comprendre", "Understand", "افهم"), t("Mon code", "My code", "الكود"), t("Pratiquer", "Practice", "تدرّب")];
  const locale = lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-MA" : "en-GB";
  if (!ready) return <p role="status">{t("Préparation de ton atelier…", "Preparing your workshop…", "جارٍ تجهيز ورشتك…")}</p>;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 6 + index);
    return { date: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(date) };
  });
  return <section dir={lang === "ar" ? "rtl" : "ltr"} className={styles.workspace + " space-y-5"} aria-label={t("Mon entraînement quotidien", "My daily training", "تدريبي اليومي")}>
    <DailyDashboard lang={lang} selected={selected} progress={progress} explored={explored} onStart={() => move(step)} />
    {storageError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">{t("La sauvegarde locale est indisponible. Garde une copie de tes notes.", "Local saving is unavailable. Keep a copy of your notes.", "الحفظ المحلي غير متاح. احتفظ بنسخة من ملاحظاتك.")}</p>}
    <div className={styles.layout}>
      <LessonOutline lang={lang} selected={selected} progress={progress} explored={explored} onChoose={choose} />
      <div className={styles.reader}>
    <article className={styles.article}>
      <div className={styles.articleHeader}>
        <div className={styles.lessonMeta}><span>{t("LES FONDATIONS", "THE FOUNDATIONS", "الأساسيات")} / {String(selected + 1).padStart(2, "0")}</span><span>{t("Lecture & pratique", "Read & practice", "قراءة وتطبيق")}</span></div>
        <h3 ref={heading} tabIndex={-1}>{dailyText(lang, lesson.title)}</h3>
        <nav aria-label={t("Étapes de la leçon", "Lesson steps", "خطوات الدرس")} className={styles.phases}>{phases.map((phase, index) => <button key={phase} type="button" aria-current={step === index ? "step" : undefined} onClick={() => move(index)}>{String(index + 1).padStart(2, "0")} · {phase}</button>)}</nav>
      </div>
      <div className={styles.body + " space-y-7"}>
        {step === 0 && <>
          <div><p className={styles.conceptLabel}><span />{t("Une notion à retenir", "One concept to remember", "فكرة لتتذكرها")}</p><h4>{t("L’idée en mots simples", "The idea in plain words", "الفكرة بكلمات بسيطة")}</h4><p className="mt-3 text-[15px] leading-8 text-neutral-600">{dailyText(lang, lesson.idea)}</p></div>
          <div className={styles.example}><code dir="ltr">{lesson.file}</code><h4>{t("Dans ta boutique", "Inside your shop", "داخل متجرك")}</h4><p className="mt-3 text-sm leading-7 text-neutral-600">{dailyText(lang, lesson.example)}</p><button type="button" onClick={() => move(1)} className="mt-4 min-h-11 text-xs font-semibold text-emerald-800">{t("Découvrir le code de cet exemple →", "Explore the code behind this example →", "اكتشف كود هذا المثال ←")}</button></div>
          <div className={styles.reflection}><span aria-hidden="true">✧</span><p>{t("Prends un instant : comment expliquerais-tu cette idée à un ami ? Tu n’as pas besoin de retenir chaque mot pour avancer.", "Take a moment: how would you explain this to a friend? You don’t need to memorise every word to move forward.", "توقف لحظة: كيف تشرح هذه الفكرة لصديق؟ لا تحتاج لحفظ كل كلمة حتى تتقدم.")}</p></div>
        </>}
        {step === 1 && <DailyCodeExample key={lesson.id} lesson={lesson} lang={lang} />}
        {step === 2 && <>
          <div><h4 className="text-sm font-bold">{t("À toi · un petit exercice", "Your turn · a small exercise", "دورك · تمرين صغير")}</h4><p className="mt-2 text-sm leading-7 text-neutral-700">{dailyText(lang, lesson.task)}</p></div>
          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm"><input type="checkbox" checked={entry.practiced} disabled={Boolean(entry.completedOn)} onChange={event => update({ practiced: event.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700" />{t("J’ai essayé cet exercice.", "I tried this exercise.", "جرّبت هذا التمرين.")}</label>
          <div><h4 className="text-sm font-bold">{dailyText(lang, lesson.question)}</h4><details className="mt-3 rounded-xl border border-neutral-200 p-3"><summary className="cursor-pointer py-1 text-sm font-semibold text-emerald-800">{t("Voir une réponse simple", "See a simple answer", "شاهد إجابة بسيطة")}</summary><p className="mt-2 text-sm leading-7 text-neutral-600">{dailyText(lang, lesson.answer)}</p></details></div>
          <div><label htmlFor="daily-note" className="text-sm font-semibold">{t("Ce que j’ai compris, avec mes mots", "What I understood, in my own words", "ما فهمته بكلماتي")}</label><textarea id="daily-note" value={entry.note} maxLength={1500} onChange={event => update({ note: event.target.value, compared: false })} rows={3} placeholder={t("Ce code sert à… On l’utilise parce que…", "This code is for… We use it because…", "هذا الكود يفعل… نستخدمه لأن…")} className="mt-2 block w-full rounded-xl border border-neutral-200 p-3 text-base leading-7 focus:outline-emerald-600" /></div>
          <button type="button" onClick={() => markTraining(!trained)} className={"min-h-12 w-full rounded-xl px-4 text-sm font-semibold " + (trained ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "bg-emerald-800 text-white hover:bg-emerald-900")}>{trained ? t("✓ Entraînement enregistré · annuler", "✓ Training recorded · undo", "✓ سُجّل التدريب · تراجع") : t("Terminer mon entraînement du jour", "Finish today’s training", "إنهاء تدريب اليوم")}</button>
          <details className="rounded-xl border border-neutral-200 p-4"><summary className="cursor-pointer py-1 text-sm font-semibold">{t("Pour aller plus loin : 3 questions (facultatif)", "Go further: 3 questions (optional)", "للتعمق: 3 أسئلة (اختياري)")}{entry.completedOn ? " ✓" : ""}</summary><div className="mt-4"><DailyLessonTest key={lesson.id} lessonId={lesson.id} lang={lang} assessment={entry.assessment} practiced={entry.practiced} saving={sync === "saving"} onSubmit={submitTest} onReview={() => move(0)} onPractice={() => document.getElementById("daily-note")?.focus()} /></div></details>
        </>}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 p-4"><button disabled={step === 0} onClick={() => move(step - 1)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-neutral-500 disabled:opacity-30">{t("Retour", "Back", "رجوع")}</button>{step < 2 ? <button onClick={() => move(step + 1)} className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white">{step === 0 ? t("Voir mon code →", "See my code →", "شاهد الكود ←") : t("À moi d’essayer →", "Let me try →", "سأجرّب الآن ←")}</button> : selected < DAILY_LESSONS.length - 1 ? <button onClick={() => choose(selected + 1)} className="min-h-11 rounded-xl border border-neutral-200 px-4 text-sm font-semibold">{t("Leçon suivante →", "Next lesson →", "الدرس التالي ←")}</button> : <button onClick={onAcademy} className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white">{t("Continuer à apprendre →", "Keep learning →", "واصل التعلم ←")}</button>}</div>
    </article>
    <div className={styles.session}>
      <label><input type="checkbox" data-training-attendance checked={trained} onChange={event => markTraining(event.target.checked)} /><span>{t("Je me suis entraîné aujourd’hui", "I trained today", "تدرّبت اليوم")}<small>{t("Pour cette leçon · chaque petite séance compte.", "For this lesson · every small session counts.", "لهذا الدرس · كل جلسة صغيرة لها قيمة.")}</small></span></label>
      <p role="status" className={styles.sessionStatus}>{trained && !storageError ? t("✓ Séance enregistrée dans ce navigateur.", "✓ Session saved in this browser.", "✓ حُفظت الجلسة في هذا المتصفح.") : trainingDays.size + " " + t("jours d’entraînement enregistrés", "training days recorded", "أيام تدريب مسجلة")}</p>
      <details className="mt-3 border-t border-neutral-100 pt-3"><summary className="min-h-11 cursor-pointer py-3 text-xs text-neutral-500">{t("Mon activité · les 7 derniers jours", "My activity · the last 7 days", "نشاطي · آخر 7 أيام")}</summary><div className={styles.week}>{days.map(day => <div key={day.date} data-trained={trainingDays.has(day.date)} data-today={day.date === today} aria-label={day.date + ": " + (trainingDays.has(day.date) ? t("entraînement enregistré", "training recorded", "تم تسجيل التدريب") : t("aucun entraînement enregistré", "no training recorded", "لم يسجّل تدريب"))}><span>{trainingDays.has(day.date) ? "✓" : Number(day.date.slice(-2))}</span>{day.label}</div>)}</div></details>
    </div>

    {sync === "saving" && <p role="status" className="text-sm text-neutral-600">{t("Enregistrement du test…", "Saving the test…", "جارٍ حفظ الاختبار…")}</p>}
    {sync === "error" && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm"><p>{t("Le résultat du test est conservé ici, mais sa synchronisation a échoué.", "The test result is kept here, but syncing failed.", "حُفظت نتيجة الاختبار هنا لكن فشلت المزامنة.")}</p><button onClick={() => entry.assessment && void syncValidation(entry.assessment.answers)} className="mt-2 min-h-11 font-semibold underline">{t("Réessayer", "Retry", "أعد المحاولة")}</button></div>}
    {sync === "saved" && <p role="status" className="text-sm text-emerald-700">{t("✓ Test validé et synchronisé.", "✓ Test passed and synced.", "✓ نجحت وتمت مزامنة الاختبار.")}</p>}
      </div>
    </div>
    <details className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6"><summary className="cursor-pointer text-sm font-bold">{t("Mon parcours complet : de débutant à Next.js", "My full path: from beginner to Next.js", "مساري الكامل: من البداية إلى Next.js")}</summary>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{t("Ces 14 leçons sont le départ. Continue ensuite dans l’Académie, une leçon par séance, dans cet ordre :", "These 14 lessons are the starting point. Then continue in the Academy, one lesson per session, in this order:", "هذه الدروس الـ14 هي البداية. تابع بعدها في الأكاديمية، درسًا في كل جلسة، بهذا الترتيب:")}</p>
      <ol className="mt-4 space-y-3 text-sm leading-6">{[
        t("Les bases : fichiers, HTML, CSS, JavaScript et TypeScript.", "Foundations: files, HTML, CSS, JavaScript and TypeScript.", "الأساسيات: الملفات وHTML وCSS وJavaScript وTypeScript."),
        t("React : composants, props, état (useState), événements et effets.", "React: components, props, state (useState), events and effects.", "React: المكونات وprops والحالة useState والأحداث والتأثيرات."),
        t("Next.js : pages, layouts, routes dynamiques, serveur et navigateur.", "Next.js: pages, layouts, dynamic routes, server and browser.", "Next.js: الصفحات والتخطيطات والمسارات الديناميكية والخادم والمتصفح."),
        t("Les données : API, Supabase, formulaires, connexion et permissions.", "Data: APIs, Supabase, forms, sign-in and permissions.", "البيانات: API وSupabase والنماذج وتسجيل الدخول والصلاحيات."),
        t("Ta boutique : catalogue, panier, commandes, paiements et administration.", "Your shop: catalog, cart, orders, payments and administration.", "متجرك: الكتالوج والسلة والطلبات والدفع والإدارة."),
        t("La mise en ligne : tests, erreurs, cache, performance, SEO et Vercel.", "Going live: tests, errors, caching, performance, SEO and Vercel.", "النشر: الاختبارات والأخطاء والتخزين المؤقت والأداء وSEO وVercel."),
      ].map((item, index) => <li key={index} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">{index + 1}</span><span>{item}</span></li>)}</ol>
      <button onClick={onAcademy} className="mt-4 min-h-12 rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white">{t("Ouvrir les leçons détaillées →", "Open the detailed lessons →", "افتح الدروس المفصلة ←")}</button>
    </details>
    <p className="text-xs leading-5 text-neutral-500">{t("Entraînements et notes : enregistrés dans ce navigateur, dates à l’heure de Paris. Cocher une séance ne valide pas le quiz et ne synchronise pas les rappels. Les tests réussis restent synchronisés séparément.", "Training and notes: saved in this browser, with Paris dates. Checking a session does not pass the quiz or sync reminders. Passed tests still sync separately.", "التدريب والملاحظات محفوظة في هذا المتصفح بتوقيت باريس. تسجيل الجلسة لا يعني اجتياز الاختبار أو مزامنة التذكيرات. تستمر مزامنة الاختبارات الناجحة بشكل منفصل.")} {completed > 0 && `${completed} ${t("tests réussis conservés.", "passed tests preserved.", "اختبارات ناجحة محفوظة.")}`}</p>
  </section>;
}
