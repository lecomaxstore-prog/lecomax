"use client";

import { useRef, useState } from "react";
import { DAILY_TESTS, gradeDailyTest } from "./course/daily-tests";
import { dailyText } from "./course/daily-lessons";
import { translate } from "./course/journey";
import type { CourseLanguage } from "./course/types";
import type { DailyAssessment } from "./course/daily-progress";

export default function DailyLessonTest({ lessonId, lang, assessment, practiced, saving, onSubmit, onReview, onPractice }: {
  lessonId: string; lang: CourseLanguage; assessment?: DailyAssessment; practiced: boolean; saving: boolean;
  onSubmit: (answers: number[]) => void; onReview: () => void; onPractice: () => void;
}) {
  const t = (fr: string, en: string, ar: string) => translate(lang, fr, en, ar);
  const questions = DAILY_TESTS[lessonId];
  const [answers, setAnswers] = useState<number[]>(assessment?.answers ?? []);
  const [submitted, setSubmitted] = useState(Boolean(assessment));
  const result = submitted ? gradeDailyTest(lessonId, assessment?.answers ?? answers) : null;
  const answered = questions.filter((_, index) => Number.isInteger(answers[index])).length;
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const firstQuestion = useRef<HTMLLegendElement>(null);

  function submit() {
    if (!practiced || answered !== questions.length || saving) return;
    onSubmit([...answers]);
    setSubmitted(true);
    requestAnimationFrame(() => { resultHeading.current?.focus({ preventScroll: true }); resultHeading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function retry() {
    setAnswers([]);
    setSubmitted(false);
    requestAnimationFrame(() => { firstQuestion.current?.focus({ preventScroll: true }); firstQuestion.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  return <section aria-label={t("Test de compréhension", "Understanding test", "اختبار الفهم")} className="space-y-5">
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
      <h4 className="font-black text-indigo-950">{t("À toi de prouver ce que tu as compris", "Show what you have understood", "أظهر ما فهمته")}</h4>
      <p className="mt-2 text-sm leading-6 text-indigo-950">{t("3 questions · 3 bonnes réponses pour valider. Sans chronomètre. Tu peux revoir la leçon et réessayer autant que nécessaire.", "3 questions · 3 correct answers to pass. No timer. Review the lesson and retry as often as you need.", "3 أسئلة · تحتاج 3 إجابات صحيحة للاجتياز. دون مؤقت. راجع الدرس وأعد المحاولة كلما احتجت.")}</p>
    </div>
    {result && <div role="status" className={"rounded-2xl border p-5 " + (result.passed ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
      <p className="text-3xl font-black tabular-nums">{result.score}/{result.total} <span className="text-base font-semibold">· {result.percent}%</span></p>
      <h4 ref={resultHeading} tabIndex={-1} className="mt-2 scroll-mt-40 text-lg font-black outline-none">{result.passed ? t("Test réussi · leçon validée", "Test passed · lesson validated", "نجحت في الاختبار · تم اعتماد الدرس") : t("Pas encore validée · reprenons ensemble", "Not validated yet · let’s review", "لم يُعتمد الدرس بعد · لنراجع معًا")}</h4>
      <p className="mt-2 text-sm leading-6">{result.passed ? t("Tu as répondu correctement aux trois questions. Ta validation et ton résultat sont enregistrés dans ce navigateur si le stockage est disponible.", "You answered all three questions correctly. Your validation and result are saved in this browser when storage is available.", "أجبت عن الأسئلة الثلاثة بشكل صحيح. يُحفظ اعتماد الدرس ونتيجتك في هذا المتصفح عندما يتوفر التخزين.") : t("Lis les corrections ci-dessous. Revois l’idée qui te manque, puis recommence le test. Une erreur ne supprime pas tes notes.", "Read the corrections below. Review the idea you missed, then try the test again. A mistake does not erase your notes.", "اقرأ التصحيحات أدناه وراجع الفكرة التي فاتتك ثم أعد الاختبار. الخطأ لا يمحو ملاحظاتك.")}</p>
      <p className="mt-2 text-xs text-neutral-600">{t("Tentative", "Attempt", "المحاولة")} {assessment?.attempts ?? 1}</p>
    </div>}
    {questions.map((question, index) => <fieldset key={index} disabled={submitted || saving} className="min-w-0 rounded-2xl border border-neutral-200 p-4">
      <legend ref={index === 0 ? firstQuestion : undefined} tabIndex={-1} className="max-w-full scroll-mt-40 px-1 text-base font-bold leading-7 outline-none">{index + 1}. {dailyText(lang, question.question)}</legend>
      <div className="mt-2 space-y-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className={"flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 " + (answers[index] === optionIndex ? "border-indigo-500 bg-indigo-50" : "border-neutral-200 bg-white")}>
        <input type="radio" name={`daily-test-${lessonId}-${index}`} value={optionIndex} checked={answers[index] === optionIndex} onChange={() => setAnswers(current => { const next = [...current]; next[index] = optionIndex; return next; })} className="mt-1 h-4 w-4 shrink-0 accent-indigo-700" />
        <span>{dailyText(lang, option)}</span>
      </label>)}</div>
      {result && <div className={"mt-4 rounded-xl p-3 text-sm leading-6 " + (result.correct[index] ? "bg-green-50 text-green-950" : "bg-amber-50 text-amber-950")}>
        <p className="font-bold">{result.correct[index] ? t("✓ Bonne réponse", "✓ Correct answer", "✓ إجابة صحيحة") : t("À revoir", "Review this", "راجع هذه الفكرة")}</p>
        {!result.correct[index] && <p className="mt-1 font-semibold">{t("Bonne réponse : ", "Correct answer: ", "الإجابة الصحيحة: ")}{dailyText(lang, question.options[question.correctIndex])}</p>}
        <p className="mt-2">{dailyText(lang, question.explanation)}</p>
      </div>}
    </fieldset>)}
    {!submitted && <>
      <p role="status" className="text-sm text-neutral-600">{answered}/{questions.length} {t("questions répondues", "questions answered", "أسئلة تمت الإجابة عنها")}</p>
      {!practiced && <button onClick={onPractice} className="min-h-12 text-sm font-bold underline">{t("Faire le petit exercice avant de valider le test", "Do the small exercise before submitting the test", "أنجز التمرين الصغير قبل إرسال الاختبار")}</button>}
      <button disabled={answered !== questions.length || !practiced || saving} onClick={submit} className="min-h-12 w-full rounded-xl bg-indigo-700 px-4 py-3 text-base font-bold text-white disabled:opacity-40">{t("Corriger mon test", "Check my answers", "صحّح إجاباتي")}</button>
    </>}
    {result && !result.passed && <div className="flex flex-wrap gap-3"><button onClick={onReview} className="min-h-12 rounded-xl border px-4 text-sm font-bold">{t("Revoir la leçon", "Review the lesson", "راجع الدرس")}</button><button onClick={retry} className="min-h-12 rounded-xl bg-indigo-700 px-4 text-sm font-bold text-white">{t("Réessayer le test", "Try the test again", "أعد الاختبار")}</button></div>}
  </section>;
}
