"use client";
import { useEffect, useRef, useState } from "react";
import { DAILY_LESSONS, dailyText } from "./course/daily-lessons";
import { DAILY_TESTS, DAILY_TEST_VERSION } from "./course/daily-tests";
import { readDailyProgress } from "./course/daily-progress";
import { DAILY_PATH, emptySession, finishSession, gradeSession, nextDailySession, readSessions, type SessionProgress, type SessionStage } from "./course/daily-path";
import { loadCourseModule } from "./course/generated/loaders";
import { translate } from "./course/journey";
import { parisLearningDay } from "@/lib/learning-reminder-time";
import type { ContentBlock, CourseLanguage, Lesson } from "./course/types";
import DailyCodeExample from "./DailyCodeExample";
import DailySessionQuiz, { type SessionQuestion } from "./DailySessionQuiz";
import styles from "./DailySession.module.css";
const KEY = "lecomax-daily-sessions-v2";

function LessonBlock({ block }: { block: ContentBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "callout") return <div className={styles.explanation}><strong>{block.title}</strong><p>{block.text}</p></div>;
  if (block.type === "list") return <div><h4>{block.title}</h4><ol>{block.items.map((item, index) => <li key={index}>{item}</li>)}</ol></div>;
  if (block.type === "vocabulary") return <dl>{block.items.map(item => <div key={item.term}><dt><strong>{item.term}</strong></dt><dd>{item.definition}</dd></div>)}</dl>;
  return <div><h4>{block.title}</h4><p className={styles.muted}>{block.code.filename}</p><pre dir="ltr" className={styles.code}><code>{block.code.source}</code></pre>{block.code.annotations.map((item, index) => <p key={index} className={styles.muted}>{item.lines} · {item.label}</p>)}</div>;
}

export default function DailySession({ lang, onAcademy }: { lang: CourseLanguage; onAcademy: () => void }) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const [progress, setProgress] = useState<SessionProgress>({});
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [advanced, setAdvanced] = useState<{ id: string; lang: CourseLanguage; lesson: Lesson } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [review, setReview] = useState(false);
  const [section, setSection] = useState(0);
  const [sync, setSync] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const path = DAILY_PATH[selected];
  const basic = DAILY_LESSONS.find(item => item.id === path.id);
  const entry = progress[path.id] ?? emptySession;
  const lesson = advanced?.id === path.id && advanced.lang === lang ? advanced.lesson : null;
  const questions: SessionQuestion[] = basic ? DAILY_TESTS[basic.id].map(item => ({ question: dailyText(lang, item.question), options: item.options.map(option => dailyText(lang, option)), correctIndex: item.correctIndex, explanation: dailyText(lang, item.explanation) })) : lesson?.quiz ?? [];
  const correct = questions.map(item => item.correctIndex);
  const passed = Boolean(entry.completedOn && entry.practiced && gradeSession(entry.answers ?? [], correct).passed);
  const title = basic ? dailyText(lang, basic.title) : lesson?.title ?? "";
  const finished = DAILY_PATH.filter(item => progress[item.id]?.completedOn).length;
  useEffect(() => {
    const date = parisLearningDay().date; setToday(date);
    try {
      const saved = localStorage.getItem(KEY);
      let clean: SessionProgress;
      if (saved) clean = readSessions(JSON.parse(saved));
      else {
        const old = readDailyProgress(JSON.parse(localStorage.getItem("lecomax-daily-learning-v1") ?? "{}"), DAILY_LESSONS.map(item => item.id));
        clean = Object.fromEntries(Object.entries(old).map(([id, item]) => [id, { ...emptySession, note: item.note, practiced: item.practiced, ...(item.completedOn ? { completedOn: item.completedOn, answers: item.assessment!.answers } : {}) }]));
      }
      setProgress(clean); setSelected(nextDailySession(clean, date));
    } catch { setStorageError(true); }
    setReady(true);
    const update = () => setToday(parisLearningDay().date);
    const timer = setInterval(update, 60_000); window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);
  useEffect(() => {
    if (today && entry.completedOn && entry.completedOn < today && !review) { setSelected(nextDailySession(progress, today)); setSection(0); setSync("idle"); }
  }, [today, entry.completedOn, progress, review]);
  useEffect(() => {
    if (!path.moduleId) return;
    let cancelled = false; setLoadError(false);
    void loadCourseModule(lang, path.moduleId).then(module => {
      const found = module.lessons.find(item => item.id === path.lessonId);
      if (!found) throw new Error("Lesson missing");
      if (!cancelled) setAdvanced({ id: path.id, lang, lesson: found });
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [lang, path.id, path.moduleId, path.lessonId, retry]);
  function save(next: SessionProgress) { setProgress(next); try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } }
  function focus() { requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); }); }
  function go(stage: SessionStage) { save({ ...progress, [path.id]: { ...entry, stage } }); focus(); }
  async function syncResult(answers: number[]) {
    if (!basic) return;
    setSync("saving");
    try {
      const response = await fetch("/api/admin/learning-completion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "daily-test", version: DAILY_TEST_VERSION, lessonId: basic.id, answers }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Sync failed"); setSync("saved");
    } catch { setSync("error"); }
  }
  function submit(answers: number[]) {
    const next = finishSession(entry, answers, correct, parisLearningDay().date);
    save({ ...progress, [path.id]: next });
    if (gradeSession(answers, correct).passed) { setReview(false); void syncResult(answers); } focus();
  }
  if (!ready) return <p role="status">{t("Préparation de ta séance…", "Preparing your session…", "جارٍ تجهيز جلستك…")}</p>;
  const stageIndex = ["welcome", "learn", "practice", "quiz"].indexOf(entry.stage);
  const nextPath = DAILY_PATH[selected + 1];
  const nextBasic = DAILY_LESSONS.find(item => item.id === nextPath?.id);
  return <section data-daily-session dir={lang === "ar" ? "rtl" : "ltr"} className={styles.shell} aria-label={t("Ma séance du jour", "My daily session", "جلستي اليومية")}>
    <div className={styles.topline}><span>{t("MON RENDEZ-VOUS AVEC LE CODE", "MY DAILY CODING SESSION", "موعدي اليومي مع البرمجة")}</span><span>{finished} {t("leçons réussies", "lessons passed", "دروس ناجحة")}</span></div>
    {storageError && <p role="alert" className={styles.warning}>{t("Ton navigateur ne peut pas enregistrer ta progression. Garde cette page ouverte et copie tes notes.", "Your browser cannot save progress. Keep this page open and copy your notes.", "يتعذر حفظ تقدمك في المتصفح. أبقِ الصفحة مفتوحة وانسخ ملاحظاتك.")}</p>}
    {!basic && !lesson ? <div className={styles.card} role="status"><p>{loadError ? t("Impossible de charger ta leçon.", "Your lesson could not load.", "تعذر تحميل الدرس.") : t("Préparation de ta leçon…", "Preparing your lesson…", "جارٍ تجهيز الدرس…")}</p>{loadError && <button className={styles.primary} onClick={() => setRetry(value => value + 1)}>{t("Réessayer", "Retry", "أعد المحاولة")}</button>}</div> : <article className={styles.card}>
      {passed && !review ? <div className={styles.stack} data-session-success>
        <span className={styles.successIcon} aria-hidden="true">✓</span><p className={styles.kicker}>{t("SÉANCE TERMINÉE", "SESSION COMPLETE", "اكتملت الجلسة")}</p>
        <h2 ref={heading} tabIndex={-1}>{t("Tu as compris. À demain !", "You’ve understood it. See you tomorrow!", "لقد فهمت. نراك غدًا!")}</h2>
        <p>{t("Tu as réussi toutes les questions sur :", "You answered every question correctly about:", "أجبت عن جميع الأسئلة بشكل صحيح حول:")} <strong>{title}</strong></p>
        <div className={styles.explanation}><strong>{nextPath ? t("Demain, on continue", "Tomorrow, we continue", "غدًا نواصل") : t("Le parcours est terminé", "Your pathway is complete", "أكملت المسار")}</strong><p>{nextBasic ? dailyText(lang, nextBasic.title) : nextPath ? t("La prochaine leçon s’ouvrira automatiquement à ton retour demain.", "Your next lesson will open automatically when you return tomorrow.", "سيفتح الدرس التالي تلقائيًا عندما تعود غدًا.") : t("Continue à pratiquer sur tes projets dans l’Académie.", "Keep practising on your projects in the Academy.", "واصل التطبيق على مشاريعك في الأكاديمية.")}</p></div>
        <p className={styles.muted}>{t("C’est tout pour aujourd’hui. Reviens sur cette page demain. Aucun retard à rattraper si tu rates un jour.", "That’s enough for today. Return to this page tomorrow. If you miss a day, you won’t skip a lesson.", "هذا يكفي لليوم. عد إلى هذه الصفحة غدًا. إذا فاتك يوم فلن يفوتك أي درس.")}</p>
        <button className={styles.secondary} onClick={() => { setReview(true); setSection(0); go("learn"); }}>{t("Revoir ce que j’ai appris", "Review what I learned", "راجع ما تعلمته")}</button>
        {!nextPath && <button className={styles.primary} onClick={onAcademy}>{t("Continuer mes projets", "Continue my projects", "تابع مشاريعي")}</button>}
      </div> : <>
        <p className={styles.kicker}>{t("JOUR", "DAY", "اليوم")} {selected + 1} · {basic ? t("MES PREMIERS PAS", "MY FIRST STEPS", "خطواتي الأولى") : t("JE CONSTRUIS MES COMPÉTENCES", "BUILDING MY SKILLS", "أطوّر مهاراتي")}</p>
        <h2 ref={heading} tabIndex={-1}>{entry.stage === "welcome" ? t("Aujourd’hui, tu vas apprendre…", "Today, you’ll learn…", "اليوم ستتعلم…") : entry.stage === "quiz" ? t("Voyons ce que tu as compris.", "Let’s see what you understood.", "لنرَ ما فهمته.") : title}</h2>
        {entry.stage !== "welcome" && <ol className={styles.steps} aria-label={t("Étapes de la séance", "Session steps", "خطوات الجلسة")}>{[t("Apprendre", "Learn", "تعلّم"), t("Essayer", "Try", "جرّب"), t("Petit test", "Short test", "اختبار قصير")].map((label, index) => <li key={label} aria-current={stageIndex === index + 1 ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>}
        <div className={styles.content}>
          {entry.stage === "welcome" && <div className={styles.stack}><h3>{title}</h3><p>{basic ? dailyText(lang, basic.idea) : lesson?.objectives[0]}</p><div className={styles.plan}><span>01 <strong>{t("Je t’explique", "I’ll explain", "أشرح لك")}</strong></span><span>02 <strong>{t("Tu essaies", "You try", "تجرّب")}</strong></span><span>03 <strong>{t("Tu passes le test", "You take the test", "تجتاز الاختبار")}</strong></span></div><p className={styles.muted}>{basic ? "10–15" : lesson?.estimatedMinutes} min · {t("Pas besoin de choisir une leçon. Je te guide, depuis le début.", "No need to choose a lesson. I’ll guide you from the beginning.", "لا تحتاج لاختيار درس. سأرشدك من البداية.")}</p><button data-session-start className={styles.primary} onClick={() => go("learn")}>{t("Commencer ma séance", "Start today’s session", "ابدأ جلسة اليوم")}</button></div>}
          {entry.stage === "learn" && <div className={styles.stack}>
            {basic ? <><h3>{t("L’idée à comprendre", "The idea to understand", "الفكرة التي نفهمها")}</h3><p>{dailyText(lang, basic.idea)}</p><div className={styles.explanation}><strong>{t("Un exemple dans ta boutique", "An example from your shop", "مثال من متجرك")}</strong><p>{dailyText(lang, basic.example)}</p></div><details className={styles.details}><summary>{t("Voir le vrai code de mon site", "See my website’s real code", "شاهد الكود الحقيقي لموقعي")}</summary><DailyCodeExample lesson={basic} lang={lang} /></details></> : lesson && <><p className={styles.muted}>{t("Partie", "Part", "الجزء")} {section + 1}/{lesson.sections.length}</p><h3>{lesson.sections[section]?.title}</h3>{lesson.sections[section]?.blocks.map(block => <LessonBlock key={block.id} block={block} />)}</>}
            {lesson && section < lesson.sections.length - 1 ? <button className={styles.primary} onClick={() => { setSection(value => value + 1); focus(); }}>{t("J’ai lu, continuer →", "I’ve read this, continue →", "قرأت، تابع ←")}</button> : <button data-session-practice className={styles.primary} onClick={() => go("practice")}>{t("J’ai compris l’idée. À moi d’essayer →", "I understand the idea. Let me try →", "فهمت الفكرة. سأجرّب الآن ←")}</button>}
            {section > 0 && <button className={styles.textButton} onClick={() => { setSection(value => value - 1); focus(); }}>{t("Partie précédente", "Previous part", "الجزء السابق")}</button>}
          </div>}
          {entry.stage === "practice" && <div className={styles.stack}><h3>{t("Un petit exercice, maintenant.", "One small exercise, now.", "تمرين صغير الآن.")}</h3><p>{basic ? dailyText(lang, basic.task) : lesson?.exercise.task}</p>{lesson && <ol>{lesson.exercise.steps.map((item, index) => <li key={index}>{item}</li>)}</ol>}{lesson && <details className={styles.details}><summary>{t("J’ai besoin d’un indice", "I need a hint", "أحتاج تلميحًا")}</summary>{lesson.exercise.hints.map((hint, index) => <p key={index}>{hint}</p>)}</details>}
            <label className={styles.check}><input data-session-practiced type="checkbox" checked={entry.practiced} onChange={event => save({ ...progress, [path.id]: { ...entry, practiced: event.target.checked } })} />{t("J’ai essayé l’exercice", "I tried the exercise", "جرّبت التمرين")}</label>
            <details className={styles.details}><summary>{t("Garder une note (facultatif)", "Keep a note (optional)", "احفظ ملاحظة (اختياري)")}</summary><label htmlFor="daily-note">{t("Ce que j’ai compris", "What I understood", "ما فهمته")}</label><textarea id="daily-note" maxLength={1500} rows={3} value={entry.note} onChange={event => save({ ...progress, [path.id]: { ...entry, note: event.target.value } })} /></details>
            <button data-session-test className={styles.primary} disabled={!entry.practiced} onClick={() => go("quiz")}>{t("Je suis prêt pour le petit test →", "I’m ready for the short test →", "أنا مستعد للاختبار القصير ←")}</button>{!entry.practiced && <p className={styles.muted}>{t("Essaie l’exercice, puis coche la case pour continuer.", "Try the exercise, then check the box to continue.", "جرّب التمرين ثم حدّد المربع للمتابعة.")}</p>}<button className={styles.textButton} onClick={() => go("learn")}>{t("Revoir l’explication", "Review the explanation", "راجع الشرح")}</button>
          </div>}
          {entry.stage === "quiz" && <DailySessionQuiz key={path.id + lang} questions={questions} lang={lang} onSubmit={submit} onReview={() => go("learn")} />}
          {review && <button className={styles.textButton} onClick={() => { setReview(false); focus(); }}>{t("Retour à ma séance terminée", "Back to my completed session", "عد إلى جلستي المكتملة")}</button>}
        </div>
      </>}
    </article>}
    {sync === "error" && <p role="status" className={styles.muted}>{t("La synchronisation du rappel a échoué. Ta progression reste ici si la sauvegarde est disponible.", "Reminder syncing failed. Your progress remains here if storage is available.", "فشلت مزامنة التذكير. يبقى تقدمك هنا إذا كان التخزين متاحًا.")} <button className={styles.textButton} onClick={() => void syncResult(entry.answers ?? [])}>{t("Réessayer", "Retry", "أعد المحاولة")}</button></p>}
    <details className={styles.pathDetails}><summary>{t("Où ce parcours va-t-il m’emmener ?", "Where will this pathway take me?", "إلى أين يأخذني هذا المسار؟")}</summary><p>{t("Tu avances après chaque test réussi. Un jour manqué ne te fait jamais sauter une leçon.", "You move forward after each passed test. Missing a day never skips a lesson.", "تتقدم بعد كل اختبار ناجح. تفويت يوم لا يجعلك تتخطى درسًا.")}</p><ol>{[t("Débuter : comprendre un site et lire le code", "Start: understand a website and read code", "البداية: فهم الموقع وقراءة الكود"), t("Créer : HTML, CSS, JavaScript et TypeScript", "Create: HTML, CSS, JavaScript and TypeScript", "الإنشاء: HTML وCSS وJavaScript وTypeScript"), t("Construire : React, Next.js, API et Supabase", "Build: React, Next.js, APIs and Supabase", "البناء: React وNext.js وAPI وSupabase"), t("Travailler avec méthode : sécurité, tests et mise en ligne", "Work methodically: security, testing and deployment", "العمل بمنهج: الأمان والاختبارات والنشر"), t("Mettre en pratique : construire une boutique complète", "Apply your skills: build a complete shop", "التطبيق: بناء متجر متكامل")].map(item => <li key={item}>{item}</li>)}</ol><p>{DAILY_PATH.length} {t("séances progressives. Devenir autonome demande aussi de pratiquer sur tes projets.", "progressive sessions. Becoming independent also takes practice on your own projects.", "جلسات متدرجة. الاستقلال في البرمجة يحتاج أيضًا للتطبيق على مشاريعك.")}</p></details>
    <p className={styles.footnote}>{t("Ta progression est sauvegardée dans ce navigateur. Le changement de journée suit l’heure de Paris.", "Your progress is saved in this browser. The day changes at Paris time.", "يُحفظ تقدمك في هذا المتصفح. يتغير اليوم حسب توقيت باريس.")}</p>
  </section>;
}
